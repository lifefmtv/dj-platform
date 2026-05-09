import { NextResponse } from "next/server";
import Parser from "rss-parser";

type FeedItem = {
  title: string;
  link: string;
  source: string;
  color: string;
  pubDate: string;
};

const FEEDS = [
  {
    url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    source: "BBC Music",
    color: "#e63030",
  },
  {
    url: "https://www.nme.com/music/feed/",
    source: "NME",
    color: "#eab308",
  },
  {
    url: "https://mixmag.net/feed",
    source: "Mixmag",
    color: "#22c55e",
  },
  {
    url: "https://djmag.com/feed/rss",
    source: "DJ Mag",
    color: "#3b82f6",
  },
  {
    url: "https://www.theguardian.com/music/rss",
    source: "Guardian",
    color: "#a855f7",
  },
  {
    url: "https://pitchfork.com/rss/news/feed/rss/",
    source: "Pitchfork",
    color: "#f97316",
  },
];

export const revalidate = 300;

export async function GET() {
  // Realistic browser UA avoids RSS feed bot-blocks
  const parser = new Parser({
    timeout: 8000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source, color }) => {
      const feed = await parser.parseURL(url);
      return feed.items.slice(0, 6).map<FeedItem>((item) => ({
        title: item.title ?? "",
        link: item.link ?? "",
        source,
        color,
        pubDate: item.pubDate ?? "",
      }));
    })
  );

  // Round-robin interleave so every source gets equal ticker representation
  const perFeed = results
    .filter((r): r is PromiseFulfilledResult<FeedItem[]> => r.status === "fulfilled")
    .map((r) => r.value);

  const maxLen = perFeed.length ? Math.max(...perFeed.map((f) => f.length)) : 0;
  const items: FeedItem[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const feed of perFeed) {
      if (feed[i]) items.push(feed[i]);
    }
  }

  return NextResponse.json(items.slice(0, 30), {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}
