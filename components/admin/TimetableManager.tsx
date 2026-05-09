"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";

interface ScheduleEntry {
  id: string;
  dj_name: string;
  stage: string | null;
  date: string;
  start_time: string;
  end_time: string;
  genre: string | null;
  is_recurring: boolean;
  template_id: string | null;
}

export default function TimetableManager() {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [djName, setDjName] = useState("");
  const [stage, setStage] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const { data } = await supabase
      .from("schedule")
      .select("id, dj_name, stage, date, start_time, end_time, genre, is_recurring, template_id")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (data) setEntries(data);
  }

  function flash(msg: string, type: "success" | "error" = "success") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3400);
  }

  async function addEntry() {
    if (!djName || !date || !startTime || !endTime) {
      flash("Please fill in all required fields.", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("schedule").insert({
      dj_name: djName.trim(),
      stage: stage.trim() || null,
      date,
      start_time: startTime,
      end_time: endTime,
      genre: genre.trim() || null,
      is_recurring: false,
    });
    setLoading(false);
    if (error) {
      flash("Error adding entry. Please try again.", "error");
    } else {
      flash(`Schedule entry added — ${djName.trim()} on ${date}.`, "success");
      setDjName("");
      setStage("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setGenre("");
      fetchEntries();
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this schedule entry?")) return;
    await supabase.from("schedule").delete().eq("id", id);
    fetchEntries();
  }

  return (
    <div>
      <h2 style={sectionTitle}>DJ Timetable — One-off Shows</h2>

      {/* Add form */}
      <div style={formCard}>
        <div style={formGrid}>
          <div>
            <label style={labelStyle}>DJ Name *</label>
            <input
              value={djName}
              onChange={(e) => setDjName(e.target.value)}
              placeholder="DJ Name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Stage / Room</label>
            <input
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="Main Stage"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Start Time *</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>End Time *</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Genre</label>
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="DNB, Jungle…"
              style={inputStyle}
            />
          </div>
        </div>
        <button onClick={addEntry} disabled={loading} style={buttonStyle}>
          {loading ? "Adding…" : "Add to Timetable"}
        </button>
        {message && (
          <div className={`admin-banner admin-banner--${messageType}`}>
            <span className="admin-banner-icon">{messageType === "success" ? "✓" : "✕"}</span>
            <span className="admin-banner-text">{message}</span>
          </div>
        )}
      </div>

      {/* Entry list */}
      <div style={{ marginTop: "1.5rem" }}>
        {entries.length === 0 ? (
          <p style={{ color: "#555", fontSize: "0.88rem" }}>No entries yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} style={entryRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 600 }}>{entry.dj_name}</p>
                  {entry.genre && <span style={genreTag}>{entry.genre}</span>}
                  {entry.is_recurring && (
                    <span style={recurringBadge}>recurring</span>
                  )}
                </div>
                <p style={{ color: "#888", fontSize: "0.78rem", marginTop: "0.1rem" }}>
                  {format(new Date(entry.date + "T00:00:00"), "d MMM yyyy")} ·{" "}
                  {entry.start_time.slice(0, 5)} — {entry.end_time.slice(0, 5)}
                  {entry.stage && ` · ${entry.stage}`}
                </p>
              </div>
              <button onClick={() => deleteEntry(entry.id)} style={deleteButton}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  marginBottom: "1.5rem",
  color: "#fff",
};

const formCard: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1.5rem",
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
  gap: "1rem",
  marginBottom: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  color: "#888",
  marginBottom: "0.35rem",
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#fff",
  padding: "0.5rem 0.75rem",
  fontSize: "0.88rem",
  width: "100%",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "0.6rem 1.5rem",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.88rem",
};

const entryRow: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1rem 1.25rem",
  marginBottom: "0.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
};

const genreTag: React.CSSProperties = {
  fontSize: "0.62rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#e63030",
  background: "rgba(230,48,48,0.1)",
  border: "1px solid rgba(230,48,48,0.25)",
  borderRadius: "3px",
  padding: "0.1rem 0.4rem",
};

const recurringBadge: React.CSSProperties = {
  fontSize: "0.6rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#888",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "3px",
  padding: "0.1rem 0.4rem",
};

const deleteButton: React.CSSProperties = {
  background: "transparent",
  color: "#e63030",
  border: "1px solid rgba(230,48,48,0.4)",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.78rem",
  flexShrink: 0,
};
