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
  { url: "https://djtechtools.com/feed/", source: "DJ Tech Tools", color: "#ff6b35" },
  { url: "https://news.djcity.com/feed/", source: "DJ City", color: "#00d4ff" },
  { url: "https://wearecrossfader.co.uk/feed/", source: "Crossfader", color: "#a855f7" },
  { url: "https://edmjoy.com/feed/", source: "EDM Joy", color: "#22c55e" },
  { url: "https://djlifemag.com/feed/", source: "DJ Life", color: "#f59e0b" },
  { url: "https://breakbeat.co.uk/feed/", source: "Breakbeat", color: "#ec4899" },
  { url: "https://www.dnbdojo.co.uk/feed/", source: "DNB Dojo", color: "#e63030" },
  { url: "https://5mag.net/category/news/feed/", source: "5 Mag", color: "#14b8a6" },
  { url: "https://feeds.feedburner.com/DeeperShadesOfHouse", source: "Deeper Shades", color: "#6366f1" },
];

export const revalidate = 300;

export async function GET() {
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

  // Round-robin interleave so every working source gets equal representation
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

  return NextResponse.json(items.slice(0, 54), {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}
