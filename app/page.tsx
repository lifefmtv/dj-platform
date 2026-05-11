export const dynamic = "force-dynamic";

import LiveStream from "@/components/LiveStream";
import ChatTabs from "@/components/ChatTabs";
import NewsTicker from "@/components/NewsTicker";
import VibeMeter from "@/components/VibeMeter";
import NewsCards from "@/components/NewsCards";
import FlyerDisplay from "@/components/FlyerDisplay";
import Countdown from "@/components/Countdown";
import NextUpBanner from "@/components/NextUpBanner";
import MixcloudShows from "@/components/MixcloudShows";
import SocialFollow from "@/components/SocialFollow";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { getUKDateTime } from "@/lib/broadcastStatus";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { date: ukDate, time: ukTime } = getUKDateTime();

  // Show currently on air — date matches today UK, time falls between start and end
  const { data: currentDJ } = await supabase
    .from("schedule")
    .select("*")
    .eq("date", ukDate)
    .lte("start_time", ukTime)
    .gt("end_time", ukTime)
    .maybeSingle();

  // Next upcoming show — first show starting after the current one (or after now if nothing current)
  const nextThreshold = currentDJ ? currentDJ.end_time : ukTime;
  const { data: nextDJ } = await supabase
    .from("schedule")
    .select("*")
    .or(`date.gt.${ukDate},and(date.eq.${ukDate},start_time.gte.${nextThreshold})`)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <main>
      {/* Status / Now Playing / Up Next banner — always rendered */}
      <NextUpBanner
        currentShow={currentDJ ?? null}
        nextShow={nextDJ ?? null}
      />

      {/* Hero: stream + chat */}
      <div className="stream-chat-grid">
        <LiveStream />
        <ChatTabs />
      </div>

      <VibeMeter />

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
