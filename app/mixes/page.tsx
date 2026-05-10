"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";

interface Mix {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  created_at: string;
  genre?: string;
}

const GENRES = [
  { label: "DNB", color: "#e63030" },
  { label: "House", color: "#6366f1" },
  { label: "Techno", color: "#1a1a2e" },
  { label: "Jungle", color: "#22c55e" },
  { label: "Dub", color: "#f59e0b" },
  { label: "Soul & Funk", color: "#ec4899" },
  { label: "Tech House", color: "#00d4ff" },
  { label: "Other", color: "#aaa" },
];

export default function MixesPage() {
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("mixes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setMixes(data);
        setLoading(false);
      });
  }, []);

  const filtered = activeGenre
    ? mixes.filter((m) => m.genre === activeGenre)
    : mixes;

  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Mixes</h1>

      {/* Genre filter bar */}
      <div className="mixes-filter-bar">
        <button
          className={`mixes-filter-btn${activeGenre === null ? " mixes-filter-btn--active" : ""}`}
          onClick={() => setActiveGenre(null)}
        >
          All
        </button>
        {GENRES.map(({ label, color }) => (
          <button
            key={label}
            className={`mixes-filter-btn${activeGenre === label ? " mixes-filter-btn--active" : ""}`}
            style={
              activeGenre === label
                ? { background: color, borderColor: color, color: label === "Techno" ? "#fff" : undefined }
                : { borderColor: color, color: color }
            }
            onClick={() => setActiveGenre(activeGenre === label ? null : label)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading mixes…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {activeGenre ? `No ${activeGenre} mixes yet` : "No mixes yet — check back soon"}
        </div>
      ) : (
        <div className="mixes-grid">
          {filtered.map((mix) => {
            const genreColor = GENRES.find((g) => g.label === mix.genre)?.color;
            return (
              <div key={mix.id} className="mix-card">
                {genreColor && (
                  <div
                    className="mix-genre-bar"
                    style={{ background: genreColor }}
                  />
                )}
                <p className="mix-title">{mix.title}</p>
                <p className="mix-artist">{mix.artist}</p>
                {mix.genre && (
                  <p
                    className="mix-genre-tag"
                    style={{ color: genreColor ?? "var(--text-3)" }}
                  >
                    {mix.genre}
                  </p>
                )}
                <p className="mix-date">
                  {format(new Date(mix.created_at), "d MMM yyyy")}
                </p>
                <audio
                  controls
                  src={mix.audio_url}
                  style={{ width: "100%", accentColor: "#e63030" }}
                />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
