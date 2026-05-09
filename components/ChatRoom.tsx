"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const PROFANITY_LIST = ["badword1", "badword2"]; // extend this list as needed

interface Message {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem("chat_display_name");
    if (stored) setDisplayName(stored);
  }, []);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("chat")
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
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  }

  function joinChat() {
    if (!nameInput.trim()) return;
    localStorage.setItem("chat_display_name", nameInput.trim());
    setDisplayName(nameInput.trim());
  }

  async function sendMessage() {
    setError("");
    const now = Date.now();
    if (now - lastSent < 2000) {
      setError("Please wait before sending another message.");
      return;
    }
    if (!newMessage.trim()) return;
    if (newMessage.length > 200) {
      setError("Message too long (max 200 characters).");
      return;
    }
    const lower = newMessage.toLowerCase();
    if (PROFANITY_LIST.some((word) => lower.includes(word))) {
      setError("Your message contains inappropriate language.");
      return;
    }
    setLastSent(now);
    await supabase.from("chat_messages").insert({
      display_name: displayName,
      message: newMessage.trim(),
    });
    setNewMessage("");
  }

  if (!displayName) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#aaa", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Enter a name to join the chat
        </p>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && joinChat()}
          placeholder="Your display name"
          maxLength={30}
          style={inputStyle}
        />
        <button onClick={joinChat} style={buttonStyle}>
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
        {messages.length === 0 && (
          <p style={{ color: "#555", fontSize: "0.85rem", textAlign: "center", marginTop: "2rem" }}>
            Be the first to say something...
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: "0.75rem" }}>
            <span style={{ color: "#e63030", fontWeight: 600, fontSize: "0.85rem" }}>
              {msg.display_name}
            </span>
            <span style={{ color: "#555", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
            </span>
            <p style={{ color: "#ddd", fontSize: "0.9rem", marginTop: "0.2rem" }}>
              {msg.message}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {error && (
        <p style={{ color: "#e63030", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say something..."
          maxLength={200}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={sendMessage} style={buttonStyle}>
          Send
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1rem",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  minHeight: "400px",
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#fff",
  padding: "0.5rem 0.75rem",
  fontSize: "0.9rem",
  width: "100%",
  marginBottom: "0.5rem",
};

const buttonStyle: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
};