"use client";

import { useEffect, useState } from "react";
import { isOnAir } from "@/lib/broadcastStatus";

export default function BroadcastIndicator() {
  const [onAir, setOnAir] = useState(() => isOnAir());

  useEffect(() => {
    // Re-check on the next whole-minute boundary so transitions are prompt
    function scheduleNext() {
      const now = new Date();
      const msUntilNextMinute =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      return setTimeout(() => {
        setOnAir(isOnAir());
        // After the first boundary hit, poll every 60 s
        const interval = setInterval(() => setOnAir(isOnAir()), 60_000);
        return () => clearInterval(interval);
      }, msUntilNextMinute);
    }

    const timeout = scheduleNext();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`broadcast-indicator${onAir ? " broadcast-indicator--on" : " broadcast-indicator--off"}`}>
      <span className={`broadcast-dot${onAir ? " broadcast-dot--on" : ""}`} aria-hidden />
      <span className="broadcast-label">{onAir ? "ON AIR" : "OFF AIR"}</span>
    </div>
  );
}
