import { NextResponse } from "next/server";

export const revalidate = 300;

export interface Show {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  created_time: string;
  source: "mixcloud" | "youtube";
  key?: string;          // mixcloud embed key
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
        key: item.key,
        listener_count: item.listener_count,
      }),
    );
}

async function fetchYouTubeShows(): Promise<Show[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map(
    (item: any): Show => ({
      id: item.id.videoId,
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail:
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        null,
      created_time: item.snippet.publishedAt,
      source: "youtube",
    }),
  );
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
