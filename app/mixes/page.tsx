export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { format } from "date-fns";

export default async function MixesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: mixes } = await supabase
    .from("mixes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>Mixes</h1>
      {!mixes || mixes.length === 0 ? (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "3rem", textAlign: "center", color: "#555" }}>
          No mixes uploaded yet
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {mixes.map((mix) => (
            <div key={mix.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "1.5rem" }}>
              <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>{mix.title}</p>
              <p style={{ color: "#e63030", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: 600 }}>{mix.artist}</p>
              <p style={{ color: "#555", fontSize: "0.75rem", marginBottom: "1rem" }}>{format(new Date(mix.created_at), "d MMM yyyy")}</p>
              <audio controls src={mix.audio_url} style={{ width: "100%", accentColor: "#e63030" }} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
