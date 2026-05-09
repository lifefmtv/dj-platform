"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  color: string;
  pubDate: string;
}

export default function NewsCards() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {});
  }, []);

  const sources = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      if (!seen.has(item.source)) seen.set(item.source, item.color);
    }
    return Array.from(seen.entries()).map(([source, color]) => ({ source, color }));
  }, [items]);

  const displayed = (
    activeFilters.size === 0
      ? items
      : items.filter((item) => activeFilters.has(item.source))
  ).slice(0, 8);

  function toggleFilter(source: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="news-section">
      <h2 className="news-section-heading">Music News</h2>

      <div className="filter-bar" role="group" aria-label="Filter by source">
        {sources.map(({ source, color }) => {
          const isActive = activeFilters.has(source);
          const dimmed = activeFilters.size > 0 && !isActive;
          return (
            <button
              key={source}
              data-tooltip={source}
              onClick={() => toggleFilter(source)}
              aria-pressed={isActive}
              aria-label={`Filter by ${source}`}
              className="filter-square"
              style={{
                background: color,
                opacity: dimmed ? 0.28 : 1,
                borderColor: isActive ? "#ffffff" : "transparent",
                boxShadow: isActive ? `0 0 8px ${color}` : "none",
                transform: isActive ? "scale(1.25)" : undefined,
              }}
            />
          );
        })}
      </div>

      <div className="news-scroll-container">
        <div className="news-cards-grid">
          {displayed.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card"
            >
              <span
                className="news-source-label"
                style={{
                  color: item.color,
                  background: `${item.color}1a`,
                  borderColor: `${item.color}44`,
                }}
              >
                {item.source}
              </span>
              <p className="news-card-title">{item.title}</p>
              <p className="news-card-date">
                {item.pubDate
                  ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })
                  : ""}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
