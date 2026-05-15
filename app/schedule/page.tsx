import type { Metadata } from "next";
import ScheduleClient from "./ScheduleClient";

export const metadata: Metadata = {
  title: "Schedule — LIFEFM.TV",
  description: "Full broadcast schedule for LIFEFM.TV — drum and bass, dub, tech house, jungle and soul. Weekly and monthly views with genre filters.",
};

export default function SchedulePage() {
  return (
    <main className="content-page" style={{ maxWidth: "1200px" }}>
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Schedule</h1>
      <ScheduleClient />
    </main>
  );
}
