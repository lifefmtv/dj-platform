"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

const EMOJIS = ["🔥", "❤️", "🎵", "💥", "🙌", "👑"];

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;   // % from left edge of overlay
  dur: number;    // animation duration (s)
  drift: number;  // total horizontal drift (px)
}

export default function EmojiRain() {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const cooldowns = useRef<Record<string, number>>({});
  // Track IDs we inserted ourselves so Realtime doesn't double-spawn for this user
  const selfInserted = useRef<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("emoji-rain")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emoji_reactions" },
        (payload) => {
          // Only spawn from Realtime if another user sent it
          if (!selfInserted.current.has(payload.new.id as string)) {
            spawn(payload.new.emoji as string);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function spawn(emoji: string) {
    const id = Math.random().toString(36).slice(2);
    const left = 4 + Math.random() * 16;        // cluster 4–20% from left
    const dur  = 2.2 + Math.random() * 0.8;     // 2.2–3s
    const drift = (Math.random() - 0.5) * 100;  // ±50px horizontal
    setFloating((prev) => [...prev.slice(-30), { id, emoji, left, dur, drift }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), (dur + 0.2) * 1000);
  }

  async function handleClick(emoji: string) {
    const now = Date.now();
    if (now - (cooldowns.current[emoji] ?? 0) < 500) return; // 500ms rate limit
    cooldowns.current[emoji] = now;

    // Optimistic — spawn immediately so the clicking user sees it right away
    spawn(emoji);

    // Insert and track the ID to prevent Realtime double-spawn
    const { data } = await supabase
      .from("emoji_reactions")
      .insert({ emoji })
      .select("id")
      .single();

    if (data?.id) {
      selfInserted.current.add(data.id as string);
      setTimeout(() => selfInserted.current.delete(data.id as string), 8000);
    }
  }

  return (
    <div className="emoji-rain">
      {/* Floating emojis */}
      {floating.map((f) => (
        <span
          key={f.id}
          className="emoji-float"
          style={{
            left: `${f.left}%`,
            "--dur": `${f.dur}s`,
            "--drift": `${f.drift}px`,
          } as React.CSSProperties}
        >
          {f.emoji}
        </span>
      ))}

      {/* Buttons */}
      <div className="emoji-btn-row">
        {EMOJIS.map((e) => (
          <button
            key={e}
            className="emoji-btn"
            onClick={() => handleClick(e)}
            aria-label={`Send ${e} reaction`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
