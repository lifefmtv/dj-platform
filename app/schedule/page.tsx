export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { format } from "date-fns";

export default async function SchedulePage() {
  const supabase = await createServerSupabaseClient();
  const { data: events } = await supabase
    .from("schedule")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  const grouped = (events || []).reduce((acc: Record<string, any[]>, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Schedule</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">No events scheduled</div>
      ) : (
        Object.entries(grouped).map(([date, dayEvents]) => (
          <div key={date}>
            <h2 className="schedule-date-label">
              {format(new Date(date + "T00:00:00"), "EEEE d MMMM yyyy")}
            </h2>
            <div className="schedule-card">
              {dayEvents.map((event) => (
                <div key={event.id} className="schedule-event-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <p className="schedule-dj-name">{event.dj_name}</p>
                      {event.genre && <span className="schedule-genre-tag">{event.genre}</span>}
                      {event.is_recurring && <span className="schedule-recurring-badge">recurring</span>}
                    </div>
                    {event.stage && <p className="schedule-stage">{event.stage}</p>}
                    {event.description && <p className="schedule-description">{event.description}</p>}
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
    </main>
  );
}
