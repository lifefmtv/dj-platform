import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const from    = req.nextUrl.searchParams.get("from");
  const to      = req.nextUrl.searchParams.get("to");
  const genre   = req.nextUrl.searchParams.get("genre");
  const nearest = req.nextUrl.searchParams.get("nearest"); // "asc" or "desc"

  // Special mode: find nearest date that has data (for "jump to data" fallback)
  if (nearest && from) {
    const asc = nearest === "asc";
    const { data } = await supabase
      .from("schedule")
      .select("date")
      .filter("date", asc ? "gte" : "lte", from)
      .neq("status", "cancelled")
      .order("date", { ascending: asc })
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ date: data?.date ?? null });
  }

  if (!from || !to) return NextResponse.json({ error: "Missing from/to params" }, { status: 400 });

  let query = supabase
    .from("schedule")
    .select("id, date, day_name, slot_number, start_time, end_time, dj_name, genre, notes, status")
    .gte("date", from)
    .lte("date", to)
    .neq("status", "cancelled")
    .order("date")
    .order("start_time");

  if (genre) query = query.eq("genre", genre);

  const { data, error } = await query;
  if (error) {
    console.error("[schedule] fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shows: data ?? [] });
}
