"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { submitShowApplication } from "@/app/actions/chatActions";

// ── Types & constants ──────────────────────────────────────────────────────────

type TabKey = "submit" | "guide" | "tagging" | "brand" | "create" | "community";
type StyleKey = "dark" | "neon" | "minimal";
type SizeKey = "instagram-post" | "instagram-story" | "youtube-banner";
type MusicStyleKey =
  | "Drum & Bass" | "Jungle" | "Dub & Reggae" | "Tech House"
  | "Techno" | "Soul & Funk" | "House" | "Garage" | "Mixed" | null;

const TABS: { key: TabKey; label: string }[] = [
  { key: "submit",    label: "Submit Music" },
  { key: "guide",     label: "Guide" },
  { key: "tagging",   label: "Tagging Guide" },
  { key: "brand",     label: "Brand Assets" },
  { key: "create",    label: "Create" },
  { key: "community", label: "Community" },
];

const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  "instagram-post":  { w: 1080, h: 1080, label: "Instagram Post (1080×1080)" },
  "instagram-story": { w: 1080, h: 1920, label: "Instagram Story (1080×1920)" },
  "youtube-banner":  { w: 1920, h: 1080, label: "YouTube Banner (1920×1080)" },
};

const MESSAGE_PRESETS = [
  "Catch me LIVE",
  "On Air Now",
  "Tune In",
  "Special Guest",
  "Every Thursday 8pm",
];

const GENRES = [
  "DNB", "House", "Techno", "Jungle", "Dub", "Soul & Funk",
  "Tech House", "Garage", "Breaks", "Ambient", "Other",
];

const MUSIC_STYLES: { key: Exclude<MusicStyleKey, null>; color: string }[] = [
  { key: "Drum & Bass",  color: "#CC0000" },
  { key: "Jungle",       color: "#CC5500" },
  { key: "Dub & Reggae", color: "#1a5c1a" },
  { key: "Tech House",   color: "#3d1a5c" },
  { key: "Techno",       color: "#2a2a2a" },
  { key: "Soul & Funk",  color: "#5c4a00" },
  { key: "House",        color: "#1a1a5c" },
  { key: "Garage",       color: "#1a4a4a" },
  { key: "Mixed",        color: "#333333" },
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
    musicStyle: MusicStyleKey;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { w, h } = SIZES[opts.size];
  canvas.width  = w;
  canvas.height = h;

  const base = Math.min(w, h);
  const pad  = Math.floor(w * 0.045);

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  if (opts.photo) {
    const pW = opts.photo.naturalWidth  || opts.photo.width;
    const pH = opts.photo.naturalHeight || opts.photo.height;
    const pAR = pW / pH;
    const cAR = w  / h;
    let sx = 0, sy = 0, sw = pW, sh = pH;
    if (pAR > cAR) { sw = pH * cAR; sx = (pW - sw) / 2; }
    else            { sh = pW / cAR; sy = (pH - sh) / 2; }
    ctx.drawImage(opts.photo, sx, sy, sw, sh, 0, 0, w, h);
  }

  const gradStart = opts.style === "minimal" ? 0.15 : 0.22;
  const gradEnd0  = opts.style === "minimal" ? 0.62 : 0.78;
  const grad = ctx.createLinearGradient(0, h * gradStart, 0, h);
  grad.addColorStop(0,        "rgba(0,0,0,0)");
  grad.addColorStop(gradEnd0, opts.style === "minimal" ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.78)");
  grad.addColorStop(1,        opts.style === "minimal" ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.96)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (opts.style !== "minimal") {
    const lw = Math.max(3, Math.floor(base * 0.0038));
    if (opts.style === "neon") { ctx.shadowBlur = 18; ctx.shadowColor = "#e63030"; }
    ctx.strokeStyle = "#e63030";
    ctx.lineWidth   = lw;
    ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    ctx.shadowBlur  = 0;
    ctx.shadowColor = "transparent";
  }

  if (opts.logo) {
    const logoH = Math.max(24, Math.floor(base * 0.065));
    const logoW = Math.floor(logoH * ((opts.logo.naturalWidth || opts.logo.width) / (opts.logo.naturalHeight || opts.logo.height)));
    const logoPad = Math.floor(w * 0.03);
    const logoY   = Math.floor(h * 0.032);
    ctx.drawImage(opts.logo, w - logoW - logoPad, logoY, logoW, logoH);
  }

  const nameSize = Math.max(38, Math.floor(base * 0.076));
  const msgSize  = Math.max(24, Math.floor(base * 0.043));
  const timeSize = Math.max(16, Math.floor(base * 0.028));
  const nameY = h - Math.floor(base * 0.185);
  const msgY  = nameY + Math.floor(nameSize * 1.28);
  const timeY = msgY  + Math.floor(msgSize  * 1.32);

  if (opts.style === "neon") { ctx.shadowBlur = 22; ctx.shadowColor = "rgba(230,48,48,0.7)"; }

  ctx.fillStyle = "#ffffff";
  ctx.font      = `bold ${nameSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(opts.djName || "DJ NAME", pad, nameY);

  ctx.fillStyle = opts.style === "minimal" ? "rgba(255,255,255,0.82)" : "#e63030";
  ctx.font      = `600 ${msgSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(opts.message || "TUNE IN", pad, msgY);

  ctx.shadowBlur = 0;
  ctx.fillStyle  = "rgba(255,255,255,0.58)";
  ctx.font       = `${timeSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  if (opts.showTime) ctx.fillText(opts.showTime, pad, timeY);

  const wmSize = Math.max(12, Math.floor(base * 0.017));
  ctx.fillStyle  = "rgba(255,255,255,0.28)";
  ctx.font       = `${wmSize}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign  = "right";
  ctx.fillText("LIFEFM.TV", w - pad, h - Math.floor(base * 0.028));
  ctx.textAlign  = "left";
  ctx.shadowBlur  = 0;
  ctx.shadowColor = "transparent";

  // Genre badge — bottom left corner
  if (opts.musicStyle) {
    const styleEntry = MUSIC_STYLES.find((s) => s.key === opts.musicStyle);
    const badgeColor = styleEntry?.color ?? "#333333";
    const badgeFontSz = 12;
    ctx.font = `bold ${badgeFontSz}px Inter, "Helvetica Neue", Arial, sans-serif`;
    const textW = ctx.measureText(opts.musicStyle).width;
    const badgeW = textW + 28;
    const badgeH = 28;
    const badgeX = 16;
    const badgeY = h - 16 - badgeH;
    const r = badgeH / 2;
    ctx.beginPath();
    ctx.moveTo(badgeX + r, badgeY);
    ctx.lineTo(badgeX + badgeW - r, badgeY);
    ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + r, r);
    ctx.lineTo(badgeX + badgeW, badgeY + badgeH - r);
    ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - r, badgeY + badgeH, r);
    ctx.lineTo(badgeX + r, badgeY + badgeH);
    ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - r, r);
    ctx.lineTo(badgeX, badgeY + r);
    ctx.arcTo(badgeX, badgeY, badgeX + r, badgeY, r);
    ctx.closePath();
    ctx.fillStyle = badgeColor;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${badgeFontSz}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillText(opts.musicStyle, badgeX + 14, badgeY + badgeH * 0.7);
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ArtistHQPage() {
  const [tab, setTab] = useState<TabKey>("submit");

  // Submit tab state
  const [form, setForm] = useState({
    full_name: "", dj_name: "", email: "",
    genre: "", mix_link: "", social_links: "", availability: "", about_show: "",
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.dj_name || !form.email) return;
    setSubmitStatus("sending");
    setSubmitError("");
    try {
      await submitShowApplication(form);
      setSubmitStatus("success");
      setForm({ full_name: "", dj_name: "", email: "", genre: "", mix_link: "", social_links: "", availability: "", about_show: "" });
    } catch {
      setSubmitStatus("error");
      setSubmitError("Something went wrong. Please try again.");
    }
  }

  // Create tab state
  const [photo,         setPhoto]         = useState<HTMLImageElement | null>(null);
  const [djName,        setDjName]        = useState("");
  const [messagePreset, setMessagePreset] = useState(MESSAGE_PRESETS[0]);
  const [customMsg,     setCustomMsg]     = useState("");
  const [showTime,      setShowTime]      = useState("");
  const [style,         setStyle]         = useState<StyleKey>("dark");
  const [size,          setSize]          = useState<SizeKey>("instagram-post");
  const [musicStyle,    setMusicStyle]    = useState<MusicStyleKey>(null);
  const [isDragging,    setIsDragging]    = useState(false);
  const [logoLoaded,    setLogoLoaded]    = useState(false);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const logoRef      = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveMessage = messagePreset === "Custom" ? customMsg : messagePreset;

  useEffect(() => {
    const img = new window.Image();
    img.src = "/logo.webp";
    img.onload = () => { logoRef.current = img; setLogoLoaded(true); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, { photo, logo: logoRef.current, djName, message: effectiveMessage, showTime, style, size, musicStyle });
  }, [photo, djName, effectiveMessage, showTime, style, size, musicStyle, logoLoaded]);

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

      <div className="ahq-notice">
        This area is for LIFEFM.TV artists and DJs.{" "}
        If you want to join the station go to{" "}
        <a href="/submit" className="ahq-notice-link">Submit a Show →</a>
      </div>

      <header className="ahq-hero">
        <p className="ahq-eyebrow">LIFEFM.TV</p>
        <h1 className="ahq-heading">Artist HQ</h1>
        <p className="ahq-sub">Guides, assets and tools for station artists.</p>
      </header>

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

      <div className="ahq-panel">

        {/* ══ TAB 0 — SUBMIT MUSIC ═════════════════════════════════════════════ */}
        {tab === "submit" && (
          <div className="ahq-tab-content">
            <p className="ahq-welcome">
              Want to broadcast on Life FM? Fill in the form below and we&apos;ll be in touch.
              We welcome DJs of all experience levels across every genre.
            </p>

            {submitStatus === "success" ? (
              <div className="submit-success">
                <p className="submit-success-heading">Application received</p>
                <p className="submit-success-body">
                  Thanks for submitting. We&apos;ll review your application and get back to you at the email you provided.
                </p>
                <button className="submit-another-btn" onClick={() => setSubmitStatus("idle")}>
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="submit-form">
                <div className="submit-grid">
                  <div className="submit-field">
                    <label className="submit-label">Full Name *</label>
                    <input className="submit-input" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} placeholder="Your legal name" required />
                  </div>
                  <div className="submit-field">
                    <label className="submit-label">DJ Name *</label>
                    <input className="submit-input" value={form.dj_name} onChange={(e) => setField("dj_name", e.target.value)} placeholder="Your artist / DJ name" required />
                  </div>
                  <div className="submit-field">
                    <label className="submit-label">Email *</label>
                    <input className="submit-input" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="you@example.com" required />
                  </div>
                  <div className="submit-field">
                    <label className="submit-label">Genre</label>
                    <select className="submit-input submit-select" value={form.genre} onChange={(e) => setField("genre", e.target.value)}>
                      <option value="">Select a genre…</option>
                      {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="submit-field submit-field--full">
                    <label className="submit-label">Mix Link</label>
                    <input className="submit-input" value={form.mix_link} onChange={(e) => setField("mix_link", e.target.value)} placeholder="Mixcloud, SoundCloud, or any link to your mix" />
                  </div>
                  <div className="submit-field submit-field--full">
                    <label className="submit-label">Social Links</label>
                    <input className="submit-input" value={form.social_links} onChange={(e) => setField("social_links", e.target.value)} placeholder="Instagram, Facebook, etc." />
                  </div>
                  <div className="submit-field submit-field--full">
                    <label className="submit-label">Availability</label>
                    <input className="submit-input" value={form.availability} onChange={(e) => setField("availability", e.target.value)} placeholder="e.g. Weekends evenings, Friday nights…" />
                  </div>
                  <div className="submit-field submit-field--full">
                    <label className="submit-label">About Your Show</label>
                    <textarea className="submit-input submit-textarea" value={form.about_show} onChange={(e) => setField("about_show", e.target.value)} placeholder="Tell us about your sound, your influences, and what you'd bring to Life FM…" rows={5} />
                  </div>
                </div>
                {submitStatus === "error" && <p className="submit-error">{submitError}</p>}
                <button type="submit" className="submit-btn" disabled={submitStatus === "sending"}>
                  {submitStatus === "sending" ? "Sending…" : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ══ TAB 1 — GUIDE ════════════════════════════════════════════════════ */}
        {tab === "guide" && (
          <div className="ahq-tab-content">
            <p className="ahq-welcome">
              Welcome to Artist HQ — everything you need to represent LIFEFM.TV
              properly, grow your audience and make the most of your time on the station.
            </p>

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

            <section className="ahq-section">
              <h2 className="ahq-section-title">Show Prep — Technical Guide</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li><span className="ahq-spec-key">Stream bitrate</span><span className="ahq-spec-val">4000–6000 kbps video · 320 kbps audio</span></li>
                  <li><span className="ahq-spec-key">Resolution</span><span className="ahq-spec-val">1080p preferred · 720p minimum</span></li>
                  <li><span className="ahq-spec-key">Audio</span><span className="ahq-spec-val">Stereo · 48 kHz sample rate</span></li>
                  <li><span className="ahq-spec-key">Software</span><span className="ahq-spec-val">OBS Studio (free) · Streamlabs · Restream Studio</span></li>
                  <li><span className="ahq-spec-key">Connect via</span><span className="ahq-spec-val">Restream — contact the team for your stream key</span></li>
                  <li><span className="ahq-spec-key">Before your slot</span><span className="ahq-spec-val">Test your stream 30 minutes before using the Restream preview</span></li>
                </ul>
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">If Something Goes Wrong</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li><span className="ahq-spec-key">Stream drops</span><span className="ahq-spec-val">Restart OBS and reconnect — the stream auto-recovers within 30 seconds</span></li>
                  <li><span className="ahq-spec-key">Audio issues</span><span className="ahq-spec-val">Check your audio interface sample rate matches OBS settings</span></li>
                  <li><span className="ahq-spec-key">Contact</span><span className="ahq-spec-val">WhatsApp the team immediately — <a href="mailto:lifefmhq@gmail.com" className="ahq-link">lifefmhq@gmail.com</a></span></li>
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

            <section className="ahq-section">
              <h2 className="ahq-section-title">YouTube</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li><span className="ahq-spec-key">Title format</span><span className="ahq-spec-val">DJ NAME — GENRE — LIFEFM.TV — MONTH YEAR</span></li>
                  <li><span className="ahq-spec-key">Example</span><span className="ahq-spec-val">Aphrodite — Drum and Bass — LIFEFM.TV — May 2026</span></li>
                  <li><span className="ahq-spec-key">Required tags</span><span className="ahq-spec-val">LIFEFM.TV · LifeFM · Life FM TV · drum and bass radio · live dnb · underground music UK · plus your genre tags</span></li>
                  <li><span className="ahq-spec-key">Description</span><span className="ahq-spec-val">"Broadcast live on LIFEFM.TV — the underground music station. Watch live at lifefm.tv"</span></li>
                  <li><span className="ahq-spec-key">Category</span><span className="ahq-spec-val">Music</span></li>
                  <li><span className="ahq-spec-key">Thumbnail</span><span className="ahq-spec-val">Use the social media asset generator in the Create tab</span></li>
                </ul>
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">Mixcloud</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li><span className="ahq-spec-key">Title format</span><span className="ahq-spec-val">DJ NAME — SHOW NAME — LIFEFM.TV — DATE</span></li>
                  <li><span className="ahq-spec-key">Tags</span><span className="ahq-spec-val">lifefm · lifefmtv · your genre · your DJ name</span></li>
                  <li><span className="ahq-spec-key">After uploading</span><span className="ahq-spec-val">Add to the LIFEFM playlist on Mixcloud</span></li>
                </ul>
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">Social Media</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li><span className="ahq-spec-key">Instagram & Twitter</span><span className="ahq-spec-val">Always tag @lifefmhq when posting about your show</span></li>
                  <li><span className="ahq-spec-key">Facebook</span><span className="ahq-spec-val">Tag the LIFEFM.TV page</span></li>
                  <li><span className="ahq-spec-key">TikTok</span><span className="ahq-spec-val">Tag @lifefmtv</span></li>
                  <li><span className="ahq-spec-key">Hashtags</span><span className="ahq-spec-val">#LIFEFMTV #UndergroundMusic #LiveDNB #LifeForMusic + your genre hashtags</span></li>
                  <li><span className="ahq-spec-key">Pre-show</span><span className="ahq-spec-val">Post at least one story or post promoting your show in the 24 hours before you go live</span></li>
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

            <section className="ahq-section">
              <h2 className="ahq-section-title">Brand Colours</h2>
              <div className="ahq-swatches">
                {[
                  { name: "Primary Red", hex: "#E63030" },
                  { name: "Background",  hex: "#0A0A0A" },
                  { name: "Dark Grey",   hex: "#1A1A1A" },
                  { name: "White",       hex: "#FFFFFF" },
                  { name: "Accent Grey", hex: "#AAAAAA" },
                ].map((c) => (
                  <div key={c.hex} className="ahq-swatch">
                    <div className="ahq-swatch-color" style={{ background: c.hex, border: c.hex === "#FFFFFF" ? "1px solid #2a2a2a" : undefined }} />
                    <p className="ahq-swatch-name">{c.name}</p>
                    <p className="ahq-swatch-hex">{c.hex}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">Brand Fonts</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li><span className="ahq-spec-key">Primary</span><span className="ahq-spec-val">Syne</span></li>
                  <li><span className="ahq-spec-key">Monospace</span><span className="ahq-spec-val">DM Mono</span></li>
                  <li><span className="ahq-spec-key">Fallback</span><span className="ahq-spec-val">system-ui, sans-serif</span></li>
                </ul>
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">Logo Downloads</h2>
              <div className="ahq-logo-variants">
                <div className="ahq-logo-variant ahq-logo-variant--dark">
                  <Image src="/logo.webp" alt="LIFEFM.TV Logo — White on Dark" width={200} height={50} />
                  <p className="ahq-logo-variant-label">White on Dark</p>
                  <a href="/logo.webp" download="LIFEFMTV-logo-white-dark.webp" className="ahq-dl-btn">↓ Download</a>
                </div>
                <div className="ahq-logo-variant ahq-logo-variant--light">
                  <Image src="/logo.webp" alt="LIFEFM.TV Logo — White on Light" width={200} height={50} />
                  <p className="ahq-logo-variant-label">White on Light</p>
                  <a href="/logo.webp" download="LIFEFMTV-logo-white-light.webp" className="ahq-dl-btn ahq-dl-btn--outline">↓ Download</a>
                </div>
                <div className="ahq-logo-variant ahq-logo-variant--red">
                  <Image src="/logo.webp" alt="LIFEFM.TV Logo — Red Background" width={200} height={50} />
                  <p className="ahq-logo-variant-label">Red Background</p>
                  <a href="/logo.webp" download="LIFEFMTV-logo-red-bg.webp" className="ahq-dl-btn ahq-dl-btn--outline">↓ Download</a>
                </div>
                <div className="ahq-logo-variant ahq-logo-variant--transparent">
                  <Image src="/logo.webp" alt="LIFEFM.TV Logo — Transparent" width={200} height={50} />
                  <p className="ahq-logo-variant-label">Transparent</p>
                  <a href="/logo.webp" download="LIFEFMTV-logo-transparent.webp" className="ahq-dl-btn ahq-dl-btn--outline">↓ Download</a>
                </div>
              </div>
              <p className="ahq-footnote">All variants link to /logo.webp — upload finals to /public/ when ready.</p>
            </section>

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
              <div className="ahq-create-controls">

                <div className="ahq-step">
                  <p className="ahq-step-label"><span className="ahq-step-num">1</span>Upload your photo</p>
                  <div
                    className={`ahq-upload-zone${isDragging ? " ahq-upload-zone--drag" : ""}${photo ? " ahq-upload-zone--done" : ""}`}
                    role="button" tabIndex={0} aria-label="Upload photo"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  >
                    {photo
                      ? <span className="ahq-upload-done">✓ Photo loaded — click to change</span>
                      : <span className="ahq-upload-hint">Drop photo here or click to browse<br /><small>JPG · PNG · WEBP</small></span>}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
                </div>

                <div className="ahq-step">
                  <p className="ahq-step-label"><span className="ahq-step-num">2</span>Music style</p>
                  <div className="ahq-style-pills">
                    <button
                      className={`ahq-style-pill${musicStyle === null ? " ahq-style-pill--active" : ""}`}
                      onClick={() => setMusicStyle(null)}
                    >None</button>
                    {MUSIC_STYLES.map(({ key, color }) => (
                      <button
                        key={key}
                        className={`ahq-style-pill${musicStyle === key ? " ahq-style-pill--active" : ""}`}
                        style={musicStyle === key ? { background: color, borderColor: color } : undefined}
                        onClick={() => setMusicStyle(musicStyle === key ? null : key)}
                      >{key}</button>
                    ))}
                  </div>
                </div>

                <div className="ahq-step">
                  <p className="ahq-step-label"><span className="ahq-step-num">3</span>Your details</p>
                  <label className="ahq-field-label">DJ Name</label>
                  <input type="text" className="ahq-input" placeholder="e.g. DJ Kitch" value={djName} onChange={(e) => setDjName(e.target.value)} />
                  <label className="ahq-field-label">Message</label>
                  <select className="ahq-input" value={messagePreset} onChange={(e) => setMessagePreset(e.target.value)}>
                    {MESSAGE_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="Custom">Custom…</option>
                  </select>
                  {messagePreset === "Custom" && (
                    <input type="text" className="ahq-input" placeholder="Type your message" value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} />
                  )}
                  <label className="ahq-field-label">Show time</label>
                  <input type="text" className="ahq-input" placeholder="e.g. Every Thursday 8pm" value={showTime} onChange={(e) => setShowTime(e.target.value)} />
                </div>

                <div className="ahq-step">
                  <p className="ahq-step-label"><span className="ahq-step-num">4</span>Style</p>
                  <div className="ahq-style-grid">
                    {(["dark", "neon", "minimal"] as StyleKey[]).map((s) => (
                      <button key={s} className={`ahq-style-btn${style === s ? " ahq-style-btn--active" : ""}`} onClick={() => setStyle(s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className="ahq-style-desc">
                          {s === "dark" && "Black · Red accents"}
                          {s === "neon" && "Dark · Glowing red"}
                          {s === "minimal" && "Clean · White only"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ahq-step">
                  <p className="ahq-step-label"><span className="ahq-step-num">5</span>Size</p>
                  <div className="ahq-size-grid">
                    {(Object.entries(SIZES) as [SizeKey, { w: number; h: number; label: string }][]).map(([key, val]) => (
                      <button key={key} className={`ahq-size-btn${size === key ? " ahq-size-btn--active" : ""}`} onClick={() => setSize(key)}>
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="ahq-download-btn" onClick={handleDownload}>↓ Download PNG</button>
              </div>

              <div className="ahq-create-preview">
                <p className="ahq-preview-label">Preview</p>
                <div className="ahq-canvas-wrap" style={{ aspectRatio: `${SIZES[size].w} / ${SIZES[size].h}` }}>
                  <canvas ref={canvasRef} />
                </div>
                <p className="ahq-preview-note">{SIZES[size].w} × {SIZES[size].h} px · PNG export is full resolution</p>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 5 — COMMUNITY ════════════════════════════════════════════════ */}
        {tab === "community" && (
          <div className="ahq-tab-content">
            <section className="ahq-section">
              <h2 className="ahq-section-title">Get in Touch</h2>
              <div className="ahq-card">
                <ul className="ahq-spec-list">
                  <li><span className="ahq-spec-key">Email</span><span className="ahq-spec-val"><a href="mailto:lifefmhq@gmail.com" className="ahq-link">lifefmhq@gmail.com</a></span></li>
                  <li><span className="ahq-spec-key">For</span><span className="ahq-spec-val">Show bookings · technical issues · demo submissions</span></li>
                </ul>
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">Station Team</h2>
              <div className="ahq-card">
                <ul className="ahq-team-list">
                  <li><span className="ahq-team-name">Paul Roast</span><span className="ahq-team-role">Founder</span></li>
                  <li><span className="ahq-team-name">Mel Lioness</span><span className="ahq-team-role">Co-Founder</span></li>
                  <li><span className="ahq-team-name">DJ V</span><span className="ahq-team-role">Label</span></li>
                  <li><span className="ahq-team-name">DJ Kitch</span><span className="ahq-team-role">Label</span></li>
                </ul>
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">Upcoming Station Events</h2>
              <div className="ahq-card ahq-card--muted">
                <p className="ahq-muted-text">No upcoming events listed — check back soon</p>
                <p className="ahq-footnote">This will eventually pull from the events / schedule system</p>
              </div>
            </section>

            <section className="ahq-section">
              <h2 className="ahq-section-title">Useful Links</h2>
              <div className="ahq-links-grid">
                {[
                  { label: "Restream",   url: "https://restream.io",    desc: "Live streaming platform" },
                  { label: "OBS Studio", url: "https://obsproject.com", desc: "Free streaming software" },
                  { label: "Mixcloud",   url: "https://mixcloud.com",   desc: "Upload your mixes" },
                  { label: "DJ Mixes",   url: "/archive/mixes",         desc: "Station mix archive" },
                ].map((link) => (
                  <a key={link.url} href={link.url} target={link.url.startsWith("http") ? "_blank" : undefined} rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined} className="ahq-link-card">
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
