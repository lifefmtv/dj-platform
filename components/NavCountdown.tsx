"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

interface NextShow {
  dj_name: string;
  date: string;
  start_time: string;
}

export default function NavCountdown() {
  const supabase = useMemo(() => createClient(), []);
  const [show, setShow] = useState<NextShow | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("schedule")
        .select("dj_name, date, start_time")
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!error && data) setShow(data);
    }
    load();
  }, [supabase]);

  useEffect(() => {
    if (!show) return;
    function calculate() {
      const target = new Date(`${show!.date}T${show!.start_time}`);
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
  }, [show]);

  // Hide completely when no data or still loading
  if (!show || !timeLeft) return null;

  return (
    <div className="nav-countdown">
      <span className="nav-countdown-label">Next Up</span>
      <div className="nav-countdown-row">
        <span className="nav-countdown-dj">{show.dj_name}</span>
        <span className="nav-countdown-sep">·</span>
        <span className="nav-countdown-time">{show.start_time.slice(0, 5)}</span>
        <span className="nav-countdown-sep">·</span>
        <span className="nav-countdown-timer">{timeLeft}</span>
      </div>
    </div>
  );
}
