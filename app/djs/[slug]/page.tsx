import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { genreColor } from "@/lib/genreColors";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifefm.tv";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: dj } = await supabase
    .from("djs")
    .select("name, genre, bio, show_name, photo_url")
    .eq("slug", slug)
    .single();

  if (!dj) return { title: "DJ Not Found" };

  const title = dj.show_name ? `${dj.name} — ${dj.show_name}` : dj.name;
  const description = dj.bio
    ? dj.bio.slice(0, 155).trimEnd() + (dj.bio.length > 155 ? "…" : "")
    : `${dj.name} is a resident DJ on LIFEFM.TV playing ${dj.genre}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | LIFEFM.TV`,
      description,
      url: `${siteUrl}/djs/${slug}`,
      images: dj.photo_url
        ? [{ url: dj.photo_url, alt: `${dj.name} — LIFEFM.TV DJ` }]
        : undefined,
    },
    alternates: { canonical: `${siteUrl}/djs/${slug}` },
  };
}

function buildSocialHref(base: string, handle: string): string {
  return handle.startsWith("http") ? handle : `${base}/${handle.replace("@", "")}`;
}

export default async function DJProfilePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: dj } = await supabase
    .from("djs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!dj) notFound();

  const color = genreColor(dj.genre);

  // Fetch upcoming shows
  const today = new Date().toISOString().split("T")[0];
  const { data: shows } = await supabase
    .from("schedule")
    .select("*")
    .ilike("dj_name", dj.name)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(5);

  // Fetch mixes
  const { data: mixes } = await supabase
    .from("mixes")
    .select("*")
    .ilike("artist", dj.name)
    .order("created_at", { ascending: false })
    .limit(6);

  // Socials — handles both full URLs and bare handles.
  // If soundcloud field holds a Bandcamp URL it's excluded here (dedicated label section below).
  const isBandcamp = (url: string) => url.includes("bandcamp.com");

  const socials: { label: string; href: string; icon: string }[] = [
    dj.instagram  && { label: "Instagram",  href: buildSocialHref("https://instagram.com",  dj.instagram),  icon: "IG" },
    dj.facebook   && { label: "Facebook",   href: dj.facebook,                                              icon: "FB" },
    dj.tiktok     && { label: "TikTok",     href: buildSocialHref("https://tiktok.com/@",   dj.tiktok),     icon: "TT" },
    dj.twitter    && { label: "Twitter/X",  href: buildSocialHref("https://twitter.com",    dj.twitter),    icon: "X"  },
    dj.mixcloud   && { label: "Mixcloud",   href: buildSocialHref("https://mixcloud.com",   dj.mixcloud),   icon: "MC" },
    dj.soundcloud && !isBandcamp(dj.soundcloud) && { label: "SoundCloud", href: dj.soundcloud, icon: "SC" },
  ].filter(Boolean) as { label: string; href: string; icon: string }[];

  const bandcampUrl = dj.soundcloud && isBandcamp(dj.soundcloud) ? dj.soundcloud : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: dj.name,
    jobTitle: "DJ",
    description: dj.bio || undefined,
    url: `${siteUrl}/djs/${dj.slug}`,
    image: dj.photo_url || undefined,
    sameAs: [dj.instagram, dj.facebook, dj.soundcloud, dj.mixcloud]
      .filter(Boolean)
      .filter((h) => (h as string).startsWith("http")),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ── */}
      <div className="dj-hero">
        {dj.photo_url && (
          <Image
            src={dj.photo_url}
            alt={dj.name}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "top center" }}
          />
        )}
        <div className="dj-hero-overlay" />
        <div className="dj-hero-content">
          <a href="/djs" className="back-link dj-back-link">← The Selectors</a>
          <div className="dj-hero-meta">
            <span
              className="dj-genre-badge dj-genre-badge--hero"
              style={{ background: `${color}22`, color, borderColor: `${color}55` }}
            >
              {dj.genre}
            </span>
            {dj.is_resident && <span className="dj-resident-badge">Resident</span>}
          </div>
          <h1 className="dj-hero-name">{dj.name}</h1>
          {dj.show_name && <p className="dj-hero-show">{dj.show_name}</p>}
          {dj.show_schedule && <p className="dj-hero-schedule">{dj.show_schedule}</p>}
        </div>
      </div>

      {/* ── Profile body ── */}
      <div className="dj-profile-body">

        {/* Bio */}
        {dj.bio && (
          <section className="dj-section">
            <p className="dj-section-label">About</p>
            <p className="dj-bio">{dj.bio}</p>
          </section>
        )}

        {/* ── SHERE KHAN RECORDS ── */}
        {dj.slug === "shere-khan" && (
          <section className="dj-section">
            <p className="dj-section-label">Shere Khan Records</p>
            <div className="dj-profile-card">
              <div className="dj-profile-card-accent" style={{ background: "#f59e0b" }} />
              <div className="dj-profile-card-body">
                <p className="dj-profile-card-eyebrow" style={{ color: "#f59e0b" }}>Independent Label</p>
                <p className="dj-profile-card-title">Shere Khan Records</p>
                <p className="dj-profile-card-sub">
                  An independent roots and dub label releasing music from Vivian Jones, Fikir Amlak,
                  Joshua Hales, Haroon Ayyaz, Nia Songbird, Joe 9000 Dub and more.
                </p>
                <div className="dj-card-buttons">
                  <a
                    href="https://sherekhansound.bandcamp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dj-card-btn dj-card-btn--gold"
                  >
                    Listen on Bandcamp
                  </a>
                  <a
                    href="https://open.spotify.com/artist/6GV3yNVFOO02NBRWX8ld04"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dj-card-btn dj-card-btn--outline"
                  >
                    Listen on Spotify
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── ROOTS ON THE CORNER ── */}
        {dj.slug === "shere-khan" && (
          <section className="dj-section">
            <p className="dj-section-label">Roots on the Corner</p>
            <div className="dj-profile-card">
              <div className="dj-profile-card-accent" style={{ background: "#22c55e" }} />
              <div className="dj-profile-card-body">
                <p className="dj-profile-card-eyebrow" style={{ color: "#22c55e" }}>Live Events</p>
                <p className="dj-profile-card-title">Roots on the Corner</p>
                <p className="dj-profile-card-sub">
                  Shere Khan is a regular at Roots on the Corner — London&apos;s premier roots reggae
                  and sound system clash event. Check the next event at rotc.uk
                </p>
                <div className="dj-card-buttons">
                  <a
                    href="https://www.rotc.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dj-card-btn dj-card-btn--outline"
                  >
                    Visit ROTC →
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── SOUNDCLOUD EMBED (Shere Khan) ── */}
        {dj.slug === "shere-khan" && (
          <section className="dj-section">
            <p className="dj-section-label">Latest Shows on SoundCloud</p>
            <div className="dj-soundcloud-embed">
              <iframe
                width="100%"
                height="450"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/users/shere-khan-sound&color=%23f59e0b&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        {/* ── DUBLIFE ARCHIVE (DJ Kullar) ── */}
        {dj.slug === "dj-kullar" && (
          <section className="dj-section">
            <p className="dj-section-label">DUBLIFE Archive</p>
            <a
              href="https://archive.org/search?query=dublife+kullar"
              target="_blank"
              rel="noopener noreferrer"
              className="dj-archive-card"
            >
              <div className="dj-archive-card-accent" />
              <div className="dj-archive-card-body">
                <p className="dj-archive-card-eyebrow">Internet Archive</p>
                <p className="dj-archive-card-title">
                  Browse 15+ Years of DUBLIFE Archives on Internet Archive
                </p>
                <p className="dj-archive-card-sub">
                  Hundreds of shows · Deep roots, steppers, digital dub · Special guests from across the global dub scene
                </p>
                <span className="dj-archive-card-cta">Browse the archive →</span>
              </div>
            </a>
          </section>
        )}

        {/* ── ROOTS YOUTHS RECORDS (DJ Kullar / any Bandcamp label) ── */}
        {bandcampUrl && (
          <section className="dj-section">
            <p className="dj-section-label">Roots Youths Records</p>
            <a
              href={bandcampUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dj-label-card"
            >
              <div className="dj-label-card-inner">
                <div>
                  <p className="dj-label-card-name">Roots Youths Records</p>
                  <p className="dj-label-card-sub">
                    Independent label championing authentic roots & dub sounds · Listen on Bandcamp
                  </p>
                </div>
                <span className="dj-label-card-btn">Open Bandcamp →</span>
              </div>
            </a>
          </section>
        )}

        {/* Socials */}
        {socials.length > 0 && (
          <section className="dj-section">
            <p className="dj-section-label">Find Me</p>
            <div className="dj-socials">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dj-social-link"
                >
                  <span className="dj-social-icon">{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming shows */}
        {shows && shows.length > 0 && (
          <section className="dj-section">
            <p className="dj-section-label">Upcoming Shows</p>
            <div className="schedule-card">
              {shows.map((event) => (
                <div key={event.id} className="schedule-event-row">
                  <div>
                    <p className="schedule-dj-name">
                      {format(parseISO(event.date + "T00:00:00"), "EEEE d MMMM yyyy")}
                    </p>
                    {event.description && (
                      <p className="schedule-description">{event.description}</p>
                    )}
                  </div>
                  <span className="schedule-time">
                    {event.start_time.slice(0, 5)} — {event.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mixes */}
        {mixes && mixes.length > 0 && (
          <section className="dj-section">
            <p className="dj-section-label">Mixes</p>
            <div className="dj-mixes-list">
              {mixes.map((mix) => (
                <div key={mix.id} className="dj-mix-row">
                  <div>
                    <p className="dj-mix-title">{mix.title}</p>
                    <p className="dj-mix-date">
                      {format(new Date(mix.created_at), "d MMM yyyy")}
                    </p>
                  </div>
                  <audio
                    controls
                    src={mix.audio_url}
                    style={{ accentColor: "#e63030", minWidth: 0, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
