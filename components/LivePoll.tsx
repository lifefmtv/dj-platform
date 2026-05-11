"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Poll {
  id: string;
  question: string;
  options: string[];
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem("lifefm_poll_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("lifefm_poll_sid", id);
    }
    return id;
  } catch {
    return "fallback";
  }
}

export default function LivePoll() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<number[]>([]);
  const [voted, setVoted] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    loadPoll();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  async function loadPoll() {
    const { data } = await supabase
      .from("live_polls")
      .select("id, question, options")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) { setPoll(null); setVisible(false); return; }

    const options = data.options as string[];
    setPoll({ id: data.id, question: data.question, options });
    await loadVotes(data.id, options.length);

    // Check if already voted
    const sid = getSessionId();
    const { data: mine } = await supabase
      .from("poll_votes")
      .select("option_index")
      .eq("poll_id", data.id)
      .eq("session_id", sid)
      .maybeSingle();
    if (mine) setVoted(mine.option_index);

    // Slide in
    setTimeout(() => setVisible(true), 80);

    // Subscribe to new votes
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`poll-votes-${data.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "poll_votes", filter: `poll_id=eq.${data.id}` },
        () => loadVotes(data.id, options.length)
      )
      .subscribe();
  }

  async function loadVotes(pollId: string, optionCount: number) {
    const { data } = await supabase
      .from("poll_votes")
      .select("option_index")
      .eq("poll_id", pollId);
    if (!data) return;
    const counts = Array<number>(optionCount).fill(0);
    data.forEach(({ option_index }) => {
      if (option_index >= 0 && option_index < optionCount) counts[option_index]++;
    });
    setVotes(counts);
  }

  async function vote(i: number) {
    if (!poll || voted !== null) return;
    const sid = getSessionId();
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: poll.id,
      option_index: i,
      session_id: sid,
    });
    if (!error) setVoted(i);
  }

  if (!poll) return null;

  const total = votes.reduce((a, b) => a + b, 0);

  return (
    <div
      className={`live-poll${visible ? " live-poll--visible" : ""}`}
      style={{ pointerEvents: "auto" }}
    >
      <p className="live-poll-eyebrow">Live Poll</p>
      <p className="live-poll-q">{poll.question}</p>
      <div className="live-poll-options">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0;
          return (
            <button
              key={i}
              className={[
                "live-poll-opt",
                voted !== null && "live-poll-opt--results",
                voted === i && "live-poll-opt--mine",
              ].filter(Boolean).join(" ")}
              onClick={() => vote(i)}
              disabled={voted !== null}
            >
              <div className="live-poll-opt-inner">
                <span className="live-poll-opt-text">{opt}</span>
                {voted !== null && <span className="live-poll-pct">{pct}%</span>}
              </div>
              {voted !== null && (
                <div className="live-poll-bar" style={{ width: `${pct}%` }} />
              )}
            </button>
          );
        })}
      </div>
      {total > 0 && (
        <p className="live-poll-total">{total} vote{total !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
