import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const SCHEDULE_URL =
  "https://www.dropbox.com/scl/fi/4pk2xozc1k1oza2bpi95p/lifefm_schedule_2026.xlsx?rlkey=k8ur2ywktm3nalx182j11wygs&st=wccjc5hi&dl=1";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEAR = 2026;

const STATUS_MAP: Record<string, string> = {
  "RESIDENT":      "resident",
  "CONFIRMED":     "confirmed",
  "NEEDS BOOKING": "needs_booking",
  "CANCELLED":     "cancelled",
};

// Sunday=0 … Saturday=6
const DAY_INDEX: Record<string, number> = {
  sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6,
  sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6,
};

interface ShowTemplate {
  dj_name: string;
  start_time: string;
  end_time: string;
  genre: string | null;
  description: string | null;
  day_name: string;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Excel time fraction or "HH:MM" string → "HH:MM"
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

// Return every date in a month that falls on the given day name
function getDatesForDay(year: number, monthIdx: number, dayLower: string): string[] {
  const target = DAY_INDEX[dayLower];
  if (target === undefined) return [];
  const dates: string[] = [];
  const d = new Date(Date.UTC(year, monthIdx, 1));
  while (d.getUTCMonth() === monthIdx) {
    if (d.getUTCDay() === target) {
      dates.push(
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
      );
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Download Excel ────────────────────────────────────────────────────────
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

  const fromExcel: Record<string, number> = {};
  const fromTemplates: Record<string, number> = {};
  const errors: string[] = [];
  let totalSkipped = 0;

  // ── Phase 1: Import Excel sheets ──────────────────────────────────────────
  for (const sheetName of workbook.SheetNames) {
    const monthKey = MONTH_NAMES.find((m) =>
      sheetName.trim().toLowerCase().startsWith(m.toLowerCase()),
    );
    if (!monthKey) continue;

    const sheet = workbook.Sheets[sheetName];
    const rows  = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    console.log(`[import-schedule] ${sheetName}: ${rows.length} rows`);

    let currentDate: string | null = null;
    const batch: object[] = [];

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length < 4) continue;

      const rawDate   = row[0];
      const dayName   = row[1] != null ? String(row[1]).trim() : null;
      const slotNum   = row[2] != null ? Number(row[2])        : null;
      const startRaw  = row[3];
      const endRaw    = row[4];
      const djNameRaw = row[5] != null ? String(row[5]).trim() : null;
      const genre     = row[6] != null ? String(row[6]).trim() || null : null;
      const notes     = row[7] != null ? String(row[7]).trim() || null : null;
      const statusRaw = row[8] != null ? String(row[8]).trim().toUpperCase() : "";

      const parsedDate = parseExcelDate(rawDate);
      if (parsedDate) currentDate = parsedDate;
      if (!currentDate) continue;
      if (!djNameRaw || !slotNum) continue;
      if (djNameRaw.toLowerCase().includes("guest show") && !statusRaw) { totalSkipped++; continue; }
      if (/^(dj.?name|name|slot|start|end|date|day)$/i.test(djNameRaw)) continue;

      const startTime = excelTimeToString(startRaw);
      const endTime   = excelTimeToString(endRaw);
      if (!startTime || !endTime) continue;

      batch.push({
        date:        currentDate,
        day_name:    dayName,
        slot_number: slotNum,
        start_time:  startTime,
        end_time:    endTime,
        dj_name:     djNameRaw,
        genre,
        notes,
        status:      statusRaw ? (STATUS_MAP[statusRaw] ?? "resident") : "resident",
        month:       monthKey,
        year:        parseInt(currentDate.slice(0, 4), 10),
      });
    }

    console.log(`[import-schedule] ${sheetName}: ${batch.length} rows to upsert`);
    if (batch.length === 0) continue;

    for (let i = 0; i < batch.length; i += 500) {
      const chunk = batch.slice(i, i + 500);
      const { error } = await supabase.from("schedule").upsert(chunk as never[], {
        onConflict: "date,slot_number",
      });
      if (error) {
        console.error(`[import-schedule] ${sheetName} upsert error:`, error.code, error.message);
        errors.push(`${sheetName}: ${error.message}`);
      } else {
        fromExcel[monthKey] = (fromExcel[monthKey] ?? 0) + chunk.length;
      }
    }
  }

  // ── Phase 2: Generate from templates for empty months ─────────────────────
  const emptyMonths = MONTH_NAMES.filter((m) => !fromExcel[m]);
  console.log("[import-schedule] Empty months for template generation:", emptyMonths.join(", ") || "none");

  if (emptyMonths.length > 0) {
    const { data: templates, error: tmplErr } = await supabase
      .from("show_templates")
      .select("dj_name, start_time, end_time, genre, description, day_name")
      .eq("is_recurring", true);

    if (tmplErr) {
      console.error("[import-schedule] show_templates fetch error:", tmplErr.message);
      errors.push(`templates: ${tmplErr.message}`);
    } else if (templates && templates.length > 0) {
      console.log(`[import-schedule] ${templates.length} recurring templates loaded`);

      // Group and sort templates by normalised day name
      const byDay: Record<string, ShowTemplate[]> = {};
      for (const t of templates as ShowTemplate[]) {
        const key = t.day_name?.trim().toLowerCase();
        if (!key || DAY_INDEX[key] === undefined) continue;
        (byDay[key] ??= []).push(t);
      }
      for (const key of Object.keys(byDay)) {
        byDay[key].sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
      }

      for (const monthKey of emptyMonths) {
        const monthIdx = MONTH_NAMES.indexOf(monthKey);
        // Build map: date → templates sorted by start_time
        const dateMap: Record<string, ShowTemplate[]> = {};
        for (const [dayLower, dayTemplates] of Object.entries(byDay)) {
          for (const date of getDatesForDay(YEAR, monthIdx, dayLower)) {
            (dateMap[date] ??= []).push(...dayTemplates);
          }
        }
        // Sort each date's slots by start_time so slot_number is chronological
        for (const slots of Object.values(dateMap)) {
          slots.sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
        }

        const batch: object[] = [];
        for (const [date, slots] of Object.entries(dateMap)) {
          const dayJs = new Date(date + "T00:00:00Z");
          const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayJs.getUTCDay()];
          slots.forEach((t, idx) => {
            batch.push({
              date,
              day_name:    dayName,
              slot_number: idx + 1,
              start_time:  t.start_time,
              end_time:    t.end_time,
              dj_name:     t.dj_name,
              genre:       t.genre,
              notes:       t.description,
              status:      "resident",
              month:       monthKey,
              year:        YEAR,
            });
          });
        }

        console.log(`[import-schedule] ${monthKey}: generating ${batch.length} template entries`);
        if (batch.length === 0) continue;

        for (let i = 0; i < batch.length; i += 500) {
          const chunk = batch.slice(i, i + 500);
          const { error } = await supabase.from("schedule").upsert(chunk as never[], {
            onConflict: "date,slot_number",
          });
          if (error) {
            console.error(`[import-schedule] template ${monthKey} error:`, error.code, error.message);
            errors.push(`templates/${monthKey}: ${error.message}`);
          } else {
            fromTemplates[monthKey] = (fromTemplates[monthKey] ?? 0) + chunk.length;
          }
        }
      }
    } else {
      console.log("[import-schedule] No recurring templates found — skipping generation");
    }
  }

  const totalFromExcel     = Object.values(fromExcel).reduce((s, n) => s + n, 0);
  const totalFromTemplates = Object.values(fromTemplates).reduce((s, n) => s + n, 0);
  console.log(
    "[import-schedule] Done — excel:", totalFromExcel,
    "templates:", totalFromTemplates,
    "skipped:", totalSkipped,
    "errors:", errors.length,
  );

  return NextResponse.json({
    success:       true,
    fromExcel,
    fromTemplates,
    total:         totalFromExcel + totalFromTemplates,
    skipped:       totalSkipped,
    source:        "lifefm_schedule_2026.xlsx (Dropbox public link)",
    errors,
  });
}
