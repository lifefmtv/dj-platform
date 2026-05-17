import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[mixes] Supabase env missing");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("mixes")
    .select("id, title, dj_name, artist, recorded_at, dropbox_path")
    .order("recorded_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[mixes] Fetch error:", error.code, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mixes: data ?? [] });
}
