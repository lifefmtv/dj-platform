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

export async function GET() {
  try {
    const res = await fetch(
      "https://api.mixcloud.com/LifeFm/cloudcasts/?limit=10",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();

    const shows: MixcloudShow[] = (data.data ?? []).map((item: any) => ({
      key: item.key,
      name: item.name,
      url: item.url,
      created_time: item.created_time,
      pictures: item.pictures ?? {},
      listener_count: item.listener_count,
    }));

    return NextResponse.json(shows, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
