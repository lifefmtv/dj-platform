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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", minHeight: "500px" }}>
        <LiveStream />
        <ChatRoom />
      </div>
      <NewsTicker />
      {nextDJ && <Countdown djName={nextDJ.dj_name} eventDate={nextDJ.date} startTime={nextDJ.start_time} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
        <FlyerDisplay />
        <NewsCards />
      </div>
    </main>
  );
}
