import type { Metadata } from "next";
import Image from "next/image";
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
            <div className="nav-links">
              <a href="/schedule" className="nav-link">Schedule</a>
              <a href="/mixes" className="nav-link">Mixes</a>
            </div>
          </nav>

          {children}

          <footer className="site-footer">
            <div className="footer-inner">
              <div className="footer-links">
                <a
                  href="https://www.instagram.com/lifefmhq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Instagram
                </a>
                <span className="footer-divider">·</span>
                <a
                  href="https://www.facebook.com/lifefm.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Facebook
                </a>
                <span className="footer-divider">·</span>
                <a
                  href="https://www.tiktok.com/@lifefmtv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  TikTok
                </a>
                <span className="footer-divider">·</span>
                <a
                  href="https://twitter.com/lifefmhq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Twitter
                </a>
                <span className="footer-divider">·</span>
                <a
                  href="mailto:lifefmhq@gmail.com"
                  className="footer-link"
                >
                  Email
                </a>
                <span className="footer-divider">·</span>
                <a
                  href="https://www.mixcloud.com/live/LifeFm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Mixcloud
                </a>
              </div>
              <p className="footer-copy">
                © {new Date().getFullYear()} Life FM TV · Broadcasting 24/7
              </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
