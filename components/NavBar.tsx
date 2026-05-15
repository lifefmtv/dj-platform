"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/",          label: "Home" },
  { href: "/schedule",  label: "Schedule" },
  { href: "/djs",       label: "Selectors" },
  { href: "/label",     label: "Label" },
  { href: "/sponsor",   label: "Advertise" },
  { href: "/artist-hq", label: "Artist HQ" },
];

const ARCHIVE_LINKS = [
  { href: "/archive/shows", label: "Shows" },
  { href: "/archive/mixes", label: "Mixes" },
];

export default function NavBar() {
  const [open, setOpen]           = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);

  // Close archive dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (archiveRef.current && !archiveRef.current.contains(e.target as Node)) {
        setArchiveOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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

        <div className="nav-right">
          <div className="nav-links">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="nav-link">
                {label}
              </a>
            ))}

            {/* Archive dropdown */}
            <div className="nav-dropdown" ref={archiveRef}>
              <button
                className={`nav-link nav-dropdown-trigger${archiveOpen ? " nav-link--active" : ""}`}
                onClick={() => setArchiveOpen((v) => !v)}
                aria-expanded={archiveOpen}
                aria-haspopup="true"
              >
                Archive <span className="nav-dropdown-caret" aria-hidden>▾</span>
              </button>
              {archiveOpen && (
                <div className="nav-dropdown-menu" role="menu">
                  {ARCHIVE_LINKS.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={() => setArchiveOpen(false)}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

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
          <p className="mobile-nav-section-label">Archive</p>
          {ARCHIVE_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="mobile-nav-link mobile-nav-link--indent"
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
