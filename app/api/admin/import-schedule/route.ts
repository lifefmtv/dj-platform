import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import { listFolder, getTemporaryLink } from "@/lib/dropbox";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const SCHEDULE_FOLDER = process.env.DROPBOX_SCHEDULE_FOLDER ?? "/LIFEFM/Schedule";
const LOCAL_FALLBACK   = join(process.cwd(), "public", "schedule", "lifefm_schedule_2026.xlsx");

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_MAP: Record<string, string> = {
  "RESIDENT":      "resident",
  "CONFIRMED":     "confirmed",
  "NEEDS BOOKING": "needs_booking",
  "CANCELLED":     "cancelled",
};

// Convert Excel time fraction (0.75 = 18:00) or "18:00" string → "HH:MM"
function excelTimeToString(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "string") {
    const t = val.trim();
    // Handle "18:00", "18:00:00", "6:00 PM" variants
    const hhmm = t.match(/^(\d{1,2}):(\d{2})/);
    if (hhmm) {
      return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
    }
    return null;
  }
  if (typeof val === "number") {
    // Excel stores times as fraction of 24h. 0.75 = 18:00
    const totalMinutes = Math.round(val * 24 * 60);
    const hours   = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return null;
}

// Parse Excel date: serial number or "01 Jun 2026" string → "YYYY-MM-DD"
function parseExcelDate(val: unknown): string | null {
  if (val === null || val === undefined) return null;

  if (typeof val === "number") {
    // Excel serial date: epoch is Dec 30, 1899 (accounting for 1900 leap-year bug)
    const d = new Date(Date.UTC(1899, 11, 30) + val * 86_400_000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const str = String(val).trim();
  if (!str || str === "NaN" || str === "null" || str === "undefined") return null;

  // "01 Jun 2026" or "1 June 2026"
  const MONTHS: Record<string, number> = {
    jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
    jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
    january:1, february:2, march:3, april:4, june:6,
    july:7, august:8, september:9, october:10, november:11, december:12,
  };
  const parts = str.split(/\s+/);
  if (parts.length >= 3) {
    const day  = parts[0].padStart(2, "0");
    const mon  = MONTHS[parts[1].toLowerCase()];
    const year = parts[2];
    if (mon && year && year.length === 4) {
      return `${year}-${String(mon).padStart(2, "0")}-${day}`;
    }
  }
  // ISO "2026-06-01"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  return null;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let buffer: Buffer;
  let sourceName: string;
  let note: string | undefined;

  // ── 1. Try Dropbox first ────────────────────────────────────────────────────
  try {
    const files    = await listFolder(SCHEDULE_FOLDER);
    const xlsxFile = files.find((f) => /\.xlsx?$/i.test(f.name));
    if (!xlsxFile) throw new Error("no-file-in-dropbox");

    const tempLink = await getTemporaryLink(xlsxFile.path_lower || `${SCHEDULE_FOLDER}/${xlsxFile.name}`);
    const res      = await fetch(tempLink);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    buffer     = Buffer.from(await res.arrayBuffer());
    sourceName = xlsxFile.name;
  } catch (dropboxErr) {
    // ── 2. Fall back to public/schedule/ ──────────────────────────────────────
    if (!existsSync(LOCAL_FALLBACK)) {
      const reason = (dropboxErr as Error).message;
      return NextResponse.json(
        {
          error: `Could not find schedule file. Dropbox error: ${reason}. ` +
                 `Local fallback not found either. ` +
                 `Either upload the Excel file to Dropbox ${SCHEDULE_FOLDER} ` +
                 `or place it at public/schedule/lifefm_schedule_2026.xlsx`,
        },
        { status: 404 },
      );
    }
    buffer     = readFileSync(LOCAL_FALLBACK);
    sourceName = "lifefm_schedule_2026.xlsx (local fallback — upload to Dropbox for auto-updates)";
    note       = `File read from local fallback at public/schedule/. ` +
                 `Upload the Excel file to Dropbox ${SCHEDULE_FOLDER} so updates sync automatically.`;
  }

  // ── 3. Parse workbook ───────────────────────────────────────────────────────
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const supabase = await createServerSupabaseClient();

  let totalImported = 0;
  const months: Record<string, number> = {};
  const errors: string[] = [];
  let totalSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const monthKey = MONTH_NAMES.find((m) =>
      sheetName.trim().toLowerCase().startsWith(m.toLowerCase()),
    );
    if (!monthKey) continue; // skip non-month sheets

    const sheet = workbook.Sheets[sheetName];
    // header:1 → array-of-arrays; defval:null → empty cells are null
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

    // Row layout: 0=title, 1=instructions, 2=column headers, 3+=data
    let currentDate: string | null = null;
    const batch: object[] = [];

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length < 4) continue;

      // Columns: 0=Date | 1=Day | 2=Slot# | 3=Start | 4=End | 5=DJ Name | 6=Genre | 7=Notes | 8=Status
      const rawDate   = row[0];
      const dayName   = row[1] != null ? String(row[1]).trim() : null;
      const slotNum   = row[2] != null ? Number(row[2])        : null;
      const startRaw  = row[3];
      const endRaw    = row[4];
      const djNameRaw = row[5] != null ? String(row[5]).trim() : null;
      const genre     = row[6] != null ? String(row[6]).trim() || null : null;
      const notes     = row[7] != null ? String(row[7]).trim() || null : null;
      const statusRaw = row[8] != null ? String(row[8]).trim().toUpperCase() : "";

      // Forward-fill the date (only first slot of each day has it)
      const parsedDate = parseExcelDate(rawDate);
      if (parsedDate) currentDate = parsedDate;
      if (!currentDate) continue;

      // Skip blank rows
      if (!djNameRaw || !slotNum) continue;

      // Skip unfilled "Guest Show" placeholder slots (DJ name contains "Guest Show" AND status blank)
      if (djNameRaw.toLowerCase().includes("guest show") && !statusRaw) {
        totalSkipped++;
        continue;
      }

      // Skip rows where DJ name looks like a header or separator
      if (/^(dj.?name|name|slot|start|end|date|day)$/i.test(djNameRaw)) continue;

      const startTime = excelTimeToString(startRaw);
      const endTime   = excelTimeToString(endRaw);
      if (!startTime || !endTime) continue;

      // Blank status → "resident" per the spec
      const status  = statusRaw ? (STATUS_MAP[statusRaw] ?? "resident") : "resident";
      const yearNum = parseInt(currentDate.slice(0, 4), 10);

      batch.push({
        date:        currentDate,
        day_name:    dayName,
        slot_number: slotNum,
        start_time:  startTime,
        end_time:    endTime,
        dj_name:     djNameRaw,
        genre,
        notes,
        status,
        month:       monthKey,
        year:        yearNum,
      });
    }

    if (batch.length === 0) continue;

    // Upsert in chunks of 500
    for (let i = 0; i < batch.length; i += 500) {
      const chunk = batch.slice(i, i + 500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("schedule").upsert(chunk as any[], {
        onConflict: "date,slot_number",
      });
      if (error) {
        errors.push(`${sheetName} chunk ${Math.floor(i / 500) + 1}: ${error.message}`);
      } else {
        months[monthKey] = (months[monthKey] ?? 0) + chunk.length;
        totalImported    += chunk.length;
      }
    }
  }

  return NextResponse.json({
    success:  true,
    imported: totalImported,
    skipped:  totalSkipped,
    months,
    source:   sourceName,
    note,
    errors,
  });
}
