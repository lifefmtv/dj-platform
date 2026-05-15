"use client";

import { useState } from "react";

/* ── Package data ─────────────────────────────────────────── */
const PACKAGES = [
  {
    badge: "Flagship",
    badgeType: "flagship",
    title: "Station Sponsor",
    hook: "Your brand, front and centre across everything",
    body: "The headline partnership. Your brand is woven into the fabric of LIFEFM.TV across all shows, all platforms, all the time. Maximum visibility, maximum association with 25 years of credibility.",
    includes: [
      "Prominent logo placement on the website homepage",
      "Named sponsorship credit on every show (\"LIFEFM.TV, brought to you by...\")",
      "Ad spots across the live stream throughout the week",
      "Dedicated sponsor page on the website",
      "Monthly social media brand features",
      "Quarterly partnership review",
    ],
  },
  {
    badge: "Most Flexible",
    badgeType: "popular",
    title: "Show Sponsor",
    hook: "Own a show. Own its audience.",
    body: "Align your brand directly with a specific show or DJ. Your sponsorship is presented as part of the experience — not an interruption. The show's loyal weekly audience becomes your audience.",
    includes: [
      "Branded intro and outro on your chosen show",
      "DJ shoutouts during the set",
      "Logo and credit on the show's page on the website",
      "Social media posts tied to each show's promotion",
      "Ad spots during your show's live stream window",
      "Choose by genre, timeslot or audience type",
    ],
  },
  {
    badge: "Genre Partner",
    badgeType: "flexible",
    title: "Genre Sponsor",
    hook: "Drum & bass. Dub. Soul. Tech house. Jungle.",
    body: "Sponsor everything in a particular genre. If your audience overlaps with a scene, this puts your brand at the heart of it — across all the shows, DJs, and listeners that live in that world.",
    includes: [
      "Branding across all shows in your chosen genre",
      "Genre landing page on the website featuring your brand",
      "Social posts and content tied to genre events and releases",
      "Ad spots across all shows in the genre",
    ],
  },
  {
    badge: "Digital",
    badgeType: "digital",
    title: "Live Stream Ads",
    hook: "Your message to an audience that's actually listening",
    body: "Pre-recorded ad spots broadcast directly during our live stream. Listeners are tuned in, engaged, and in the zone. This isn't background noise — this is active attention.",
    includes: [
      "Broadcast across our full 24/7 live stream",
      "Flexible frequency — daily, weekly, or show-specific",
      "We can help with simple ad production if needed",
      "Works standalone or alongside a broader package",
    ],
  },
  {
    badge: "Digital",
    badgeType: "digital",
    title: "Website Advertising",
    hook: "Permanent visibility on a growing platform",
    body: "Banner placements, show page branding, and featured listings on lifefm.tv. As the new site rolls out in 2026, website traffic is growing fast — early partners get the best positioning.",
    includes: [
      "Banner placements across the site",
      "Featured listing in our sponsor directory",
      "Show page or genre page branding",
      "Links and calls-to-action driving traffic directly to you",
    ],
  },
  {
    badge: "Digital",
    badgeType: "digital",
    title: "Social Media Package",
    hook: "Reach our community on their feeds",
    body: "Dedicated posts, stories, and shoutouts across the LIFEFM social channels. Authentic, community-led content that puts your brand where our audience already is.",
    includes: [
      "Branded posts and stories promoting your product or service",
      "Event or launch announcements to our following",
      "Tag campaigns and competitions to drive engagement",
      "Content created in the LIFEFM voice — authentic, not corporate",
    ],
  },
  {
    badge: "Equipment",
    badgeType: "equipment",
    title: "Kit Partnership",
    hook: "Put your gear at the heart of the sound",
    body: "Supply equipment — cameras, DJ gear, mics, computers, software, speakers — and we'll make sure your brand is seen and heard. Products on camera, credits on every broadcast, and a genuine story to tell.",
    includes: [
      "Your equipment featured prominently in all broadcasts",
      "\"Powered by [Brand]\" credits across shows and website",
      "Behind-the-scenes content showcasing your kit in use",
      "Great for brands wanting authentic product placement",
    ],
  },
  {
    badge: "Events",
    badgeType: "events",
    title: "Launch & Event Partner",
    hook: "Make some noise around your moment",
    body: "Got a product launch, event, or campaign? We can build a dedicated show, special broadcast, or listener competition around it. LIFEFM's audience is London's underground — exactly the crowd early-adopter brands need to reach.",
    includes: [
      "Dedicated broadcast or special show around your launch",
      "Listener competitions with your product as the prize",
      "Live coverage or promotion of your event",
      "Full social push to coincide with your campaign dates",
    ],
  },
];

const DELIVERABLES = [
  {
    item: "On-air shoutouts",
    desc: "Your brand mentioned by name during live shows — natural, not scripted. Heard by everyone tuned in at that moment.",
  },
  {
    item: "Live stream ad spots",
    desc: "Pre-recorded audio ads broadcast across our 24/7 live stream. Frequency tailored to your package.",
  },
  {
    item: "Website logo & branding",
    desc: "Your logo featured prominently on lifefm.tv — homepage, show pages, genre pages or your own dedicated sponsor page.",
  },
  {
    item: "Show sponsorship credit",
    desc: "\"This show is brought to you by [Your Brand]\" — heard at the start and end of every sponsored set.",
  },
  {
    item: "Social media posts",
    desc: "Branded posts across our channels promoting your product, service, event or campaign to our active following.",
  },
  {
    item: "Equipment / product placement",
    desc: "Your gear on camera during every broadcast — visible to live stream viewers and in all recorded footage.",
  },
  {
    item: "Listener competitions",
    desc: "We run a competition on-air and on social — prize is your product, your brand gets the spotlight and the engagement.",
  },
  {
    item: "Dedicated show or segment",
    desc: "A branded show or regular segment built entirely around your brand or product category. The deepest integration available.",
  },
  {
    item: "Event promotion",
    desc: "We promote your event, launch or campaign across shows and social in the lead-up. Ticket giveaways, previews, live coverage.",
  },
  {
    item: "Bespoke partnership",
    desc: "Don't see exactly what you need? Tell us your goals and budget and we'll build something around you. We're flexible.",
  },
];

/* ── Component ────────────────────────────────────────────── */
export default function SponsorPage() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    interest: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/sponsor-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "general", ...form }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setForm({ name: "", company: "", email: "", interest: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="sp-page">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="sp-hero">
        <div className="sp-hero-bg" aria-hidden />
        <p className="sp-tag">Sponsor &amp; Advertise</p>
        <h1 className="sp-hero-headline">
          Your Brand.<br /><em>Our Stage.</em>
        </h1>
        <p className="sp-hero-sub">
          Reach a loyal, passionate audience that doesn&apos;t scroll away. Our listeners stay tuned
          for the whole show — and your brand stays with them the entire time.
        </p>
        <div className="sp-stats">
          <div className="sp-stat">
            <span className="sp-stat-num">25</span>
            <span className="sp-stat-label">Years on Air</span>
          </div>
          <div className="sp-stat-divider" />
          <div className="sp-stat">
            <span className="sp-stat-num">2hrs</span>
            <span className="sp-stat-label">Average Session</span>
          </div>
          <div className="sp-stat-divider" />
          <div className="sp-stat">
            <span className="sp-stat-num">1000s</span>
            <span className="sp-stat-label">Loyal Listeners</span>
          </div>
          <div className="sp-stat-divider" />
          <div className="sp-stat">
            <span className="sp-stat-num">24/7</span>
            <span className="sp-stat-label">Live Streaming</span>
          </div>
        </div>
      </section>

      {/* ── THIS ISN'T SOCIAL MEDIA ───────────────────────── */}
      <section className="sp-section sp-scroll-section">
        <p className="sp-tag">The Difference</p>
        <h2 className="sp-heading">This Isn&apos;t Social Media</h2>
        <p className="sp-body-text">
          Social media gives you 3 seconds before someone scrolls past. LIFEFM gives you an audience
          that&apos;s with you for the whole journey.
        </p>
        <div className="sp-comparison-grid">
          <div className="sp-compare-col">
            <span className="sp-compare-badge sp-compare-badge--them">Social Media</span>
            <h3 className="sp-compare-title sp-compare-title--them">
              Here one second.<br />Gone the next.
            </h3>
            <ul className="sp-compare-list">
              <li>Average attention span under 8 seconds before scrolling</li>
              <li>Ad-blind audiences trained to skip and swipe</li>
              <li>Competing with thousands of other brands in the same feed</li>
              <li>No context, no environment — just noise</li>
              <li>Followers accumulated, rarely engaged with</li>
              <li>Algorithm-dependent reach that can disappear overnight</li>
            </ul>
          </div>
          <div className="sp-compare-col sp-compare-right">
            <span className="sp-compare-badge sp-compare-badge--us">LIFEFM.TV</span>
            <h3 className="sp-compare-title sp-compare-title--us">
              Two hours.<br />Every show.
            </h3>
            <ul className="sp-compare-list sp-compare-list--us">
              <li>Listeners tune in for a specific show and stay for the full set</li>
              <li>Your brand mentioned naturally throughout — not as an interruption</li>
              <li>One station, one audience, one culture — no competition in the room</li>
              <li>Authentic underground music environment builds trust by association</li>
              <li>Community built over 25 years — these aren&apos;t casual followers</li>
              <li>Direct relationship with listeners who are genuinely engaged</li>
            </ul>
          </div>
        </div>
        <blockquote className="sp-pull-quote">
          &ldquo;Our DJs don&apos;t have followers who scroll away. They have an audience that{" "}
          <em>turns up every week</em>, stays for two hours, and comes back the week after —
          because they love the music and they trust the station. That&apos;s 25 years of loyalty.{" "}
          <em>Your brand gets to be part of that.</em>&rdquo;
        </blockquote>
      </section>

      {/* ── BUILT ON 25 YEARS ────────────────────────────── */}
      <section className="sp-section sp-why-section">
        <p className="sp-tag">Why Us</p>
        <h2 className="sp-heading">Built on 25 Years of Trust</h2>
        <div className="sp-why-grid">
          {[
            {
              num: "01",
              title: "Pirate Radio Heritage",
              body: "LIFEFM started on the rooftops of London. We earned our audience the hard way — through passion, authenticity, and music that mattered. That credibility doesn't just stick with us. It sticks with the brands we work with too.",
            },
            {
              num: "02",
              title: "A Niche You Can't Buy Elsewhere",
              body: "Drum & bass. Dub. Jungle. Tech house. Soul. Our genres have always shaped mainstream culture — in fashion, lifestyle, tech, food and drink. Our audience are early adopters, taste-makers and loyal customers.",
            },
            {
              num: "03",
              title: "Not-for-Profit Integrity",
              body: "Every penny we generate goes back into the station. Your sponsorship funds cameras, equipment, studio rent and the shows your audience loves. That's a story worth telling your own customers.",
            },
            {
              num: "04",
              title: "Real People, Real Sessions",
              body: "Our listeners don't dip in and out. They tune in for their favourite show, stay for the full set, and tune in again next week. We give your brand two hours of contact time per session — not two seconds.",
            },
            {
              num: "05",
              title: "Growing Infrastructure",
              body: "A brand new website, video archive and live stream are rolling out in 2026, giving sponsors more surfaces, more visibility and better analytics than ever before. Get in early at the best rates.",
            },
            {
              num: "06",
              title: "Flexible, Honest Partnerships",
              body: "We don't do one-size-fits-all. Whether you're a local business or a national brand, we'll build something that works for your goals and budget. No hidden costs, no corporate runaround — just a proper conversation.",
            },
          ].map((card) => (
            <div key={card.num} className="sp-why-card">
              <span className="sp-why-num">{card.num}</span>
              <h3 className="sp-why-title">{card.title}</h3>
              <p className="sp-why-body">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PICK YOUR PACKAGE ────────────────────────────── */}
      <section className="sp-section" id="get-involved">
        <div className="sp-packages-intro">
          <div>
            <p className="sp-tag">Ways to Get Involved</p>
            <h2 className="sp-heading">Pick Your Package</h2>
          </div>
          <p className="sp-body-text" style={{ margin: 0 }}>
            Sponsor the whole station or align with a specific show, genre, or moment. Everything is
            negotiable — these are starting points, not rigid boxes.
          </p>
        </div>
        <div className="sp-options-grid">
          {PACKAGES.map((pkg) => (
            <div key={pkg.title} className="sp-option-card">
              <span className={`sp-badge sp-badge--${pkg.badgeType}`}>{pkg.badge}</span>
              <h3 className="sp-option-title">{pkg.title}</h3>
              <p className="sp-option-hook">{pkg.hook}</p>
              <p className="sp-option-body">{pkg.body}</p>
              <ul className="sp-option-includes">
                {pkg.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <a href="/sponsor/shows" className="sp-browse-btn">
            Browse Available Shows &amp; Book Online →
          </a>
        </div>
      </section>

      {/* ── EVERYTHING ON THE TABLE ──────────────────────── */}
      <section className="sp-section sp-offer-section">
        <p className="sp-tag">Full Breakdown</p>
        <h2 className="sp-heading">Everything on the Table</h2>
        <p className="sp-body-text">
          Here&apos;s the full list of what we offer. Mix and match — we&apos;ll build you something bespoke.
        </p>
        <table className="sp-offer-table">
          <thead>
            <tr>
              <th>What We Offer</th>
              <th>What It Means for You</th>
            </tr>
          </thead>
          <tbody>
            {DELIVERABLES.map((row) => (
              <tr key={row.item}>
                <td className="sp-offer-item">{row.item}</td>
                <td>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── NOT-FOR-PROFIT BANNER ────────────────────────── */}
      <div className="sp-nfp-banner">
        <h2 className="sp-nfp-heading">Not-for-profit.<br />All heart.</h2>
        <p className="sp-nfp-body">
          LIFEFM exists because of music, not money. Every sponsorship goes straight back into the
          station — better equipment, better broadcasts, better shows. When you sponsor us, you&apos;re
          part of keeping something real alive.
        </p>
      </div>

      {/* ── ENQUIRY ──────────────────────────────────────── */}
      <section className="sp-cta-section" id="contact">
        <div className="sp-cta-left">
          <h2 className="sp-cta-title">
            Let&apos;s Build<br />Something<br /><em>Together.</em>
          </h2>
          <p className="sp-cta-body">
            Whether you want to sponsor the whole station, back a specific show, or just have a
            conversation about what might work for your brand — we want to hear from you. Fill in
            the form and we&apos;ll get back to you personally.
          </p>
          <p className="sp-cta-note">
            No pushy sales calls. No corporate process. Just a proper chat about what we can do together.
          </p>
        </div>

        <div className="sp-cta-right">
          {status === "success" ? (
            <div className="sp-success">
              <p className="sp-success-heading">Enquiry received</p>
              <p className="sp-success-body">
                Thanks for getting in touch. We&apos;ll review your message and get back to you personally.
              </p>
              <button onClick={() => setStatus("idle")} className="sp-submit-btn">
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="sp-form">
              <input
                className="sp-input"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
              <input
                className="sp-input"
                type="text"
                placeholder="Company / Brand name"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
              <input
                className="sp-input"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
              <select
                className={`sp-input sp-select${!form.interest ? " sp-select--empty" : ""}`}
                value={form.interest}
                onChange={(e) => set("interest", e.target.value)}
              >
                <option value="">What are you interested in?</option>
                <option>Station Sponsorship</option>
                <option>Show Sponsorship</option>
                <option>Genre Sponsorship</option>
                <option>Live Stream Ads</option>
                <option>Website Advertising</option>
                <option>Social Media Package</option>
                <option>Kit Partnership</option>
                <option>Event Partner</option>
                <option>Not sure yet</option>
              </select>
              <textarea
                className="sp-input sp-textarea"
                placeholder="Tell us a bit about your brand and what you're hoping to achieve..."
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
              />
              {status === "error" && (
                <p style={{ color: "var(--accent)", fontSize: "0.875rem" }}>
                  Something went wrong. Please try again.
                </p>
              )}
              <button
                type="submit"
                className="sp-submit-btn"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Send Enquiry"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
