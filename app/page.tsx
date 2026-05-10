export const dynamic = "force-dynamic";

import LiveStream from "@/components/LiveStream";
import ChatTabs from "@/components/ChatTabs";
import NewsTicker from "@/components/NewsTicker";
import NewsCards from "@/components/NewsCards";
import FlyerDisplay from "@/components/FlyerDisplay";
import Countdown from "@/components/Countdown";
import NextUpBanner from "@/components/NextUpBanner";
import MixcloudShows from "@/components/MixcloudShows";
import TikTokFeed from "@/components/TikTokFeed";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: nextDJ } = await supabase
    .from("schedule")
    .select("*")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <main>
      {/* Next Up banner — above the stream */}
      {nextDJ && (
        <NextUpBanner
          djName={nextDJ.dj_name}
          eventDate={nextDJ.date}
          startTime={nextDJ.start_time}
          genre={nextDJ.genre ?? null}
        />
      )}

      {/* Hero: stream + chat */}
      <div className="stream-chat-grid">
        <LiveStream />
        <ChatTabs />
      </div>

      <NewsTicker />

      {/* About */}
      <section className="about-section">
        <div className="about-left">
          <p className="about-eyebrow">Born from the underground</p>
          <p className="about-text">
            Born from the underground, broadcasting to the world. LIFEFM.TV has been championing
            the sounds of DNB, dub, tech house, jungle and everything in between since the pirate
            radio days. Founded by Paul Roast — one of the original faces behind the legendary
            Sunday Roast jungle raves — we&apos;ve spent decades giving a platform to the artists,
            DJs and selectors that don&apos;t fit anywhere else.
          </p>
          <p className="about-hero-line">
            Every night is something different. Every set is live. Every listener is family.
          </p>
          <p className="about-tagline">Tune in.</p>
        </div>

        <div className="about-right">
          <TikTokFeed />
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

      {/* Flyer + News */}
      <div className="flyer-news-grid">
        <FlyerDisplay />
        <NewsCards />
      </div>
    </main>
  );
}
