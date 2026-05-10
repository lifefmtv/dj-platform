import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import TimetableManager from "@/components/admin/TimetableManager";
import ShowTemplateManager from "@/components/admin/ShowTemplateManager";
import FlyerUpload from "@/components/admin/FlyerUpload";
import MixManager from "@/components/admin/MixManager";
import ChatModeration from "@/components/admin/ChatModeration";
import DJManager from "@/components/admin/DJManager";

const NAV_ITEMS = [
  { href: "#timetable", label: "Timetable" },
  { href: "#templates", label: "Templates" },
  { href: "#flyer", label: "Flyer" },
  { href: "#mixes", label: "Mixes" },
  { href: "#chat", label: "Chat" },
  { href: "#djs", label: "DJs" },
];

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const [user, supabase] = await Promise.all([
    currentUser(),
    createServerSupabaseClient(),
  ]);

  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const { data: settings } = await supabase
    .from("settings")
    .select("current_flyer_url")
    .eq("id", 1)
    .single();

  return (
    <>
      {/* ── Sticky header ── */}
      <header style={stickyHeader}>
        <span style={brandLabel}>
          LIFEFM.TV <span style={{ color: "#e63030" }}>Admin</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {email && <span style={emailLabel}>{email}</span>}
          <SignOutButton>
            <button style={signOutBtn}>Sign Out</button>
          </SignOutButton>
        </div>
      </header>

      {/* ── Module navigation ── */}
      <nav style={moduleNav}>
        {NAV_ITEMS.map(({ href, label }) => (
          <a key={href} href={href} style={navLink}>
            {label}
          </a>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="admin-wrap-main" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>

          <section id="timetable" style={sectionCard}>
            <TimetableManager />
          </section>

          <section id="templates" style={sectionCard}>
            <ShowTemplateManager />
          </section>

          <section id="flyer" style={sectionCard}>
            <FlyerUpload currentFlyer={settings?.current_flyer_url || null} />
          </section>

          <section id="mixes" style={sectionCard}>
            <MixManager />
          </section>

          <section id="chat" style={sectionCard}>
            <ChatModeration />
          </section>

          <section id="djs" style={sectionCard}>
            <DJManager />
          </section>

        </div>
      </main>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────

const stickyHeader: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 200,
  background: "#080706",
  borderBottom: "1px solid #1e1e1e",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 1.25rem",
  height: "52px",
  overflowX: "hidden",
};

const brandLabel: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "0.88rem",
  letterSpacing: "0.08em",
  color: "#fff",
};

const emailLabel: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#555",
  fontFamily: "monospace",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "180px",
};

const signOutBtn: React.CSSProperties = {
  background: "transparent",
  color: "#888",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  padding: "0.35rem 0.8rem",
  cursor: "pointer",
  fontSize: "0.75rem",
};

const moduleNav: React.CSSProperties = {
  background: "#0a0a0a",
  borderBottom: "1px solid #181818",
  display: "flex",
  alignItems: "center",
  padding: "0 1rem",
  position: "sticky",
  top: "52px",
  zIndex: 199,
  overflowX: "auto",
};

const navLink: React.CSSProperties = {
  display: "block",
  padding: "0.65rem 1.1rem",
  fontSize: "0.66rem",
  fontWeight: 500,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#555",
  textDecoration: "none",
  borderRight: "1px solid #181818",
  transition: "color 0.15s",
};

const sectionCard: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "clamp(1rem, 4vw, 2rem)",
  scrollMarginTop: "108px",
};
