"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const PROFANITY_LIST = ["badword1", "badword2"];

interface Message {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export default function ChatRoom() {
  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("chat_display_name");
    if (stored) setDisplayName(stored);
  }, []);

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

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (displayName) inputRef.current?.focus();
  }, [displayName]);

  async function checkBanned(name: string): Promise<boolean> {
    const { data } = await supabase
      .from("banned_users")
      .select("id")
      .eq("display_name", name)
      .maybeSingle();
    return !!data;
  }

  async function joinChat() {
    const name = nameInput.trim();
    if (!name) return;
    const banned = await checkBanned(name);
    if (banned) {
      setIsBanned(true);
      setDisplayName(name);
      localStorage.setItem("chat_display_name", name);
      return;
    }
    localStorage.setItem("chat_display_name", name);
    setDisplayName(name);
  }

  async function sendMessage() {
    setError("");
    const now = Date.now();
    if (now - lastSent < 2000) {
      setError("Wait a moment before sending again.");
      return;
    }
    const text = newMessage.trim();
    if (!text) return;
    if (text.length > 200) {
      setError("Max 200 characters.");
      return;
    }
    const lower = text.toLowerCase();
    if (PROFANITY_LIST.some((w) => lower.includes(w))) {
      setError("Message contains inappropriate language.");
      return;
    }

    setSending(true);
    setLastSent(now);
    const { error: insertError } = await supabase
      .from("chat_messages")
      .insert({ display_name: displayName, message: text });
    setSending(false);

    if (insertError) {
      setError("Could not send. Please try again.");
    } else {
      setNewMessage("");
    }
  }

  if (!displayName) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-dot" />
          <span className="chat-header-label">Live Chat</span>
        </div>
        <div className="chat-join">
          <p className="chat-join-label">Enter a name to join the chat</p>
          <input
            className="chat-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinChat()}
            placeholder="Your display name"
            maxLength={30}
            autoFocus
          />
          <button className="chat-btn" onClick={joinChat}>
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-dot" />
          <span className="chat-header-label">Live Chat</span>
        </div>
        <div className="chat-join">
          <p className="chat-join-label" style={{ color: "#e63030" }}>
            You have been banned from the chat.
          </p>
          <p style={{ fontSize: "0.78rem", color: "#555" }}>
            Contact us if you think this was a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-dot" />
        <span className="chat-header-label">Live Chat</span>
        <span className="chat-header-user">{displayName}</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Be the first to say something…</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            <div className="chat-message-meta">
              <span className="chat-sender">{msg.display_name}</span>
              <span className="chat-timestamp">
                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="chat-text">{msg.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        {error && <p className="chat-error">{error}</p>}
        <div className="chat-input-wrap">
          <input
            ref={inputRef}
            className="chat-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
            placeholder="Say something…"
            maxLength={200}
            disabled={sending}
            style={{ opacity: sending ? 0.6 : 1 }}
          />
          <button className="chat-btn" onClick={sendMessage} disabled={sending}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
