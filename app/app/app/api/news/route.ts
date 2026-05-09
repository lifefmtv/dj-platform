import Parser from "rss-parser";

const parser = new Parser();

const FEEDS = [
  { url: "https://www.residentadvisor.net/rss.aspx", source: "Resident Advisor" },
  { url: "https://mixmag.net/feed", source: "Mixmag" },
  { url: "https://www.nme.com/feed", source: "NME" },
];

export const revalidate = 900; // 15 minutes

export async function GET() {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async (feed) => {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items.map((item) => ({
          title: item.title || "",
          link: item.link || "",
          source: feed.source,
          pubDate: item.pubDate || "",
        }));
      })
    );

    const allItems = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value);

    // Deduplicate by link
    const seen = new Set();
    const unique = allItems.filter((item) => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    });

    // Sort by date descending
    unique.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    return Response.json(unique.slice(0, 20));
  } catch (error) {
    return Response.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}