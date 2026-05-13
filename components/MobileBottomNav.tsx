"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const PRIMARY = [
  { href: "/",         label: "Home",      icon: "🏠" },
  { href: "/schedule", label: "Schedule",  icon: "📅" },
  { href: "/mixes",    label: "Mixes",     icon: "🎵" },
  { href: "/djs",      label: "Selectors", icon: "🎧" },
];

const ALL_LINKS = [
  { href: "/shows",      label: "Shows" },
  { href: "/schedule",   label: "Schedule" },
  { href: "/djs",        label: "Selectors" },
  { href: "/mixes",      label: "Mixes" },
  { href: "/label",      label: "Label" },
  { href: "/shop",       label: "Shop" },
  { href: "/submit",     label: "Submit" },
  { href: "/artist-hq",  label: "Artist HQ" },
  { href: "/about",      label: "About" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="mob-bottom-nav" aria-label="Mobile navigation">
        {PRIMARY.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className={`mob-tab${pathname === href ? " mob-tab--active" : ""}`}
          >
            <span className="mob-tab-icon" aria-hidden>{icon}</span>
            <span className="mob-tab-label">{label}</span>
          </a>
        ))}

        <button
          className={`mob-tab mob-tab-more${moreOpen ? " mob-tab--active" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label="More navigation links"
        >
          <span className="mob-tab-icon" aria-hidden>☰</span>
          <span className="mob-tab-label">More</span>
        </button>
      </nav>

      {/* Full-screen "More" overlay */}
      {moreOpen && (
        <div
          className="mob-more-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="All navigation links"
        >
          <button
            className="mob-more-close"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>

          <p className="mob-more-eyebrow">LIFEFM.TV</p>

          <div className="mob-more-grid">
            {ALL_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`mob-more-link${pathname === href ? " mob-more-link--active" : ""}`}
                onClick={() => setMoreOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
