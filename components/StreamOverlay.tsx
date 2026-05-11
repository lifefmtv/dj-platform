"use client";

import EmojiRain from "@/components/EmojiRain";
import LivePoll from "@/components/LivePoll";
import ShoutoutBanner from "@/components/ShoutoutBanner";

export default function StreamOverlay() {
  return (
    // pointer-events: none on the wrapper; interactive children opt back in
    <div className="stream-overlay" aria-label="Stream interactions">

      {/* ── Bottom left: emoji rain (buttons + floating emojis) ── */}
      <div className="stream-overlay-emoji">
        <EmojiRain />
      </div>

      {/* ── Bottom strip: shoutout ticker + form ── */}
      <div className="stream-overlay-shoutout">
        <ShoutoutBanner />
      </div>

      {/* ── Bottom right: live poll ── */}
      <div className="stream-overlay-poll">
        <LivePoll />
      </div>

    </div>
  );
}
