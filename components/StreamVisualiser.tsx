"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FREQ_BIN_COUNT, useAudioReactive, type AudioSource } from "@/context/AudioReactiveContext";

const BAR_COUNT  = 64;
const SMOOTHING  = 0.75;
const PEAK_HOLD  = 1500;  // ms before peak dot falls
const PEAK_FALL  = 1.2;   // px per frame after hold

function barColor(i: number): string {
  const t = i / BAR_COUNT;
  if (t < 0.15) return "#CC0000";
  if (t < 0.35) return "#AA0000";
  if (t < 0.65) return "#880000";
  if (t < 0.85) return "#660000";
  return "#440000";
}

function barWeight(i: number): number {
  const t = i / BAR_COUNT;
  if (t < 0.15) return 1.5;
  if (t < 0.35) return 1.2;
  if (t < 0.65) return 1.0;
  if (t < 0.85) return 0.85;
  return 0.7;
}

const TOTAL_WEIGHT = Array.from({ length: BAR_COUNT }, (_, i) => barWeight(i))
  .reduce((a, b) => a + b, 0);

const SOURCES: { id: AudioSource; icon: string; label: string }[] = [
  { id: "stream", icon: "🎵", label: "Stream" },
  { id: "mic",    icon: "🎤", label: "Mic"    },
];

export default function StreamVisualiser() {
  const {
    isActive, activeSource, sourceError,
    getFrequencyData, startVisualiser, stopVisualiser,
  } = useAudioReactive();

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const smoothed    = useRef(new Float32Array(BAR_COUNT));
  const peakHeights = useRef(new Float32Array(BAR_COUNT));
  const peakTimes   = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const isActiveRef = useRef(isActive);

  // Locally selected source (user picks before enabling)
  const [selectedSource, setSelectedSource] = useState<AudioSource>("stream");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const handleToggle = useCallback(async () => {
    if (isActive) {
      stopVisualiser();
      return;
    }
    setRequesting(true);
    await startVisualiser(selectedSource);
    setRequesting(false);
  }, [isActive, selectedSource, startVisualiser, stopVisualiser]);

  const handleSourceChange = useCallback(async (src: AudioSource) => {
    setSelectedSource(src);
    if (isActive) {
      // Switch source on the fly
      setRequesting(true);
      await startVisualiser(src);
      setRequesting(false);
    }
  }, [isActive, startVisualiser]);

  // Single persistent draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data   = new Uint8Array(FREQ_BIN_COUNT) as Uint8Array<ArrayBuffer>;
    const bars   = smoothed.current;
    const peaks  = peakHeights.current;
    const ptimes = peakTimes.current;
    const step   = Math.max(1, Math.floor(FREQ_BIN_COUNT / BAR_COUNT));

    let dpr  = 1;
    let cssW = 0;
    let cssH = 0;

    function resize() {
      if (!canvas) return;
      dpr  = window.devicePixelRatio || 1;
      cssW = canvas.clientWidth;
      cssH = canvas.clientHeight;
      canvas.width  = cssW * dpr;
      canvas.height = cssH * dpr;
    }

    function draw() {
      if (!canvas || !ctx) return;
      const now = performance.now();

      if (isActiveRef.current) {
        getFrequencyData(data);
      } else {
        data.fill(0);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      if (!isActiveRef.current) {
        let anyVisible = false;
        for (let i = 0; i < BAR_COUNT; i++) {
          bars[i]  *= 0.88;
          peaks[i] *= 0.88;
          if (bars[i] > 0.5) anyVisible = true;
        }
        if (!anyVisible) {
          ctx.fillStyle = "rgba(204,0,0,0.15)";
          ctx.fillRect(0, cssH / 2 - 0.5, cssW, 1);
          ctx.restore();
          rafRef.current = requestAnimationFrame(draw);
          return;
        }
      }

      let x = 0;
      for (let i = 0; i < BAR_COUNT; i++) {
        const w      = (barWeight(i) / TOTAL_WEIGHT) * cssW;
        const binIdx = Math.min(i * step, FREQ_BIN_COUNT - 1);
        const raw    = data[binIdx] ?? 0;
        const target = (raw / 255) * cssH * 0.92;

        bars[i] = bars[i] * SMOOTHING + target * (1 - SMOOTHING);
        const barH = Math.max(1, bars[i]);

        if (barH > peaks[i]) {
          peaks[i]  = barH;
          ptimes[i] = now;
        } else if (now - ptimes[i] > PEAK_HOLD) {
          peaks[i] = Math.max(1, peaks[i] - PEAK_FALL);
        }

        const color = barColor(i);
        ctx.fillStyle = color;
        ctx.fillRect(x, cssH - barH, w - 1, barH);

        if (peaks[i] > 3 && isActiveRef.current) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle   = color;
          ctx.fillRect(x, cssH - peaks[i] - 2, w - 1, 2);
          ctx.globalAlpha = 1;
        }

        x += w;
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displaySource = isActive ? activeSource : selectedSource;

  return (
    <div className="stream-visualiser-wrap">
      <div className="stream-visualiser-controls">

        {/* Source picker */}
        <div className="vis-source-picker">
          {SOURCES.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`vis-source-btn${displaySource === id ? " vis-source-btn--active" : ""}`}
              onClick={() => handleSourceChange(id)}
              disabled={requesting}
              title={label}
            >
              <span>{icon}</span>
              <span className="vis-source-label">{label}</span>
            </button>
          ))}
        </div>

        {/* Enable / disable toggle */}
        <button
          className={`vis-toggle-btn${isActive ? " vis-toggle-btn--on" : ""}`}
          onClick={handleToggle}
          disabled={requesting}
          aria-label={isActive ? "Disable Visual Mode" : "Enable Visual Mode"}
        >
          {requesting ? "Connecting…" : isActive ? "Visual Mode ON" : "Visual Mode OFF"}
        </button>

        {isActive && (
          <span className="vis-active-label">
            {activeSource === "stream" ? "Stream" : "Mic (fallback)"}
          </span>
        )}
        {sourceError && (
          <span className="vis-source-error">{sourceError}</span>
        )}

      </div>
      <canvas ref={canvasRef} className="stream-visualiser-canvas" aria-hidden />
    </div>
  );
}
