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
          fontSize: "1rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#aaa",
          marginBottom: "1.5rem",
          textTransform: "uppercase",
        }}
      >
        Music News
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
{items.map((item, i) => (
          
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "8px",
              padding: "1rem",
              display: "block",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#e63030")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#222")
            }
          >
            <span
              style={{
                background: "#e63030",
                color: "#fff",
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "0.2rem 0.5rem",
                borderRadius: "3px",
                marginBottom: "0.75rem",
                display: "inline-block",
              }}
            >
              {item.source}
            </span>
            <p
              style={{
                color: "#ddd",
                fontSize: "0.9rem",
                lineHeight: 1.5,
                marginBottom: "0.5rem",
              }}
            >
              {item.title}
            </p>
            <p style={{ color: "#555", fontSize: "0.75rem" }}>
              {item.pubDate
                ? formatDistanceToNow(new Date(item.pubDate), {
                    addSuffix: true,
                  })
                : ""}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}