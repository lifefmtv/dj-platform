"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function FlyerLightbox({ src, coverMode = false }: { src: string; coverMode?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Thumbnail */}
      {coverMode ? (
        <button
          className="flyer-thumb-btn flyer-thumb-btn--cover"
          onClick={() => setOpen(true)}
          aria-label="View full event flyer"
        >
          <Image
            src={src}
            alt="Event flyer"
            fill
            style={{ objectFit: "cover", objectPosition: "center top" }}
            sizes="(max-width: 768px) 100vw, (max-width: 960px) 50vw, 33vw"
          />
          <div className="flyer-thumb-overlay">
            <span className="flyer-thumb-label">View Flyer</span>
          </div>
        </button>
      ) : (
        <button
          className="flyer-thumb-btn"
          onClick={() => setOpen(true)}
          aria-label="View full event flyer"
        >
          <Image
            src={src}
            alt="Event flyer"
            width={240}
            height={360}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          <div className="flyer-thumb-overlay">
            <span className="flyer-thumb-label">View Flyer</span>
          </div>
        </button>
      )}

      {/* Lightbox */}
      {open && (
        <div
          className="flyer-backdrop"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Event flyer"
        >
          <div
            className="flyer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flyer-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <Image
              src={src}
              alt="Event flyer"
              width={600}
              height={900}
              style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px" }}
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
