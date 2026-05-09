"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface MixcloudShow {
  key: string;
  name: string;
  url: string;
  created_time: string;
  pictures: {
    large?: string;
    medium?: string;
    thumbnail?: string;
    "640wx640h"?: string;
    "300wx300h"?: string;
  };
  listener_count?: number;
}

interface Props {
  compact?: boolean;
}

export default function MixcloudShows({ compact = false }: Props) {
  const [shows, setShows] = useState<MixcloudShow[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mixcloud")
      .then((res) => res.json())
      .then((data: MixcloudShow[]) => {
        setShows(compact ? data.slice(0, 3) : data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [compact]);

  function toggleShow(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  if (loading || shows.length === 0) return null;

  return (
    <section className={compact ? "shows-section-compact" : "shows-section"}>
      {compact ? (
        <h2 className="news-section-heading" style={{ marginBottom: "1rem" }}>
          Recent Shows
        </h2>
      ) : (
        <>
          <a href="/" className="back-link">← Home</a>
          <h1 className="page-heading">Recent Shows</h1>
        </>
      )}

      <div className={compact ? "shows-grid-compact" : "shows-grid"}>
        {shows.map((show) => {
          const isOpen = openKey === show.key;
          const thumb =
            show.pictures?.["640wx640h"] ||
            show.pictures?.large ||
            show.pictures?.["300wx300h"] ||
            show.pictures?.medium ||
            show.pictures?.thumbnail;

          const embedSrc = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(show.key)}`;

          return (
            <div key={show.key} className={`show-card${isOpen ? " show-card--open" : ""}`}>
              {/* Thumbnail / play button */}
              <button
                className="show-thumb-btn"
                onClick={() => toggleShow(show.key)}
                aria-expanded={isOpen}
                aria-label={isOpen ? `Close ${show.name}` : `Play ${show.name}`}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={show.name} className="show-thumb" />
                ) : (
                  <div className="show-thumb-placeholder" />
                )}
                <div className="show-play-overlay">
                  <span className="show-play-icon">{isOpen ? "■" : "▶"}</span>
                </div>
              </button>

              {/* Info */}
              <div className="show-card-body">
                <p className="show-name">{show.name}</p>
                <div className="show-meta">
                  <span className="show-date">
                    {format(new Date(show.created_time), "d MMM yyyy")}
                  </span>
                  {show.listener_count != null && show.listener_count > 0 && (
                    <span className="show-listeners">
                      {show.listener_count.toLocaleString()} listeners
                    </span>
                  )}
                </div>
              </div>

              {/* Inline embed — opens when card is active */}
              {isOpen && (
                <iframe
                  src={embedSrc}
                  className="show-embed"
                  allow="autoplay"
                  frameBorder={0}
                  title={show.name}
                />
              )}
            </div>
          );
        })}
      </div>

      {compact && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/shows" className="back-link" style={{ margin: 0 }}>
            View all shows →
          </a>
        </div>
      )}
    </section>
  );
}
