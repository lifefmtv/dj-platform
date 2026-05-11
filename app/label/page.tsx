import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Life For Music — Label",
  description:
    "Life For Music is an independent digital record label from London releasing Drum and Bass and Techno music. Founded by the LIFEFM.TV crew — Paul Roast, Mel Lioness, DJ Kitch, SolutionSound and DJ V.",
};

const TEAM = [
  { name: "Paul Roast",    role: "Founder & A&R",       href: null },
  { name: "Mel Lioness",   role: "Co-Founder & DJ",     href: "/djs/lioness" },
  { name: "DJ Kitch",      role: "Artist & DJ",         href: "/djs/dj-kitch" },
  { name: "SolutionSound", role: "Producer & Artwork",  href: null },
  { name: "DJ V",          role: "Artist & Engineer",   href: "/djs/dj-v" },
];

const PLATFORMS = [
  { name: "Spotify",       url: "https://open.spotify.com/search/Life%20For%20Music",        color: "#1DB954" },
  { name: "Beatport",      url: "https://www.beatport.com/label/life-for-music/",             color: "#01FF95" },
  { name: "Juno Download", url: "https://www.junodownload.com/labels/Life+For+Music/",        color: "#e63030" },
  { name: "Apple Music",   url: "https://music.apple.com/search?term=life+for+music",         color: "#fc3c44" },
  { name: "Amazon Music",  url: "https://music.amazon.com/search/life+for+music",             color: "#00a8e0" },
  { name: "Deezer",        url: "https://www.deezer.com/search/Life%20For%20Music",           color: "#a238ff" },
  { name: "Tidal",         url: "https://tidal.com/browse/search?q=life+for+music",          color: "#fff" },
  { name: "Bandcamp",      url: "https://lifeformusic.bandcamp.com",                          color: "#1DA0C3" },
  { name: "SoundCloud",    url: "https://soundcloud.com/lifeformusicuk",                      color: "#FF5500" },
];

export default function LabelPage() {
  return (
    <main className="lfm-page">

      {/* ── 1. HERO ─────────────────────────────────────────── */}
      <section className="lfm-hero">
        <a href="/" className="back-link lfm-back">← Home</a>
        <p className="lfm-eyebrow">Independent Digital Record Label</p>
        <h1 className="lfm-hero-title">LIFE<br />FOR<br />MUSIC</h1>
        <p className="lfm-hero-tagline">
          A digital record label born from the underground —<br />
          releasing Drum and Bass and Techno music from London
        </p>
        <div className="lfm-hero-buttons">
          <a href="https://lifeformusic.bandcamp.com" target="_blank" rel="noopener noreferrer"
            className="lfm-btn" style={{ background: "#1DA0C3" }}>Bandcamp</a>
          <a href="https://soundcloud.com/lifeformusicuk" target="_blank" rel="noopener noreferrer"
            className="lfm-btn" style={{ background: "#FF5500" }}>SoundCloud</a>
          <a href="https://x.com/LifeForMusicUK" target="_blank" rel="noopener noreferrer"
            className="lfm-btn" style={{ background: "#111", border: "1px solid #333" }}>Twitter / X</a>
          <a href="https://www.beatport.com/label/life-for-music/" target="_blank" rel="noopener noreferrer"
            className="lfm-btn" style={{ background: "#01FF95", color: "#111" }}>Beatport</a>
          <a href="https://www.instagram.com/lifeformusicuk" target="_blank" rel="noopener noreferrer"
            className="lfm-btn lfm-btn--instagram">Instagram</a>
          <a href="https://linktr.ee/lifeformusic" target="_blank" rel="noopener noreferrer"
            className="lfm-btn" style={{ background: "#39E09B", color: "#111" }}>Linktree</a>
        </div>
        <p className="lfm-cat-count">30+ releases and counting · est. from the underground</p>
      </section>

      {/* ── 2. ABOUT ─────────────────────────────────────────── */}
      <section className="lfm-about">
        <div className="lfm-about-inner">
          <div className="lfm-about-text">
            <span className="lfm-section-eyebrow">About the Label</span>
            <p className="lfm-body-text">
              Life For Music is an independent digital record label releasing Drum and Bass and
              Techno music from the heart of London. Founded by the crew behind LIFEFM.TV — Paul
              Roast, Mel Lioness, DJ Kitch, SolutionSound and DJ V — the label has been quietly
              building a catalogue of underground releases since its inception, now reaching
              catalogue number LFM030 and counting.
            </p>
            <p className="lfm-body-text">
              Every release is crafted with care — mastered to the highest standard and
              distributed worldwide across Spotify, Beatport, Juno Download, Apple Music, Deezer,
              Amazon Music and Tidal. Life For Music is not just a label — it is a family, a
              philosophy, and a commitment to keeping the underground alive.
            </p>
          </div>
          <div className="lfm-about-embed">
            <iframe
              width="100%"
              height="400"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fsoundcloud.com%2Flifeformusicuk&show_artwork=true&auto_play=false"
              title="Life For Music on SoundCloud"
              style={{ border: "none", display: "block", borderRadius: "8px" }}
            />
          </div>
        </div>
      </section>

      {/* ── 3. LATEST RELEASE ────────────────────────────────── */}
      <section className="lfm-release-section">
        <div className="lfm-release-inner">
          <span className="lfm-section-eyebrow">Latest Release</span>
          <div className="lfm-release-card">
            <div className="lfm-release-accent" />
            <div className="lfm-release-body">
              <p className="lfm-release-cat">LFM030 · Released 26 April 2024</p>
              <h2 className="lfm-release-title">Clik — &ldquo;Tears&rdquo;</h2>
              <p className="lfm-release-desc">
                The latest chapter in the Life For Music story. Mastered by Clik himself, with
                artwork and visuals by Solution-Sound. Available now on all major platforms.
              </p>
              <div className="lfm-release-buttons">
                <a href="https://www.beatport.com/release/coshh-tears/4525076"
                  target="_blank" rel="noopener noreferrer" className="lfm-release-btn lfm-release-btn--beatport">
                  Buy on Beatport
                </a>
                <a href="https://www.junodownload.com/products/clik-coshh-tears/6575181-02/"
                  target="_blank" rel="noopener noreferrer" className="lfm-release-btn lfm-release-btn--juno">
                  Buy on Juno
                </a>
                <a href="https://soundcloud.com/lifeformusicuk"
                  target="_blank" rel="noopener noreferrer" className="lfm-release-btn lfm-release-btn--sc">
                  Stream on SoundCloud
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. THE TEAM ──────────────────────────────────────── */}
      <section className="lfm-team-section">
        <div className="lfm-team-inner">
          <span className="lfm-section-eyebrow">The Team</span>
          <div className="lfm-team-grid">
            {TEAM.map((member) =>
              member.href ? (
                <a key={member.name} href={member.href} className="lfm-team-card lfm-team-card--link">
                  <div className="lfm-team-avatar">{member.name.charAt(0)}</div>
                  <p className="lfm-team-name">{member.name}</p>
                  <p className="lfm-team-role">{member.role}</p>
                  <span className="lfm-team-view">View profile →</span>
                </a>
              ) : (
                <div key={member.name} className="lfm-team-card">
                  <div className="lfm-team-avatar">{member.name.charAt(0)}</div>
                  <p className="lfm-team-name">{member.name}</p>
                  <p className="lfm-team-role">{member.role}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── 5. WHERE TO FIND OUR MUSIC ───────────────────────── */}
      <section className="lfm-platforms-section">
        <div className="lfm-platforms-inner">
          <span className="lfm-section-eyebrow">Where to Find Our Music</span>
          <div className="lfm-platforms-grid">
            {PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="lfm-platform-btn"
                style={{ "--platform-color": p.color } as React.CSSProperties}
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SUBMIT DEMOS ──────────────────────────────────── */}
      <section className="lfm-demos-section">
        <div className="lfm-demos-inner">
          <span className="lfm-section-eyebrow">Submit a Demo</span>
          <h2 className="lfm-demos-heading">Want to release on Life For Music?</h2>
          <p className="lfm-demos-text">
            We are always listening. Send your demos to{" "}
            <a href="mailto:lifefmhq@gmail.com" className="lfm-demos-email-link">
              lifefmhq@gmail.com
            </a>{" "}
            with <strong>DEMO</strong> in the subject line.
            Drum and Bass and Techno only. No ghost production. Keep it real.
          </p>
          <a
            href="mailto:lifefmhq@gmail.com?subject=DEMO — Life For Music Submission"
            className="lfm-demos-btn"
          >
            Send a Demo
          </a>
        </div>
      </section>

    </main>
  );
}
