"use client";

import { useState } from "react";

/* ── Types ──────────────────────────────────────────────────── */
type Show = {
  id: string;
  day: string;
  slot: string;
  name: string;
  dj: string;
  genre: string;
  listeners: number;
  sponsored?: boolean;
  sponsoredBy?: string;
};

type DisplayStyle = "brought-to-you-by" | "dj-brand" | "presented-by";

type WizardState = {
  brandName: string;
  strapline: string;
  displayStyle: DisplayStyle | "";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactCompany: string;
  contactNotes: string;
  paymentMethod: "stripe" | "bank" | "";
  stripeCard: string;
  stripeExpiry: string;
  stripeCvc: string;
  stripeHolder: string;
};

/* ── Show data ─────────────────────────────────────────────── */
const SHOWS: Show[] = [
  { id: "mon-8pm",  day: "Monday",    slot: "8pm–10pm",   name: "Monday Night Vibes",  dj: "DJ Phantom",     genre: "Drum & Bass",  listeners: 800 },
  { id: "mon-10pm", day: "Monday",    slot: "10pm–12am",  name: "Late Night Sessions", dj: "DJ Mixx",        genre: "Tech House",   listeners: 600 },
  { id: "tue-6pm",  day: "Tuesday",   slot: "6pm–8pm",    name: "Rush Hour",           dj: "MC Storm",       genre: "Jungle/DNB",   listeners: 1200 },
  { id: "tue-8pm",  day: "Tuesday",   slot: "8pm–10pm",   name: "The Dub Room",        dj: "Selecta Rex",    genre: "Dub/Reggae",   listeners: 900,  sponsored: true, sponsoredBy: "Carhartt WIP" },
  { id: "tue-10pm", day: "Tuesday",   slot: "10pm–12am",  name: "Nite Shift",          dj: "DJ Luna",        genre: "Tech House",   listeners: 700 },
  { id: "wed-7pm",  day: "Wednesday", slot: "7pm–9pm",    name: "Mid Week Madness",    dj: "Subzero",        genre: "Drum & Bass",  listeners: 950 },
  { id: "wed-9pm",  day: "Wednesday", slot: "9pm–11pm",   name: "Soul Kitchen",        dj: "Lady T",         genre: "Soul/R&B",     listeners: 800 },
  { id: "thu-6pm",  day: "Thursday",  slot: "6pm–8pm",    name: "The Thursday Drop",   dj: "DJ Roots",       genre: "Jungle",       listeners: 750 },
  { id: "thu-8pm",  day: "Thursday",  slot: "8pm–10pm",   name: "Dark Matter",         dj: "DJ Shadow",      genre: "Techno",       listeners: 650 },
  { id: "fri-6pm",  day: "Friday",    slot: "6pm–8pm",    name: "Friday Rush",         dj: "MC Fire",        genre: "DNB/Jungle",   listeners: 1500, sponsored: true, sponsoredBy: "Pioneer DJ" },
  { id: "fri-8pm",  day: "Friday",    slot: "8pm–10pm",   name: "Weekend Starter",     dj: "Diesel",         genre: "Tech House",   listeners: 1800 },
  { id: "fri-10pm", day: "Friday",    slot: "10pm–12am",  name: "The Late Show",       dj: "DJ Collective",  genre: "Mixed",        listeners: 2000 },
  { id: "sat-2pm",  day: "Saturday",  slot: "2pm–4pm",    name: "Afternoon Sessions",  dj: "Lady Soul",      genre: "Soul/Funk",    listeners: 600 },
  { id: "sat-6pm",  day: "Saturday",  slot: "6pm–8pm",    name: "Saturday Night",      dj: "DJ Nova",        genre: "Tech House",   listeners: 1400 },
  { id: "sat-8pm",  day: "Saturday",  slot: "8pm–10pm",   name: "The Main Event",      dj: "MC Stormz",      genre: "Drum & Bass",  listeners: 2200 },
  { id: "sat-10pm", day: "Saturday",  slot: "10pm–12am",  name: "Midnight Riddim",     dj: "Selecta King",   genre: "Dub",          listeners: 1600 },
  { id: "sun-2pm",  day: "Sunday",    slot: "2pm–4pm",    name: "Sunday Roast",        dj: "DJ Mellow",      genre: "Mixed/Chill",  listeners: 700 },
  { id: "sun-6pm",  day: "Sunday",    slot: "6pm–8pm",    name: "Sunday Session",      dj: "The Collective", genre: "Jungle/DNB",   listeners: 1100 },
];

const DAYS = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getPrice(listeners: number): number {
  if (listeners < 700)  return 99;
  if (listeners < 1000) return 149;
  if (listeners < 1500) return 199;
  if (listeners < 2000) return 299;
  return 399;
}

const DISPLAY_STYLES: { id: DisplayStyle; name: string; desc: string }[] = [
  {
    id: "brought-to-you-by",
    name: "Brought to you by",
    desc: "Your brand appears as a credit beneath the show name.",
  },
  {
    id: "dj-brand",
    name: "DJ × Brand co-credit",
    desc: "Your brand appears alongside the DJ name — equal billing.",
  },
  {
    id: "presented-by",
    name: "Presented by",
    desc: "Your brand leads the show title — maximum brand prominence.",
  },
];

function buildPreview(show: Show, brandName: string, style: DisplayStyle | ""): { line1: string; line2: string; line3: string } {
  const brand = brandName || "[Your Brand]";
  if (!style || style === "brought-to-you-by") {
    return { line1: show.name, line2: `Brought to you by ${brand}`, line3: show.dj };
  }
  if (style === "dj-brand") {
    return { line1: show.name, line2: `${show.dj} × ${brand}`, line3: "" };
  }
  return { line1: `${brand} presents`, line2: show.name, line3: show.dj };
}

const PROGRESS_STEPS = ["Style", "Contact", "Payment", "Review"];

/* ── Component ─────────────────────────────────────────────── */
export default function ShowsPage() {
  const [activeDay, setActiveDay] = useState("All");
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [w, setW] = useState<WizardState>({
    brandName: "",
    strapline: "",
    displayStyle: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactCompany: "",
    contactNotes: "",
    paymentMethod: "",
    stripeCard: "",
    stripeExpiry: "",
    stripeCvc: "",
    stripeHolder: "",
  });

  function setWf(key: keyof WizardState, val: string) {
    setW((prev) => ({ ...prev, [key]: val }));
  }

  const filteredShows = activeDay === "All" ? SHOWS : SHOWS.filter((s) => s.day === activeDay);

  function openWizard(show: Show) {
    setSelectedShow(show);
    setStep(1);
    setConfirmed(false);
    setW({
      brandName: "",
      strapline: "",
      displayStyle: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactCompany: "",
      contactNotes: "",
      paymentMethod: "",
      stripeCard: "",
      stripeExpiry: "",
      stripeCvc: "",
      stripeHolder: "",
    });
  }

  function closeWizard() {
    setSelectedShow(null);
    setConfirmed(false);
  }

  async function handleSubmit() {
    if (!selectedShow) return;
    setSubmitting(true);
    try {
      const firstName = w.contactName.trim().split(" ")[0] ?? "SPONSOR";
      const ref = `LIFEFM-${selectedShow.id.toUpperCase()}-${firstName.toUpperCase()}`;
      await fetch("/api/sponsor-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "show-booking",
          showId: selectedShow.id,
          showName: selectedShow.name,
          djName: selectedShow.dj,
          brandName: w.brandName,
          strapline: w.strapline,
          displayStyle: w.displayStyle,
          contactName: w.contactName,
          email: w.contactEmail,
          contactPhone: w.contactPhone,
          contactCompany: w.contactCompany,
          contactNotes: w.contactNotes,
          paymentMethod: w.paymentMethod,
          monthlyPrice: getPrice(selectedShow.listeners),
          bankRef: ref,
        }),
      });
      setConfirmed(true);
    } finally {
      setSubmitting(false);
    }
  }

  // Derived values for the wizard
  const show = selectedShow;
  const price = show ? getPrice(show.listeners) : 0;
  const preview = show ? buildPreview(show, w.brandName, w.displayStyle) : null;
  const firstName = w.contactName.trim().split(" ")[0] ?? "SPONSOR";
  const bankRef = show ? `LIFEFM-${show.id.toUpperCase()}-${firstName.toUpperCase()}` : "";
  const sortCode = process.env.NEXT_PUBLIC_METRO_SORT_CODE ?? "XX-XX-XX";
  const accountNumber = process.env.NEXT_PUBLIC_METRO_ACCOUNT_NUMBER ?? "XXXXXXXX";

  // Step validity
  const step1Valid = w.brandName.trim().length > 0;
  const step2Valid = w.contactName.trim().length > 0 && w.contactEmail.trim().includes("@");
  const step3Valid = w.paymentMethod !== "";

  return (
    <main className="sb-page">
      {/* Header */}
      <div className="sb-header">
        <a href="/sponsor" className="sb-back">← Back to Sponsorship</a>
        <h1 className="sb-header-title">Browse Shows &amp; Book</h1>
        <p className="sb-header-sub">
          Find an available show that fits your brand, choose your display style, and book your
          sponsorship in minutes.
        </p>
      </div>

      {/* Day filter */}
      <div className="sb-filter-bar">
        {DAYS.map((day) => (
          <button
            key={day}
            className={`sb-day-btn${activeDay === day ? " sb-day-btn--active" : ""}`}
            onClick={() => setActiveDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Show grid */}
      <div className="sb-grid">
        {filteredShows.map((show) => (
          <div
            key={show.id}
            className={`sb-show-card${show.sponsored ? " sb-show-card--sponsored" : ""}`}
          >
            <p className="sb-show-day">
              {show.day} · {show.slot}
            </p>
            <h2 className="sb-show-name">{show.name}</h2>
            <div className="sb-show-meta">
              <span className="sb-show-dj">{show.dj}</span>
              <span className="sb-show-genre">{show.genre}</span>
            </div>
            {show.sponsored && show.sponsoredBy && (
              <p className="sb-sponsored-by">Sponsored by {show.sponsoredBy}</p>
            )}
            <div className="sb-show-footer">
              <span
                className={`sb-badge-avail ${show.sponsored ? "sb-badge-avail--sponsored" : "sb-badge-avail--available"}`}
              >
                {show.sponsored ? "Sponsored" : "Available"}
              </span>
              {!show.sponsored && (
                <span className="sb-show-price">£{getPrice(show.listeners)}/mo</span>
              )}
            </div>
            {!show.sponsored && (
              <button className="sb-sponsor-btn" onClick={() => openWizard(show)}>
                Sponsor This Show →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Wizard overlay */}
      {selectedShow && (
        <div className="sb-wizard-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeWizard(); }}>
          <div className="sb-wizard">
            {/* Header */}
            <div className="sb-wizard-header">
              <div>
                <p className="sb-wizard-title">Sponsor {selectedShow.name}</p>
                <p className="sb-wizard-subtitle">
                  {selectedShow.day} · {selectedShow.slot} · {selectedShow.dj}
                </p>
              </div>
              <button className="sb-wizard-close" onClick={closeWizard} aria-label="Close">×</button>
            </div>

            {!confirmed ? (
              <>
                {/* Progress bar */}
                <div className="sb-progress">
                  {PROGRESS_STEPS.map((label, i) => {
                    const stepNum = i + 1;
                    const isActive = step === stepNum;
                    const isDone = step > stepNum;
                    return (
                      <div
                        key={label}
                        className={`sb-progress-step${isActive ? " sb-progress-step--active" : ""}${isDone ? " sb-progress-step--done" : ""}`}
                      >
                        <div className="sb-progress-dot">{isDone ? "✓" : stepNum}</div>
                        <span className="sb-progress-label">{label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="sb-wizard-body">
                  {/* ── STEP 1: Display Style ── */}
                  {step === 1 && (
                    <>
                      <p className="sb-step-heading">How should your brand appear?</p>

                      <div className="sb-field">
                        <label className="sb-label">Brand Name *</label>
                        <input
                          className="sb-input"
                          placeholder="e.g. Pioneer DJ"
                          value={w.brandName}
                          onChange={(e) => setWf("brandName", e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div className="sb-field">
                        <label className="sb-label">Strapline (optional)</label>
                        <input
                          className="sb-input"
                          placeholder="e.g. Equipment for the dedicated"
                          value={w.strapline}
                          onChange={(e) => setWf("strapline", e.target.value)}
                        />
                      </div>

                      <p className="sb-label" style={{ marginBottom: "0.75rem" }}>
                        Display Style
                      </p>
                      <div className="sb-style-cards">
                        {DISPLAY_STYLES.map((style) => (
                          <div
                            key={style.id}
                            className={`sb-style-card${w.displayStyle === style.id ? " sb-style-card--selected" : ""}`}
                            onClick={() => setWf("displayStyle", style.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && setWf("displayStyle", style.id)}
                          >
                            <p className="sb-style-card-name">{style.name}</p>
                            <p className="sb-style-card-desc">{style.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* Live preview */}
                      {preview && (
                        <div className="sb-preview-card">
                          <p className="sb-preview-label">Live preview</p>
                          <p className="sb-preview-show">{preview.line1}</p>
                          <p className="sb-preview-brand">{preview.line2}</p>
                          {preview.line3 && <p className="sb-preview-dj">{preview.line3}</p>}
                          {w.strapline && (
                            <p style={{ fontSize: "0.8rem", color: "var(--text-3)", marginTop: "0.25rem", fontStyle: "italic" }}>
                              {w.strapline}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── STEP 2: Contact Details ── */}
                  {step === 2 && (
                    <>
                      <p className="sb-step-heading">Your contact details</p>
                      <div className="sb-field-grid">
                        <div className="sb-field">
                          <label className="sb-label">Full Name *</label>
                          <input
                            className="sb-input"
                            placeholder="Your name"
                            value={w.contactName}
                            onChange={(e) => setWf("contactName", e.target.value)}
                          />
                        </div>
                        <div className="sb-field">
                          <label className="sb-label">Email *</label>
                          <input
                            className="sb-input"
                            type="email"
                            placeholder="you@example.com"
                            value={w.contactEmail}
                            onChange={(e) => setWf("contactEmail", e.target.value)}
                          />
                        </div>
                        <div className="sb-field">
                          <label className="sb-label">Phone</label>
                          <input
                            className="sb-input"
                            type="tel"
                            placeholder="+44 7700 000000"
                            value={w.contactPhone}
                            onChange={(e) => setWf("contactPhone", e.target.value)}
                          />
                        </div>
                        <div className="sb-field">
                          <label className="sb-label">Company</label>
                          <input
                            className="sb-input"
                            placeholder="Company name"
                            value={w.contactCompany}
                            onChange={(e) => setWf("contactCompany", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="sb-field">
                        <label className="sb-label">Notes</label>
                        <textarea
                          className="sb-input sb-textarea"
                          placeholder="Any additional information or questions..."
                          value={w.contactNotes}
                          onChange={(e) => setWf("contactNotes", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* ── STEP 3: Payment Method ── */}
                  {step === 3 && (
                    <>
                      <p className="sb-step-heading">How would you like to pay?</p>
                      <div className="sb-pay-cards">
                        <div
                          className={`sb-pay-card${w.paymentMethod === "stripe" ? " sb-pay-card--selected" : ""}`}
                          onClick={() => setWf("paymentMethod", "stripe")}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && setWf("paymentMethod", "stripe")}
                        >
                          <p className="sb-pay-card-title">💳 Card via Stripe</p>
                          <p className="sb-pay-card-desc">Pay by debit or credit card. Secure checkout.</p>
                        </div>
                        <div
                          className={`sb-pay-card${w.paymentMethod === "bank" ? " sb-pay-card--selected" : ""}`}
                          onClick={() => setWf("paymentMethod", "bank")}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && setWf("paymentMethod", "bank")}
                        >
                          <p className="sb-pay-card-title">🏦 Bank Transfer</p>
                          <p className="sb-pay-card-desc">Transfer directly to our Metro Bank account.</p>
                        </div>
                      </div>

                      {w.paymentMethod === "stripe" && (
                        <div className="sb-stripe-placeholder">
                          <div className="sb-field">
                            <label className="sb-label">Card Number</label>
                            <input
                              className="sb-input"
                              placeholder="1234 5678 9012 3456"
                              value={w.stripeCard}
                              onChange={(e) => setWf("stripeCard", e.target.value)}
                              maxLength={19}
                            />
                          </div>
                          <div className="sb-field-grid">
                            <div className="sb-field">
                              <label className="sb-label">Expiry</label>
                              <input
                                className="sb-input"
                                placeholder="MM / YY"
                                value={w.stripeExpiry}
                                onChange={(e) => setWf("stripeExpiry", e.target.value)}
                                maxLength={7}
                              />
                            </div>
                            <div className="sb-field">
                              <label className="sb-label">CVC</label>
                              <input
                                className="sb-input"
                                placeholder="123"
                                value={w.stripeCvc}
                                onChange={(e) => setWf("stripeCvc", e.target.value)}
                                maxLength={4}
                              />
                            </div>
                          </div>
                          <div className="sb-field">
                            <label className="sb-label">Cardholder Name</label>
                            <input
                              className="sb-input"
                              placeholder="Name on card"
                              value={w.stripeHolder}
                              onChange={(e) => setWf("stripeHolder", e.target.value)}
                            />
                          </div>
                          <p className="sb-stripe-note">
                            Stripe integration coming soon — submitting registers your interest and
                            we will contact you to arrange payment.
                          </p>
                        </div>
                      )}

                      {w.paymentMethod === "bank" && (
                        <div className="sb-bank-details">
                          <div className="sb-bank-row">
                            <span className="sb-bank-key">Account Name</span>
                            <span className="sb-bank-val">LIFEFM CIC</span>
                          </div>
                          <div className="sb-bank-row">
                            <span className="sb-bank-key">Sort Code</span>
                            <span className="sb-bank-val">{sortCode}</span>
                          </div>
                          <div className="sb-bank-row">
                            <span className="sb-bank-key">Account Number</span>
                            <span className="sb-bank-val">{accountNumber}</span>
                          </div>
                          <div className="sb-bank-row">
                            <span className="sb-bank-key">Reference</span>
                            <span className="sb-bank-val" style={{ color: "var(--accent)" }}>
                              {bankRef || "LIFEFM-[SHOW]-[NAME]"}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── STEP 4: Review & Confirm ── */}
                  {step === 4 && preview && (
                    <>
                      <p className="sb-step-heading">Review your booking</p>

                      <div className="sb-preview-card" style={{ marginBottom: "1.5rem" }}>
                        <p className="sb-preview-label">How your brand will appear</p>
                        <p className="sb-preview-show">{preview.line1}</p>
                        <p className="sb-preview-brand">{preview.line2}</p>
                        {preview.line3 && <p className="sb-preview-dj">{preview.line3}</p>}
                        {w.strapline && (
                          <p style={{ fontSize: "0.8rem", color: "var(--text-3)", marginTop: "0.25rem", fontStyle: "italic" }}>
                            {w.strapline}
                          </p>
                        )}
                      </div>

                      <table className="sb-review-table">
                        <tbody>
                          <tr>
                            <td>Show</td>
                            <td>{selectedShow.name}</td>
                          </tr>
                          <tr>
                            <td>Timeslot</td>
                            <td>{selectedShow.day} · {selectedShow.slot}</td>
                          </tr>
                          <tr>
                            <td>DJ</td>
                            <td>{selectedShow.dj}</td>
                          </tr>
                          <tr>
                            <td>Brand</td>
                            <td>{w.brandName}{w.strapline ? ` — ${w.strapline}` : ""}</td>
                          </tr>
                          <tr>
                            <td>Display Style</td>
                            <td>{DISPLAY_STYLES.find((s) => s.id === w.displayStyle)?.name ?? "Default"}</td>
                          </tr>
                          <tr>
                            <td>Name</td>
                            <td>{w.contactName}</td>
                          </tr>
                          <tr>
                            <td>Email</td>
                            <td>{w.contactEmail}</td>
                          </tr>
                          {w.contactPhone && (
                            <tr>
                              <td>Phone</td>
                              <td>{w.contactPhone}</td>
                            </tr>
                          )}
                          <tr>
                            <td>Payment</td>
                            <td>{w.paymentMethod === "bank" ? "Bank Transfer" : "Card via Stripe"}</td>
                          </tr>
                          {w.paymentMethod === "bank" && (
                            <tr>
                              <td>Reference</td>
                              <td style={{ color: "var(--accent)", fontWeight: 700 }}>{bankRef}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="sb-price-row">
                        <span className="sb-price-label">Monthly sponsorship</span>
                        <span>
                          <span className="sb-price-val">£{price}</span>
                          <span className="sb-price-per">/month</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="sb-wizard-footer">
                  {step > 1 ? (
                    <button className="sb-btn-back" onClick={() => setStep((s) => s - 1)}>
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}
                  {step < 4 ? (
                    <button
                      className="sb-btn-next"
                      onClick={() => setStep((s) => s + 1)}
                      disabled={
                        (step === 1 && !step1Valid) ||
                        (step === 2 && !step2Valid) ||
                        (step === 3 && !step3Valid)
                      }
                    >
                      Continue →
                    </button>
                  ) : (
                    <button
                      className="sb-btn-next"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? "Confirming…" : "Confirm Booking →"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Confirmation screen */
              <div className="sb-confirm">
                <div className="sb-confirm-icon">✓</div>
                <h2 className="sb-confirm-heading">Booking Confirmed</h2>
                <p className="sb-confirm-body">
                  Thanks {w.contactName.split(" ")[0]}! We&apos;ve received your sponsorship booking for{" "}
                  <strong>{selectedShow.name}</strong>. We&apos;ll be in touch at {w.contactEmail} to
                  finalise everything.
                </p>

                {/* Summary recap */}
                <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
                  <table className="sb-review-table">
                    <tbody>
                      <tr><td>Show</td><td>{selectedShow.name}</td></tr>
                      <tr><td>Timeslot</td><td>{selectedShow.day} · {selectedShow.slot}</td></tr>
                      <tr><td>Monthly Cost</td><td style={{ color: "var(--accent)", fontWeight: 700 }}>£{price}/month</td></tr>
                    </tbody>
                  </table>
                </div>

                {w.paymentMethod === "bank" && (
                  <div style={{ textAlign: "left", marginBottom: "2rem" }}>
                    <p className="sb-label" style={{ marginBottom: "0.75rem" }}>Bank transfer details</p>
                    <div className="sb-bank-details">
                      <div className="sb-bank-row">
                        <span className="sb-bank-key">Account Name</span>
                        <span className="sb-bank-val">LIFEFM CIC</span>
                      </div>
                      <div className="sb-bank-row">
                        <span className="sb-bank-key">Sort Code</span>
                        <span className="sb-bank-val">{sortCode}</span>
                      </div>
                      <div className="sb-bank-row">
                        <span className="sb-bank-key">Account Number</span>
                        <span className="sb-bank-val">{accountNumber}</span>
                      </div>
                      <div className="sb-bank-row">
                        <span className="sb-bank-key">Reference</span>
                        <span className="sb-bank-val" style={{ color: "var(--accent)" }}>{bankRef}</span>
                      </div>
                      <div className="sb-bank-row">
                        <span className="sb-bank-key">Amount</span>
                        <span className="sb-bank-val">£{price}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button className="sb-btn-next" onClick={closeWizard}>
                  Back to Shows
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
