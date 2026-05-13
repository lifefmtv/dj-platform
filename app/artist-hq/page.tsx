"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// ── Types & constants ──────────────────────────────────────────────────────────

type TabKey = "guide" | "tagging" | "brand" | "create" | "community";
type StyleKey = "dark" | "neon" | "minimal";
type SizeKey = "instagram-post" | "instagram-story" | "twitter-banner" | "facebook-cover";

const TABS: { key: TabKey; label: string }[] = [
  { key: "guide",     label: "Guide" },
  { key: "tagging",   label: "Tagging Guide" },
  { key: "brand",     label: "Brand Assets" },
  { key: "create",    label: "Create" },
  { key: "community", label: "Community" },
];

const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  "instagram-post":   { w: 1080, h: 1080, label: "Instagram Post (1080×1080)" },
  "instagram-story":  { w: 1080, h: 1920, label: "Instagram Story (1080×1920)" },
  "twitter-banner":   { w: 1500, h: 500,  label: "Twitter/X Banner (1500×500)" },
  "facebook-cover":   { w: 820,  h: 312,  label: "Facebook Cover (820×312)" },
};

const MESSAGE_PRESETS = [
  "Catch me LIVE",
  "On Air Now",
  "Tune In",
  "Special Guest",
  "Every Thursday 8pm",
];

// ── Canvas renderer ────────────────────────────────────────────────────────────

function drawCanvas(
  canvas: HTMLCanvasElement,
  opts: {
    photo: HTMLImageElement | null;
    logo: HTMLImageElement | null;
    djName: string;
    message: string;
    showTime: string;
    style: StyleKey;
    size: SizeKey;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { w, h } = SIZES[opts.size];
  canvas.width  = w;
  canvas.height = h;

  const base = Math.min(w, h);
  const pad  = Math.floor(w * 0.045);

  // Background fill
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  // Photo — cover-fit crop
  if (opts.photo) {
    const pW = opts.photo.naturalWidth  || opts.photo.width;
    const pH = opts.photo.naturalHeight || opts.photo.height;
    const pAR = pW / pH;
    const cAR = w  / h;
    let sx = 0, sy = 0, sw = pW, sh = pH;
    if (pAR > cAR) {
      sw = pH * cAR;
      sx = (pW - sw) / 2;
    } else {
      sh = pW / cAR;
      sy = (pH - sh) / 2;
    }
    ctx.drawImage(opts.photo, sx, sy, sw, sh, 0, 0, w, h);
  }

  // Gradient overlay — stronger on dark/neon, lighter on minimal
  const gradStart = opts.style === "minimal" ? 0.15 : 0.22;
  const gradEnd0  = opts.style === "minimal" ? 0.62 : 0.78;
  const gradEnd1  = opts.style === "minimal" ? 0.78 : 0.96;
  const grad = ctx.createLinearGradient(0, h * gradStart, 0, h);
  grad.addColorStop(0,        "rgba(0,0,0,0)");
  grad.addColorStop(gradEnd0, opts.style === "minimal" ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.78)");
  grad.addColorStop(1,        opts.style === "minimal" ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.96)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Border accent (dark + neon only)
  if (opts.style !== "minimal") {
    const lw = Math.max(3, Math.floor(base * 0.0038));
    if (opts.style === "neon") {
      ctx.shadowBlur  = 18;
      ctx.shadowColor = "#e63030";
    }
    ctx.strokeStyle = "#e63030";
    ctx.lineWidth   = lw;
    ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    ctx.shadowBlur  = 0;
    ctx.shadowColor = "transparent";
  }

  // Logo — top right
  if (opts.logo) {
    const logoH = Math.max(24, Math.floor(base * 0.065));
    const logoW = Math.floor(logoH * ((opts.logo.naturalWidth || opts.logo.width) / (opts.logo.naturalHeight || opts.logo.height)));
    const logoPad = Math.floor(w * 0.03);
    const logoY   = Math.floor(h * 0.032);
    ctx.drawImage(opts.logo, w - logoW - logoPad, logoY, logoW, logoH);
  }

  // Font sizes — scale from base (shorter dimension) so banner/square both look right
  const nameSize = Math.max(38, Math.floor(base * 0.076));
  const msgSize  = Math.max(24, Math.floor(base * 0.043));
  const timeSize = Math.max(16, Math.floor(base * 0.028));

  // Y positions — anchor from bottom
  const nameY = h - Math.floor(base * 0.185);
  const msgY  = nameY + Math.floor(nameSize * 1.28);
  const timeY = msgY  + Math.floor(msgSize  * 1.32);

  // Neon glow on text
  if (opts.style === "neon") {
    ctx.shadowBlur  = 22;
    ctx.shadowColor = "rgba(230,48,48,0.7)";
  }

  // DJ name
  ctx.fillStyle = "#ffffff";
  ctx.font      = `bold ${nameSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(opts.djName || "DJ NAME", pad, nameY);

  // Message
  ctx.fillStyle = opts.style === "minimal" ? "rgba(255,255,255,0.82)" : "#e63030";
  ctx.font      = `600 ${msgSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(opts.message || "TUNE IN", pad, msgY);

  // Show time
  ctx.shadowBlur = 0;
  ctx.fillStyle  = "rgba(255,255,255,0.58)";
  ctx.font       = `${timeSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  if (opts.showTime) {
    ctx.fillText(opts.showTime, pad, timeY);
  }

  // LIFEFM.TV watermark — bottom right
  const wmSize = Math.max(12, Math.floor(base * 0.017));
  ctx.fillStyle  = "rgba(255,255,255,0.28)";
  ctx.font       = `${wmSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign  = "right";
  ctx.fillText("LIFEFM.TV", w - pad, h - Math.floor(base * 0.028));
  ctx.textAlign  = "left";

  ctx.shadowBlur  = 0;
  ctx.shadowColor = "transparent";
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ArtistHQPage() {
  const [tab, setTab] = useState<TabKey>("guide");

  // Create tab state
  const [photo,         setPhoto]         = useState<HTMLImageElement | null>(null);
  const [djName,        setDjName]        = useState("");
  const [messagePreset, setMessagePreset] = useState(MESSAGE_PRESETS[0]);
  const [customMsg,     setCustomMsg]     = useState("");
  const [showTime,      setShowTime]      = useState("");
  const [style,         setStyle]         = useState<StyleKey>("dark");
  const [size,          setSize]          = useState<SizeKey>("instagram-post");
  const [isDragging,    setIsDragging]    = useState(false);
  const [logoLoaded,    setLogoLoaded]    = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const logoRef     = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveMessage = messagePreset === "Custom" ? customMsg : messagePreset;

  // Load logo once on mount
  useEffect(() => {
    const img = new window.Image();
    img.src = "/logo.webp";
    img.onload = () => {
      logoRef.current = img;
      setLogoLoaded(true);
    };
  }, []);

  // Redraw canvas whenever any input changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, {
      photo,
      logo: logoRef.current,
      djName,
      message: effectiveMessage,
      showTime,
      style,
      size,
    });
  }, [photo, djName, effectiveMessage, showTime, style, size, logoLoaded]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target?.result as string;
      img.onload = () => setPhoto(img);
    };
    reader.readAsDataURL(file);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${(djName || "artist").replace(/\s+/g, "-")}-LIFEFMTV-asset.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <main className="ahq-page">

      {/* Top notice */}
      <div className="ahq-notice">
        This area is for LIFEFM.TV artists and DJs.{" "}
        If you want to join the station go to{" "}
        <a href="/submit" className="ahq-notice-link">Submit a Show →</a>
      </div>

      {/* Hero */}
      <header className="ahq-hero">
        <p className="ahq-eyebrow">LIFEFM.TV</p>
        <h1 className="ahq-heading">Artist HQ</h1>
        <p className="ahq-sub">Guides, assets and tools for station artists.</p>
      </header>

      {/* Tab navigation */}
      <nav className="ahq-tabs-nav" aria-label="Artist HQ sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ahq-tab-btn${tab === t.key ? " ahq-tab-btn--active" : ""}`}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab panels */}
      <div className="ahq-panel">

        {/* ══ TAB 1 — GUIDE ════════════════════════════════════════════════════ */}
        {tab === "guide" && (
          <div className="ahq-tab-content">
            <p className="ahq-welcome">
              Welcome to Artist HQ — everything you need to represent LIFEFM.TV
              properly, grow your audience and make the most of your time on the station.
            </p>

            {/* Studio Manners */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Studio Manners</h2>
              <div className="ahq-card">
                <ol className="ahq-rule-list">
                  {[
                    "Be ready to go live at least 10 minutes before your slot",
                    "Test your audio levels before going live — aim for -6dB to avoid clipping",
                    "Keep your stream title consistent — use format: DJ NAME — LIFEFM.TV — GENRE",
                    "No pre-recorded sets without prior agreement with the team",
                    "If you need to cancel give at least 48 hours notice",
                    "Keep it professional — this is a broadcast, not a bedroom stream",
                    "Engage with the chat — viewers tune in for the interaction as much as the music",
                    "Tag all your content correctly (see the Tagging Guide tab)",
                  ].map((rule, i) => (
                    <li key={i} className="ahq-rule-item">
                      <span className="ahq-rule-num">{i + 1}</span>
                      <span className="ahq-rule-text">{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Technical guide */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Show Prep — Technical Guide</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li>
                    <span className="ahq-spec-key">Stream bitrate</span>
                    <span className="ahq-spec-val">4000–6000 kbps video · 320 kbps audio</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Resolution</span>
                    <span className="ahq-spec-val">1080p preferred · 720p minimum</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Audio</span>
                    <span className="ahq-spec-val">Stereo · 48 kHz sample rate</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Software</span>
                    <span className="ahq-spec-val">OBS Studio (free) · Streamlabs · Restream Studio</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Connect via</span>
                    <span className="ahq-spec-val">Restream — contact the team for your stream key</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Before your slot</span>
                    <span className="ahq-spec-val">Test your stream 30 minutes before using the Restream preview</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* If something goes wrong */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">If Something Goes Wrong</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li>
                    <span className="ahq-spec-key">Stream drops</span>
                    <span className="ahq-spec-val">Restart OBS and reconnect — the stream auto-recovers within 30 seconds</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Audio issues</span>
                    <span className="ahq-spec-val">Check your audio interface sample rate matches OBS settings</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Contact</span>
                    <span className="ahq-spec-val">
                      WhatsApp the team immediately —{" "}
                      <a href="mailto:lifefmhq@gmail.com" className="ahq-link">lifefmhq@gmail.com</a>
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* ══ TAB 2 — TAGGING GUIDE ════════════════════════════════════════════ */}
        {tab === "tagging" && (
          <div className="ahq-tab-content">
            <p className="ahq-welcome">
              How to tag your content so it appears in our shows feed and gets maximum reach.
            </p>

            {/* YouTube */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">YouTube</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li>
                    <span className="ahq-spec-key">Title format</span>
                    <span className="ahq-spec-val">DJ NAME — GENRE — LIFEFM.TV — MONTH YEAR</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Example</span>
                    <span className="ahq-spec-val">Aphrodite — Drum and Bass — LIFEFM.TV — May 2026</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Required tags</span>
                    <span className="ahq-spec-val">LIFEFM.TV · LifeFM · Life FM TV · drum and bass radio · live dnb · underground music UK · plus your genre tags</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Description</span>
                    <span className="ahq-spec-val">"Broadcast live on LIFEFM.TV — the underground music station. Watch live at lifefm.tv"</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Category</span>
                    <span className="ahq-spec-val">Music</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Thumbnail</span>
                    <span className="ahq-spec-val">Use the social media asset generator in the Create tab</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Mixcloud */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Mixcloud</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li>
                    <span className="ahq-spec-key">Title format</span>
                    <span className="ahq-spec-val">DJ NAME — SHOW NAME — LIFEFM.TV — DATE</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Tags</span>
                    <span className="ahq-spec-val">lifefm · lifefmtv · your genre · your DJ name</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">After uploading</span>
                    <span className="ahq-spec-val">Add to the LIFEFM playlist on Mixcloud</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Social media */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Social Media</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li>
                    <span className="ahq-spec-key">Instagram & Twitter</span>
                    <span className="ahq-spec-val">Always tag @lifefmhq when posting about your show</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Facebook</span>
                    <span className="ahq-spec-val">Tag the LIFEFM.TV page</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">TikTok</span>
                    <span className="ahq-spec-val">Tag @lifefmtv</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Hashtags</span>
                    <span className="ahq-spec-val">#LIFEFMTV #UndergroundMusic #LiveDNB #LifeForMusic + your genre hashtags</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Pre-show</span>
                    <span className="ahq-spec-val">Post at least one story or post promoting your show in the 24 hours before you go live</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* ══ TAB 3 — BRAND ASSETS ═════════════════════════════════════════════ */}
        {tab === "brand" && (
          <div className="ahq-tab-content">
            <p className="ahq-welcome">
              Official LIFEFM.TV brand assets for your use. Please use these correctly and do not alter the logo.
            </p>

            {/* Colour swatches */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Brand Colours</h2>
              <div className="ahq-swatches">
                {[
                  { name: "Primary Red",  hex: "#E63030" },
                  { name: "Background",   hex: "#0A0A0A" },
                  { name: "Dark Grey",    hex: "#1A1A1A" },
                  { name: "White",        hex: "#FFFFFF" },
                  { name: "Accent Grey",  hex: "#AAAAAA" },
                ].map((c) => (
                  <div key={c.hex} className="ahq-swatch">
                    <div
                      className="ahq-swatch-color"
                      style={{
                        background: c.hex,
                        border: c.hex === "#FFFFFF" ? "1px solid #2a2a2a" : undefined,
                      }}
                    />
                    <p className="ahq-swatch-name">{c.name}</p>
                    <p className="ahq-swatch-hex">{c.hex}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Fonts */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Brand Fonts</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li>
                    <span className="ahq-spec-key">Primary</span>
                    <span className="ahq-spec-val">Syne</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Monospace</span>
                    <span className="ahq-spec-val">DM Mono</span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">Fallback</span>
                    <span className="ahq-spec-val">system-ui, sans-serif</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Logo downloads */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Logo Downloads</h2>
              <div className="ahq-logo-display">
                <Image
                  src="/logo.webp"
                  alt="LIFEFM.TV Logo"
                  width={280}
                  height={70}
                  style={{ display: "block" }}
                  priority
                />
              </div>
              <div className="ahq-dl-btns">
                <a
                  href="/logo.webp"
                  download="LIFEFMTV-logo-white.webp"
                  className="ahq-dl-btn"
                >
                  ↓ White Version
                </a>
                <a
                  href="/logo.webp"
                  download="LIFEFMTV-logo-red.webp"
                  className="ahq-dl-btn ahq-dl-btn--outline"
                >
                  ↓ Red Version
                </a>
              </div>
              <p className="ahq-footnote">Additional logo variants will be added here.</p>
            </section>

            {/* Usage rules */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Usage Rules</h2>
              <div className="ahq-card">
                <ol className="ahq-rule-list">
                  {[
                    "Do not stretch or distort the logo",
                    "Do not change the logo colours",
                    "Always use on a dark background",
                    "Minimum size: 100px wide",
                    "Always maintain clear space around the logo equal to the height of the letter L",
                  ].map((rule, i) => (
                    <li key={i} className="ahq-rule-item">
                      <span className="ahq-rule-num">{i + 1}</span>
                      <span className="ahq-rule-text">{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        )}

        {/* ══ TAB 4 — CREATE ═══════════════════════════════════════════════════ */}
        {tab === "create" && (
          <div className="ahq-tab-content">
            <p className="ahq-welcome">
              Generate a social media asset for your show in seconds.
              Upload your photo, fill in your details, pick a style and download.
            </p>

            <div className="ahq-create-layout">

              {/* ── Controls column ── */}
              <div className="ahq-create-controls">

                {/* Step 1 — Photo */}
                <div className="ahq-step">
                  <p className="ahq-step-label">
                    <span className="ahq-step-num">1</span>Upload your photo
                  </p>
                  <div
                    className={`ahq-upload-zone${isDragging ? " ahq-upload-zone--drag" : ""}${photo ? " ahq-upload-zone--done" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload photo"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleFile(file);
                    }}
                  >
                    {photo ? (
                      <span className="ahq-upload-done">✓ Photo loaded — click to change</span>
                    ) : (
                      <span className="ahq-upload-hint">
                        Drop photo here or click to browse<br />
                        <small>JPG · PNG · WEBP</small>
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Step 2 — Details */}
                <div className="ahq-step">
                  <p className="ahq-step-label">
                    <span className="ahq-step-num">2</span>Your details
                  </p>

                  <label className="ahq-field-label">DJ Name</label>
                  <input
                    type="text"
                    className="ahq-input"
                    placeholder="e.g. DJ Kitch"
                    value={djName}
                    onChange={(e) => setDjName(e.target.value)}
                  />

                  <label className="ahq-field-label">Message</label>
                  <select
                    className="ahq-input"
                    value={messagePreset}
                    onChange={(e) => setMessagePreset(e.target.value)}
                  >
                    {MESSAGE_PRESETS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="Custom">Custom…</option>
                  </select>
                  {messagePreset === "Custom" && (
                    <input
                      type="text"
                      className="ahq-input"
                      placeholder="Type your message"
                      value={customMsg}
                      onChange={(e) => setCustomMsg(e.target.value)}
                    />
                  )}

                  <label className="ahq-field-label">Show time</label>
                  <input
                    type="text"
                    className="ahq-input"
                    placeholder="e.g. Every Thursday 8pm"
                    value={showTime}
                    onChange={(e) => setShowTime(e.target.value)}
                  />
                </div>

                {/* Step 3 — Style */}
                <div className="ahq-step">
                  <p className="ahq-step-label">
                    <span className="ahq-step-num">3</span>Style
                  </p>
                  <div className="ahq-style-grid">
                    {(["dark", "neon", "minimal"] as StyleKey[]).map((s) => (
                      <button
                        key={s}
                        className={`ahq-style-btn${style === s ? " ahq-style-btn--active" : ""}`}
                        onClick={() => setStyle(s)}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className="ahq-style-desc">
                          {s === "dark"    && "Black · Red accents"}
                          {s === "neon"    && "Dark · Glowing red"}
                          {s === "minimal" && "Clean · White only"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4 — Size */}
                <div className="ahq-step">
                  <p className="ahq-step-label">
                    <span className="ahq-step-num">4</span>Size
                  </p>
                  <div className="ahq-size-grid">
                    {(Object.entries(SIZES) as [SizeKey, { w: number; h: number; label: string }][]).map(
                      ([key, val]) => (
                        <button
                          key={key}
                          className={`ahq-size-btn${size === key ? " ahq-size-btn--active" : ""}`}
                          onClick={() => setSize(key)}
                        >
                          {val.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Download */}
                <button className="ahq-download-btn" onClick={handleDownload}>
                  ↓ Download PNG
                </button>
              </div>

              {/* ── Preview column ── */}
              <div className="ahq-create-preview">
                <p className="ahq-preview-label">Preview</p>
                <div
                  className="ahq-canvas-wrap"
                  style={{ aspectRatio: `${SIZES[size].w} / ${SIZES[size].h}` }}
                >
                  <canvas ref={canvasRef} />
                </div>
                <p className="ahq-preview-note">
                  {SIZES[size].w} × {SIZES[size].h} px · PNG export is full resolution
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ══ TAB 5 — COMMUNITY ════════════════════════════════════════════════ */}
        {tab === "community" && (
          <div className="ahq-tab-content">

            {/* Get in touch */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Get in Touch</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li>
                    <span className="ahq-spec-key">Email</span>
                    <span className="ahq-spec-val">
                      <a href="mailto:lifefmhq@gmail.com" className="ahq-link">lifefmhq@gmail.com</a>
                    </span>
                  </li>
                  <li>
                    <span className="ahq-spec-key">For</span>
                    <span className="ahq-spec-val">Show bookings · technical issues · demo submissions</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Station team */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Station Team</h2>
              <div className="ahq-card">
                <ul className="ahq-team-list">
                  <li>
                    <span className="ahq-team-name">Paul Roast</span>
                    <span className="ahq-team-role">Founder</span>
                  </li>
                  <li>
                    <span className="ahq-team-name">Mel Lioness</span>
                    <span className="ahq-team-role">Co-Founder</span>
                  </li>
                  <li>
                    <span className="ahq-team-name">DJ V</span>
                    <span className="ahq-team-role">Label</span>
                  </li>
                  <li>
                    <span className="ahq-team-name">DJ Kitch</span>
                    <span className="ahq-team-role">Label</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Upcoming events */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Upcoming Station Events</h2>
              <div className="ahq-card ahq-card--muted">
                <p className="ahq-muted-text">No upcoming events listed — check back soon</p>
                <p className="ahq-footnote">This will eventually pull from the events / schedule system</p>
              </div>
            </section>

            {/* Useful links */}
            <section className="ahq-section">
              <h2 className="ahq-section-title">Useful Links</h2>
              <div className="ahq-links-grid">
                {[
                  { label: "Restream",      url: "https://restream.io",       desc: "Live streaming platform" },
                  { label: "OBS Studio",    url: "https://obsproject.com",    desc: "Free streaming software" },
                  { label: "Mixcloud",      url: "https://mixcloud.com",      desc: "Upload your mixes" },
                  { label: "Submit a Show", url: "/submit",                   desc: "Apply to join the station" },
                ].map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target={link.url.startsWith("http") ? "_blank" : undefined}
                    rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="ahq-link-card"
                  >
                    <span className="ahq-link-label">{link.label}</span>
                    <span className="ahq-link-desc">{link.desc}</span>
                    <span className="ahq-link-arrow">→</span>
                  </a>
                ))}
              </div>
            </section>

          </div>
        )}

      </div>
    </main>
  );
}
