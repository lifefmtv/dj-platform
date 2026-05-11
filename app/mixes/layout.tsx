import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mixes — Life FM TV",
  description: "Stream exclusive DJ mixes from the Life FM TV roster. Filter by genre — DNB, house, techno, jungle, dub, soul and more.",
};

export default function MixesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
