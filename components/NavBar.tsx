"use client";

import { useState } from "react";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/shows", label: "Shows" },
  { href: "/schedule", label: "Schedule" },
  { href: "/mixes", label: "Mixes" },
  { href: "/about", label: "About" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="site-nav">
        <a href="/" className="nav-logo-link" aria-label="Life FM TV — Home">
          <Image
            src="/logo.webp"
            alt="Life FM TV"
            width={160}
            height={40}
            style={{ height: "40px", width: "auto", display: "block" }}
            priority
          />
        </a>

        {/* Desktop links */}
        <div className="nav-links">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="nav-link">
              {label}
            </a>
          ))}
        </div>

        {/* Hamburger — mobile only */}
        <button
          className={`hamburger${open ? " hamburger--open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile dropdown — rendered outside nav so it sits below it */}
      {open && (
        <div id="mobile-menu" className="mobile-menu" role="menu">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="mobile-nav-link"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
