import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Public Dropbox share link — dl=1 forces direct download without auth
const SCHEDULE_URL =
  "https://www.dropbox.com/scl/fi/4pk2xozc1k1oza2bpi95p/lifefm_schedule_2026.xlsx?rlkey=k8ur2ywktm3nalx182j11wygs&st=wccjc5hi&dl=1";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_MAP: Record<string, string> = {
  "RESIDENT":      "resident",
  "CONFIRMED":     "confirmed",
  "NEEDS BOOKING": "needs_booking",
  "CANCELLED":     "cancelled",
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Excel time fraction (0.75 = 18:00) or "18:00" string → "HH:MM"
function excelTimeToString(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "string") {
    const hhmm = val.trim().match(/^(\d{1,2}):(\d{2})/);
    if (hhmm) return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
    return null;
  }
  if (typeof val === "number") {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours   = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return null;
}

// Excel date serial or "01 Jun 2026" string → "YYYY-MM-DD"
function parseExcelDate(val: unknown): string | null {
  if (val === null || val === undefined) return null;

  if (typeof val === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) + val * 86_400_000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  const str = String(val).trim();
  if (!str || str === "NaN") return null;

  // "01 Jun 2026" or "1 June 2026"
  const MONTHS: Record<string, number> = {
    jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
    jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
    january:1, february:2, march:3, april:4, june:6,
    july:7, august:8, september:9, october:10, november:11, december:12,
  };
  const parts = str.split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, "0");
    const mon = MONTHS[parts[1].toLowerCase()];
    const yr  = parts[2];
    if (mon && yr.length === 4) return `${yr}-${String(mon).padStart(2, "0")}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  return null;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Download Excel from Dropbox public share link ─────────────────────────
  let buffer: Buffer;
  try {
    const res = await fetch(SCHEDULE_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    buffer = Buffer.from(await res.arrayBuffer());
    console.log("[import-schedule] Downloaded", buffer.byteLength, "bytes");
  } catch (e) {
    console.error("[import-schedule] Download failed:", (e as Error).message);
    return NextResponse.json(
      { error: `Could not download schedule file: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  // ── Parse workbook ────────────────────────────────────────────────────────
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  console.log("[import-schedule] Sheets:", workbook.SheetNames.join(", "));

  let supabase;
  try {
    supabase = getSupabase();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  let totalImported = 0;
  let totalSkipped  = 0;
  const months: Record<string, number> = {};
  const errors: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const monthKey = MONTH_NAMES.find((m) =>
      sheetName.trim().toLowerCase().startsWith(m.toLowerCase()),
    );
    if (!monthKey) {
      console.log(`[import-schedule] Skipping non-month sheet: "${sheetName}"`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    // header:1 → array-of-arrays; defval:null → empty cells are null
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    console.log(`[import-schedule] ${sheetName}: ${rows.length} total rows`);

    // Rows 0,1,2 = title / instructions / column headers — data starts at index 3
    let currentDate: string | null = null;
    const batch: object[] = [];

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length < 4) continue;

      // Col: 0=Date | 1=Day | 2=Slot# | 3=Start | 4=End | 5=DJ Name | 6=Genre | 7=Notes | 8=Status
      const rawDate   = row[0];
      const dayName   = row[1] != null ? String(row[1]).trim() : null;
      const slotNum   = row[2] != null ? Number(row[2])        : null;
      const startRaw  = row[3];
      const endRaw    = row[4];
      const djNameRaw = row[5] != null ? String(row[5]).trim() : null;
      const genre     = row[6] != null ? String(row[6]).trim() || null : null;
      const notes     = row[7] != null ? String(row[7]).trim() || null : null;
      const statusRaw = row[8] != null ? String(row[8]).trim().toUpperCase() : "";

      // Date only appears on the first slot of each day — forward-fill
      const parsedDate = parseExcelDate(rawDate);
      if (parsedDate) currentDate = parsedDate;
      if (!currentDate) continue;

      // Skip blank rows (no DJ, no slot number)
      if (!djNameRaw || !slotNum) continue;

      // Skip unfilled placeholder slots
      if (djNameRaw.toLowerCase().includes("guest show") && !statusRaw) {
        totalSkipped++;
        continue;
      }

      // Skip rows where DJ name looks like a column header
      if (/^(dj.?name|name|slot|start|end|date|day)$/i.test(djNameRaw)) continue;

      const startTime = excelTimeToString(startRaw);
      const endTime   = excelTimeToString(endRaw);
      if (!startTime || !endTime) continue;

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

    console.log(`[import-schedule] ${sheetName}: ${batch.length} rows to upsert, ${totalSkipped} skipped so far`);
    if (batch.length === 0) continue;

    // Upsert in chunks of 500
    for (let i = 0; i < batch.length; i += 500) {
      const chunk = batch.slice(i, i + 500);
      const { error } = await supabase.from("schedule").upsert(chunk as never[], {
        onConflict: "date,slot_number",
      });
      if (error) {
        console.error(`[import-schedule] ${sheetName} upsert error:`, error.code, error.message);
        errors.push(`${sheetName}: ${error.message}`);
      } else {
        months[monthKey] = (months[monthKey] ?? 0) + chunk.length;
        totalImported    += chunk.length;
      }
    }
  }

  console.log("[import-schedule] Done — imported:", totalImported, "skipped:", totalSkipped, "errors:", errors.length);

  return NextResponse.json({
    success:  true,
    imported: totalImported,
    skipped:  totalSkipped,
    months,
    source:   "lifefm_schedule_2026.xlsx (Dropbox public link)",
    errors,
  });
}
