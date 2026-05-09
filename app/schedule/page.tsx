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
    const date = event.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  return (
    <main style={{ padding: "2.5rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/" className="back-link">
        ← Home
      </a>

      <h1 className="page-heading">Schedule</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">No events scheduled</div>
      ) : (
        Object.entries(grouped).map(([date, events]) => (
          <div key={date} style={{ marginBottom: "2rem" }}>
            <h2 className="schedule-date-label">
              {format(new Date(date + "T00:00:00"), "EEEE d MMMM yyyy")}
            </h2>
            <div className="schedule-card">
              {events.map((event) => (
                <div key={event.id} className="schedule-event-row">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.2rem" }}>
                      {event.dj_name}
                    </p>
                    {event.stage && (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", letterSpacing: "0.05em" }}>
                        {event.stage}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      color: "var(--accent)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "0.04em",
                      textShadow: "0 0 12px rgba(230,48,48,0.35)",
                    }}
                  >
                    {event.start_time.slice(0, 5)} — {event.end_time.slice(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  );
}
