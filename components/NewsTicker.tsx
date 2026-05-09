"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  color: string;
  pubDate: string;
}

export default function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "#0d0d0d",
        borderTop: "1px solid #1e1e1e",
        borderBottom: "1px solid #1e1e1e",
        padding: "0.55rem 0",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            background: "var(--accent)",
            color: "#fff",
            padding: "0.25rem 1rem",
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            whiteSpace: "nowrap",
            fontFamily: "'Barlow Condensed', sans-serif",
            boxShadow: "4px 0 12px rgba(230,48,48,0.35)",
            flexShrink: 0,
          }}
        >
          NEWS
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div className="ticker-animate" style={{ display: "inline-block" }}>
            {items.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#bbb",
                  fontSize: "0.82rem",
                  marginRight: "4rem",
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    color: item.color || "var(--accent)",
                    fontWeight: 700,
                    marginRight: "0.5rem",
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.source}
                </span>
                {item.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
