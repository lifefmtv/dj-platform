"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

const MAX_TAPS = 40; // taps in 60s = 100%
const BOOM_SET = ["🔥", "💥", "🎵", "👑", "❤️", "🙌", "⚡", "🎉"];

export default function VibeMeter() {
  const [pct, setPct] = useState(0);
  const [boom, setBoom] = useState(false);
  const boomRef = useRef(false);
  const supabase = createClient();

  // Pre-generate boom emoji positions once — not on every render
  const boomEmojis = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      key: i,
      emoji: BOOM_SET[i % BOOM_SET.length],
      left: Math.random() * 90 + 5,
      top: Math.random() * 85 + 5,
      size: 1.4 + Math.random() * 2,
      delay: Math.random() * 0.6,
    })), []);

  useEffect(() => {
    fetchVibe();
    const interval = setInterval(fetchVibe, 5000);
    const channel = supabase
      .channel("vibe-taps-meter")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "vibe_taps" }, fetchVibe)
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  async function fetchVibe() {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("vibe_taps")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    const next = Math.min(100, Math.round(((count ?? 0) / MAX_TAPS) * 100));
    setPct((prev) => {
      if (next >= 100 && prev < 100 && !boomRef.current) triggerBoom();
      return next;
    });
  }

  function triggerBoom() {
    boomRef.current = true;
    setBoom(true);
    setTimeout(() => { setBoom(false); boomRef.current = false; setPct(0); }, 3200);
  }

  async function tap() {
    await supabase.from("vibe_taps").insert({});
  }

  const barColor = pct > 70 ? "#e63030" : pct > 40 ? "#f59e0b" : "#22c55e";
  const pulseSpeed = pct > 70 ? "0.55s" : pct > 40 ? "0.9s" : "1.6s";

  return (
    <>
      {/* Full-screen boom overlay (position:fixed breaks out of overflow:hidden) */}
      {boom && (
        <div className="vibe-boom">
          {boomEmojis.map((b) => (
            <span
              key={b.key}
              className="vibe-boom-emoji"
              style={{
                left: `${b.left}%`,
                top: `${b.top}%`,
                fontSize: `${b.size}rem`,
                animationDelay: `${b.delay}s`,
              }}
            >
              {b.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Vertical bar — positioned on right edge by StreamOverlay */}
      <div className="vibe-meter">
        <span className="vibe-label">VIBE</span>

        <button className="vibe-tap-area" onClick={tap} aria-label="Tap to add vibe">
          <div className="vibe-track">
            <div
              className="vibe-fill"
              style={{
                height: `${pct}%`,
                background: barColor,
                boxShadow: `0 0 10px ${barColor}88`,
                animationDuration: pulseSpeed,
              }}
            />
          </div>
        </button>

        <span className="vibe-pct">{pct}%</span>
      </div>
    </>
  );
}
