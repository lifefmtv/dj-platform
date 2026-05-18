import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUKDateTime } from "@/lib/broadcastStatus";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ genre: null, djName: null });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { date: ukDate, time: ukTime } = getUKDateTime();
  const ukHHMM = ukTime.slice(0, 5);

  const { data } = await supabase
    .from("schedule")
    .select("dj_name, genre, start_time, end_time")
    .eq("date", ukDate)
    .neq("status", "cancelled")
    .order("start_time");

  const current = data?.find((s) => {
    const startHHMM = s.start_time.slice(0, 5);
    const endHHMM   = s.end_time.slice(0, 5);
    const end = endHHMM === "00:00" ? "24:00" : endHHMM;
    return startHHMM <= ukHHMM && end > ukHHMM;
  }) ?? null;

  return NextResponse.json({
    genre:  current?.genre  ?? null,
    djName: current?.dj_name ?? null,
  });
}
