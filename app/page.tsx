export const dynamic = "force-dynamic";

import LiveStream from "@/components/LiveStream";
import ChatRoom from "@/components/ChatRoom";
import NewsTicker from "@/components/NewsTicker";
import NewsCards from "@/components/NewsCards";
import FlyerDisplay from "@/components/FlyerDisplay";
import Countdown from "@/components/Countdown";
import MixcloudShows from "@/components/MixcloudShows";
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
      {/* Stream + Chat with gradient glow border */}
      <div
        className="stream-chat-glow"
        style={{
          background:
            "linear-gradient(135deg, rgba(230,48,48,0.38) 0%, rgba(20,20,20,0) 45%, rgba(230,48,48,0.18) 100%)",
          padding: "1px",
        }}
      >
        <div className="stream-chat-grid">
          <LiveStream />
          <ChatRoom />
        </div>
      </div>

      <NewsTicker />

      {/* About */}
      <section className="about-section">
        <p className="about-eyebrow">Born from the underground</p>
        <p className="about-text">
          Born from the underground, broadcasting to the world. LIFEFM.TV has been championing
          the sounds of DNB, dub, tech house, jungle and everything in between since the pirate
          radio days. Founded by Paul Roast — one of the original faces behind the legendary
          Sunday Roast jungle raves — we&apos;ve spent decades giving a platform to the artists,
          DJs and selectors that don&apos;t fit anywhere else.
        </p>
        <p className="about-text about-text--secondary">
          Every night is something different. Every set is live. Every listener is family.
        </p>
        <p className="about-tagline">Tune in.</p>
      </section>

      {/* Recent shows — compact 3-card strip */}
      <MixcloudShows compact />

      {nextDJ && (
        <Countdown
          djName={nextDJ.dj_name}
          eventDate={nextDJ.date}
          startTime={nextDJ.start_time}
        />
      )}

      <div className="flyer-news-grid">
        <FlyerDisplay />
        <NewsCards />
      </div>
    </main>
  );
}
