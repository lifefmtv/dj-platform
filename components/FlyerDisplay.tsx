import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Image from "next/image";

export default async function FlyerDisplay() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("settings")
    .select("current_flyer_url")
    .eq("id", 1)
    .single();

  if (!data?.current_flyer_url) return null;

  return (
    <div style={{ padding: "2rem" }}>
      <h2
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: "var(--text-muted)",
          marginBottom: "1.25rem",
          textTransform: "uppercase",
        }}
      >
        Current Event
      </h2>
      <div
        style={{
          maxWidth: "400px",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(230,48,48,0.2)",
          boxShadow: "0 0 30px rgba(230,48,48,0.1)",
        }}
      >
        <Image
          src={data.current_flyer_url}
          alt="Event flyer"
          width={400}
          height={600}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
    </div>
  );
}
