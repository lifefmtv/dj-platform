"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

export default function NewsCards() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{ padding: "2rem" }}>
      <h2
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: "var(--text-muted)",
          marginBottom: "1.25rem",
          textTransform: "uppercase",
        }}
      >
        Music News
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "0.85rem",
        }}
      >
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "1rem",
              display: "block",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-bright)";
              (e.currentTarget as HTMLElement).style.background = "var(--card-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.background = "var(--card)";
            }}
          >
            <span
              style={{
                background: "rgba(230,48,48,0.15)",
                color: "var(--accent)",
                fontSize: "0.66rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "0.2rem 0.55rem",
                borderRadius: "3px",
                marginBottom: "0.7rem",
                display: "inline-block",
                textTransform: "uppercase",
                border: "1px solid rgba(230,48,48,0.25)",
              }}
            >
              {item.source}
            </span>
            <p
              style={{
                color: "#ccc",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                marginBottom: "0.5rem",
              }}
            >
              {item.title}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
              {item.pubDate ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }) : ""}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
