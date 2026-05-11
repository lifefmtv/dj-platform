import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Life For Music Label",
  description: "Life For Music is an independent label championing underground sounds — jungle, DNB, dub and beyond. Meet the artist roster and stream their music.",
};

export default function LabelPage() {
  const artists = [
    { name: "Paul Roast", role: "Founder · Jungle / DNB" },
    { name: "Mel Lioness", role: "Jungle · Drum & Bass" },
    { name: "DJ V", role: "Tech House · Techno" },
    { name: "Solution-Sound", role: "Dub · Reggae" },
    { name: "DJ Kitch", role: "Soul & Funk · House" },
  ];

  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>

      <div className="label-hero">
        <p className="label-eyebrow">Est. from the underground</p>
        <h1 className="label-heading">Life For Music</h1>
        <p className="label-strapline">
          Independent label. Uncompromising sound. Community first.
        </p>
        <a
          href="https://linktr.ee/lifeformusic"
          target="_blank"
          rel="noopener noreferrer"
          className="label-linktree-btn"
        >
          Linktree — All Links
        </a>
      </div>

      <section className="label-artists">
        <p className="label-section-label">Artist Roster</p>
        <div className="label-artists-grid">
          {artists.map((a) => (
            <div key={a.name} className="label-artist-card">
              <div className="label-artist-avatar">
                {a.name.charAt(0)}
              </div>
              <p className="label-artist-name">{a.name}</p>
              <p className="label-artist-role">{a.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="label-music">
        <p className="label-section-label">Listen</p>
        <div className="label-soundcloud-wrap">
          <iframe
            width="100%"
            height="450"
            allow="autoplay"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/users/lifeformusic&color=%23e63030&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true"
            title="Life For Music on SoundCloud"
            style={{ border: "none", display: "block" }}
          />
        </div>
      </section>

      <section className="label-links-section">
        <a
          href="https://linktr.ee/lifeformusic"
          target="_blank"
          rel="noopener noreferrer"
          className="label-linktree-btn label-linktree-btn--large"
        >
          Find Us Everywhere — Linktree
        </a>
      </section>
    </main>
  );
}
