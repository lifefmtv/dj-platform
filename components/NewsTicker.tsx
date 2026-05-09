"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
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
    <div style={{
      background: "#111",
      borderTop: "1px solid #1a1a1a",
      borderBottom: "1px solid #1a1a1a",
      padding: "0.6rem 0",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{
          background: "#e63030",
          color: "#fff",
          padding: "0.25rem 1rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          whiteSpace: "nowrap",
        }}>
          NEWS
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div className="ticker-animate" style={{ display: "inline-block" }}>
            {items.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{
                color: "#ccc",
                fontSize: "0.85rem",
                marginRight: "3rem",
                display: "inline-block",
              }}>
                <span style={{
                  color: "#e63030",
                  fontWeight: 600,
                  marginRight: "0.5rem",
                  fontSize: "0.75rem",
                }}>
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