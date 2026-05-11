import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Show — Life FM TV",
  description: "Want to broadcast on Life FM TV? Submit your DJ application and we'll be in touch.",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
