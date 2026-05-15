"use client";

import { useState } from "react";
import AdminLiveControls from "@/components/admin/AdminLiveControls";
import AdminShoutouts from "@/components/admin/AdminShoutouts";
import ChatModeration from "@/components/admin/ChatModeration";
import InteractionsManager from "@/components/admin/InteractionsManager";

const TABS = [
  { id: "controls",     label: "Controls" },
  { id: "chat",         label: "Chat" },
  { id: "shoutouts",    label: "Shoutouts" },
  { id: "interactions", label: "Interactions" },
] as const;

type Tab = typeof TABS[number]["id"];

export default function AdminLiveClient() {
  const [tab, setTab] = useState<Tab>("controls");

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">Live &amp; Community</div>
        <div className="admin-page-sub">Stream controls, chat moderation, shoutouts, and live interactions.</div>
      </div>

      <div className="admin-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`admin-tab${tab === id ? " admin-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "controls"     && <AdminLiveControls />}
      {tab === "chat"         && <ChatModeration />}
      {tab === "shoutouts"    && <AdminShoutouts />}
      {tab === "interactions" && <InteractionsManager />}
    </div>
  );
}
