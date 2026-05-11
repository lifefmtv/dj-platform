"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

const EMOJIS = ["🔥", "❤️", "🎵", "💥", "🙌", "👑"];

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
  dur: number;
  drift: number;
}

export default function EmojiRain() {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const cooldowns = useRef<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("emoji-rain")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emoji_reactions" },
        (payload) => spawn(payload.new.emoji as string)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function spawn(emoji: string) {
    const id = Math.random().toString(36).slice(2);
    const left = 3 + Math.random() * 18;       // cluster 3-21% from left
    const dur  = 3.2 + Math.random() * 1.8;    // 3.2-5s
    const drift = (Math.random() - 0.5) * 80;  // ±40px horizontal drift
    setFloating((prev) => [...prev.slice(-25), { id, emoji, left, dur, drift }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), (dur + 0.3) * 1000);
  }

  async function handleClick(emoji: string) {
    const now = Date.now();
    if (now - (cooldowns.current[emoji] ?? 0) < 1000) return;
    cooldowns.current[emoji] = now;
    await supabase.from("emoji_reactions").insert({ emoji });
  }

  return (
    <div className="emoji-rain">
      {/* Floating emojis — rendered inside the overlay, pointer-events none on container */}
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

      {/* Button row */}
      <div className="emoji-btn-row">
        {EMOJIS.map((e) => (
          <button
            key={e}
            className="emoji-btn"
            onClick={() => handleClick(e)}
            aria-label={`Send ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
