import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 300;

// Confirmed channel ID for @lifefmtv (verified from channel page HTML)
const LIFEFM_CHANNEL_ID = "UCcUHbW1H8IGylqyxhcTCaUQ";

// Known YouTube usernames to try — rss-parser accepts user= feeds
const LIFEFM_YT_USERS = ["lifefmhq", "lifefm"];

export interface Show {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  created_time: string;
  source: "mixcloud" | "youtube";
  embed_url?: string;
  listener_count?: number;
}

// rss-parser with custom fields to capture YouTube Atom namespace elements
type YTItem = { ytVideoId?: string } & Record<string, unknown>;
const ytParser = new Parser<Record<string, never>, YTItem>({
  timeout: 8000,
  customFields: {
    item: [["yt:videoId", "ytVideoId"]],
  },
});

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

async function parseFeed(feedUrl: string): Promise<Show[]> {
  try {
    const feed = await ytParser.parseURL(feedUrl);
    return (feed.items ?? []).slice(0, 12).map((item): Show => {
      const videoId: string =
        item.ytVideoId ||
        new URL(item.link ?? "https://x.invalid").searchParams.get("v") ||
        (item.id?.toString().split(":").pop() ?? "");

      return {
        id: videoId || item.guid || item.link || "",
        title: item.title ?? "",
        url: videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : (item.link ?? ""),
        thumbnail: videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : null,
        created_time: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        source: "youtube",
      };
    });
  } catch {
    return [];
  }
}

async function fetchYouTubeShows(): Promise<Show[]> {
  const feeds = [
    { url: `https://www.youtube.com/feeds/videos.xml?channel_id=${LIFEFM_CHANNEL_ID}` },
    ...LIFEFM_YT_USERS.map((u) => ({
      url: `https://www.youtube.com/feeds/videos.xml?user=${u}`,
    })),
  ];

  const results = await Promise.allSettled(feeds.map((f) => parseFeed(f.url)));

  const seen = new Set<string>();
  const merged: Show[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const show of r.value) {
      if (show.id && !seen.has(show.id)) {
        seen.add(show.id);
        merged.push(show);
      }
    }
  }

  return merged;
}

export async function GET() {
  try {
    const [mixResult, ytResult] = await Promise.allSettled([
      fetchMixcloudShows(),
      fetchYouTubeShows(),
    ]);

    if (mixResult.status === "rejected") {
      console.error("[shows] Mixcloud fetch failed:", mixResult.reason);
    }
    if (ytResult.status === "rejected") {
      console.error("[shows] YouTube fetch failed:", ytResult.reason);
    }

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
  } catch (err) {
    console.error("[shows] Unhandled error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
