"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

const NAV = [
  { href: "/admin/upload",   icon: "📤", label: "Studio Upload" },
  { href: "/admin/schedule", icon: "📅", label: "Schedule" },
  { href: "/admin/djs",      icon: "🎤", label: "DJs & Shows" },
  { href: "/admin/sponsors", icon: "💰", label: "Sponsors" },
  { href: "/admin/live",     icon: "💬", label: "Live & Community" },
  { href: "/admin/settings", icon: "⚙️",  label: "Settings" },
];

interface Props {
  email: string;
  role: string;
}

export default function AdminSidebar({ email, role }: Props) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        LIFEFM.TV<span className="admin-sidebar-logo-accent">Admin</span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV.map(({ href, icon, label }) => {
          if (href === "/admin/settings" && role !== "owner" && role !== "admin") return null;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`admin-sidebar-link${active ? " admin-sidebar-link--active" : ""}`}
            >
              <span className="admin-sidebar-icon">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        {email && <span className="admin-sidebar-email">{email}</span>}
        <SignOutButton>
          <button className="admin-sidebar-signout">Sign Out</button>
        </SignOutButton>
      </div>
    </aside>
  );
}
