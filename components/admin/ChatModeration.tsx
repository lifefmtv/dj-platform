"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import {
  deleteMessage,
  clearAllMessages,
  banUser,
  unbanUser,
} from "@/app/actions/chatActions";

interface Message {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

interface BannedUser {
  id: string;
  display_name: string;
  banned_at: string;
}

export default function ChatModeration() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    fetchBannedUsers();
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

  async function fetchBannedUsers() {
    const { data } = await supabase
      .from("banned_users")
      .select("*")
      .order("banned_at", { ascending: false });
    if (data) setBannedUsers(data);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    await deleteMessage(id);
    fetchMessages();
  }

  async function handleClearAll() {
    if (
      !confirm(
        "Are you sure you want to clear ALL chat messages? This cannot be undone."
      )
    )
      return;
    await clearAllMessages();
    fetchMessages();
  }

  async function handleBan(displayName: string) {
    if (!confirm(`Ban "${displayName}" from chat? They will not be able to send messages.`))
      return;
    try {
      await banUser(displayName);
      fetchBannedUsers();
    } catch (e: any) {
      if (e.message?.includes("unique")) {
        alert(`${displayName} is already banned.`);
      } else {
        alert("Failed to ban user.");
      }
    }
  }

  async function handleUnban(id: string, displayName: string) {
    if (!confirm(`Unban "${displayName}"?`)) return;
    await unbanUser(id);
    fetchBannedUsers();
  }

  return (
    <div>
      {/* Messages section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <h2 style={sectionTitle}>Chat Moderation</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={fetchMessages} style={refreshButton}>
            ↻ Refresh
          </button>
          <button onClick={handleClearAll} style={clearButton}>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.25rem",
                }}
              >
                <span style={{ color: "#e63030", fontWeight: 600, fontSize: "0.85rem" }}>
                  {msg.display_name}
                </span>
                <span style={{ color: "#555", fontSize: "0.75rem" }}>
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p style={{ color: "#ddd", fontSize: "0.9rem" }}>{msg.message}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button
                onClick={() => handleBan(msg.display_name)}
                style={banButton}
              >
                Ban
              </button>
              <button
                onClick={() => handleDelete(msg.id)}
                style={deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Banned Users section */}
      <div
        style={{
          marginTop: "3rem",
          borderTop: "1px solid #222",
          paddingTop: "2rem",
        }}
      >
        <h2 style={{ ...sectionTitle, marginBottom: "1rem" }}>
          Banned Users ({bannedUsers.length})
        </h2>

        {bannedUsers.length === 0 ? (
          <p style={{ color: "#555", fontSize: "0.9rem" }}>No banned users.</p>
        ) : (
          bannedUsers.map((u) => (
            <div key={u.id} style={messageRow}>
              <div style={{ flex: 1 }}>
                <span
                  style={{ color: "#e63030", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  {u.display_name}
                </span>
                <span
                  style={{
                    color: "#555",
                    fontSize: "0.75rem",
                    marginLeft: "0.75rem",
                  }}
                >
                  banned{" "}
                  {formatDistanceToNow(new Date(u.banned_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <button
                onClick={() => handleUnban(u.id, u.display_name)}
                style={unbanButton}
              >
                Unban
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

const banButton: React.CSSProperties = {
  background: "transparent",
  color: "#f59e0b",
  border: "1px solid #f59e0b",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
};

const unbanButton: React.CSSProperties = {
  background: "transparent",
  color: "#22c55e",
  border: "1px solid #22c55e",
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
