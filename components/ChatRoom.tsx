"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const PROFANITY_LIST = ["badword1", "badword2"]; // extend as needed

interface Message {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export default function ChatRoom() {
  // Single stable client instance — avoids creating a new client on every render
  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore saved name from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("chat_display_name");
    if (stored) setDisplayName(stored);
  }, []);

  // Fetch history + subscribe to realtime inserts
  useEffect(() => {
    async function fetchMessages() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data);
    }

    fetchMessages();

    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => [...prev.slice(-99), payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus message input after joining
  useEffect(() => {
    if (displayName) {
      inputRef.current?.focus();
    }
  }, [displayName]);

  function joinChat() {
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem("chat_display_name", name);
    setDisplayName(name);
  }

  async function sendMessage() {
    setError("");
    const now = Date.now();
    if (now - lastSent < 2000) {
      setError("Please wait a moment before sending again.");
      return;
    }
    const text = newMessage.trim();
    if (!text) return;
    if (text.length > 200) {
      setError("Message too long (max 200 characters).");
      return;
    }
    const lower = text.toLowerCase();
    if (PROFANITY_LIST.some((w) => lower.includes(w))) {
      setError("Your message contains inappropriate language.");
      return;
    }

    setSending(true);
    setLastSent(now);
    const { error: insertError } = await supabase.from("chat_messages").insert({
      display_name: displayName,
      message: text,
    });
    setSending(false);

    if (insertError) {
      setError("Could not send message. Please try again.");
    } else {
      setNewMessage("");
    }
  }

  // ── Join screen ────────────────────────────────────────
  if (!displayName) {
    return (
      <div className="chat-container">
        <div className="chat-header-bar">
          <div className="chat-live-dot" />
          <span className="chat-header-title">Live Chat</span>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.875rem" }}>
            Enter a name to join the chat
          </p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinChat()}
            placeholder="Your display name"
            maxLength={30}
            autoFocus
            style={inputStyle}
          />
          <button onClick={joinChat} style={buttonStyle}>
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  // ── Chat screen ────────────────────────────────────────
  return (
    <div className="chat-container">
      <div className="chat-header-bar">
        <div className="chat-live-dot" />
        <span className="chat-header-title">Live Chat</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
          }}
        >
          {displayName}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {messages.length === 0 && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.82rem",
              textAlign: "center",
              marginTop: "2rem",
            }}
          >
            Be the first to say something…
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: "1rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.5rem",
                marginBottom: "0.2rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "var(--accent)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  letterSpacing: "0.03em",
                }}
              >
                {msg.display_name}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
              </span>
            </div>
            <p style={{ color: "#ccc", fontSize: "0.875rem", lineHeight: 1.5 }}>
              {msg.message}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: "0.75rem 1rem",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {error && (
          <p style={{ color: "var(--accent)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
            placeholder="Say something…"
            maxLength={200}
            disabled={sending}
            style={{ ...inputStyle, flex: 1, marginBottom: 0, opacity: sending ? 0.6 : 1 }}
          />
          <button onClick={sendMessage} disabled={sending} style={buttonStyle}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#161616",
  border: "1px solid #2a2a2a",
  borderRadius: "5px",
  color: "#fff",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  width: "100%",
  marginBottom: "0.5rem",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.82rem",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
  boxShadow: "0 0 10px rgba(230,48,48,0.3)",
  flexShrink: 0,
};
