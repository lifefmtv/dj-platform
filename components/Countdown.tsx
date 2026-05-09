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
        background: "#111",
        border: "1px solid #222",
        borderRadius: "8px",
        padding: "1.5rem 2rem",
        margin: "2rem",
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
            color: "#aaa",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          Next Up
        </p>
        <p style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 600 }}>
          {djName}
        </p>
      </div>
      <div
        style={{
          color: "#e63030",
          fontSize: "1.5rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
}