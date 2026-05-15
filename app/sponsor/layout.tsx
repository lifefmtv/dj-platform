import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor & Advertise",
  description:
    "Partner with LIFEFM.TV — 25 years of pirate radio heritage, 2-hour listener sessions, and a loyal underground music audience. Sponsorship, show packages, and advertising opportunities.",
};

export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
