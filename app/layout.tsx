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
          <nav className="site-nav">
            <a href="/" className="nav-logo">LIFE FM TV</a>
            <div className="nav-links">
              <a href="/schedule" className="nav-link">Schedule</a>
              <a href="/mixes" className="nav-link">Mixes</a>
            </div>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
