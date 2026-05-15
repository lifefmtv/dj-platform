"use client";

import StreamOverlay from "@/components/StreamOverlay";

export default function LiveStream() {
  const isLive = process.env.NEXT_PUBLIC_IS_LIVE === "true";

  return (
    <div className="stream-video-wrap">
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
