export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { format, addDays, startOfDay, parseISO } from "date-fns";

const GENRE_COLORS: Record<string, string> = {
  DNB: "#e63030",
  House: "#6366f1",
  Techno: "#1a1a2e",
  Jungle: "#22c55e",
  Dub: "#f59e0b",
  "Soul & Funk": "#ec4899",
  "Tech House": "#00d4ff",
  Other: "#aaa",
};

const TIME_SLOTS = [14, 16, 18, 20, 22]; // 2-hour slots from 14:00–00:00

function slotIndex(hour: number): number {
  return TIME_SLOTS.indexOf(hour);
}

function startHour(time: string): number {
  return parseInt(time.slice(0, 2), 10);
}

function endHour(time: string): number {
  const h = parseInt(time.slice(0, 2), 10);
  return h === 0 ? 24 : h;
}

function slotSpan(startTime: string, endTime: string): number {
  const s = startHour(startTime);
  const e = endHour(endTime);
  return Math.max(1, Math.ceil((e - s) / 2));
}

export default async function SchedulePage() {
  const supabase = await createServerSupabaseClient();
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 6);

  const { data: events } = await supabase
    .from("schedule")
    .select("*")
    .gte("date", format(today, "yyyy-MM-dd"))
    .lte("date", format(weekEnd, "yyyy-MM-dd"))
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  // Also fetch all for the list view below
  const { data: allEvents } = await supabase
    .from("schedule")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Build a lookup: date → hour → events[]
  const lookup: Record<string, Record<number, any[]>> = {};
  for (const event of events || []) {
    const h = startHour(event.start_time);
    if (!lookup[event.date]) lookup[event.date] = {};
    if (!lookup[event.date][h]) lookup[event.date][h] = [];
    lookup[event.date][h].push(event);
  }

  // Grouped for the list below
  const grouped = (allEvents || []).reduce((acc: Record<string, any[]>, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  return (
    <main className="content-page" style={{ maxWidth: "1200px" }}>
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Schedule</h1>

      {/* ── TV Guide Grid — hidden on mobile ── */}
      <div className="tvguide-wrap">
        <p className="tvguide-label">This Week</p>
        <div className="tvguide-grid">
          {/* Corner cell */}
          <div className="tvguide-corner" />

          {/* Day headers */}
          {days.map((day) => (
            <div key={day.toISOString()} className="tvguide-day-header">
              <span className="tvguide-day-name">{format(day, "EEE")}</span>
              <span className="tvguide-day-date">{format(day, "d MMM")}</span>
            </div>
          ))}

          {/* Time slot rows */}
          {TIME_SLOTS.map((hour) => (
            <>
              {/* Time label */}
              <div key={`time-${hour}`} className="tvguide-time-label">
                {String(hour).padStart(2, "0")}:00
              </div>

              {/* Day cells */}
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const cellEvents = lookup[dateStr]?.[hour] ?? [];

                return (
                  <div key={`${dateStr}-${hour}`} className="tvguide-cell">
                    {cellEvents.map((event) => {
                      const color =
                        GENRE_COLORS[event.genre] ?? GENRE_COLORS.Other;
                      const span = slotSpan(event.start_time, event.end_time);
                      return (
                        <div
                          key={event.id}
                          className="tvguide-show"
                          style={{
                            background: color,
                            gridRowEnd: `span ${span}`,
                          }}
                        >
                          <span className="tvguide-show-name">
                            {event.dj_name}
                          </span>
                          <span className="tvguide-show-time">
                            {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Genre legend */}
        <div className="tvguide-legend">
          {Object.entries(GENRE_COLORS).map(([genre, color]) => (
            <div key={genre} className="tvguide-legend-item">
              <span className="tvguide-legend-dot" style={{ background: color }} />
              <span className="tvguide-legend-label">{genre}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full schedule list ── */}
      <div style={{ marginTop: "3rem" }}>
        <p className="label-section-label" style={{ marginBottom: "1.5rem" }}>Full Schedule</p>
        {Object.keys(grouped).length === 0 ? (
          <div className="empty-state">No events scheduled</div>
        ) : (
          Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <h2 className="schedule-date-label">
                {format(parseISO(date + "T00:00:00"), "EEEE d MMMM yyyy")}
              </h2>
              <div className="schedule-card">
                {dayEvents.map((event) => (
                  <div key={event.id} className="schedule-event-row">
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <p className="schedule-dj-name">{event.dj_name}</p>
                        {event.genre && (
                          <span
                            className="schedule-genre-tag"
                            style={{
                              color: GENRE_COLORS[event.genre] ?? "var(--accent)",
                              background: `${GENRE_COLORS[event.genre] ?? "#e63030"}18`,
                              borderColor: `${GENRE_COLORS[event.genre] ?? "#e63030"}40`,
                            }}
                          >
                            {event.genre}
                          </span>
                        )}
                        {event.is_recurring && (
                          <span className="schedule-recurring-badge">recurring</span>
                        )}
                      </div>
                      {event.stage && (
                        <p className="schedule-stage">{event.stage}</p>
                      )}
                      {event.description && (
                        <p className="schedule-description">{event.description}</p>
                      )}
                    </div>
                    <span className="schedule-time">
                      {event.start_time.slice(0, 5)} — {event.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
