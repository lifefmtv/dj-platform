import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Life FM TV",
};

export default function AboutPage() {
  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Founders</h1>

      {/* Founder cards */}
      <div className="founders-grid">
        {/* Paul Roast */}
        <div className="founder-card">
          <div className="founder-card-accent" />
          <h2 className="founder-name">Paul Roast</h2>
          <p className="founder-role">Founder</p>
          <p className="founder-bio">
            The original bad boy MC, bringing the underground sound pirate stylie. Paul Roast
            is the original founder of LIFEFM.TV with a long history in the UK music scene.
            One of the original founders of the jungle rave Sunday Roast, as well as a string
            of other events from the 80s right through to today. He promotes new and exciting
            talent from all over the country, giving them a platform to showcase their skills
            to a wider and engaged audience of likeminded souls.
          </p>
        </div>

        {/* Mel Lioness */}
        <div className="founder-card">
          <div className="founder-card-accent" />
          <h2 className="founder-name">Mel Lioness</h2>
          <p className="founder-role">Co-Founder &amp; DJ</p>
          <p className="founder-bio">
            Co-founder turned DJ, Mel Lioness has gone from organising the monthly DJ rosters
            and working behind the scenes to pushing her way front and centre on the live
            stream. She plays different music styles on LIFEFM.TV with a record bag full of
            jumpy Tech House bangers. Catch her soon and join in with the good time vibes.
          </p>
        </div>
      </div>

      {/* Documentary section */}
      <section className="documentary-section">
        <h2 className="documentary-heading">A London Somet&apos;ing Dis</h2>
        <p className="documentary-subheading">1993 Jungle Documentary</p>
        <div className="documentary-embed-wrap">
          {/* REPLACE WITH ACTUAL VIDEO URL */}
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="A London Somet'ing Dis — 1993 Jungle Documentary"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>
    </main>
  );
}
