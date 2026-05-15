"use client";

import { useEffect, useRef } from "react";
import { useAudioReactive } from "@/context/AudioReactiveContext";

const THRESHOLD = 140; // bassLevel (0–255) above which flash fires
const DECAY     = 0.82;

export default function BassFxLayer() {
  const { isActive, bassLevel } = useAudioReactive();
  const layerRef      = useRef<HTMLDivElement>(null);
  const opacityRef    = useRef(0);
  const rafRef        = useRef<number>(0);
  const isActiveRef   = useRef(isActive);
  const bassLevelRef  = useRef(bassLevel);

  useEffect(() => { isActiveRef.current  = isActive;  }, [isActive]);
  useEffect(() => { bassLevelRef.current = bassLevel; }, [bassLevel]);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    function tick() {
      if (!el) return;
      if (isActiveRef.current && bassLevelRef.current > THRESHOLD) {
        opacityRef.current = Math.min(
          1,
          opacityRef.current + ((bassLevelRef.current - THRESHOLD) / 255) * 0.35,
        );
      }
      opacityRef.current *= DECAY;
      el.style.opacity = opacityRef.current.toFixed(3);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // intentionally empty — reads from refs

  return (
    <div
      ref={layerRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0,
        background:
          "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(230,48,48,0.18) 0%, transparent 70%)",
      }}
    />
  );
}
