import MixcloudShows from "@/components/MixcloudShows";

export const metadata = {
  title: "Recent Shows — Life FM TV",
};

export default function ShowsPage() {
  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 2rem" }}>
      <MixcloudShows />
    </main>
  );
}
