"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { deleteShoutout } from "@/app/actions/interactionActions";

interface Shoutout {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export default function AdminShoutouts() {
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    fetchShoutouts();
    const channel = supabase
      .channel("admin-shoutouts")
      .on("postgres_changes", { event: "*", schema: "public", table: "shoutouts" }, fetchShoutouts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchShoutouts() {
    const { data } = await supabase
      .from("shoutouts")
      .select("id, display_name, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setShoutouts(data);
  }

  async function handleDelete(id: string) {
    await deleteShoutout(id);
    setShoutouts((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="admin-card">
      <div className="admin-card-title">Shoutout Moderation</div>
      <div className="admin-card-sub">Review and remove listener shoutouts from the live stream overlay.</div>
      {shoutouts.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "#484240", fontStyle: "italic" }}>No shoutouts yet.</p>
      ) : (
        <div>
          {shoutouts.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 0",
                borderBottom: "1px solid #1a1816",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: "#e63030", fontWeight: 700, fontSize: "0.82rem", marginRight: "0.4rem" }}>
                  {s.display_name}
                </span>
                <span style={{ color: "#ccc", fontSize: "0.82rem" }}>{s.message}</span>
              </div>
              <button className="admin-btn admin-btn--danger" style={{ padding: "0.25rem 0.65rem", fontSize: "0.72rem" }} onClick={() => handleDelete(s.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
