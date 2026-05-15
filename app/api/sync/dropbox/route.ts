import { NextRequest, NextResponse } from "next/server";
import { listFolder, getTemporaryLink, cleanFileName } from "@/lib/dropbox";
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

  const supabase = await createServerSupabaseClient();
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  // ── Video shows ──────────────────────────────────────────────────────────────
  try {
    const files = await listFolder(FOLDERS.shows);
    counts.shows = 0;
    for (const f of files) {
      if (!/\.(mp4|mov|mkv|webm)$/i.test(f.name)) continue;
      const { title, djName, date } = cleanFileName(f.name);

      let tempLink: string | null = null;
      let tempLinkExpiresAt: string | null = null;
      try {
        tempLink = await getTemporaryLink(f.path_lower);
        tempLinkExpiresAt = new Date(Date.now() + LINK_TTL).toISOString();
      } catch (linkErr) {
        console.warn(`[sync/shows] ${f.name} → temp link failed: ${(linkErr as Error).message}`);
      }

      // Step 1: insert metadata only if new (preserves admin-set status)
      await supabase.from("show_archive").upsert(
        {
          dropbox_file_id: f.id,
          dropbox_path:    f.path_lower,
          title,
          dj_name:         djName ?? "",
          recorded_at:     date   ?? null,
          status:          "pending",
        },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );

      // Step 2: always refresh temp link (even if row already existed)
      if (tempLink) {
        await supabase
          .from("show_archive")
          .update({ temp_link: tempLink, temp_link_expires_at: tempLinkExpiresAt })
          .eq("dropbox_file_id", f.id);
      }

      counts.shows++;
    }
  } catch (e) {
    errors.push(`shows: ${(e as Error).message}`);
  }

  // ── DJ mixes ─────────────────────────────────────────────────────────────────
  try {
    const files = await listFolder(FOLDERS.mixes);
    counts.mixes = 0;
    for (const f of files) {
      if (!/\.(mp3|wav|aac|flac|ogg|m4a)$/i.test(f.name)) continue;
      const { title, djName, date } = cleanFileName(f.name);

      let tempLink: string | null = null;
      let tempLinkExpiresAt: string | null = null;
      try {
        tempLink = await getTemporaryLink(f.path_lower);
        tempLinkExpiresAt = new Date(Date.now() + LINK_TTL).toISOString();
      } catch (linkErr) {
        console.warn(`[sync/mixes] ${f.name} → temp link failed: ${(linkErr as Error).message}`);
      }

      // Step 1: insert metadata only if new (preserves admin-set status)
      await supabase.from("mixes").upsert(
        {
          dropbox_file_id: f.id,
          dropbox_path:    f.path_lower,
          title,
          dj_name:         djName ?? "",
          recorded_at:     date   ?? null,
          status:          "pending",
        },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );

      // Step 2: always refresh temp link
      if (tempLink) {
        await supabase
          .from("mixes")
          .update({ temp_link: tempLink, temp_link_expires_at: tempLinkExpiresAt })
          .eq("dropbox_file_id", f.id);
      }

      counts.mixes++;
    }
  } catch (e) {
    errors.push(`mixes: ${(e as Error).message}`);
  }

  // ── Flyers ───────────────────────────────────────────────────────────────────
  try {
    const files = await listFolder(FOLDERS.flyers);
    counts.flyers = 0;
    for (const f of files) {
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)) continue;
      await supabase.from("flyers").upsert(
        {
          dropbox_file_id: f.id,
          dropbox_path:    f.path_lower,
          title:           cleanFileName(f.name).title,
        },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );
      counts.flyers++;
    }
  } catch (e) {
    errors.push(`flyers: ${(e as Error).message}`);
  }

  // ── Photos ───────────────────────────────────────────────────────────────────
  try {
    const files = await listFolder(FOLDERS.photos);
    counts.photos = 0;
    for (const f of files) {
      if (!/\.(jpg|jpeg|png|webp)$/i.test(f.name)) continue;
      await supabase.from("photos").upsert(
        {
          dropbox_file_id: f.id,
          dropbox_path:    f.path_lower,
          title:           cleanFileName(f.name).title,
        },
        { onConflict: "dropbox_file_id", ignoreDuplicates: true },
      );
      counts.photos++;
    }
  } catch (e) {
    errors.push(`photos: ${(e as Error).message}`);
  }

  // ── Log the sync ─────────────────────────────────────────────────────────────
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
