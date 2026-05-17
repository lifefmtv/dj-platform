import { NextRequest, NextResponse } from "next/server";
import { listFolder, listFolderRaw, getTemporaryLink, cleanFileName } from "@/lib/dropbox";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const FOLDERS = {
  shows:  process.env.DROPBOX_VIDEO_FOLDER  ?? "/LIFEFM/Video Shows",
  mixes:  process.env.DROPBOX_MIXES_FOLDER  ?? "/LIFEFM/DJ Mixes",
  flyers: process.env.DROPBOX_FLYERS_FOLDER ?? "/LIFEFM/Event Flyers",
  photos: process.env.DROPBOX_PHOTOS_FOLDER ?? "/LIFEFM/Photos",
};

const LINK_TTL = 4 * 60 * 60 * 1000; // 4 hours in ms

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Env var audit ─────────────────────────────────────────────────────────────
  console.log("[sync] Folder paths from env:", JSON.stringify(FOLDERS));
  console.log("[sync] DROPBOX_ACCESS_TOKEN set:", !!process.env.DROPBOX_ACCESS_TOKEN);

  // ── Root folder audit — what actually exists in Dropbox ──────────────────────
  try {
    const rootEntries = await listFolderRaw("");
    console.log("[sync] Root Dropbox folders:", rootEntries.map((e) => e.name).join(", ") || "(none)");
  } catch (e) {
    console.error("[sync] Could not list root folder:", (e as Error).message);
  }

  const supabase = await createServerSupabaseClient();
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  // ── Video shows ──────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/shows] Listing folder: "${FOLDERS.shows}"`);
    const files = await listFolder(FOLDERS.shows);
    console.log(`[sync/shows] Raw files returned: ${files.length} — [${files.map((f) => f.name).join(", ")}]`);
    counts.shows = 0;
    for (const f of files) {
      if (!/\.(mp4|mov|mkv|webm)$/i.test(f.name)) {
        console.log(`[sync/shows] Skipping (wrong ext): ${f.name}`);
        continue;
      }
      console.log(`[sync/shows] Processing: ${f.name}`);
      const { title, djName, date } = cleanFileName(f.name);

      let tempLink: string | null = null;
      let tempLinkExpiresAt: string | null = null;
      try {
        tempLink = await getTemporaryLink(f.path_lower);
        tempLinkExpiresAt = new Date(Date.now() + LINK_TTL).toISOString();
      } catch (linkErr) {
        console.warn(`[sync/shows] ${f.name} → temp link failed: ${(linkErr as Error).message}`);
      }

      await supabase.from("show_archive").upsert(
        { dropbox_file_id: f.id, dropbox_path: f.path_lower, title, dj_name: djName ?? "", recorded_at: date ?? null, status: "pending" },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );
      if (tempLink) {
        await supabase.from("show_archive").update({ temp_link: tempLink, temp_link_expires_at: tempLinkExpiresAt }).eq("dropbox_file_id", f.id);
      }
      counts.shows++;
    }
  } catch (e) {
    console.error(`[sync/shows] Error:`, (e as Error).message);
    errors.push(`shows: ${(e as Error).message}`);
  }

  // ── DJ mixes ─────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/mixes] Listing folder: "${FOLDERS.mixes}"`);
    const files = await listFolder(FOLDERS.mixes);
    console.log(`[sync/mixes] Raw files returned: ${files.length} — [${files.map((f) => f.name).join(", ")}]`);
    counts.mixes = 0;
    for (const f of files) {
      if (!/\.(mp3|wav|aac|flac|ogg|m4a)$/i.test(f.name)) {
        console.log(`[sync/mixes] Skipping (wrong ext): ${f.name}`);
        continue;
      }
      console.log(`[sync/mixes] Processing: ${f.name}`);
      const { title, djName, date } = cleanFileName(f.name);

      let tempLink: string | null = null;
      let tempLinkExpiresAt: string | null = null;
      try {
        tempLink = await getTemporaryLink(f.path_lower);
        tempLinkExpiresAt = new Date(Date.now() + LINK_TTL).toISOString();
      } catch (linkErr) {
        console.warn(`[sync/mixes] ${f.name} → temp link failed: ${(linkErr as Error).message}`);
      }

      await supabase.from("mixes").upsert(
        { dropbox_file_id: f.id, dropbox_path: f.path_lower, title, dj_name: djName ?? "", recorded_at: date ?? null, status: "pending" },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );
      if (tempLink) {
        await supabase.from("mixes").update({ temp_link: tempLink, temp_link_expires_at: tempLinkExpiresAt }).eq("dropbox_file_id", f.id);
      }
      counts.mixes++;
    }
  } catch (e) {
    console.error(`[sync/mixes] Error:`, (e as Error).message);
    errors.push(`mixes: ${(e as Error).message}`);
  }

  // ── Flyers ───────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/flyers] Listing folder: "${FOLDERS.flyers}"`);
    const files = await listFolder(FOLDERS.flyers);
    console.log(`[sync/flyers] Raw files returned: ${files.length} — [${files.map((f) => f.name).join(", ")}]`);
    counts.flyers = 0;
    for (const f of files) {
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)) continue;
      await supabase.from("flyers").upsert(
        { dropbox_file_id: f.id, dropbox_path: f.path_lower, title: cleanFileName(f.name).title },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );
      counts.flyers++;
    }
  } catch (e) {
    console.error(`[sync/flyers] Error:`, (e as Error).message);
    errors.push(`flyers: ${(e as Error).message}`);
  }

  // ── Photos ───────────────────────────────────────────────────────────────────
  try {
    console.log(`[sync/photos] Listing folder: "${FOLDERS.photos}"`);
    const files = await listFolder(FOLDERS.photos);
    console.log(`[sync/photos] Raw files returned: ${files.length} — [${files.map((f) => f.name).join(", ")}]`);
    counts.photos = 0;
    for (const f of files) {
      if (!/\.(jpg|jpeg|png|webp)$/i.test(f.name)) continue;
      await supabase.from("photos").upsert(
        { dropbox_file_id: f.id, dropbox_path: f.path_lower, title: cleanFileName(f.name).title },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );
      counts.photos++;
    }
  } catch (e) {
    console.error(`[sync/photos] Error:`, (e as Error).message);
    errors.push(`photos: ${(e as Error).message}`);
  }

  // ── Log the sync ─────────────────────────────────────────────────────────────
  console.log("[sync] Final counts:", JSON.stringify(counts));
  await supabase.from("sync_log").insert({
    synced_at:    new Date().toISOString(),
    shows_found:  counts.shows  ?? 0,
    mixes_found:  counts.mixes  ?? 0,
    flyers_found: counts.flyers ?? 0,
    photos_found: counts.photos ?? 0,
    errors:       errors.length ? errors.join("; ") : null,
  });

  return NextResponse.json({ ok: true, counts, errors });
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  return POST(req);
}
