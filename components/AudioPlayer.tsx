"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer() {
  const [open, setOpen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Capture the container in the closure so cleanup still works after
    // the element unmounts and the ref is nulled out by React.
    const container = playerRef.current;
    if (!container) return;

    // document.createElement is the only reliable way to execute a third-party
    // script — dropping a <script> tag in JSX is inert (React strips it).
    const script = document.createElement("script");
    script.src = "https://embed.radio.co/player/7c6d71d.js";
    script.async = true;
    container.appendChild(script);

    return () => {
      script.remove();
      try {
        container.innerHTML = "";
      } catch {
        // container may already be detached — safe to ignore
      }
    };
  }, [open]);

  return (
    <>
      {/* ── Pop-out panel ── */}
      {open && (
        <div className="audio-panel" role="dialog" aria-label="Audio player">
          <div className="audio-panel-header">
            <span className="audio-panel-title">♫ Life FM — Listen Live</span>
            <button
              className="audio-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Close player"
            >
              ✕
            </button>
          </div>
          {/* radio.co script renders its player into this div */}
          <div ref={playerRef} className="audio-panel-player" />
        </div>
      )}

      {/* ── Floating trigger button ── */}
      <button
        className={`audio-fab${open ? " audio-fab--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={open ? "Close audio player" : "Listen live — open audio player"}
      >
        <span className="audio-fab-icon" aria-hidden>♫</span>
        <span className="audio-fab-label">{open ? "Close" : "Listen Live"}</span>
      </button>
    </>
  );
}
