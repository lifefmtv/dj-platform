"use client";

import { useEffect, useState } from "react";
import { isOnAir } from "@/lib/broadcastStatus";

interface Props {
  djName: string;
  eventDate: string;
  startTime: string;
  genre?: string | null;
}

export default function NextUpBanner({ djName, eventDate, startTime, genre }: Props) {
  const [timeLeft, setTimeLeft] = useState("");
  const [onAir, setOnAir] = useState(() => isOnAir());

  useEffect(() => {
    function calculate() {
      const target = new Date(`${eventDate}T${startTime}`);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("On now");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m ${secs}s`);
    }
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [eventDate, startTime]);

  // Sync broadcast status to whole-minute boundary
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

  const dateLabel = new Date(`${eventDate}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="next-up-banner">
      {/* Left: status + next-up label + DJ + genre */}
      <div className="next-up-left">
        <div className="next-up-status-group">
          <span
            className={`next-up-status-dot${onAir ? " next-up-status-dot--on" : " next-up-status-dot--off"}`}
            aria-hidden
          />
          <span className={`next-up-status-label${onAir ? " next-up-status-label--on" : " next-up-status-label--off"}`}>
            {onAir ? "ON AIR" : "ARCHIVE"}
          </span>
        </div>

        <span className="next-up-divider" aria-hidden />

        <span className="next-up-label">Next Up</span>
        <span className="next-up-dj">{djName}</span>
        {genre && <span className="next-up-genre">{genre}</span>}
      </div>

      {/* Right: date + countdown */}
      <div className="next-up-right">
        <span className="next-up-datetime">{dateLabel} · {startTime.slice(0, 5)}</span>
        <div className="next-up-timer-group">
          <span className="next-up-timer-label">Starts in</span>
          <span className="next-up-timer">{timeLeft}</span>
        </div>
      </div>
    </div>
  );
}
