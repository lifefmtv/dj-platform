import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listFolder, cleanFileName } from "@/lib/dropbox";

const FOLDERS = {
  shows:  process.env.DROPBOX_VIDEO_FOLDER  ?? "/LIFEFM/Video Shows",
  mixes:  process.env.DROPBOX_MIXES_FOLDER  ?? "/LIFEFM/DJ Mixes",
  flyers: process.env.DROPBOX_FLYERS_FOLDER ?? "/LIFEFM/Event Flyers",
  photos: process.env.DROPBOX_PHOTOS_FOLDER ?? "/LIFEFM/Photos",
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Supabase env missing: url=${!!url} key=${!!key}`);
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[sync] Starting — folders:", JSON.stringify(FOLDERS));

  let supabase;
  try {
    supabase = getSupabase();
  } catch (e) {
    console.error("[sync] Supabase init failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }

  const counts: Record<string, number> = { shows: 0, mixes: 0, flyers: 0, photos: 0 };
  const errors: string[] = [];

  // ── Helper: bulk upsert with a single call ───────────────────────────────────
  async function bulkUpsert(table: string, rows: object[], conflict: string): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await supabase!.from(table).upsert(rows as any[], {
      onConflict: conflict,
      ignoreDuplicates: true,
    });
    if (error) {
      const msg = `${table} upsert: [${error.code}] ${error.message}`;
      console.error(`[sync/${table}] Upsert FAILED:`, error.code, error.message, error.details ?? "");
      errors.push(msg);
    } else {
      console.log(`[sync/${table}] Upserted ${rows.length} rows OK`);
    }
  }

  // ── Video shows — metadata only, no temp links ────────────────────────────────
  try {
    console.log(`[sync/shows] Listing: "${FOLDERS.shows}"`);
    const files = await listFolder(FOLDERS.shows);
    console.log(`[sync/shows] Found ${files.length} entries`);

    const rows = files
      .filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f.name))
      .map((f) => {
        const { title, djName, date } = cleanFileName(f.name);
        return { dropbox_file_id: f.id, dropbox_path: f.path_lower, title, dj_name: djName ?? "", recorded_at: date ?? null, status: "pending" };
      });

    console.log(`[sync/shows] ${rows.length} video files after extension filter`);
    await bulkUpsert("show_archive", rows, "dropbox_file_id");
    counts.shows = rows.length;
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[sync/shows] Error:", msg);
    if (msg.includes("401") || msg.toLowerCase().includes("token")) {
      errors.push("shows: Dropbox token expired or invalid — regenerate access token");
    } else {
      errors.push(`shows: ${msg}`);
    }
  }

  // ── DJ mixes — metadata only, no temp links ───────────────────────────────────
  try {
    console.log(`[sync/mixes] Listing: "${FOLDERS.mixes}"`);
    const files = await listFolder(FOLDERS.mixes);
    console.log(`[sync/mixes] Found ${files.length} entries`);

    const rows = files
      .filter((f) => /\.(mp3|wav|aac|flac|ogg|m4a)$/i.test(f.name))
      .map((f) => {
        const { title, djName, date } = cleanFileName(f.name);
        // Write to both dj_name (new) and artist (legacy) so all code paths can read it
        return { dropbox_file_id: f.id, dropbox_path: f.path_lower, title, dj_name: djName ?? "", artist: djName ?? "", recorded_at: date ?? null, status: "pending" };
      });

    console.log(`[sync/mixes] ${rows.length} audio files after extension filter`);
    await bulkUpsert("mixes", rows, "dropbox_file_id");
    counts.mixes = rows.length;
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[sync/mixes] Error:", msg);
    if (msg.includes("401") || msg.toLowerCase().includes("token")) {
      errors.push("mixes: Dropbox token expired or invalid — regenerate access token");
    } else {
      errors.push(`mixes: ${msg}`);
    }
  }

  // ── Flyers ────────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/flyers] Listing: "${FOLDERS.flyers}"`);
    const files = await listFolder(FOLDERS.flyers);
    console.log(`[sync/flyers] Found ${files.length} entries`);

    const rows = files
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .map((f) => ({ dropbox_file_id: f.id, dropbox_path: f.path_lower, title: cleanFileName(f.name).title }));

    await bulkUpsert("flyers", rows, "dropbox_file_id");
    counts.flyers = rows.length;
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[sync/flyers] Error:", msg);
    errors.push(`flyers: ${msg}`);
  }

  // ── Photos ────────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/photos] Listing: "${FOLDERS.photos}"`);
    const files = await listFolder(FOLDERS.photos);
    console.log(`[sync/photos] Found ${files.length} entries`);

    const rows = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
      .map((f) => ({ dropbox_file_id: f.id, dropbox_path: f.path_lower, title: cleanFileName(f.name).title }));

    await bulkUpsert("photos", rows, "dropbox_file_id");
    counts.photos = rows.length;
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[sync/photos] Error:", msg);
    errors.push(`photos: ${msg}`);
  }

  // ── Sync log ──────────────────────────────────────────────────────────────────
  console.log("[sync] Final counts:", JSON.stringify(counts), "| Errors:", errors.length);
  const logRow = {
    synced_at:    new Date().toISOString(),
    shows_found:  counts.shows,
    mixes_found:  counts.mixes,
    flyers_found: counts.flyers,
    photos_found: counts.photos,
    errors:       errors.length ? errors.join("; ") : null,
  };
  const { error: logErr } = await supabase.from("sync_log").insert(logRow);
  if (logErr) console.error("[sync] sync_log FAILED:", logErr.code, logErr.message);
  else console.log("[sync] sync_log OK");

  return NextResponse.json({ ok: true, counts, errors });
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  return POST(req);
}
