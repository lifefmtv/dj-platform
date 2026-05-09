"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export default function ChatModeration() {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("admin-chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setMessages(data);
  }

  async function deleteMessage(id: string) {
    if (!confirm("Delete this message?")) return;
    await supabase.from("chat_messages").delete().eq("id", id);
    fetchMessages();
  }

  async function clearAll() {
    if (!confirm("Are you sure you want to clear ALL chat messages? This cannot be undone.")) return;
    await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    fetchMessages();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={sectionTitle}>Chat Moderation</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={fetchMessages} style={refreshButton}>
            ↻ Refresh
          </button>
          <button onClick={clearAll} style={clearButton}>
            Clear All Messages
          </button>
        </div>
      </div>

      {messages.length === 0 ? (
        <p style={{ color: "#555", fontSize: "0.9rem" }}>No messages yet.</p>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} style={messageRow}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                <span style={{ color: "#e63030", fontWeight: 600, fontSize: "0.85rem" }}>
                  {msg.display_name}
                </span>
                <span style={{ color: "#555", fontSize: "0.75rem" }}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </div>
              <p style={{ color: "#ddd", fontSize: "0.9rem" }}>{msg.message}</p>
            </div>
            <button onClick={() => deleteMessage(msg.id)} style={deleteButton}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#fff",
};

const messageRow: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1rem 1.5rem",
  marginBottom: "0.5rem",
  display: "flex",
  alignItems: "flex-start",
  gap: "1rem",
};

const deleteButton: React.CSSProperties = {
  background: "transparent",
  color: "#e63030",
  border: "1px solid #e63030",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
};

const clearButton: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 600,
};

const refreshButton: React.CSSProperties = {
  background: "transparent",
  color: "#888",
  border: "1px solid #333",
  borderRadius: "4px",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 500,
};