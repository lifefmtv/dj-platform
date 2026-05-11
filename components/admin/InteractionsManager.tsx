"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  createPoll,
  endPoll,
  deleteShoutout,
  resetVibeMeter,
  clearEmojiReactions,
} from "@/app/actions/interactionActions";

interface Poll {
  id: string;
  question: string;
  options: string[];
  is_active: boolean;
  created_at: string;
}

interface PollVoteCounts {
  [optionIndex: number]: number;
}

interface Shoutout {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export default function InteractionsManager() {
  // Poll state
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pollVotes, setPollVotes] = useState<PollVoteCounts>({});
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [publishing, setPublishing] = useState(false);
  const [pollMsg, setPollMsg] = useState("");

  // Shoutout state
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    fetchActivePoll();
    fetchShoutouts();

    const channel = supabase
      .channel("admin-interactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "shoutouts" }, fetchShoutouts)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, fetchActivePoll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchActivePoll() {
    const { data } = await supabase
      .from("live_polls")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setActivePoll(data ?? null);

    if (data) {
      const { data: votes } = await supabase
        .from("poll_votes")
        .select("option_index")
        .eq("poll_id", data.id);
      if (votes) {
        const counts: PollVoteCounts = {};
        votes.forEach(({ option_index }) => {
          counts[option_index] = (counts[option_index] ?? 0) + 1;
        });
        setPollVotes(counts);
      }
    }
  }

  async function fetchShoutouts() {
    const { data } = await supabase
      .from("shoutouts")
      .select("id, display_name, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setShoutouts(data);
  }

  async function handlePublishPoll() {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) {
      setPollMsg("Need a question and at least 2 options.");
      return;
    }
    setPublishing(true);
    const result = await createPoll(question, options);
    setPublishing(false);
    if (result.ok) {
      setQuestion("");
      setOptions(["", "", "", ""]);
      setPollMsg("Poll published!");
      fetchActivePoll();
    } else {
      setPollMsg(result.error ?? "Failed to publish poll.");
    }
    setTimeout(() => setPollMsg(""), 4000);
  }

  async function handleEndPoll() {
    if (!activePoll) return;
    await endPoll(activePoll.id);
    setActivePoll(null);
    setPollVotes({});
  }

  async function handleDeleteShoutout(id: string) {
    await deleteShoutout(id);
    setShoutouts((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleResetVibe() {
    if (!confirm("Reset the Vibe Meter? This deletes all recent taps.")) return;
    await resetVibeMeter();
  }

  async function handleClearEmoji() {
    if (!confirm("Clear all emoji reactions?")) return;
    await clearEmojiReactions();
  }

  const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);

  return (
    <div style={wrap}>
      <h2 style={heading}>Stream Interactions</h2>

      {/* ── Create Poll ── */}
      <section style={card}>
        <h3 style={subheading}>Create Poll</h3>
        {activePoll ? (
          <div>
            <p style={label}>Active poll: <strong style={{ color: "#fff" }}>{activePoll.question}</strong></p>
            <div style={{ marginBottom: "1rem" }}>
              {(activePoll.options as string[]).map((opt, i) => {
                const count = pollVotes[i] ?? 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={i} style={voteRow}>
                    <span style={voteLabel}>{opt}</span>
                    <div style={voteBarTrack}>
                      <div style={{ ...voteBarFill, width: `${pct}%` }} />
                    </div>
                    <span style={voteCount}>{count} ({pct}%)</span>
                  </div>
                );
              })}
              <p style={totalLabel}>{totalVotes} total vote{totalVotes !== 1 ? "s" : ""}</p>
            </div>
            <button style={dangerBtn} onClick={handleEndPoll}>End Poll</button>
          </div>
        ) : (
          <div>
            <input
              style={inputStyle}
              placeholder="Poll question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            {options.map((opt, i) => (
              <input
                key={i}
                style={{ ...inputStyle, marginBottom: "0.5rem" }}
                placeholder={`Option ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
              />
            ))}
            {pollMsg && <p style={msgStyle}>{pollMsg}</p>}
            <button style={primaryBtn} onClick={handlePublishPoll} disabled={publishing}>
              {publishing ? "Publishing…" : "Publish Poll"}
            </button>
          </div>
        )}
      </section>

      {/* ── Shoutout Moderation ── */}
      <section style={card}>
        <h3 style={subheading}>Shoutout Moderation</h3>
        {shoutouts.length === 0 ? (
          <p style={emptyText}>No shoutouts yet.</p>
        ) : (
          shoutouts.map((s) => (
            <div key={s.id} style={shoutoutRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={shoutoutName}>{s.display_name}</span>
                <span style={shoutoutMsg}>{s.message}</span>
              </div>
              <button style={deleteBtn} onClick={() => handleDeleteShoutout(s.id)}>Delete</button>
            </div>
          ))
        )}
      </section>

      {/* ── Vibe Meter + Emoji ── */}
      <section style={card}>
        <h3 style={subheading}>Controls</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button style={warningBtn} onClick={handleResetVibe}>Reset Vibe Meter</button>
          <button style={warningBtn} onClick={handleClearEmoji}>Clear Emoji Reactions</button>
        </div>
      </section>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────

const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.5rem" };

const heading: React.CSSProperties = { fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "0.25rem" };

const subheading: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 700, color: "#ccc", marginBottom: "1rem" };

const card: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "10px",
  padding: "1.25rem 1.5rem",
};

const label: React.CSSProperties = { fontSize: "0.82rem", color: "#888", marginBottom: "0.75rem" };

const emptyText: React.CSSProperties = { fontSize: "0.82rem", color: "#555", fontStyle: "italic" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  color: "#fff",
  padding: "0.6rem 0.875rem",
  fontSize: "0.875rem",
  outline: "none",
  marginBottom: "0.75rem",
  boxSizing: "border-box",
};

const msgStyle: React.CSSProperties = { fontSize: "0.78rem", color: "#f59e0b", marginBottom: "0.75rem" };

const primaryBtn: React.CSSProperties = {
  background: "#e63030", color: "#fff", border: "none", borderRadius: "5px",
  padding: "0.55rem 1.25rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
};

const dangerBtn: React.CSSProperties = {
  background: "transparent", color: "#e63030", border: "1px solid #e63030",
  borderRadius: "5px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.82rem",
};

const warningBtn: React.CSSProperties = {
  background: "transparent", color: "#f59e0b", border: "1px solid #f59e0b",
  borderRadius: "5px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.82rem",
};

const deleteBtn: React.CSSProperties = {
  background: "transparent", color: "#e63030", border: "1px solid #e63030",
  borderRadius: "4px", padding: "0.25rem 0.65rem", cursor: "pointer", fontSize: "0.75rem",
  flexShrink: 0,
};

const shoutoutRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.75rem",
  padding: "0.6rem 0", borderBottom: "1px solid #1a1a1a",
};

const shoutoutName: React.CSSProperties = {
  color: "#e63030", fontWeight: 700, fontSize: "0.82rem", marginRight: "0.4rem",
};

const shoutoutMsg: React.CSSProperties = { color: "#ccc", fontSize: "0.82rem" };

const voteRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem",
};

const voteLabel: React.CSSProperties = { color: "#ccc", fontSize: "0.82rem", width: "120px", flexShrink: 0 };

const voteBarTrack: React.CSSProperties = {
  flex: 1, height: "8px", background: "#222", borderRadius: "4px", overflow: "hidden",
};

const voteBarFill: React.CSSProperties = {
  height: "100%", background: "#e63030", borderRadius: "4px",
  transition: "width 0.4s ease",
};

const voteCount: React.CSSProperties = { color: "#888", fontSize: "0.75rem", width: "72px", textAlign: "right", flexShrink: 0 };

const totalLabel: React.CSSProperties = { fontSize: "0.72rem", color: "#555", marginTop: "0.5rem" };
