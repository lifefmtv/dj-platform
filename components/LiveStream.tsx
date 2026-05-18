"use client";

import { useEffect, useState } from "react";
import StreamOverlay from "@/components/StreamOverlay";

const RESTREAM_TOKEN = process.env.NEXT_PUBLIC_RESTREAM_TOKEN ?? "aac9fac0a8854d65b094b2d3c6b6d1de";

const STREAM_GENRE_COLORS: Record<string, string> = {
  DNB: "#CC0000", Jungle: "#CC5500", Dub: "#1a5c1a",
  "Tech House": "#3d1a5c", Techno: "#444444",
  "Soul & Funk": "#5c4a00", House: "#1a1a5c",
};

function genreToStreamColor(genre: string | null | undefined): string {
  return STREAM_GENRE_COLORS[genre ?? ""] ?? "#333333";
}

interface Props {
  genreColor?: string;
}

export default function LiveStream({ genreColor = "#333333" }: Props) {
  const isLive = process.env.NEXT_PUBLIC_IS_LIVE === "true";
  const [color, setColor] = useState(genreColor);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/now-playing");
        if (!res.ok) return;
        const { genre } = await res.json();
        setColor(genreToStreamColor(genre));
      } catch { /* silent */ }
    }
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="stream-video-wrap"
      style={{
        boxShadow: `0 0 0 3px ${color}, 0 0 20px 4px ${color}40`,
        transition: "box-shadow 2s ease",
      }}
    >
      <iframe
        src={`https://player.restream.io/?token=${RESTREAM_TOKEN}&vwrs=1`}
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
