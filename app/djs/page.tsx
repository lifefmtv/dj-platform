import type { Metadata } from "next";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { genreColor } from "@/lib/genreColors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Selectors — Life FM TV",
  description: "The DJs, selectors and artists who power the Life FM TV stream — from jungle and DNB to house, techno, dub and soul.",
};

interface DJ {
  id: string;
  name: string;
  slug: string;
  genre: string;
  photo_url: string | null;
  show_name: string | null;
  is_resident: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DJsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: djs } = await supabase
    .from("djs")
    .select("id,name,slug,genre,photo_url,show_name,is_resident")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const list = djs ?? [];

  return (
    <main className="content-page djs-page">
      <a href="/" className="back-link">← Home</a>

      <div className="djs-page-header">
        <p className="djs-eyebrow">Life FM TV</p>
        <h1 className="djs-heading">The Selectors</h1>
        <p className="djs-subheading">
          The artists, DJs and selectors that power the stream.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">No DJ profiles yet — check back soon</div>
      ) : (
        <div className="djs-grid">
          {list.map((dj) => {
            const color = genreColor(dj.genre);
            return (
              <a key={dj.id} href={`/djs/${dj.slug}`} className="dj-card">
                {/* Background photo or placeholder */}
                <div className="dj-card-bg">
                  {dj.photo_url ? (
                    <Image
                      src={dj.photo_url}
                      alt={dj.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: "cover", objectPosition: "top center" }}
                    />
                  ) : (
                    <div className="dj-card-initials" style={{ background: `${color}18` }}>
                      <span style={{ color }}>{initials(dj.name)}</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="dj-card-overlay" />
                </div>

                {/* Bottom content */}
                <div className="dj-card-body">
                  {dj.is_resident && (
                    <span className="dj-resident-badge">Resident</span>
                  )}
                  <p className="dj-card-name">{dj.name}</p>
                  {dj.show_name && (
                    <p className="dj-card-show">{dj.show_name}</p>
                  )}
                  <span
                    className="dj-genre-badge"
                    style={{ background: `${color}22`, color, borderColor: `${color}55` }}
                  >
                    {dj.genre}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}
