import { NextResponse } from "next/server";

interface MixcloudPictures {
  large?: string;
  medium?: string;
  thumbnail?: string;
  "640wx640h"?: string;
  "300wx300h"?: string;
}

interface MixcloudShow {
  key: string;
  name: string;
  url: string;
  created_time: string;
  pictures: MixcloudPictures;
  listener_count?: number;
}

export const revalidate = 300;

function mapShow(item: any): MixcloudShow {
  return {
    key: item.key,
    name: item.name,
    url: item.url,
    created_time: item.created_time,
    pictures: item.pictures ?? {},
    listener_count: item.listener_count,
  };
}

export async function GET() {
  try {
    const fetchOpts = {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    };

    const [profileResult, searchResult] = await Promise.allSettled([
      fetch("https://api.mixcloud.com/LifeFm/cloudcasts/?limit=20", fetchOpts),
      fetch(
        "https://api.mixcloud.com/search/?q=lifefm&type=cloudcast&limit=20",
        fetchOpts
      ),
    ]);

    const shows: MixcloudShow[] = [];
    const seen = new Set<string>();

    for (const result of [profileResult, searchResult]) {
      if (result.status !== "fulfilled" || !result.value.ok) continue;
      const data = await result.value.json();
      for (const item of data.data ?? []) {
        if (item.url && !seen.has(item.url)) {
          seen.add(item.url);
          shows.push(mapShow(item));
        }
      }
    }

    shows.sort(
      (a, b) =>
        new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    );

    return NextResponse.json(shows, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
