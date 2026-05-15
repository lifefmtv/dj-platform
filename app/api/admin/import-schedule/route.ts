import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";
import { listFolder, getTemporaryLink } from "@/lib/dropbox";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const SCHEDULE_FOLDER = process.env.DROPBOX_SCHEDULE_FOLDER ?? "/LIFEFM/Schedule";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_MAP: Record<string, string> = {
  "RESIDENT":      "resident",
  "CONFIRMED":     "confirmed",
  "NEEDS BOOKING": "needs_booking",
  "CANCELLED":     "cancelled",
};

function excelTimeToString(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "string") {
    const t = val.trim();
    if (/^\d{1,2}:\d{2}/.test(t)) return t.slice(0, 5);
    return null;
  }
  if (typeof val === "number") {
    // Excel stores times as a fraction of 24 hours
    const totalMinutes = Math.round(val * 24 * 60);
    const hours   = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return null;
}

function parseExcelDate(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const str = String(val).trim();
  if (!str || str === "NaN" || str === "null") return null;
  // Expected format: "01 Jun 2026"
  const months: Record<string, number> = {
    Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12,
    January:1,February:2,March:3,April:4,June:6,July:7,August:8,September:9,October:10,November:11,December:12,
  };
  const parts = str.split(/\s+/);
  if (parts.length >= 3) {
    const day  = parts[0].padStart(2, "0");
    const mon  = months[parts[1]];
    const year = parts[2];
    if (mon && year) {
      return `${year}-${String(mon).padStart(2, "0")}-${day}`;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Find the Excel file in Dropbox
    const files = await listFolder(SCHEDULE_FOLDER);
    const xlsxFile = files.find((f) => /\.xlsx?$/i.test(f.name));
    if (!xlsxFile) {
      return NextResponse.json(
        { error: `No Excel (.xlsx) file found in Dropbox folder: ${SCHEDULE_FOLDER}` },
        { status: 404 },
      );
    }

    // 2. Download the file via temporary link
    const tempLink = await getTemporaryLink(xlsxFile.path_lower || xlsxFile.name);
    const fileRes  = await fetch(tempLink);
    if (!fileRes.ok) throw new Error(`File download failed: ${fileRes.status}`);
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    // 3. Parse workbook
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const supabase = await createServerSupabaseClient();

    let totalImported = 0;
    const byMonth: Record<string, number> = {};
    const errors: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      // Match sheet name to a known month abbreviation
      const monthKey = MONTH_NAMES.find((m) =>
        sheetName.trim().toLowerCase().startsWith(m.toLowerCase()),
      );
      if (!monthKey) continue; // skip non-month sheets (e.g. "Instructions")

      const sheet = workbook.Sheets[sheetName];
      // header:1 → array-of-arrays; defval:null → missing cells are null
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

      // Structure: row 0 = title, row 1 = instructions, row 2 = column headers, row 3+ = data
      let currentDate: string | null = null;
      const batch: object[] = [];

      for (let i = 3; i < rows.length; i++) {
        const row = rows[i] as unknown[];
        if (!row || row.length < 5) continue;

        // Column layout: Date | Day | Slot # | Start | End | DJ Name | Genre | Notes | Status
        const rawDate   = row[0];
        const dayName   = row[1] != null ? String(row[1]).trim() : null;
        const slotNum   = row[2] != null ? Number(row[2])       : null;
        const startRaw  = row[3];
        const endRaw    = row[4];
        const djName    = row[5] != null ? String(row[5]).trim() : null;
        const genre     = row[6] != null ? String(row[6]).trim() : null;
        const notes     = row[7] != null ? String(row[7]).trim() : null;
        const statusRaw = row[8] != null ? String(row[8]).trim().toUpperCase() : null;

        // Forward-fill date from the previous populated row
        const parsedDate = parseExcelDate(rawDate);
        if (parsedDate) currentDate = parsedDate;
        if (!currentDate) continue;

        // Skip separator / blank rows
        if (!djName || !slotNum) continue;

        const startTime = excelTimeToString(startRaw);
        const endTime   = excelTimeToString(endRaw);
        if (!startTime || !endTime) continue;

        const status  = statusRaw ? (STATUS_MAP[statusRaw] ?? "confirmed") : "confirmed";
        const yearNum = parseInt(currentDate.slice(0, 4), 10);

        batch.push({
          date:        currentDate,
          day_name:    dayName,
          slot_number: slotNum,
          start_time:  startTime,
          end_time:    endTime,
          dj_name:     djName,
          genre:       genre || null,
          notes:       notes || null,
          status,
          month:       monthKey,
          year:        yearNum,
        });
      }

      if (batch.length === 0) continue;

      // Upsert in chunks of 500 to stay within Supabase limits
      for (let i = 0; i < batch.length; i += 500) {
        const chunk = batch.slice(i, i + 500);
        const { error } = await supabase
          .from("schedule")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(chunk as any[], { onConflict: "date,slot_number" });
        if (error) {
          errors.push(`${sheetName} chunk ${i / 500 + 1}: ${error.message}`);
        } else {
          byMonth[monthKey] = (byMonth[monthKey] ?? 0) + chunk.length;
          totalImported     += chunk.length;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      file: xlsxFile.name,
      imported: totalImported,
      byMonth,
      errors,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
