import { NextResponse } from "next/server";
import Parser from "rss-parser";

type FeedItem = {
  title: string;
  link: string;
  source: string;
  pubDate: string;
};

const FEEDS = [
  { url: "https://mixmag.net/feed", source: "Mixmag" },
  { url: "https://djmag.com/feed/rss", source: "DJ Mag" },
  { url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", source: "BBC Music" },
  { url: "https://www.nme.com/music/feed/", source: "NME" },
];

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  const parser = new Parser({ timeout: 6000 });

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      const feed = await parser.parseURL(url);
      return feed.items.slice(0, 6).map<FeedItem>((item) => ({
        title: item.title ?? "",
        link: item.link ?? "",
        source,
        pubDate: item.pubDate ?? "",
      }));
    })
  );

  const items: FeedItem[] = results
    .filter((r): r is PromiseFulfilledResult<FeedItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 24);

  return NextResponse.json(items, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}
