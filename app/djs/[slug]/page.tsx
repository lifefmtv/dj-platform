import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { genreColor } from "@/lib/genreColors";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("djs")
    .select("name,genre")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "DJ Not Found — Life FM TV" };
  return { title: `${data.name} — Life FM TV` };
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

  const socials: { label: string; href: string; icon: string }[] = [
    dj.instagram  && { label: "Instagram",  href: `https://instagram.com/${dj.instagram.replace("@","")}`,  icon: "IG" },
    dj.facebook   && { label: "Facebook",   href: dj.facebook,   icon: "FB" },
    dj.tiktok     && { label: "TikTok",     href: `https://tiktok.com/@${dj.tiktok.replace("@","")}`,      icon: "TT" },
    dj.twitter    && { label: "Twitter/X",  href: `https://twitter.com/${dj.twitter.replace("@","")}`,     icon: "X" },
    dj.mixcloud   && { label: "Mixcloud",   href: `https://mixcloud.com/${dj.mixcloud.replace("@","")}`,   icon: "MC" },
    dj.soundcloud && { label: "SoundCloud", href: dj.soundcloud, icon: "SC" },
  ].filter(Boolean) as { label: string; href: string; icon: string }[];

  return (
    <main>
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
