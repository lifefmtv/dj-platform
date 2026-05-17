"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

interface ShowRecord {
  id: string;
  title: string;
  dj_name: string;
  recorded_at: string | null;
  dropbox_path: string;
  genre: string | null;
}

const STATION_PREFIXES = /^(LIFEFM\.TV|LIFEFM\s*\.TV|IFEFM\.TV|FEFM\.TV|ifefm\.tv)\s*[-–—]?\s*/i;

function cleanTitle(raw: string): string {
  return raw.replace(STATION_PREFIXES, "").replace(/^[-–—\s]+/, "").trim();
}

function ShowThumb({ title, index }: { title: string; index: number }) {
  const clean = cleanTitle(title);
  return (
    <div className="archive-thumb-branded" aria-hidden>
      <div className="archive-thumb-bar" />
      <div className="archive-thumb-content">
        <span className="archive-thumb-station">LIFEFM.TV</span>
        <span className="archive-thumb-show-title">{clean || `Show ${index + 1}`}</span>
      </div>
      <div className="archive-thumb-play-btn">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>
    </div>
  );
}

export default function ShowsArchivePage() {
  const [shows, setShows]     = useState<ShowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ShowRecord | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("show_archive")
      .select("id, title, dj_name, recorded_at, dropbox_path, genre")
      .order("recorded_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .then(({ data }) => {
        setShows((data as ShowRecord[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function openShow(show: ShowRecord, idx: number) {
    setSelected(show);
    setSelectedIdx(idx);
    setVideoUrl(null);
    setLoadingVideo(true);

    try {
      const res = await fetch(`/api/sync/temp-link?path=${encodeURIComponent(show.dropbox_path)}`);
      const { link } = await res.json();
      setVideoUrl(link);
    } catch {
      setVideoUrl(null);
    }
    setLoadingVideo(false);
  }

  function closeModal() {
    setSelected(null);
    setVideoUrl(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
  }

  return (
    <main className="archive-page">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Shows Archive</h1>
      <p className="archive-intro">Watch past broadcasts from LIFEFM.TV selectors.</p>

      {loading ? (
        <p className="archive-loading">Loading…</p>
      ) : shows.length === 0 ? (
        <p className="archive-empty">Syncing content from Dropbox — check back soon.</p>
      ) : (
        <div className="archive-grid">
          {shows.map((show, idx) => (
            <button
              key={show.id}
              className="archive-card"
              onClick={() => openShow(show, idx)}
              aria-label={`Watch ${show.title}`}
            >
              <div className="archive-thumb">
                <ShowThumb title={show.title} index={idx} />
              </div>
              <div className="archive-card-info">
                <p className="archive-card-title">{cleanTitle(show.title)}</p>
                {show.dj_name && (
                  <p className="archive-card-dj">{show.dj_name}</p>
                )}
                <div className="archive-card-meta">
                  {show.genre && <span className="archive-card-genre">{show.genre}</span>}
                  {show.recorded_at && (
                    <span className="archive-card-date">
                      {new Date(show.recorded_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Video modal */}
      {selected && (
        <div
          className="archive-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
        >
          <div className="archive-modal">
            <button className="archive-modal-close" onClick={closeModal} aria-label="Close">✕</button>
            <h2 className="archive-modal-title">{cleanTitle(selected.title)}</h2>
            {selected.dj_name && (
              <p className="archive-modal-dj">{selected.dj_name}</p>
            )}

            <div className="archive-modal-video-wrap">
              {loadingVideo ? (
                <div className="archive-modal-loading">Loading video…</div>
              ) : videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="archive-modal-video"
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  autoPlay
                />
              ) : (
                <div className="archive-modal-error">Could not load video. Please try again.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
