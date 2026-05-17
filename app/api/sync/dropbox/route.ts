import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listFolder, listFolderRaw, getTemporaryLink, cleanFileName } from "@/lib/dropbox";

const FOLDERS = {
  shows:  process.env.DROPBOX_VIDEO_FOLDER  ?? "/LIFEFM/Video Shows",
  mixes:  process.env.DROPBOX_MIXES_FOLDER  ?? "/LIFEFM/DJ Mixes",
  flyers: process.env.DROPBOX_FLYERS_FOLDER ?? "/LIFEFM/Event Flyers",
  photos: process.env.DROPBOX_PHOTOS_FOLDER ?? "/LIFEFM/Photos",
};

const LINK_TTL = 4 * 60 * 60 * 1000; // 4 hours in ms

// Use the plain service-role client — no cookie/session machinery needed for background syncs.
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

  // ── Env audit ────────────────────────────────────────────────────────────────
  console.log("[sync] Folder paths:", JSON.stringify(FOLDERS));
  console.log("[sync] Env check — DROPBOX_ACCESS_TOKEN:", !!process.env.DROPBOX_ACCESS_TOKEN,
    "| SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    "| SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  let supabase;
  try {
    supabase = getSupabase();
    console.log("[sync] Supabase client created OK");
  } catch (e) {
    console.error("[sync] Supabase init failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }

  // ── Root folder audit ────────────────────────────────────────────────────────
  try {
    const rootEntries = await listFolderRaw("");
    console.log("[sync] Root Dropbox entries:", rootEntries.map((e) => `${e.tag}:${e.name}`).join(", ") || "(none)");
  } catch (e) {
    console.error("[sync] Root list failed:", (e as Error).message);
  }

  const counts: Record<string, number> = {};
  const errors: string[] = [];

  // ── Video shows ──────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/shows] Listing: "${FOLDERS.shows}"`);
    const files = await listFolder(FOLDERS.shows);
    console.log(`[sync/shows] Found ${files.length} total entries: [${files.map((f) => f.name).join(", ")}]`);
    counts.shows = 0;

    for (const f of files) {
      if (!/\.(mp4|mov|mkv|webm)$/i.test(f.name)) {
        console.log(`[sync/shows] Skip (ext): ${f.name}`);
        continue;
      }
      const { title, djName, date } = cleanFileName(f.name);
      const row = { dropbox_file_id: f.id, dropbox_path: f.path_lower, title, dj_name: djName ?? "", recorded_at: date ?? null, status: "pending" };
      console.log(`[sync/shows] Upserting: ${f.name} →`, JSON.stringify(row));

      const { error: upsertErr } = await supabase
        .from("show_archive")
        .upsert(row, { onConflict: "dropbox_file_id", ignoreDuplicates: true });
      if (upsertErr) {
        console.error(`[sync/shows] Upsert FAILED for ${f.name}:`, upsertErr.code, upsertErr.message, upsertErr.details);
        errors.push(`show_archive upsert ${f.name}: ${upsertErr.message}`);
        continue;
      }
      console.log(`[sync/shows] Upsert OK: ${f.name}`);

      let tempLink: string | null = null;
      let tempLinkExpiresAt: string | null = null;
      try {
        tempLink = await getTemporaryLink(f.path_lower);
        tempLinkExpiresAt = new Date(Date.now() + LINK_TTL).toISOString();
      } catch (linkErr) {
        console.warn(`[sync/shows] Temp link failed for ${f.name}: ${(linkErr as Error).message}`);
      }

      if (tempLink) {
        const { error: linkErr } = await supabase
          .from("show_archive")
          .update({ temp_link: tempLink, temp_link_expires_at: tempLinkExpiresAt })
          .eq("dropbox_file_id", f.id);
        if (linkErr) console.error(`[sync/shows] Link update FAILED for ${f.name}:`, linkErr.message);
        else console.log(`[sync/shows] Link updated OK: ${f.name}`);
      }
      counts.shows++;
    }
  } catch (e) {
    console.error("[sync/shows] Outer error:", (e as Error).message);
    errors.push(`shows: ${(e as Error).message}`);
  }

  // ── DJ mixes ─────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/mixes] Listing: "${FOLDERS.mixes}"`);
    const files = await listFolder(FOLDERS.mixes);
    console.log(`[sync/mixes] Found ${files.length} total entries: [${files.map((f) => f.name).join(", ")}]`);
    counts.mixes = 0;

    for (const f of files) {
      if (!/\.(mp3|wav|aac|flac|ogg|m4a)$/i.test(f.name)) {
        console.log(`[sync/mixes] Skip (ext): ${f.name}`);
        continue;
      }
      const { title, djName, date } = cleanFileName(f.name);
      const row = { dropbox_file_id: f.id, dropbox_path: f.path_lower, title, dj_name: djName ?? "", recorded_at: date ?? null, status: "pending" };
      console.log(`[sync/mixes] Upserting: ${f.name}`);

      const { error: upsertErr } = await supabase
        .from("mixes")
        .upsert(row, { onConflict: "dropbox_file_id", ignoreDuplicates: true });
      if (upsertErr) {
        console.error(`[sync/mixes] Upsert FAILED for ${f.name}:`, upsertErr.code, upsertErr.message, upsertErr.details);
        errors.push(`mixes upsert ${f.name}: ${upsertErr.message}`);
        continue;
      }
      console.log(`[sync/mixes] Upsert OK: ${f.name}`);

      let tempLink: string | null = null;
      let tempLinkExpiresAt: string | null = null;
      try {
        tempLink = await getTemporaryLink(f.path_lower);
        tempLinkExpiresAt = new Date(Date.now() + LINK_TTL).toISOString();
      } catch (linkErr) {
        console.warn(`[sync/mixes] Temp link failed for ${f.name}: ${(linkErr as Error).message}`);
      }

      if (tempLink) {
        const { error: linkErr } = await supabase
          .from("mixes")
          .update({ temp_link: tempLink, temp_link_expires_at: tempLinkExpiresAt })
          .eq("dropbox_file_id", f.id);
        if (linkErr) console.error(`[sync/mixes] Link update FAILED for ${f.name}:`, linkErr.message);
        else console.log(`[sync/mixes] Link updated OK: ${f.name}`);
      }
      counts.mixes++;
    }
  } catch (e) {
    console.error("[sync/mixes] Outer error:", (e as Error).message);
    errors.push(`mixes: ${(e as Error).message}`);
  }

  // ── Flyers ───────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/flyers] Listing: "${FOLDERS.flyers}"`);
    const files = await listFolder(FOLDERS.flyers);
    console.log(`[sync/flyers] Found ${files.length} entries`);
    counts.flyers = 0;

    for (const f of files) {
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)) continue;
      const { error } = await supabase
        .from("flyers")
        .upsert({ dropbox_file_id: f.id, dropbox_path: f.path_lower, title: cleanFileName(f.name).title },
          { onConflict: "dropbox_file_id", ignoreDuplicates: true });
      if (error) {
        console.error(`[sync/flyers] Upsert FAILED for ${f.name}:`, error.code, error.message);
        errors.push(`flyers upsert ${f.name}: ${error.message}`);
      } else {
        counts.flyers++;
      }
    }
    console.log(`[sync/flyers] Wrote ${counts.flyers} flyers`);
  } catch (e) {
    console.error("[sync/flyers] Outer error:", (e as Error).message);
    errors.push(`flyers: ${(e as Error).message}`);
  }

  // ── Photos ───────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/photos] Listing: "${FOLDERS.photos}"`);
    const files = await listFolder(FOLDERS.photos);
    console.log(`[sync/photos] Found ${files.length} entries`);
    counts.photos = 0;

    for (const f of files) {
      if (!/\.(jpg|jpeg|png|webp)$/i.test(f.name)) continue;
      const { error } = await supabase
        .from("photos")
        .upsert({ dropbox_file_id: f.id, dropbox_path: f.path_lower, title: cleanFileName(f.name).title },
          { onConflict: "dropbox_file_id", ignoreDuplicates: true });
      if (error) {
        console.error(`[sync/photos] Upsert FAILED for ${f.name}:`, error.code, error.message);
        errors.push(`photos upsert ${f.name}: ${error.message}`);
      } else {
        counts.photos++;
      }
    }
    console.log(`[sync/photos] Wrote ${counts.photos} photos`);
  } catch (e) {
    console.error("[sync/photos] Outer error:", (e as Error).message);
    errors.push(`photos: ${(e as Error).message}`);
  }

  // ── Sync log ─────────────────────────────────────────────────────────────────
  console.log("[sync] Final counts:", JSON.stringify(counts), "| Errors:", errors.length);
  const logRow = {
    synced_at:    new Date().toISOString(),
    shows_found:  counts.shows  ?? 0,
    mixes_found:  counts.mixes  ?? 0,
    flyers_found: counts.flyers ?? 0,
    photos_found: counts.photos ?? 0,
    errors:       errors.length ? errors.join("; ") : null,
  };
  console.log("[sync] Writing sync_log:", JSON.stringify(logRow));
  const { error: logErr } = await supabase.from("sync_log").insert(logRow);
  if (logErr) console.error("[sync] sync_log write FAILED:", logErr.code, logErr.message, logErr.details);
  else console.log("[sync] sync_log write OK");

  return NextResponse.json({ ok: true, counts, errors });
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  return POST(req);
}
