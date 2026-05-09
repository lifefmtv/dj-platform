import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Life FM TV",
  description: "Live DJ streaming platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <nav style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.1em", color: "#e63030" }}>LIFE FM TV</span>
            <div style={{ display: "flex", gap: "2rem" }}>
              <a href="/schedule" style={{ color: "#aaa" as string, fontSize: "0.9rem" }}>Schedule</a>
              <a href="/mixes" style={{ color: "#aaa" as string, fontSize: "0.9rem" }}>Mixes</a>
            </div>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
