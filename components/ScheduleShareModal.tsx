"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";

interface Show {
  id: string;
  start_time: string;
  end_time: string;
  dj_name: string;
  genre: string | null;
  status: string | null;
}

interface Props {
  shows: Show[];
  date: string; // YYYY-MM-DD
  onClose: () => void;
}

const FORMATS = {
  square:    { w: 1080, h: 1080, label: "Square 1:1",    sub: "1080×1080 · Instagram Post" },
  story:     { w: 1080, h: 1920, label: "Story 9:16",    sub: "1080×1920 · Instagram & TikTok" },
  landscape: { w: 1920, h: 1080, label: "Landscape 16:9",sub: "1920×1080 · Facebook & Twitter" },
} as const;
type FormatKey = keyof typeof FORMATS;

const GENRE_COLORS: Record<string, string> = {
  DNB: "#CC0000", Jungle: "#CC5500", Dub: "#1a5c1a",
  "Tech House": "#3d1a5c", Techno: "#444444",
  "Soul & Funk": "#5c4a00", House: "#1a1a5c",
  Garage: "#1a4a4a", Mixed: "#333333",
};
function getGenreColor(g: string | null | undefined) {
  return GENRE_COLORS[g ?? ""] ?? "#444444";
}

function drawScheduleCanvas(
  canvas: HTMLCanvasElement,
  shows: Show[],
  dateStr: string,
  fmt: FormatKey,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { w, h } = FORMATS[fmt];
  canvas.width  = w;
  canvas.height = h;

  const PAD  = Math.round(w * 0.03);
  const LEFT = PAD + 18; // offset for left bar

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  // Left accent bar
  ctx.fillStyle = "#CC0000";
  ctx.fillRect(0, 0, 6, h);

  let y = Math.round(h * 0.06);

  // LIFEFM.TV — mixed weight
  const titleSz = Math.round(w * 0.048);
  ctx.font = `bold ${titleSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("LIFE", LEFT, y);
  const lifeW = ctx.measureText("LIFE").width;
  ctx.font = `${titleSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("FM", LEFT + lifeW, y);
  const fmW = ctx.measureText("FM").width;
  ctx.font = `bold ${titleSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#CC0000";
  ctx.fillText(".TV", LEFT + lifeW + fmW, y);
  y += Math.round(titleSz * 1.5);

  // TODAY'S SCHEDULE
  const schedSz = Math.round(w * 0.013);
  ctx.font = `700 ${schedSz}px "DM Mono", monospace`;
  ctx.fillStyle = "#CC0000";
  ctx.fillText("TODAY'S  SCHEDULE", LEFT, y);
  y += Math.round(schedSz * 2.2);

  // Date
  const dateSz = Math.round(w * 0.018);
  const dateLabel = format(new Date(dateStr + "T12:00:00"), "EEEE d MMMM yyyy").toUpperCase();
  ctx.font = `${dateSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dateLabel, LEFT, y);
  y += Math.round(dateSz * 1.6);

  // Divider
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(LEFT, y);
  ctx.lineTo(w - PAD, y);
  ctx.stroke();
  y += Math.round(h * 0.025);

  // Shows list
  const maxShows = 10;
  const visible  = shows.slice(0, maxShows);
  const remaining = h * 0.55; // space for show list
  const rowH = Math.min(Math.round(remaining / Math.max(visible.length, 1)), Math.round(h * 0.07));
  const timeSz = Math.round(rowH * 0.38);
  const nameSz = Math.round(rowH * 0.40);

  for (const show of visible) {
    const time   = show.start_time.slice(0, 5);
    const isGuest = /guest\s*tbc/i.test(show.dj_name);
    const isTBC   = show.status === "needs_booking";
    const name    = isTBC ? "TBC" : isGuest ? "Guest TBC" : show.dj_name;

    ctx.font = `700 ${timeSz}px "DM Mono", monospace`;
    ctx.fillStyle = "#CC0000";
    ctx.fillText(time, LEFT, y + rowH * 0.65);
    const timeW = ctx.measureText(time).width;

    const sep = "  —  ";
    ctx.font = `${timeSz}px "DM Mono", monospace`;
    ctx.fillStyle = "#555555";
    ctx.fillText(sep, LEFT + timeW, y + rowH * 0.65);
    const sepW = ctx.measureText(sep).width;

    ctx.font = `${isGuest || isTBC ? "italic " : ""}${nameSz}px Inter, Arial, sans-serif`;
    ctx.fillStyle = isGuest || isTBC ? "#555555" : "#ffffff";
    ctx.fillText(name, LEFT + timeW + sepW, y + rowH * 0.68);
    const nameW = ctx.measureText(name).width;

    // Genre pill
    if (show.genre && !isTBC && !isGuest) {
      const gColor = getGenreColor(show.genre);
      const pillX  = LEFT + timeW + sepW + nameW + 14;
      const pillH  = Math.round(nameSz * 1.1);
      const pillW  = ctx.measureText(show.genre).width + 16;
      const pillY  = y + rowH * 0.68 - pillH * 0.82;
      ctx.fillStyle = gColor + "55";
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.strokeStyle = gColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(pillX, pillY, pillW, pillH);
      ctx.font = `600 ${Math.round(nameSz * 0.7)}px Inter, Arial, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(show.genre, pillX + 8, pillY + pillH * 0.72);
    }
    y += rowH;
  }

  // Bottom section
  const bottomY = h - Math.round(h * 0.16);
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(LEFT, bottomY);
  ctx.lineTo(w - PAD, bottomY);
  ctx.stroke();

  const tuneSz = Math.round(w * 0.033);
  ctx.font = `bold ${tuneSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("TUNE IN LIVE", LEFT, bottomY + Math.round(h * 0.045));

  const siteSz = Math.round(w * 0.048);
  ctx.font = `bold ${siteSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#CC0000";
  ctx.fillText("LIFEFM.TV", LEFT, bottomY + Math.round(h * 0.045) + Math.round(siteSz * 1.25));

  const tagSz = Math.round(w * 0.013);
  ctx.font = `${tagSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#555555";
  ctx.fillText(
    "Underground Music — Broadcasting Since 1999",
    LEFT,
    bottomY + Math.round(h * 0.045) + Math.round(siteSz * 1.25) + Math.round(tagSz * 2.2),
  );

  // Watermark
  const wmSz = Math.round(w * 0.011);
  ctx.font = `${wmSz}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.textAlign = "right";
  ctx.fillText("LIFEFM.TV", w - PAD, h - Math.round(h * 0.015));
  ctx.textAlign = "left";
}

export default function ScheduleShareModal({ shows, date, onClose }: Props) {
  const [selected, setSelected] = useState<FormatKey>("square");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview) return;

    drawScheduleCanvas(canvas, shows, date, selected);

    // Scale down for preview (max 380px wide)
    const { w, h } = FORMATS[selected];
    const scale = Math.min(380 / w, 480 / h);
    preview.width  = Math.round(w * scale);
    preview.height = Math.round(h * scale);
    const pCtx = preview.getContext("2d");
    if (!pCtx) return;
    pCtx.drawImage(canvas, 0, 0, w, h, 0, 0, preview.width, preview.height);
  }, [shows, date, selected]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScheduleCanvas(canvas, shows, date, selected);
    const link = document.createElement("a");
    link.download = `lifefm-schedule-${date}-${selected}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="share-modal-backdrop" onClick={handleBackdrop}>
      <div className="share-modal">
        <div className="share-modal-header">
          <span className="share-modal-title">Share Today&apos;s Schedule</span>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Hidden full-res canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Format picker */}
        <div className="share-format-grid">
          {(Object.entries(FORMATS) as [FormatKey, typeof FORMATS[FormatKey]][]).map(([key, val]) => (
            <button
              key={key}
              className={`share-format-card${selected === key ? " share-format-card--active" : ""}`}
              onClick={() => setSelected(key)}
            >
              <span className="share-format-label">{val.label}</span>
              <span className="share-format-sub">{val.sub}</span>
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div className="share-preview-wrap">
          <canvas ref={previewRef} className="share-preview-canvas" />
        </div>

        <button className="share-download-btn" onClick={handleDownload}>
          ↓ Download PNG
        </button>
      </div>
    </div>
  );
}
