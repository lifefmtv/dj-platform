"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

interface MixRecord {
  id: string;
  title: string;
  dj_name: string | null;
  artist: string | null;
  recorded_at: string | null;
  created_at: string | null;
  dropbox_path: string;
}

const STATION_PREFIXES = /^(LIFEFM\.TV|LIFEFM\s*\.TV|IFEFM\.TV|FEFM\.TV|ifefm\.tv)\s*[-–—]?\s*/i;

function cleanTitle(raw: string): string {
  return raw.replace(STATION_PREFIXES, "").replace(/^[-–—\s]+/, "").trim();
}

export default function MixesArchivePage() {
  const [mixes, setMixes]           = useState<MixRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [audioUrl, setAudioUrl]     = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("mixes")
      .select("id, title, dj_name, artist, recorded_at, created_at, dropbox_path")
      .order("recorded_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMixes((data as MixRecord[]) ?? []);
        setLoading(false);
      });
  }, []);

  const loadMix = useCallback(async (idx: number, autoplay = true) => {
    const mix = mixes[idx];
    if (!mix) return;

    setCurrentIdx(idx);
    setAudioUrl(null);
    setLoadingAudio(true);
    setPlaying(false);
    setProgress(0);
    setDuration(0);

    try {
      const res = await fetch(`/api/sync/temp-link?path=${encodeURIComponent(mix.dropbox_path)}`);
      const { link } = await res.json();
      setAudioUrl(link);
      if (autoplay) setPlaying(true);
    } catch {
      setAudioUrl(null);
    }
    setLoadingAudio(false);
  }, [mixes]);

  function handleEnded() {
    if (currentIdx !== null && currentIdx < mixes.length - 1) {
      loadMix(currentIdx + 1);
    } else {
      setPlaying(false);
    }
  }

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    el.src = audioUrl;
    if (playing) el.play().catch(() => {});
  }, [audioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  function togglePlay() {
    if (!audioUrl) return;
    setPlaying((p) => !p);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const t = (parseFloat(e.target.value) / 100) * duration;
    el.currentTime = t;
    setProgress(parseFloat(e.target.value));
  }

  function fmt(s: number) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const currentMix = currentIdx !== null ? mixes[currentIdx] : null;

  return (
    <main className="archive-page archive-page--mixes">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">DJ Mixes</h1>
      <p className="archive-intro">Recorded mixes from the LIFEFM.TV archive.</p>

      <div className="mixes-layout">

        {/* ── Track list ── */}
        <div className="mixes-list">
          {loading ? (
            <p className="archive-loading">Loading…</p>
          ) : mixes.length === 0 ? (
            <p className="archive-empty">Mixes coming soon — syncing from Dropbox.</p>
          ) : (
            mixes.map((mix, idx) => (
              <button
                key={mix.id}
                className={`mix-row${currentIdx === idx ? " mix-row--active" : ""}`}
                onClick={() => loadMix(idx)}
                aria-label={`Play ${mix.title}`}
              >
                <span className="mix-row-num">
                  {currentIdx === idx && playing ? "▶" : idx + 1}
                </span>
                <span className="mix-row-info">
                  <span className="mix-row-title">{cleanTitle(mix.title)}</span>
                  {(mix.dj_name || mix.artist) && (
                    <span className="mix-row-dj">{mix.dj_name ?? mix.artist}</span>
                  )}
                </span>
                {mix.recorded_at && (
                  <span className="mix-row-date">
                    {new Date(mix.recorded_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "2-digit",
                    })}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* ── Player ── */}
        <div className="mixes-player">
          {currentMix ? (
            <>
              <div className="mixes-player-art" aria-hidden>
                <span className="mixes-player-art-icon">♪</span>
              </div>

              <div className="mixes-player-meta">
                <p className="mixes-player-title">{cleanTitle(currentMix.title)}</p>
                {(currentMix.dj_name || currentMix.artist) && (
                  <p className="mixes-player-dj">{currentMix.dj_name ?? currentMix.artist}</p>
                )}
              </div>

              {loadingAudio ? (
                <p className="mixes-player-loading">Loading…</p>
              ) : (
                <>
                  <div className="mixes-player-progress">
                    <span className="mixes-player-time">{fmt(duration * progress / 100)}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.1}
                      value={progress}
                      onChange={seek}
                      className="mixes-player-seek"
                      aria-label="Seek"
                    />
                    <span className="mixes-player-time">{fmt(duration)}</span>
                  </div>

                  <div className="mixes-player-controls">
                    <button
                      className="mixes-ctrl-btn"
                      onClick={() => currentIdx !== null && currentIdx > 0 && loadMix(currentIdx - 1)}
                      disabled={currentIdx === 0}
                      aria-label="Previous"
                    >⏮</button>
                    <button
                      className="mixes-ctrl-btn mixes-ctrl-btn--play"
                      onClick={togglePlay}
                      aria-label={playing ? "Pause" : "Play"}
                    >
                      {playing ? "⏸" : "▶"}
                    </button>
                    <button
                      className="mixes-ctrl-btn"
                      onClick={() => currentIdx !== null && currentIdx < mixes.length - 1 && loadMix(currentIdx + 1)}
                      disabled={currentIdx === mixes.length - 1}
                      aria-label="Next"
                    >⏭</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="mixes-player-empty">
              <p>Select a mix to play</p>
            </div>
          )}

          <audio
            ref={audioRef}
            onEnded={handleEnded}
            onTimeUpdate={() => {
              const el = audioRef.current;
              if (el && el.duration) {
                setProgress((el.currentTime / el.duration) * 100);
              }
            }}
            onDurationChange={() => {
              const el = audioRef.current;
              if (el) setDuration(el.duration);
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

      </div>
    </main>
  );
}
