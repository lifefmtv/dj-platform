"use client";

import { useState } from "react";
import Image from "next/image";
import NavCountdown from "@/components/NavCountdown";
import BroadcastIndicator from "@/components/BroadcastIndicator";

const NAV_LINKS = [
  { href: "/shows", label: "Shows" },
  { href: "/schedule", label: "Schedule" },
  { href: "/djs", label: "Selectors" },
  { href: "/mixes", label: "Mixes" },
  { href: "/label", label: "Label" },
  { href: "/shop", label: "Shop" },
  { href: "/submit", label: "Submit" },
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
            width={280}
            height={70}
            className="nav-logo-img"
            priority
          />
        </a>

        {/* Centre slot — broadcast indicator + next-up countdown, desktop only */}
        <div className="nav-centre">
          <BroadcastIndicator />
          <NavCountdown />
        </div>

        {/* Right side: desktop links + hamburger */}
        <div className="nav-right">
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
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div id="mobile-menu" className="mobile-menu" role="menu">
          {/* ON AIR / OFF AIR at the top of the mobile menu */}
          <div className="mobile-menu-indicator">
            <BroadcastIndicator />
          </div>
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
