"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  color: string;
}

function TickerItem({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="ticker-item"
    >
      <span className="ticker-source" style={{ color: item.color }}>
        {item.source}
      </span>
      <span className="ticker-title">{item.title}</span>
    </a>
  );
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
    <div className="ticker-wrap">
      <div className="ticker-badge">News</div>
      <div className="ticker-track">
        <div className="ticker-animate">
          {items.map((item, i) => <TickerItem key={`a-${i}`} item={item} />)}
          {items.map((item, i) => <TickerItem key={`b-${i}`} item={item} />)}
        </div>
      </div>
    </div>
  );
}
