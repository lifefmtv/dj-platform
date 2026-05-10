"use client";

import { useState } from "react";
import ChatRoom from "@/components/ChatRoom";

type Tab = "website" | "socials";

const RESTREAM_URL =
  "https://chat.restream.io/embed?token=e7677d72-ae6d-467c-8ee9-1fd6606522dd";

export default function ChatTabs() {
  const [active, setActive] = useState<Tab>("website");

  return (
    <div className="chat-tabs-outer">
      {/* LIVE CHAT label */}
      <div className="chat-tabs-header">
        <div className="chat-header-dot" />
        <span className="chat-tabs-live-label">Live Chat</span>
      </div>

      {/* Tab buttons */}
      <div className="chat-tabs-bar" role="tablist">
        <button
          role="tab"
          aria-selected={active === "website"}
          className={`chat-tab-btn${active === "website" ? " chat-tab-btn--active" : ""}`}
          onClick={() => setActive("website")}
        >
          Website Chat
        </button>
        <button
          role="tab"
          aria-selected={active === "socials"}
          className={`chat-tab-btn${active === "socials" ? " chat-tab-btn--active" : ""}`}
          onClick={() => setActive("socials")}
        >
          Socials Chat
        </button>
      </div>

      {/* Tab panels */}
      <div className="chat-tabs-body">
        <div
          role="tabpanel"
          className={`chat-tab-pane${active === "website" ? " chat-tab-pane--active" : ""}`}
        >
          <ChatRoom />
        </div>
        <div
          role="tabpanel"
          className={`chat-tab-pane${active === "socials" ? " chat-tab-pane--active" : ""}`}
        >
          <iframe
            src={RESTREAM_URL}
            title="Socials Chat — Restream"
            allow="autoplay"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
