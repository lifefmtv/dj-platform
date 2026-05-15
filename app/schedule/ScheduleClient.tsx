"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  format, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isToday, addDays,
} from "date-fns";

interface Show {
  id: string;
  date: string;
  day_name: string | null;
  slot_number: number | null;
  start_time: string;
  end_time: string;
  dj_name: string;
  genre: string | null;
  notes: string | null;
  status: string | null;
}

const GENRES = ["DNB", "Dub", "House", "Jungle", "Soul & Funk", "Tech House", "Techno"];

const GENRE_COLORS: Record<string, string> = {
  DNB:           "#CC0000",
  Jungle:        "#CC5500",
  Dub:           "#1a5c1a",
  House:         "#1a1a5c",
  "Tech House":  "#3d1a5c",
  "Soul & Funk": "#5c4a00",
  Techno:        "#2a2a2a",
};

function genreColor(genre: string | null): string {
  return genre ? (GENRE_COLORS[genre] ?? "#333") : "#333";
}

function StatusDot({ status }: { status: string | null }) {
  if (status === "confirmed") return <span className="sched-dot sched-dot--confirmed" aria-hidden />;
  if (status === "resident")  return <span className="sched-dot sched-dot--resident"  aria-hidden />;
  return null;
}

function ShowCard({ show }: { show: Show }) {
  const isTBC    = show.status === "needs_booking";
  const color    = genreColor(show.genre);
  const effectiveStatus = show.status ?? "confirmed";

  return (
    <div
      className={`sched-show${isTBC ? " sched-show--tbc" : ""}`}
      style={{ borderLeftColor: isTBC ? "#333" : color }}
    >
      <span className="sched-show-time">
        {show.start_time.slice(0, 5)}–{show.end_time.slice(0, 5)}
      </span>
      <div className="sched-show-body">
        <div className="sched-show-top">
          <StatusDot status={effectiveStatus} />
          <span className="sched-show-dj">{isTBC ? "TBC" : show.dj_name}</span>
        </div>
        {show.genre && !isTBC && (
          <span
            className="sched-show-genre"
            style={{ color, background: color + "22", borderColor: color + "55" }}
          >
            {show.genre}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ScheduleClient() {
  const [anchor,   setAnchor]   = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [genre,    setGenre]    = useState<string | null>(null);
  const [shows,    setShows]    = useState<Show[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetchShows = useCallback(async () => {
    setLoading(true);
    const wStart  = startOfWeek(anchor, { weekStartsOn: 1 });
    const wEnd    = endOfWeek(anchor, { weekStartsOn: 1 });
    const mStart  = startOfMonth(anchor);
    const mEnd    = endOfMonth(anchor);
    const calFrom = viewMode === "week"
      ? format(wStart, "yyyy-MM-dd")
      : format(startOfWeek(mStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const calTo = viewMode === "week"
      ? format(wEnd, "yyyy-MM-dd")
      : format(endOfWeek(mEnd, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const supabase = createClient();
    let query = supabase
      .from("schedule")
      .select("id, date, day_name, slot_number, start_time, end_time, dj_name, genre, notes, status")
      .gte("date", calFrom)
      .lte("date", calTo)
      .neq("status", "cancelled")
      .order("date")
      .order("start_time");

    if (genre) query = query.eq("genre", genre);

    const { data } = await query;
    setShows((data as Show[]) ?? []);
    setLoading(false);
  }, [anchor, viewMode, genre]);

  useEffect(() => { fetchShows(); }, [fetchShows]);

  function prev() {
    setAnchor((a) => viewMode === "week" ? subWeeks(a, 1) : subMonths(a, 1));
  }
  function next() {
    setAnchor((a) => viewMode === "week" ? addWeeks(a, 1) : addMonths(a, 1));
  }

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(anchor, { weekStartsOn: 1 });
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(anchor);
  const monthEnd   = endOfMonth(anchor);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays    = eachDayOfInterval({ start: calStart, end: calEnd });

  // Group shows by ISO date string
  const byDate = shows.reduce<Record<string, Show[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const navLabel = viewMode === "week"
    ? `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`
    : format(anchor, "MMMM yyyy");

  return (
    <div className="sched-page">

      {/* ── Top controls ── */}
      <div className="sched-controls">
        <div className="sched-nav">
          <button className="sched-nav-btn" onClick={prev} aria-label="Previous">‹</button>
          <span className="sched-nav-label">{navLabel}</span>
          <button className="sched-nav-btn" onClick={next} aria-label="Next">›</button>
        </div>
        <div className="sched-ctrl-right">
          <button className="sched-today-btn" onClick={() => setAnchor(new Date())}>Today</button>
          <div className="sched-view-toggle">
            <button
              className={`sched-view-btn${viewMode === "week"  ? " sched-view-btn--active" : ""}`}
              onClick={() => setViewMode("week")}
            >Week</button>
            <button
              className={`sched-view-btn${viewMode === "month" ? " sched-view-btn--active" : ""}`}
              onClick={() => setViewMode("month")}
            >Month</button>
          </div>
        </div>
      </div>

      {/* ── Genre filter ── */}
      <div className="sched-genre-filter">
        <button
          className={`sched-genre-btn${!genre ? " sched-genre-btn--active" : ""}`}
          onClick={() => setGenre(null)}
        >All</button>
        {GENRES.map((g) => (
          <button
            key={g}
            className={`sched-genre-btn${genre === g ? " sched-genre-btn--active" : ""}`}
            style={genre === g ? { background: genreColor(g), borderColor: genreColor(g) } : undefined}
            onClick={() => setGenre(genre === g ? null : g)}
          >{g}</button>
        ))}
      </div>

      {loading ? (
        <div className="sched-loading">Loading schedule…</div>
      ) : viewMode === "week" ? (

        /* ── Weekly 7-column grid ── */
        <div className="sched-week-grid">
          {weekDays.map((day) => {
            const ds     = format(day, "yyyy-MM-dd");
            const dShows = byDate[ds] ?? [];
            return (
              <div key={ds} className={`sched-day-col${isToday(day) ? " sched-day-col--today" : ""}`}>
                <div className="sched-day-header">
                  <span className="sched-day-name">{format(day, "EEE").toUpperCase()}</span>
                  <span className="sched-day-date">{format(day, "d MMM")}</span>
                  {isToday(day) && <span className="sched-today-pill">TODAY</span>}
                </div>
                <div className="sched-day-shows">
                  {dShows.length === 0
                    ? <div className="sched-day-empty">–</div>
                    : dShows.map((s) => <ShowCard key={s.id} show={s} />)
                  }
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ── Month calendar ── */
        <div className="sched-month-view">
          <div className="sched-month-grid">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="sched-month-dow">{d}</div>
            ))}
            {calDays.map((day) => {
              const ds     = format(day, "yyyy-MM-dd");
              const dShows = byDate[ds] ?? [];
              const inMonth = isSameMonth(day, anchor);
              return (
                <div
                  key={ds}
                  className={`sched-month-day${!inMonth ? " sched-month-day--out" : ""}${isToday(day) ? " sched-month-day--today" : ""}`}
                >
                  <span className="sched-month-day-num">{format(day, "d")}</span>
                  <div className="sched-month-slots">
                    {dShows.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="sched-month-slot"
                        style={{ background: genreColor(s.genre) + "bb" }}
                        title={`${s.start_time.slice(0, 5)} ${s.dj_name}`}
                      >
                        <span className="sched-month-slot-time">{s.start_time.slice(0, 5)}</span>
                        <span className="sched-month-slot-dj">
                          {s.status === "needs_booking" ? "TBC" : s.dj_name}
                        </span>
                      </div>
                    ))}
                    {dShows.length > 3 && (
                      <div className="sched-month-more">+{dShows.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="sched-legend">
            {GENRES.map((g) => (
              <div key={g} className="sched-legend-item">
                <span className="sched-legend-dot" style={{ background: genreColor(g) }} />
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status legend */}
      <div className="sched-status-legend">
        <div className="sched-status-item">
          <span className="sched-dot sched-dot--confirmed" />Confirmed
        </div>
        <div className="sched-status-item">
          <span className="sched-dot sched-dot--resident" />Resident
        </div>
        <div className="sched-status-item">
          <span className="sched-dot sched-dot--tbc" />Needs booking
        </div>
      </div>
    </div>
  );
}
