import type { Metadata } from "next";
import MerchSignupForm from "@/components/MerchSignupForm";

export const metadata: Metadata = {
  title: "Shop — Life FM TV",
  description: "New LIFEFM.TV merch is on the way. Sign up to be first to know.",
};

export default function ShopPage() {
  return (
    <main className="merch-soon-page">

      {/* Decorative scan lines */}
      <div className="merch-soon-scanlines" aria-hidden />

      <div className="merch-soon-inner">

        {/* Eyebrow */}
        <p className="merch-soon-eyebrow">Life FM TV · Official Merch</p>

        {/* Heading */}
        <h1 className="merch-soon-heading">
          <span className="merch-soon-heading-line1">Merch</span>
          <span className="merch-soon-heading-line2">Coming<br />Soon</span>
        </h1>

        {/* Accent rule */}
        <div className="merch-soon-rule" aria-hidden />

        {/* Subtext */}
        <p className="merch-soon-sub">
          New LIFEFM.TV merch is on the way. Fresh designs, quality threads.
          Sign up below to be the first to know when we drop.
        </p>

        {/* Email signup form */}
        <MerchSignupForm />

        {/* Footer note */}
        <p className="merch-soon-note">No spam. Unsubscribe any time.</p>

      </div>

      {/* Decorative bottom strip */}
      <div className="merch-soon-bottom-strip" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="merch-soon-strip-word">LIFEFM.TV</span>
        ))}
      </div>

    </main>
  );
}
