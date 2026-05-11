"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Shoutout {
  id: string;
  display_name: string;
  message: string;
}

export default function ShoutoutBanner() {
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    try { const n = localStorage.getItem("chat_display_name"); if (n) setName(n); } catch {}

    loadRecent();

    const channel = supabase
      .channel("shoutouts-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shoutouts" },
        (payload) => {
          if (payload.new.is_approved) {
            setShoutouts((prev) => [
              ...prev.slice(-20),
              { id: payload.new.id, display_name: payload.new.display_name, message: payload.new.message },
            ]);
            setFlash(true);
            setTimeout(() => setFlash(false), 600);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadRecent() {
    const { data } = await supabase
      .from("shoutouts")
      .select("id, display_name, message")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(15);
    if (data) setShoutouts(data.reverse());
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !msg.trim() || sending) return;
    setSending(true);
    await supabase.from("shoutouts").insert({
      display_name: name.trim().slice(0, 30),
      message: msg.trim().slice(0, 50),
      is_approved: true,
    });
    try { localStorage.setItem("chat_display_name", name.trim()); } catch {}
    setMsg("");
    setSending(false);
    setFormOpen(false);
  }

  const tickerItems = shoutouts.length > 0
    ? [...shoutouts, ...shoutouts]
    : null;

  return (
    <div className={`shoutout-section${flash ? " shoutout-section--flash" : ""}`}>
      {/* Form slides up from the strip */}
      {formOpen && (
        <form className="shoutout-form" onSubmit={handleSend}>
          <input
            className="shoutout-input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <input
            className="shoutout-input shoutout-input--msg"
            placeholder="Send a shoutout… (50 chars max)"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            maxLength={50}
          />
          <div className="shoutout-form-actions">
            <button type="submit" className="shoutout-send-btn" disabled={sending}>
              {sending ? "Sending…" : "Send 🙌"}
            </button>
            <button type="button" className="shoutout-cancel-btn" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <span className="shoutout-strip-label">SHOUTOUTS</span>

      {tickerItems ? (
        <div className="shoutout-ticker-track">
          <div className="shoutout-ticker-inner">
            {tickerItems.map((s, i) => (
              <span key={`${s.id}-${i}`} className="shoutout-item">
                <span className="shoutout-name">{s.display_name}</span>
                <span className="shoutout-msg">{s.message}</span>
                <span className="shoutout-dot" aria-hidden>·</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <span className="shoutout-empty">Be the first to send a shoutout!</span>
      )}

      <button
        className="shoutout-trigger"
        onClick={() => setFormOpen((o) => !o)}
        aria-label="Send a shoutout"
      >
        📢 SHOUT OUT
      </button>
    </div>
  );
}
