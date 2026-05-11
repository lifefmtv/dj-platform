"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

const MAX_TAPS = 40;
const BOOM_SET = ["🔥", "💥", "🎵", "👑", "❤️", "🙌", "⚡", "🎉"];

export default function VibeMeter() {
  const [pct, setPct] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [boom, setBoom] = useState(false);
  const [ripple, setRipple] = useState(false);
  const boomRef = useRef(false);
  const supabase = useMemo(() => createClient(), []);

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
    const raw = count ?? 0;
    const next = Math.min(100, Math.round((raw / MAX_TAPS) * 100));
    setTapCount(raw);
    setPct((prev) => {
      if (next >= 100 && prev < 100 && !boomRef.current) triggerBoom();
      return next;
    });
  }

  function triggerBoom() {
    boomRef.current = true;
    setBoom(true);
    setTimeout(() => { setBoom(false); boomRef.current = false; setPct(0); setTapCount(0); }, 3200);
  }

  async function tap() {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    await supabase.from("vibe_taps").insert({});
  }

  const barColor = pct > 70 ? "#e63030" : pct > 40 ? "#f59e0b" : "#22c55e";

  return (
    <>
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

      <div className="vibe-section">
        <div className="vibe-strip-left">
          <span className="vibe-strip-label">VIBE CHECK</span>
          <button
            className={`vibe-tap-btn${ripple ? " vibe-tap-btn--ripple" : ""}`}
            onClick={tap}
            aria-label="Tap to add vibe"
          >
            🔥
          </button>
        </div>

        <div className="vibe-strip-centre">
          <div className="vibe-strip-track">
            <div
              className="vibe-strip-fill"
              style={{
                width: `${pct}%`,
                background: barColor,
                boxShadow: pct > 10 ? `0 0 12px ${barColor}88` : "none",
              }}
            />
          </div>
        </div>

        <div className="vibe-strip-right">
          <span className="vibe-strip-pct">{pct}%</span>
          <span className="vibe-strip-count">{tapCount} vibing</span>
        </div>
      </div>
    </>
  );
}
