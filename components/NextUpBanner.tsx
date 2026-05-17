"use client";

import { useEffect, useState } from "react";
import { isOnAir } from "@/lib/broadcastStatus";
import { genreColor } from "@/lib/genreColors";
import { useAudioReactive } from "@/context/AudioReactiveContext";

interface Show {
  dj_name: string;
  date: string;
  start_time: string;
  end_time: string;
  genre?: string | null;
}

interface Props {
  currentShow: Show | null;
  nextShow: Show | null;
}

function genrePillStyle(genre: string | null | undefined, dim = false) {
  const c = genreColor(genre);
  return dim
    ? { color: c, background: `${c}18`, borderColor: `${c}40` }
    : { color: c, background: `${c}22`, borderColor: `${c}55` };
}

export default function NextUpBanner({ currentShow, nextShow }: Props) {
  const [onAir, setOnAir] = useState(() => isOnAir());
  const [timeLeft, setTimeLeft] = useState("");
  const { isActive, energy } = useAudioReactive();

  // Pulse speed reacts to energy: fast on high energy, slow when quiet
  const pulseDuration = isActive
    ? `${(1.8 - energy * 1.2).toFixed(2)}s`
    : "1.8s";

  // Sync broadcast status on whole-minute boundaries
  useEffect(() => {
    function scheduleNext() {
      const now = new Date();
      const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      return setTimeout(() => {
        setOnAir(isOnAir());
        const interval = setInterval(() => setOnAir(isOnAir()), 60_000);
        return () => clearInterval(interval);
      }, msUntilNextMinute);
    }
    const timeout = scheduleNext();
    return () => clearTimeout(timeout);
  }, []);

  // Countdown for UP NEXT
  useEffect(() => {
    if (!nextShow) { setTimeLeft(""); return; }
    function calculate() {
      const target = new Date(`${nextShow!.date}T${nextShow!.start_time}`);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Starting now"); return; }
      const days  = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins  = Math.floor((diff % 3_600_000) / 60_000);
      const secs  = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m ${secs}s`);
    }
    calculate();
    const id = setInterval(calculate, 1_000);
    return () => clearInterval(id);
  }, [nextShow]);

  const nextDateLabel = nextShow
    ? new Date(`${nextShow.date}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long",
      })
    : "";

  return (
    <div className="next-up-banner">

      {/* ── Left: status indicator + NOW PLAYING ── */}
      <div className="next-up-left">
        <div className="next-up-status-group">
          <span
            className={`next-up-status-dot${onAir ? " next-up-status-dot--on" : " next-up-status-dot--off"}`}
            style={onAir ? { animationDuration: pulseDuration } : undefined}
            aria-hidden
          />
          <span className={`next-up-status-label${onAir ? " next-up-status-label--on" : " next-up-status-label--off"}`}>
            {onAir ? "ON AIR" : "ARCHIVE"}
          </span>
        </div>

        {(currentShow || onAir) && (
          <>
            <span className="next-up-divider" aria-hidden />
            <div className="next-up-now-playing">
              <span className="next-up-now-label">Now Playing</span>
              {currentShow ? (
                <>
                  <span
                    className={`next-up-dj${/guest\s*tbc/i.test(currentShow.dj_name) ? " next-up-dj--guest-tbc" : ""}`}
                  >
                    {/guest\s*tbc/i.test(currentShow.dj_name) ? "Guest TBC" : currentShow.dj_name}
                  </span>
                  {currentShow.genre && !/guest\s*tbc/i.test(currentShow.dj_name) && (
                    <span
                      className="next-up-genre"
                      style={genrePillStyle(currentShow.genre)}
                    >
                      {currentShow.genre}
                    </span>
                  )}
                </>
              ) : (
                <span className="next-up-dj">LIFEFM.TV LIVE</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Right: UP NEXT + countdown ── */}
      {nextShow && (
        <div className="next-up-right-group">
          <span className="next-up-section-divider" aria-hidden />

          <div className="next-up-upnext-info">
            <span className="next-up-label">Up Next</span>
            <span
              className={`next-up-dj next-up-dj--dim${/guest\s*tbc/i.test(nextShow.dj_name) ? " next-up-dj--guest-tbc" : ""}`}
            >
              {/guest\s*tbc/i.test(nextShow.dj_name) ? "Guest TBC" : nextShow.dj_name}
            </span>
            {nextShow.genre && !/guest\s*tbc/i.test(nextShow.dj_name) && (
              <span
                className="next-up-genre next-up-genre--dim"
                style={genrePillStyle(nextShow.genre, true)}
              >
                {nextShow.genre}
              </span>
            )}
          </div>

          <div className="next-up-right">
            <span className="next-up-datetime">
              {nextDateLabel} · {nextShow.start_time.slice(0, 5)}
            </span>
            {timeLeft && (
              <div className="next-up-timer-group">
                <span className="next-up-timer-label">Starts in</span>
                <span className="next-up-timer">{timeLeft}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
