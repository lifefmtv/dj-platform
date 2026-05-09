export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { format } from "date-fns";

export default async function MixesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: mixes } = await supabase
    .from("mixes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Mixes</h1>

      {!mixes || mixes.length === 0 ? (
        <div className="empty-state">No mixes uploaded yet</div>
      ) : (
        <div className="mixes-grid">
          {mixes.map((mix) => (
            <div key={mix.id} className="mix-card">
              <p className="mix-title">{mix.title}</p>
              <p className="mix-artist">{mix.artist}</p>
              <p className="mix-date">{format(new Date(mix.created_at), "d MMM yyyy")}</p>
              <audio controls src={mix.audio_url} style={{ width: "100%", accentColor: "#e63030" }} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
