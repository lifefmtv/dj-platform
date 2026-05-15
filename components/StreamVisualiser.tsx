"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FREQ_BIN_COUNT, useAudioReactive } from "@/context/AudioReactiveContext";

const BAR_COUNT  = 64;
const SMOOTHING  = 0.75;   // per-bar: prev * 0.75 + raw * 0.25
const PEAK_HOLD  = 1500;   // ms before peak dot starts falling
const PEAK_FALL  = 1.2;    // px per frame after hold expires

// Frequency region colours — bass → high
function barColor(i: number): string {
  const t = i / BAR_COUNT;
  if (t < 0.15) return "#CC0000";
  if (t < 0.35) return "#AA0000";
  if (t < 0.65) return "#880000";
  if (t < 0.85) return "#660000";
  return "#440000";
}

// Width weight — bass bars wider, high-freq bars narrower
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

export default function StreamVisualiser() {
  const { isActive, getFrequencyData, startVisualiser, stopVisualiser } = useAudioReactive();
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const smoothed    = useRef(new Float32Array(BAR_COUNT));
  const peakHeights = useRef(new Float32Array(BAR_COUNT));
  const peakTimes   = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const isActiveRef = useRef(isActive);
  const [uiState, setUiState] = useState<"idle" | "requesting" | "denied">("idle");

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const handleToggle = useCallback(async () => {
    if (isActive) {
      stopVisualiser();
      setUiState("idle");
      return;
    }
    setUiState("requesting");
    const result = await startVisualiser();
    setUiState(result === "denied" ? "denied" : "idle");
  }, [isActive, startVisualiser, stopVisualiser]);

  // Single persistent draw loop — reads from refs, never restarts
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

      // Fade out when inactive
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

        // Per-bar independent smoothing
        bars[i] = bars[i] * SMOOTHING + target * (1 - SMOOTHING);
        const barH = Math.max(1, bars[i]);

        // Peak dot: update or decay
        if (barH > peaks[i]) {
          peaks[i]  = barH;
          ptimes[i] = now;
        } else if (now - ptimes[i] > PEAK_HOLD) {
          peaks[i] = Math.max(1, peaks[i] - PEAK_FALL);
        }

        const color = barColor(i);
        ctx.fillStyle = color;
        ctx.fillRect(x, cssH - barH, w - 1, barH);

        // Peak dot (2px tall, slightly brighter)
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
  }, []); // intentionally empty — loop reads from refs

  return (
    <div className="stream-visualiser-wrap">
      <div className="stream-visualiser-controls">
        <button
          className={`vis-toggle-btn${isActive ? " vis-toggle-btn--on" : ""}`}
          onClick={handleToggle}
          disabled={uiState === "requesting"}
          aria-label={isActive ? "Disable Visual Mode" : "Enable Visual Mode"}
        >
          🎵 {uiState === "requesting" ? "Requesting mic…" : isActive ? "Visual Mode ON" : "Visual Mode OFF"}
        </button>
        {isActive && <span className="vis-active-indicator">● Active</span>}
        {uiState === "denied" && (
          <span className="vis-denied-msg">Mic blocked — enable in browser settings</span>
        )}
      </div>
      <canvas ref={canvasRef} className="stream-visualiser-canvas" aria-hidden />
    </div>
  );
}
