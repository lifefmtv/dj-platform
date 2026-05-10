// Static server component — no client JS needed

const brandBtn = (bg: string, fg: string, border = "transparent") =>
  ({ "--brand-bg": bg, "--brand-fg": fg, "--brand-border": border } as React.CSSProperties);

// ── Icons ────────────────────────────────────────────────────────

const Icons = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  mixcloud: (
    // Headphones — Mixcloud is an audio streaming platform
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M12 3a9 9 0 00-9 9v5a2 2 0 002 2h1v-6H5v-1a7 7 0 0114 0v1h-1v6h1a2 2 0 002-2v-5a9 9 0 00-9-9z" />
    </svg>
  ),
  kick: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  twitch: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2C5.61 4 4 5.61 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8c1.99 0 3.6-1.61 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 011.25 1.25A1.25 1.25 0 0117.25 8 1.25 1.25 0 0116 6.75a1.25 1.25 0 011.25-1.25zM12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5zm0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
};

// ── Data ─────────────────────────────────────────────────────────

const STREAM_PLATFORMS = [
  { name: "Facebook Live", href: "https://www.facebook.com/lifefm.co.uk",   icon: Icons.facebook,  style: brandBtn("#1877F2", "#fff") },
  { name: "Mixcloud Live", href: "https://www.mixcloud.com/live/LifeFm",     icon: Icons.mixcloud,  style: brandBtn("#52473F", "#fff") },
  { name: "Kick",          href: "https://kick.com/lifefmtv",                icon: Icons.kick,      style: brandBtn("#53FC18", "#000") },
  { name: "Twitch",        href: "https://twitch.tv/lifefmtv",               icon: Icons.twitch,    style: brandBtn("#9146FF", "#fff") },
  { name: "YouTube",       href: "https://www.youtube.com/@lifefmtv",        icon: Icons.youtube,   style: brandBtn("#FF0000", "#fff") },
  { name: "TikTok",        href: "https://www.tiktok.com/@lifefmtv",         icon: Icons.tiktok,    style: brandBtn("#010101", "#fff", "rgba(255,255,255,0.15)") },
];

const LEFT_SOCIAL = [
  { name: "Instagram", sub: "@lifefmhq",        href: "https://www.instagram.com/lifefmhq", icon: Icons.instagram, style: brandBtn("#E1306C", "#fff") },
  { name: "X / Twitter", sub: "@lifefmhq",      href: "https://twitter.com/lifefmhq",       icon: Icons.twitter,   style: brandBtn("#000000", "#fff", "#333333") },
  { name: "Email",      sub: "lifefmhq@gmail",  href: "mailto:lifefmhq@gmail.com",           icon: Icons.email,     style: brandBtn("#e63030", "#fff") },
];

const RIGHT_SOCIAL = [
  { name: "Facebook",  sub: "/lifefm.co.uk",  href: "https://www.facebook.com/lifefm.co.uk",  icon: Icons.facebook,  style: brandBtn("#1877F2", "#fff") },
  { name: "YouTube",   sub: "@lifefmtv",       href: "https://www.youtube.com/@lifefmtv",      icon: Icons.youtube,   style: brandBtn("#FF0000", "#fff") },
  { name: "TikTok",    sub: "@lifefmtv",       href: "https://www.tiktok.com/@lifefmtv",       icon: Icons.tiktok,    style: brandBtn("#010101", "#fff", "rgba(255,255,255,0.15)") },
];

// ── Component ────────────────────────────────────────────────────

export default function SocialFollow() {
  return (
    <div className="social-follow">

      {/* ── Section 1: Stream ── */}
      <div className="social-follow-part">
        <p className="social-follow-eyebrow">Catch us live on</p>
        <div className="social-stream-grid">
          {STREAM_PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="social-stream-btn"
              style={p.style}
              aria-label={p.name}
            >
              <span className="social-btn-icon">{p.icon}</span>
              <span className="social-btn-name">{p.name}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="social-follow-divider" />

      {/* ── Section 2: Social (two columns) ── */}
      <div className="social-follow-part">
        <p className="social-follow-eyebrow">Follow or message us on</p>
        <div className="social-two-col">
          <div className="social-socials-col">
            {LEFT_SOCIAL.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target={p.href.startsWith("mailto") ? undefined : "_blank"}
                rel={p.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                className="social-follow-btn"
                style={p.style}
              >
                <span className="social-btn-icon">{p.icon}</span>
                <div className="social-follow-btn-text">
                  <span className="social-btn-name">{p.name}</span>
                  <span className="social-btn-handle">{p.sub}</span>
                </div>
              </a>
            ))}
          </div>
          <div className="social-socials-col">
            {RIGHT_SOCIAL.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-follow-btn"
                style={p.style}
              >
                <span className="social-btn-icon">{p.icon}</span>
                <div className="social-follow-btn-text">
                  <span className="social-btn-name">{p.name}</span>
                  <span className="social-btn-handle">{p.sub}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="social-follow-divider" />

      {/* ── Section 3: Support ── */}
      <div className="social-follow-part">
        <p className="social-follow-eyebrow">Support the station</p>
        <a
          href="https://ko-fi.com/lifefmtv"
          target="_blank"
          rel="noopener noreferrer"
          className="social-support-btn"
          style={brandBtn("#f59e0b", "#111")}
        >
          <span>☕</span>
          <span>Buy Us a Coffee — Keep the underground alive</span>
        </a>
      </div>

    </div>
  );
}
