import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Image from "next/image";

export default async function FlyerDisplay() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("settings")
    .select("current_flyer_url")
    .eq("id", 1)
    .single();

  return (
    <div className="flyer-section">
      <h2 className="news-section-heading">Current Event</h2>
      {data?.current_flyer_url ? (
        <div className="flyer-image-wrap">
          <Image
            src={data.current_flyer_url}
            alt="Event flyer"
            width={400}
            height={600}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      ) : (
        <div className="placeholder-empty">Flyer coming soon</div>
      )}
    </div>
  );
}
