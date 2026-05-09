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
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "2rem",
          letterSpacing: "0.05em",
        }}
      >
        Schedule
      </h1>

      {Object.keys(grouped).length === 0 ? (
        <div
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "3rem",
            textAlign: "center",
            color: "#555",
          }}
        >
          No events scheduled
        </div>
      ) : (
        Object.entries(grouped).map(([date, events]) => (
          <div key={date} style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#e63030",
                marginBottom: "1rem",
              }}
            >
              {format(new Date(date + "T00:00:00"), "EEEE d MMMM yyyy")}
            </h2>
            <div
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {events.map((event, i) => (
                <div
                  key={event.id}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom:
                      i < events.length - 1 ? "1px solid #1a1a1a" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {event.dj_name}
                    </p>
                    {event.stage && (
                      <p style={{ color: "#555", fontSize: "0.8rem" }}>
                        {event.stage}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      color: "#e63030",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      whiteSpace: "nowrap",
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