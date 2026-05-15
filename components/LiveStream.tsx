"use client";

import StreamOverlay from "@/components/StreamOverlay";
import { useAudioReactive } from "@/context/AudioReactiveContext";

export default function LiveStream() {
  const isLive = process.env.NEXT_PUBLIC_IS_LIVE === "true";
  const { isActive, bassLevel } = useAudioReactive();

  const glowIntensity = isActive ? bassLevel / 255 : 0;
  const glowOpacity   = (0.3 + glowIntensity * 0.7).toFixed(2);
  const glowSpread    = Math.round(glowIntensity * 24);
  const boxShadow     = isActive
    ? `0 0 ${8 + glowSpread}px ${glowSpread}px rgba(230,48,48,${glowOpacity})`
    : "none";

  return (
    <div className="stream-video-wrap" style={{ boxShadow }}>
      <iframe
        src="https://player.restream.io/?token=aac9fac0a8854d65b094b2d3c6b6d1de&vwrs=1"
        allow="autoplay"
        allowFullScreen
        frameBorder={0}
        title="Life FM TV — Live Stream"
      />
      {isLive && (
        <div className="stream-live-badge">
          <span className="stream-live-dot pulse-red" />
          LIVE
        </div>
      )}
      <StreamOverlay />
    </div>
  );
}
