import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "@/components/NavBar";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import BackToTop from "@/components/BackToTop";
import MobileBottomNav from "@/components/MobileBottomNav";
import { AudioReactiveProvider } from "@/context/AudioReactiveContext";
import AudioVisualiser from "@/components/AudioVisualiser";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifefm.tv";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LIFEFM.TV — Live Underground Music Radio",
    template: "%s | LIFEFM.TV",
  },
  description:
    "LIFEFM.TV — live streaming radio broadcasting DNB, dub, tech house, jungle and underground music 24/7 from London. Watch live, check the schedule and explore our DJ roster.",
  keywords: [
    "drum and bass radio",
    "live DNB stream",
    "underground music UK",
    "dub radio",
    "jungle music live",
    "tech house radio",
    "LIFEFM",
    "live music stream UK",
    "drum and bass radio station UK",
    "live jungle music stream",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName: "LIFEFM.TV",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LIFEFM.TV — Live Underground Music Radio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lifefmhq",
    creator: "@lifefmhq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AudioReactiveProvider>
          <ScrollProgressBar />
          <NavBar />
          <MobileBottomNav />

          {children}

          <AudioVisualiser />
          <BackToTop />
          </AudioReactiveProvider>

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
                <a href="mailto:lifefmhq@gmail.com" className="footer-link">
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
                <span className="footer-divider">·</span>
                <a href="/privacy" className="footer-link">
                  Privacy Policy
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
