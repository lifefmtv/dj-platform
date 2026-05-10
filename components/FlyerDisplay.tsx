import { createServerSupabaseClient } from "@/lib/supabaseServer";
import FlyerLightbox from "@/components/FlyerLightbox";

export default async function FlyerDisplay() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("settings")
    .select("current_flyer_url")
    .eq("id", 1)
    .single();

  return (
    <div className="flyer-section">
      <p className="flyer-section-label">Current Event</p>
      {data?.current_flyer_url ? (
        <div className="flyer-image-wrap">
          <FlyerLightbox src={data.current_flyer_url} />
        </div>
      ) : (
        <div className="placeholder-empty">Event flyer coming soon</div>
      )}
    </div>
  );
}
