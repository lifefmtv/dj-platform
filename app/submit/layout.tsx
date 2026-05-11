import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Show",
  description: "Are you a DJ? Apply for a show slot on LIFEFM.TV — the underground music radio station broadcasting live 24/7.",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
