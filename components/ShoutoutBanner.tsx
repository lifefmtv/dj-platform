"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MSG = "Send a shoutout and it will appear here for everyone to see 📢";

interface Shoutout {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

function isFresh(s: Shoutout): boolean {
  return Date.now() - new Date(s.created_at).getTime() < EXPIRY_MS;
}

export default function ShoutoutBanner() {
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    try { const n = localStorage.getItem("chat_display_name"); if (n) setName(n); } catch {}

    loadRecent();

    // Prune expired shoutouts from state every 60s
    const cleanup = setInterval(() => {
      setShoutouts((prev) => prev.filter(isFresh));
    }, 60_000);

    const channel = supabase
      .channel("shoutouts-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shoutouts" },
        (payload) => {
          if (payload.new.is_approved) {
            const s: Shoutout = {
              id: payload.new.id,
              display_name: payload.new.display_name,
              message: payload.new.message,
              created_at: payload.new.created_at,
            };
            if (isFresh(s)) {
              setShoutouts((prev) => [...prev.slice(-20), s]);
              setFlash(true);
              setTimeout(() => setFlash(false), 600);
            }
          }
        }
      )
      .subscribe();

    return () => { clearInterval(cleanup); supabase.removeChannel(channel); };
  }, []);

  async function loadRecent() {
    const since = new Date(Date.now() - EXPIRY_MS).toISOString();
    const { data } = await supabase
      .from("shoutouts")
      .select("id, display_name, message, created_at")
      .eq("is_approved", true)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(20);
    if (data) setShoutouts(data.filter(isFresh));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !msg.trim() || sending) return;
    setSending(true);
    await supabase.from("shoutouts").insert({
      display_name: name.trim().slice(0, 20),
      message: msg.trim().slice(0, 50),
      is_approved: true,
    });
    try { localStorage.setItem("chat_display_name", name.trim()); } catch {}
    setMsg("");
    setSending(false);
  }

  const fresh = shoutouts.filter(isFresh);

  return (
    <div className={`shoutout-section${flash ? " shoutout-section--flash" : ""}`}>
      {/* Always-visible inline form */}
      <div className="shoutout-form-row">
        <span className="shoutout-strip-label">SHOUTOUTS</span>
        <form className="shoutout-inline-form" onSubmit={handleSend}>
          <input
            className="shoutout-input shoutout-input--name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <input
            className="shoutout-input shoutout-input--msg"
            placeholder="Send a shoutout… (50 chars max)"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            maxLength={50}
          />
          <button type="submit" className="shoutout-send-btn" disabled={sending}>
            {sending ? "Sending…" : "📢 SHOUT"}
          </button>
        </form>
      </div>

      {/* Ticker — recent shoutouts or default prompt */}
      <div className="shoutout-ticker-track">
        {fresh.length > 0 ? (
          <div className="shoutout-ticker-inner">
            {[...fresh, ...fresh].map((s, i) => (
              <span key={`${s.id}-${i}`} className="shoutout-item">
                <span className="shoutout-name">{s.display_name}</span>
                <span className="shoutout-msg">{s.message}</span>
                <span className="shoutout-dot" aria-hidden>·</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="shoutout-default">{DEFAULT_MSG}</span>
        )}
      </div>
    </div>
  );
}
