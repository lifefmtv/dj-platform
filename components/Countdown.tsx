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
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("On now!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [eventDate, startTime]);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(230,48,48,0.07) 0%, transparent 60%)",
        border: "1px solid rgba(230,48,48,0.2)",
        borderRadius: "10px",
        padding: "1.25rem 2rem",
        margin: "1.5rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "0.3rem",
          }}
        >
          Next Up
        </p>
        <p
          style={{
            color: "#fff",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1.4rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {djName}
        </p>
      </div>
      <div
        style={{
          color: "var(--accent)",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "2.2rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.04em",
          textShadow: "0 0 20px rgba(230,48,48,0.45)",
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
}
