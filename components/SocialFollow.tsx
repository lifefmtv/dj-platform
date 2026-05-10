// Static server component — no client JS needed

const STREAM_PLATFORMS = [
  {
    name: "Facebook Live",
    href: "https://www.facebook.com/lifefm.co.uk",
    bg: "#1877F2",
    fg: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Mixcloud",
    href: "https://www.mixcloud.com/live/LifeFm",
    bg: "#52473F",
    fg: "#fff",
    // Headphones icon — Mixcloud is an audio streaming platform
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
        <path d="M12 3a9 9 0 00-9 9v5a2 2 0 002 2h1v-6H5v-1a7 7 0 0114 0v1h-1v6h1a2 2 0 002-2v-5a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    name: "Kick",
    href: "https://kick.com/lifefmtv",
    bg: "#53FC18",
    fg: "#000",
    // Play arrow
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
  },
  {
    name: "Twitch",
    href: "https://twitch.tv/lifefmtv",
    bg: "#9146FF",
    fg: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    ),
  },
];

const SOCIAL_PLATFORMS = [
  {
    name: "Instagram",
    handle: "@lifefmhq",
    href: "https://www.instagram.com/lifefmhq",
    bg: "#E1306C",
    fg: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2C5.61 4 4 5.61 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8c1.99 0 3.6-1.61 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 011.25 1.25A1.25 1.25 0 0117.25 8 1.25 1.25 0 0116 6.75a1.25 1.25 0 011.25-1.25zM12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5zm0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z" />
      </svg>
    ),
  },
  {
    name: "X / Twitter",
    handle: "@lifefmhq",
    href: "https://twitter.com/lifefmhq",
    bg: "#000",
    fg: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    handle: "@lifefmtv",
    href: "https://www.tiktok.com/@lifefmtv",
    bg: "#010101",
    fg: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

export default function SocialFollow() {
  return (
    <div className="social-follow">

      {/* ── Part A: Stream with us ── */}
      <div className="social-follow-part">
        <p className="social-follow-eyebrow">Catch us live on</p>
        <p className="social-follow-intro">
          We stream live to these platforms every night — follow us so you never miss a show
        </p>
        <div className="social-stream-grid">
          {STREAM_PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="social-stream-btn"
              style={{ background: p.bg, color: p.fg }}
              aria-label={p.name}
            >
              <span className="social-btn-icon">{p.icon}</span>
              <span className="social-btn-name">{p.name}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="social-follow-divider" />

      {/* ── Part B: Follow us ── */}
      <div className="social-follow-part">
        <p className="social-follow-eyebrow">Follow us on</p>
        <div className="social-socials-col">
          {SOCIAL_PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="social-follow-btn"
              style={{ background: p.bg, color: p.fg }}
              aria-label={`Follow on ${p.name}`}
            >
              <span className="social-btn-icon">{p.icon}</span>
              <div className="social-follow-btn-text">
                <span className="social-btn-name">{p.name}</span>
                <span className="social-btn-handle">{p.handle}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
