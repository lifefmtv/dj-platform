export const dynamic = "force-dynamic";

import LiveStream from "@/components/LiveStream";
import ChatRoom from "@/components/ChatRoom";
import NewsTicker from "@/components/NewsTicker";
import NewsCards from "@/components/NewsCards";
import FlyerDisplay from "@/components/FlyerDisplay";
import Countdown from "@/components/Countdown";
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
        <p className="about-eyebrow">24/7 Live Radio</p>
        <p className="about-text">
          Live streaming radio station broadcasting 24/7 DNB &amp; DUB. From tech house to
          trance, drum and bass to funky house, reggae to dub, we have it all. Join us for
          something new every night.
        </p>
      </section>

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
