import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 300;

// UPDATE THIS WITH LIFEFM.TV YOUTUBE CHANNEL ID
const LIFEFM_YOUTUBE_CHANNEL_ID = "UCcUHbW1H8IGylqyxhcTCaUQ";

export interface Show {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  created_time: string;
  source: "mixcloud" | "youtube";
  embed_url?: string;    // Mixcloud iframe src only
  listener_count?: number;
}

async function fetchMixcloudShows(): Promise<Show[]> {
  const res = await fetch(
    "https://api.mixcloud.com/LifeFm/cloudcasts/?limit=12",
    { headers: { Accept: "application/json" }, next: { revalidate: 300 } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? [])
    .filter((item: any) => item.user?.key === "/LifeFm/")
    .map(
      (item: any): Show => ({
        id: item.key,
        title: item.name,
        url: item.url,
        thumbnail:
          item.pictures?.["640wx640h"] ??
          item.pictures?.large ??
          item.pictures?.["300wx300h"] ??
          item.pictures?.medium ??
          item.pictures?.thumbnail ??
          null,
        created_time: item.created_time,
        source: "mixcloud",
        embed_url: `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(item.key)}`,
        listener_count: item.listener_count,
      }),
    );
}

async function fetchYouTubeShows(): Promise<Show[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${LIFEFM_YOUTUBE_CHANNEL_ID}`;
  const parser = new Parser({ timeout: 8000 });
  const feed = await parser.parseURL(feedUrl);
  return (feed.items ?? []).slice(0, 12).map((item): Show => {
    const videoId =
      new URL(item.link ?? "https://x.invalid").searchParams.get("v") ?? "";
    return {
      id: videoId || item.guid || item.link || "",
      title: item.title ?? "",
      url: item.link ?? `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null,
      created_time: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      source: "youtube",
    };
  });
}

export async function GET() {
  try {
    const [mixResult, ytResult] = await Promise.allSettled([
      fetchMixcloudShows(),
      fetchYouTubeShows(),
    ]);

    const shows: Show[] = [
      ...(mixResult.status === "fulfilled" ? mixResult.value : []),
      ...(ytResult.status === "fulfilled" ? ytResult.value : []),
    ];

    shows.sort(
      (a, b) =>
        new Date(b.created_time).getTime() - new Date(a.created_time).getTime(),
    );

    return NextResponse.json(shows.slice(0, 20), {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
