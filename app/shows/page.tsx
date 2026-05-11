import type { Metadata } from "next";
import MixcloudShows from "@/components/MixcloudShows";

export const metadata: Metadata = {
  title: "Recent Shows",
  description: "Listen back to recent shows from the LIFEFM.TV DJ lineup. Stream mixes across jungle, DNB, house, techno and more.",
};

export default function ShowsPage() {
  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 2rem" }}>
      <MixcloudShows />
    </main>
  );
}
