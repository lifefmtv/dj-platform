import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist HQ",
  description:
    "LIFEFM.TV Artist HQ — guides, brand assets, tagging tips and a social media image generator for DJs and artists on the station.",
};

export default function ArtistHQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
