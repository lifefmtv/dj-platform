"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

interface ShowRecord {
  id: string;
  title: string;
  dj_name: string;
  recorded_at: string | null;
  dropbox_path: string;
  temp_link: string | null;
  temp_link_expires_at: string | null;
  genre: string | null;
}

export default function ShowsArchivePage() {
  const [shows, setShows]     = useState<ShowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ShowRecord | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("show_archive")
      .select("id, title, dj_name, recorded_at, dropbox_path, temp_link, temp_link_expires_at, genre")
      .eq("status", "approved")
      .order("recorded_at", { ascending: false })
      .then(({ data }) => {
        setShows((data as ShowRecord[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function openShow(show: ShowRecord) {
    setSelected(show);
    setVideoUrl(null);
    setLoadingVideo(true);

    // Use cached link if still valid (>5 min remaining)
    const expires = show.temp_link_expires_at ? new Date(show.temp_link_expires_at).getTime() : 0;
    if (show.temp_link && expires > Date.now() + 5 * 60 * 1000) {
      setVideoUrl(show.temp_link);
      setLoadingVideo(false);
      return;
    }

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
        <p className="archive-empty">No shows in the archive yet. Check back soon.</p>
      ) : (
        <div className="archive-grid">
          {shows.map((show) => (
            <button
              key={show.id}
              className="archive-card"
              onClick={() => openShow(show)}
              aria-label={`Watch ${show.title}`}
            >
              <div className="archive-thumb">
                <div className="archive-thumb-placeholder" aria-hidden>
                  <span className="archive-thumb-play">▶</span>
                </div>
              </div>
              <div className="archive-card-info">
                <p className="archive-card-title">{show.title}</p>
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

      {/* Modal */}
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
            <h2 className="archive-modal-title">{selected.title}</h2>
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
