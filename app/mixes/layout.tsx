import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mixes",
  description: "Stream recorded DJ mixes from LIFEFM.TV residents — DNB, dub, house, jungle and more. New mixes added regularly.",
};

export default function MixesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
