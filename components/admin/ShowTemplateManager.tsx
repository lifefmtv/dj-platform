"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { addDays, format } from "date-fns";

interface ShowTemplate {
  id: string;
  dj_name: string;
  stage: string | null;
  start_time: string;
  end_time: string;
  genre: string | null;
  description: string | null;
  recurrence_type: "weekly" | "monthly_day";
  recurrence_day: number;
  recurrence_week: number | null;
  is_active: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", [-1]: "Last" };

function describeRecurrence(t: ShowTemplate): string {
  const day = DAYS[t.recurrence_day];
  const time = `${t.start_time.slice(0, 5)} – ${t.end_time.slice(0, 5)}`;
  if (t.recurrence_type === "weekly") return `Every ${day} · ${time}`;
  const weekLabel =
    t.recurrence_week != null ? `${WEEK_LABELS[t.recurrence_week]} ${day}` : `Every ${day}`;
  return `${weekLabel} of each month · ${time}`;
}

function matchesTemplate(date: Date, t: ShowTemplate): boolean {
  if (date.getDay() !== t.recurrence_day) return false;
  if (t.recurrence_type === "weekly") return true;

  const dom = date.getDate();
  if (t.recurrence_week === null) return true;

  if (t.recurrence_week === -1) {
    // Last occurrence: no same-weekday in the rest of this month
    const next = new Date(date);
    next.setDate(dom + 7);
    return next.getMonth() !== date.getMonth();
  }

  return Math.ceil(dom / 7) === t.recurrence_week;
}

export default function ShowTemplateManager() {
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<ShowTemplate[]>([]);

  // Form state
  const [djName, setDjName] = useState("");
  const [stage, setStage] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "monthly_day">("weekly");
  const [recurrenceDay, setRecurrenceDay] = useState(5); // Friday
  const [recurrenceWeek, setRecurrenceWeek] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [weeksAhead, setWeeksAhead] = useState(4);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const { data } = await supabase
      .from("show_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTemplates(data);
  }

  function flash(msg: string, type: "success" | "error" = "success") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3400);
  }

  async function saveTemplate() {
    if (!djName.trim() || !startTime || !endTime) {
      flash("DJ name, start time and end time are required.", "error");
      return;
    }
    const savedName = djName.trim();
    setSaving(true);
    const { error } = await supabase.from("show_templates").insert({
      dj_name: savedName,
      stage: stage.trim() || null,
      start_time: startTime,
      end_time: endTime,
      genre: genre.trim() || null,
      description: description.trim() || null,
      recurrence_type: recurrenceType,
      recurrence_day: recurrenceDay,
      recurrence_week: recurrenceType === "monthly_day" ? recurrenceWeek : null,
    });
    setSaving(false);
    if (error) {
      flash("Error saving template. Please try again.", "error");
    } else {
      flash(`Template saved — ${savedName} added to recurring shows.`, "success");
      setDjName("");
      setStage("");
      setStartTime("");
      setEndTime("");
      setGenre("");
      setDescription("");
      fetchTemplates();
    }
  }

  async function toggleActive(t: ShowTemplate) {
    await supabase
      .from("show_templates")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    fetchTemplates();
  }

  async function deleteTemplate(id: string) {
    if (
      !confirm(
        "Delete this template? Already-generated schedule entries will not be removed."
      )
    )
      return;
    await supabase.from("show_templates").delete().eq("id", id);
    fetchTemplates();
  }

  async function generateFromTemplate(t: ShowTemplate) {
    setGeneratingId(t.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = addDays(today, weeksAhead * 7);

    let cursor = new Date(today);
    let created = 0;
    let skipped = 0;

    while (cursor <= end) {
      if (matchesTemplate(cursor, t)) {
        const dateStr = format(cursor, "yyyy-MM-dd");

        // Avoid duplicates: check by template_id + date
        const { data: existing } = await supabase
          .from("schedule")
          .select("id")
          .eq("date", dateStr)
          .eq("template_id", t.id)
          .maybeSingle();

        if (existing) {
          skipped++;
        } else {
          const { error } = await supabase.from("schedule").insert({
            dj_name: t.dj_name,
            stage: t.stage,
            date: dateStr,
            start_time: t.start_time,
            end_time: t.end_time,
            genre: t.genre,
            description: t.description,
            is_recurring: true,
            template_id: t.id,
          });
          if (!error) created++;
        }
      }
      cursor = addDays(cursor, 1);
    }

    setGeneratingId(null);
    const weekLabel = `${weeksAhead} ${weeksAhead === 1 ? "week" : "weeks"}`;
    const showLabel = `${created} ${created === 1 ? "show" : "shows"}`;
    const skipNote = skipped > 0 ? ` (${skipped} already existed, skipped)` : "";
    flash(`${showLabel} added to schedule for the next ${weekLabel}${skipNote}.`, "success");
  }

  return (
    <div>
      <h2 style={sectionTitle}>Recurring Show Templates</h2>

      {/* Create form */}
      <div style={formCard}>
        <p style={{ color: "#666", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
          Define a repeating show, then use Generate to push instances into the schedule.
        </p>

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
              placeholder="DNB, Tech House…"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Repeats</label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value as "weekly" | "monthly_day")}
              style={inputStyle}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly_day">Monthly (by weekday)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Day of Week</label>
            <select
              value={recurrenceDay}
              onChange={(e) => setRecurrenceDay(Number(e.target.value))}
              style={inputStyle}
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {recurrenceType === "monthly_day" && (
            <div>
              <label style={labelStyle}>Which Week</label>
              <select
                value={recurrenceWeek ?? ""}
                onChange={(e) =>
                  setRecurrenceWeek(e.target.value === "" ? null : Number(e.target.value))
                }
                style={inputStyle}
              >
                <option value="">Every week</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
                <option value="-1">Last</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ marginTop: "0.75rem" }}>
          <label style={labelStyle}>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description shown on the public schedule…"
            style={{ ...inputStyle, height: "72px", resize: "vertical" } as React.CSSProperties}
          />
        </div>

        <button onClick={saveTemplate} disabled={saving} style={{ ...buttonStyle, marginTop: "1rem" }}>
          {saving ? "Saving…" : "Save Template"}
        </button>
        {message && (
          <div className={`admin-banner admin-banner--${messageType}`}>
            <span className="admin-banner-icon">{messageType === "success" ? "✓" : "✕"}</span>
            <span className="admin-banner-text">{message}</span>
          </div>
        )}
      </div>

      {/* Template list */}
      {templates.length > 0 && (
        <div style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <label style={{ ...labelStyle, margin: 0 }}>Generate for next</label>
            <input
              type="number"
              min={1}
              max={52}
              value={weeksAhead}
              onChange={(e) => setWeeksAhead(Math.max(1, Number(e.target.value)))}
              style={{ ...inputStyle, width: "64px" }}
            />
            <label style={{ ...labelStyle, margin: 0 }}>weeks</label>
          </div>

          {templates.map((t) => (
            <div key={t.id} style={{ ...entryRow, opacity: t.is_active ? 1 : 0.45 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 600 }}>{t.dj_name}</p>
                  {t.genre && <span style={genreTag}>{t.genre}</span>}
                  {!t.is_active && (
                    <span style={{ fontSize: "0.7rem", color: "#555" }}>inactive</span>
                  )}
                </div>
                <p style={{ color: "#888", fontSize: "0.78rem", marginTop: "0.15rem" }}>
                  {describeRecurrence(t)}
                </p>
                {t.stage && (
                  <p style={{ color: "#555", fontSize: "0.72rem" }}>{t.stage}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  onClick={() => generateFromTemplate(t)}
                  disabled={generatingId === t.id || !t.is_active}
                  style={generateButton}
                >
                  {generatingId === t.id ? "Generating…" : "Generate"}
                </button>
                <button onClick={() => toggleActive(t)} style={toggleButton}>
                  {t.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteTemplate(t.id)} style={deleteButton}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {templates.length === 0 && (
        <p style={{ color: "#555", fontSize: "0.85rem", marginTop: "1rem" }}>
          No templates yet.
        </p>
      )}
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
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#e63030",
  background: "rgba(230,48,48,0.1)",
  border: "1px solid rgba(230,48,48,0.25)",
  borderRadius: "3px",
  padding: "0.1rem 0.4rem",
};

const generateButton: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.78rem",
  fontWeight: 600,
};

const toggleButton: React.CSSProperties = {
  background: "transparent",
  color: "#888",
  border: "1px solid #333",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.78rem",
};

const deleteButton: React.CSSProperties = {
  background: "transparent",
  color: "#e63030",
  border: "1px solid rgba(230,48,48,0.4)",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.78rem",
};
