export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import LiveStream from "@/components/LiveStream";
import ChatTabs from "@/components/ChatTabs";
import NewsTicker from "@/components/NewsTicker";
import VibeMeter from "@/components/VibeMeter";
import ShoutoutBanner from "@/components/ShoutoutBanner";
import NewsCards from "@/components/NewsCards";
import FlyerDisplay from "@/components/FlyerDisplay";
import Countdown from "@/components/Countdown";
import NextUpBanner from "@/components/NextUpBanner";
import MixcloudShows from "@/components/MixcloudShows";
import SocialFollow from "@/components/SocialFollow";
import StreamVisualiser from "@/components/StreamVisualiser";
import ScrollToTop from "@/components/ScrollToTop";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { getUKDateTime } from "@/lib/broadcastStatus";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifefm.tv";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RadioStation",
  name: "LIFEFM.TV",
  url: siteUrl,
  description:
    "Live underground music radio broadcasting DNB, dub, jungle and tech house 24/7 from London.",
  genre: ["Drum and Bass", "Dub", "Jungle", "Tech House", "House", "Soul & Funk"],
  broadcastDisplayName: "LIFEFM.TV",
  broadcastTimezone: "Europe/London",
  parentOrganization: {
    "@type": "Organization",
    name: "Life For Music",
    url: `${siteUrl}/label`,
    foundingDate: "2010",
  },
};

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { date: ukDate, time: ukTime } = getUKDateTime();
  const ukHHMM = ukTime.slice(0, 5); // "HH:MM" — matches stored time format

  // Fetch all of today's non-cancelled shows then filter in JS.
  // Needed to handle midnight crossover: shows ending at "00:00" would fail
  // a simple .gt("end_time", ukTime) string comparison.
  const { data: todayShows } = await supabase
    .from("schedule")
    .select("dj_name, date, start_time, end_time, genre, status")
    .eq("date", ukDate)
    .neq("status", "cancelled")
    .order("start_time");

  console.log("[homepage] ukDate:", ukDate, "ukHHMM:", ukHHMM);
  console.log("[homepage] todayShows count:", todayShows?.length ?? 0,
    todayShows?.map((s) => `${s.dj_name} ${s.start_time}-${s.end_time}`));

  // Postgres TIME columns return "HH:MM:SS" — slice to "HH:MM" before comparing.
  // Midnight crossover: end_time "00:00" means the show runs to midnight, treat as "24:00".
  const currentDJ = todayShows?.find((s) => {
    const startHHMM = s.start_time.slice(0, 5);
    const endHHMM   = s.end_time.slice(0, 5);
    const end = endHHMM === "00:00" ? "24:00" : endHHMM;
    return startHHMM <= ukHHMM && end > ukHHMM;
  }) ?? null;

  console.log("[homepage] currentDJ:", currentDJ?.dj_name ?? "null");

  // Up Next: first show starting after current ends (or after now), then tomorrow
  const nextThreshold = currentDJ ? currentDJ.end_time.slice(0, 5) : ukHHMM;
  const todayNext = todayShows?.find((s) => s.start_time.slice(0, 5) > nextThreshold) ?? null;

  const { data: futureNext } = !todayNext
    ? await supabase
        .from("schedule")
        .select("dj_name, date, start_time, end_time, genre, status")
        .gt("date", ukDate)
        .neq("status", "cancelled")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const nextDJ = todayNext ?? futureNext ?? null;

  // Map schedule genre names to video border colours
  const STREAM_GENRE_COLORS: Record<string, string> = {
    DNB: "#CC0000", Jungle: "#CC5500", Dub: "#1a5c1a",
    "Tech House": "#3d1a5c", Techno: "#444444",
    "Soul & Funk": "#5c4a00", House: "#1a1a5c",
  };
  const initialGenreColor = STREAM_GENRE_COLORS[currentDJ?.genre ?? ""] ?? "#333333";

  return (
    <main>
      <ScrollToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Status / Now Playing / Up Next banner — fixed-position, spacer reserves its height */}
      <NextUpBanner
        currentShow={currentDJ ?? null}
        nextShow={nextDJ ?? null}
      />
      <div className="next-up-banner-spacer" />

      {/* Hero: stream + chat */}
      <div className="stream-chat-grid">
        <LiveStream genreColor={initialGenreColor} />
        <ChatTabs />
      </div>
      <StreamVisualiser />

      <div className="interaction-strip">
        <VibeMeter />
        <ShoutoutBanner />
      </div>

      <NewsTicker />

      {/* About — 3 columns: copy | flyer | social */}
      <section className="about-section">
        <div className="about-left">
          <p className="about-text">
            LIFEFM.TV has been championing the sounds of DNB, dub, tech house, jungle and
            everything in between since the pirate radio days. Founded by Paul Roast — one of the
            original faces behind the legendary Sunday Roast jungle raves — we&apos;ve spent
            decades giving a platform to the artists, DJs and selectors that don&apos;t fit
            anywhere else.
          </p>
          <p className="about-hero-line">
            Every night is something different. Every set is live. Every listener is family.
          </p>
          <p className="about-tagline">Tune in.</p>
        </div>

        <div className="about-centre">
          <FlyerDisplay coverMode />
        </div>

        <div className="about-right">
          <SocialFollow />
        </div>
      </section>

      {/* Recent shows */}
      <div className="section-strip">
        <span className="section-strip-label">Recent Shows</span>
        <a href="/shows" className="section-strip-link">View all →</a>
      </div>
      <MixcloudShows compact />

      {nextDJ && (
        <Countdown
          djName={nextDJ.dj_name}
          eventDate={nextDJ.date}
          startTime={nextDJ.start_time}
        />
      )}

      <NewsCards />
    </main>
  );
}
