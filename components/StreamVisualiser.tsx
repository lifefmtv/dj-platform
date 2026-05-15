"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FREQ_BIN_COUNT, useAudioReactive } from "@/context/AudioReactiveContext";

const BAR_COUNT = 64;
const EASE_UP   = 0.38;
const EASE_DOWN = 0.11;

export default function StreamVisualiser() {
  const { isActive, getFrequencyData, startVisualiser, stopVisualiser, bassLevel, energy } = useAudioReactive();
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const smoothed    = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const isActiveRef = useRef(isActive);
  const [uiState, setUiState] = useState<"idle" | "requesting" | "denied">("idle");
  const logThrottle = useRef(0);

  // Keep isActiveRef current without restarting the draw loop
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // Debug log — throttled to once per second
  useEffect(() => {
    if (!isActive) return;
    const now = Date.now();
    if (now - logThrottle.current > 1000) {
      console.log(`[AudioVis] bassLevel=${bassLevel.toFixed(1)} energy=${energy.toFixed(3)}`);
      logThrottle.current = now;
    }
  }, [isActive, bassLevel, energy]);

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

  // Single persistent draw loop — reads from refs, never restarts on state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data    = new Uint8Array(FREQ_BIN_COUNT) as Uint8Array<ArrayBuffer>;
    const bars    = smoothed.current;
    const step    = Math.floor(FREQ_BIN_COUNT / BAR_COUNT);
    let dpr       = 1;
    let cssW      = 0;
    let cssH      = 0;

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
          bars[i] *= 0.88;
          if (bars[i] > 0.5) anyVisible = true;
        }

        if (!anyVisible) {
          ctx.fillStyle = "rgba(230,48,48,0.18)";
          ctx.fillRect(0, cssH / 2 - 0.5, cssW, 1);
          ctx.restore();
          rafRef.current = requestAnimationFrame(draw);
          return;
        }
      }

      const barW = cssW / BAR_COUNT;

      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        const start = i * step;
        for (let j = 0; j < step; j++) sum += data[start + j] ?? 0;
        const raw     = sum / step;
        const target  = (raw / 255) * cssH * 0.95;
        const prev    = bars[i];
        bars[i]       = prev < target
          ? prev + (target - prev) * EASE_UP
          : prev + (target - prev) * EASE_DOWN;

        const barH = Math.max(1, bars[i]);
        const t    = i / (BAR_COUNT - 1);

        const r = 230;
        const g = Math.round(t * 55);
        const b = Math.round(t * 18);
        const a = (0.38 + (raw / 255) * 0.62).toFixed(2);

        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(i * barW, cssH - barH, barW - 1, barH);
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
        {isActive && (
          <span className="vis-active-indicator">● Active</span>
        )}
        {uiState === "denied" && (
          <span className="vis-denied-msg">Mic blocked — enable in browser settings</span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="stream-visualiser-canvas"
        aria-hidden
      />
    </div>
  );
}
