"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Show } from "@/app/api/shows/route";

interface Props {
  compact?: boolean;
}

export default function MixcloudShows({ compact = false }: Props) {
  const [shows, setShows] = useState<Show[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
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

  function toggleShow(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
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
            <ShowCard key={show.id} show={show} openId={openId} toggleShow={toggleShow} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="shows-section">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Recent Shows</h1>
      <div className="shows-grid">
        {shows.map((show) => (
          <ShowCard key={show.id} show={show} openId={openId} toggleShow={toggleShow} />
        ))}
      </div>
    </section>
  );
}

function ShowCard({
  show,
  openId,
  toggleShow,
}: {
  show: Show;
  openId: string | null;
  toggleShow: (id: string) => void;
}) {
  const isOpen = openId === show.id;
  const isYouTube = show.source === "youtube";

  const thumbInner = (
    <>
      {show.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={show.thumbnail} alt={show.title} className="show-thumb" />
      ) : (
        <div className="show-thumb-placeholder" />
      )}
      <div className="show-play-overlay">
        <div className="show-play-icon">{isOpen ? "■" : "▶"}</div>
      </div>
      <span className={`show-source-badge show-source-badge--${show.source}`}>
        {isYouTube ? "YouTube" : "Mixcloud"}
      </span>
    </>
  );

  return (
    <div className={`show-card${isOpen ? " show-card--open" : ""}`}>
      {isYouTube ? (
        <a
          href={show.url}
          target="_blank"
          rel="noopener noreferrer"
          className="show-thumb-btn"
          aria-label={`Watch ${show.title} on YouTube`}
        >
          {thumbInner}
        </a>
      ) : (
        <button
          className="show-thumb-btn"
          onClick={() => toggleShow(show.id)}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Close ${show.title}` : `Play ${show.title}`}
        >
          {thumbInner}
        </button>
      )}

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

      {isOpen && show.embed_url && (
        <iframe
          src={show.embed_url}
          className="show-embed"
          allow="autoplay"
          frameBorder={0}
          title={show.title}
        />
      )}
    </div>
  );
}
