import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Show Sponsorship — Browse & Book",
  description:
    "Browse available show slots on LIFEFM.TV and book your sponsorship online. Own a show, own its audience.",
};

export default function ShowsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
