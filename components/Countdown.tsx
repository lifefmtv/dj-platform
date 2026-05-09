"use client";

import { useEffect, useState } from "react";

interface Props {
  djName: string;
  eventDate: string;
  startTime: string;
}

export default function Countdown({ djName, eventDate, startTime }: Props) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calculate() {
      const target = new Date(`${eventDate}T${startTime}`);
      const diff = target.getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("On now!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        days > 0
          ? `${days}d ${hours}h ${minutes}m`
          : `${hours}h ${minutes}m ${seconds}s`
      );
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [eventDate, startTime]);

  return (
    <div className="countdown-strip">
      <div>
        <p className="countdown-next-label">Next Up</p>
        <p className="countdown-dj-name">{djName}</p>
      </div>
      <div className="countdown-timer">{timeLeft}</div>
    </div>
  );
}
