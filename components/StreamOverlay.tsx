"use client";

import EmojiRain from "@/components/EmojiRain";
import LivePoll from "@/components/LivePoll";
import ShoutoutBanner from "@/components/ShoutoutBanner";
import VibeMeter from "@/components/VibeMeter";

export default function StreamOverlay() {
  return (
    // pointer-events: none on the wrapper; interactive children opt back in
    <div className="stream-overlay" aria-label="Stream interactions">

      {/* ── Bottom left: emoji rain (buttons + floating emojis) ── */}
      <div className="stream-overlay-emoji">
        <EmojiRain />
      </div>

      {/* ── Bottom strip above emoji row: shoutout ticker + form ── */}
      <div className="stream-overlay-shoutout">
        <ShoutoutBanner />
      </div>

      {/* ── Right edge: vibe meter ── */}
      <div className="stream-overlay-vibe">
        <VibeMeter />
      </div>

      {/* ── Bottom right: live poll ── */}
      <div className="stream-overlay-poll">
        <LivePoll />
      </div>

    </div>
  );
}
