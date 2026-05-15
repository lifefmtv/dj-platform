"use client";

import { useEffect, useRef } from "react";
import { FREQ_BIN_COUNT, useAudioReactive } from "@/context/AudioReactiveContext";

const BAR_COUNT = 64;
const EASE_UP   = 0.38;
const EASE_DOWN = 0.11;

export default function StreamVisualiser() {
  const { isActive, getFrequencyData } = useAudioReactive();
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const smoothed    = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const isActiveRef = useRef(isActive);

  // Keep isActiveRef current without restarting the draw loop
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

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
        // Ease bars back down when inactive
        let anyVisible = false;
        for (let i = 0; i < BAR_COUNT; i++) {
          bars[i] *= 0.88;
          if (bars[i] > 0.5) anyVisible = true;
        }

        if (!anyVisible) {
          // Static flat line with label
          ctx.fillStyle = "rgba(230,48,48,0.18)";
          ctx.fillRect(0, cssH / 2 - 0.5, cssW, 1);
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.font      = `${Math.min(10, cssH * 0.22)}px 'DM Mono', 'Courier New', monospace`;
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("ENABLE VISUAL MODE", cssW / 2, cssH / 2);
          ctx.restore();
          rafRef.current = requestAnimationFrame(draw);
          return;
        }
      }

      const barW = cssW / BAR_COUNT;

      for (let i = 0; i < BAR_COUNT; i++) {
        // Average the frequency bins in this slot
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
        const t    = i / (BAR_COUNT - 1); // 0 = bass, 1 = treble

        // Colour gradient: deep red at bass, slightly brighter/warmer at treble
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
    <canvas
      ref={canvasRef}
      className="stream-visualiser-canvas"
      aria-hidden
    />
  );
}
