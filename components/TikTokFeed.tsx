import Image from "next/image";

const TIKTOK_URL = "https://www.tiktok.com/@lifefmtv";

export default function TikTokFeed() {
  return (
    <a
      href={TIKTOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="tiktok-card"
      aria-label="Follow Life FM on TikTok"
    >
      {/* Header */}
      <div className="tiktok-card-header">
        <TikTokLogo />
        <span className="tiktok-card-platform">TikTok</span>
      </div>

      {/* Profile row */}
      <div className="tiktok-profile-row">
        <div className="tiktok-avatar">
          <Image
            src="/logo.webp"
            alt="Life FM TV"
            width={52}
            height={52}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div className="tiktok-profile-info">
          <p className="tiktok-handle">@lifefmtv</p>
          <p className="tiktok-name">Life FM TV</p>
        </div>
      </div>

      {/* Stats */}
      <div className="tiktok-stats">
        <div className="tiktok-stat">
          <span className="tiktok-stat-value">24/7</span>
          <span className="tiktok-stat-label">Live Sets</span>
        </div>
        <div className="tiktok-stat-divider" />
        <div className="tiktok-stat">
          <span className="tiktok-stat-value">DNB</span>
          <span className="tiktok-stat-label">Jungle · House</span>
        </div>
        <div className="tiktok-stat-divider" />
        <div className="tiktok-stat">
          <span className="tiktok-stat-value">UK</span>
          <span className="tiktok-stat-label">Underground</span>
        </div>
      </div>

      {/* Video teasers */}
      <div className="tiktok-teasers">
        <div className="tiktok-teaser">
          <div className="tiktok-teaser-thumb tiktok-teaser-thumb--1">
            <span className="tiktok-play-icon">▶</span>
          </div>
          <p className="tiktok-teaser-text">Live DNB set 🔥</p>
        </div>
        <div className="tiktok-teaser">
          <div className="tiktok-teaser-thumb tiktok-teaser-thumb--2">
            <span className="tiktok-play-icon">▶</span>
          </div>
          <p className="tiktok-teaser-text">Sunday Roast vibes</p>
        </div>
        <div className="tiktok-teaser">
          <div className="tiktok-teaser-thumb tiktok-teaser-thumb--3">
            <span className="tiktok-play-icon">▶</span>
          </div>
          <p className="tiktok-teaser-text">Tech house takeover</p>
        </div>
      </div>

      {/* CTA */}
      <div className="tiktok-cta">
        <span className="tiktok-follow-btn">
          <TikTokLogo size={14} />
          Follow on TikTok
        </span>
      </div>
    </a>
  );
}

function TikTokLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}
