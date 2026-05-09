"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";

interface ScheduleEntry {
  id: string;
  dj_name: string;
  stage: string;
  date: string;
  start_time: string;
  end_time: string;
}

export default function TimetableManager() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [djName, setDjName] = useState("");
  const [stage, setStage] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const { data } = await supabase
      .from("schedule")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (data) setEntries(data);
  }

  async function addEntry() {
    if (!djName || !date || !startTime || !endTime) {
      setMessage("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("schedule").insert({
      dj_name: djName,
      stage,
      date,
      start_time: startTime,
      end_time: endTime,
    });
    if (error) {
      setMessage("Error adding entry.");
    } else {
      setMessage("Entry added successfully.");
      setDjName("");
      setStage("");
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchEntries();
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("schedule").delete().eq("id", id);
    fetchEntries();
  }

  return (
    <div>
      <h2 style={sectionTitle}>DJ Timetable</h2>

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
        </div>
        <button onClick={addEntry} disabled={loading} style={buttonStyle}>
          {loading ? "Adding..." : "Add to Timetable"}
        </button>
        {message && (
          <p style={{ color: "#e63030", marginTop: "0.5rem", fontSize: "0.85rem" }}>
            {message}
          </p>
        )}
      </div>

      {/* Entries list */}
      <div style={{ marginTop: "1.5rem" }}>
        {entries.length === 0 ? (
          <p style={{ color: "#555", fontSize: "0.9rem" }}>No entries yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} style={entryRow}>
              <div>
                <p style={{ fontWeight: 600 }}>{entry.dj_name}</p>
                <p style={{ color: "#aaa", fontSize: "0.8rem" }}>
                  {format(new Date(entry.date + "T00:00:00"), "d MMM yyyy")} •{" "}
                  {entry.start_time.slice(0, 5)} — {entry.end_time.slice(0, 5)}
                  {entry.stage && ` • ${entry.stage}`}
                </p>
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                style={deleteButton}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "1rem",
  marginBottom: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  color: "#aaa",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#fff",
  padding: "0.5rem 0.75rem",
  fontSize: "0.9rem",
  width: "100%",
};

const buttonStyle: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "0.6rem 1.5rem",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
};

const entryRow: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1rem 1.5rem",
  marginBottom: "0.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const deleteButton: React.CSSProperties = {
  background: "transparent",
  color: "#e63030",
  border: "1px solid #e63030",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.8rem",
};