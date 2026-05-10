"use client";

import { useState } from "react";
import { submitShowApplication } from "@/app/actions/chatActions";

const GENRES = [
  "DNB",
  "House",
  "Techno",
  "Jungle",
  "Dub",
  "Soul & Funk",
  "Tech House",
  "Garage",
  "Breaks",
  "Ambient",
  "Other",
];

export default function SubmitPage() {
  const [form, setForm] = useState({
    full_name: "",
    dj_name: "",
    email: "",
    genre: "",
    mix_link: "",
    social_links: "",
    availability: "",
    about_show: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.dj_name || !form.email) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      await submitShowApplication(form);
      setStatus("success");
      setForm({
        full_name: "",
        dj_name: "",
        email: "",
        genre: "",
        mix_link: "",
        social_links: "",
        availability: "",
        about_show: "",
      });
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Submit a Show</h1>

      <p className="submit-intro">
        Want to broadcast on Life FM? Fill in the form below and we&apos;ll be in touch.
        We welcome DJs of all experience levels across every genre.
      </p>

      {status === "success" ? (
        <div className="submit-success">
          <p className="submit-success-heading">Application received</p>
          <p className="submit-success-body">
            Thanks for submitting. We&apos;ll review your application and get back to you at the email you provided.
          </p>
          <button
            className="submit-another-btn"
            onClick={() => setStatus("idle")}
          >
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="submit-form">
          <div className="submit-grid">
            <div className="submit-field">
              <label className="submit-label">Full Name *</label>
              <input
                className="submit-input"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Your legal name"
                required
              />
            </div>

            <div className="submit-field">
              <label className="submit-label">DJ Name *</label>
              <input
                className="submit-input"
                value={form.dj_name}
                onChange={(e) => set("dj_name", e.target.value)}
                placeholder="Your artist / DJ name"
                required
              />
            </div>

            <div className="submit-field">
              <label className="submit-label">Email *</label>
              <input
                className="submit-input"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="submit-field">
              <label className="submit-label">Genre</label>
              <select
                className="submit-input submit-select"
                value={form.genre}
                onChange={(e) => set("genre", e.target.value)}
              >
                <option value="">Select a genre…</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="submit-field submit-field--full">
              <label className="submit-label">Mix Link</label>
              <input
                className="submit-input"
                value={form.mix_link}
                onChange={(e) => set("mix_link", e.target.value)}
                placeholder="Mixcloud, SoundCloud, or any link to your mix"
              />
            </div>

            <div className="submit-field submit-field--full">
              <label className="submit-label">Social Links</label>
              <input
                className="submit-input"
                value={form.social_links}
                onChange={(e) => set("social_links", e.target.value)}
                placeholder="Instagram, Facebook, etc."
              />
            </div>

            <div className="submit-field submit-field--full">
              <label className="submit-label">Availability</label>
              <input
                className="submit-input"
                value={form.availability}
                onChange={(e) => set("availability", e.target.value)}
                placeholder="e.g. Weekends evenings, Friday nights…"
              />
            </div>

            <div className="submit-field submit-field--full">
              <label className="submit-label">About Your Show</label>
              <textarea
                className="submit-input submit-textarea"
                value={form.about_show}
                onChange={(e) => set("about_show", e.target.value)}
                placeholder="Tell us about your sound, your influences, and what you'd bring to Life FM…"
                rows={5}
              />
            </div>
          </div>

          {status === "error" && (
            <p className="submit-error">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending…" : "Submit Application"}
          </button>
        </form>
      )}
    </main>
  );
}
