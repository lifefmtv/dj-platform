"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Show } from "@/app/api/shows/route";

interface Props {
  compact?: boolean;
}

export default function MixcloudShows({ compact = false }: Props) {
  const [shows, setShows] = useState<Show[]>([]);
  const [selected, setSelected] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shows")
      .then((res) => res.json())
      .then((data: Show[]) => {
        setShows(compact ? data.slice(0, 3) : data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [compact]);

  function selectShow(show: Show) {
    setSelected((prev) => (prev?.id === show.id ? null : show));
  }

  if (loading || shows.length === 0) {
    return (
      <div className={compact ? "shows-section-compact" : "shows-section"}>
        <div className="placeholder-empty">
          {loading ? "Loading shows…" : "No shows available yet"}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="shows-section-compact">
        <div className="shows-grid-compact">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              isSelected={selected?.id === show.id}
              onSelect={selectShow}
            />
          ))}
        </div>
        {selected && (
          <ShowPlayer show={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    );
  }

  return (
    <section className="shows-section">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Recent Shows</h1>
      <div className="shows-grid">
        {shows.map((show) => (
          <ShowCard
            key={show.id}
            show={show}
            isSelected={selected?.id === show.id}
            onSelect={selectShow}
          />
        ))}
      </div>
      {selected && (
        <ShowPlayer show={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

function ShowCard({
  show,
  isSelected,
  onSelect,
}: {
  show: Show;
  isSelected: boolean;
  onSelect: (show: Show) => void;
}) {
  return (
    <div className={`show-card${isSelected ? " show-card--open" : ""}`}>
      <button
        className="show-thumb-btn"
        onClick={() => onSelect(show)}
        aria-expanded={isSelected}
        aria-label={isSelected ? `Close ${show.title}` : `Play ${show.title}`}
      >
        {show.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={show.thumbnail} alt={show.title} className="show-thumb" />
        ) : (
          <div className="show-thumb-placeholder" />
        )}
        <div className="show-play-overlay">
          <div className="show-play-icon">{isSelected ? "■" : "▶"}</div>
        </div>
        <span className={`show-source-badge show-source-badge--${show.source}`}>
          {show.source === "youtube" ? "YouTube" : "Mixcloud"}
        </span>
      </button>

      <div className="show-card-body">
        <p className="show-name">{show.title}</p>
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
    </div>
  );
}

function ShowPlayer({ show, onClose }: { show: Show; onClose: () => void }) {
  const isYouTube = show.source === "youtube";

  const src = isYouTube
    ? `https://www.youtube.com/embed/${show.id}?autoplay=1`
    : `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=${encodeURIComponent(show.id)}`;

  return (
    <div className="show-player-wrap" style={{ width: "100%", marginTop: "1.5rem" }}>
      <div className="show-player-header">
        <span className="show-player-title">{show.title}</span>
        <button
          className="show-player-close"
          onClick={onClose}
          aria-label="Close player"
        >
          ✕ Close
        </button>
      </div>
      <iframe
        src={src}
        className={`show-player-iframe${isYouTube ? " show-player-iframe--youtube" : " show-player-iframe--mixcloud"}`}
        allow="autoplay; fullscreen"
        frameBorder={0}
        title={show.title}
        allowFullScreen
      />
    </div>
  );
}
