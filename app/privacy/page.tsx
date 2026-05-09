import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Life FM TV",
};

export default function PrivacyPage() {
  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>

      {/* ── Privacy Policy ──────────────────────────── */}
      <h1 className="page-heading">Privacy Policy</h1>

      <div className="policy-content">
        <p className="policy-intro">
          Any information you provide about yourself (&ldquo;personal information&rdquo;)
          LifeFM.TV will only be used in accordance with this privacy policy. This privacy
          policy outlines how we collect and deal with personal information and your rights
          regarding the personal information you provide to us.
        </p>

        <div className="policy-section">
          <h2 className="policy-section-title">1 — Collection of Information</h2>
          <p className="policy-text">
            We collect personal information from you through your interaction via our websites
            or other media. This may occur when you participate in, or sign up to, any of
            LifeFM&apos;s services, such as competitions, or if you use any of our apps, or join
            any subscription service. The information we collect will vary depending on the
            service you request but could include name, address, phone number, email address,
            username, password, age, gender, date of birth, comments and/or competition
            answers. We also collect certain information through the use of cookies and other
            similar automated means.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">2 — Use of Information</h2>
          <p className="policy-text">
            We will use your personal information to provide, administer and communicate with
            you about our services and promotions, to send you marketing communications about
            content, products and events that you might be interested in, and to analyse and
            improve the services we offer. We will only send you third-party marketing
            communications if you have specifically opted in.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">3 — Sharing Information</h2>
          <p className="policy-text">
            We will not sell, trade, rent or otherwise pass on your personal information to
            others except as described in this policy or with your prior consent. We may share
            personal information with service providers who perform functions on our behalf. We
            may disclose personal information to comply with applicable laws or when requested
            by law enforcement agencies.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">5 — Transferring Data</h2>
          <p className="policy-text">
            We may transfer your personal information to countries other than the country in
            which it was originally collected. Our servers are situated in the UK. When you
            submit your details you agree to the data being transferred to the UK and processed
            under the terms of the Data Protection Act 1998 and the Privacy and Electronic
            Communications Regulations 2003.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">6 — Your Rights</h2>
          <p className="policy-text">
            You have the right to request that we cease sending marketing communications to you
            by contacting us at{" "}
            <a href="mailto:LifeFMHQ@gmail.com" className="policy-link">
              LifeFMHQ@gmail.com
            </a>{" "}
            with &ldquo;PRIVACY&rdquo; in the subject line. You may also request access to the personal
            information we hold about you by emailing{" "}
            <a href="mailto:LifeFMHQ@gmail.com" className="policy-link">
              LifeFMHQ@gmail.com
            </a>{" "}
            with &ldquo;Personal Information Request&rdquo; in the subject line.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">7 — Third Party Websites</h2>
          <p className="policy-text">
            When you click on links on our site you will leave our site and go to a third party
            site outside of our control. Our privacy policy does not apply to these sites.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">8 — Changes</h2>
          <p className="policy-text">
            We reserve the right to change our privacy policy from time to time to comply with
            relevant legislation. All changes will be posted here.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">9 — Contact</h2>
          <p className="policy-text">
            If you have any questions about this privacy policy please contact us at{" "}
            <a href="mailto:LifeFMHQ@gmail.com" className="policy-link">
              LifeFMHQ@gmail.com
            </a>{" "}
            with &ldquo;PRIVACY&rdquo; in the subject line.
          </p>
        </div>
      </div>

      {/* ── Terms & Conditions ──────────────────────── */}
      <h1 className="page-heading" style={{ marginTop: "4rem" }}>
        Terms &amp; Conditions
      </h1>

      <div className="policy-content">
        <div className="policy-section">
          <h2 className="policy-section-title">Access &amp; Permitted Use</h2>
          <p className="policy-text">
            Access to LifeFM.TV is provided for personal, non-commercial use only. You agree
            not to use this site in any way that is unlawful or harmful, or that could damage
            the reputation of LifeFM.TV. We reserve the right to restrict or terminate access
            to any user at any time without notice.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">Intellectual Property</h2>
          <p className="policy-text">
            All content on LifeFM.TV — including but not limited to audio recordings, mixes,
            artwork, logos, text and video — is the intellectual property of LifeFM.TV or its
            licensors. You may not copy, reproduce, distribute, publicly perform, transmit or
            create derivative works from any content on this site without prior written consent
            from LifeFM.TV.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">Third Party Content Disclaimer</h2>
          <p className="policy-text">
            LifeFM.TV may feature links to or content from third party websites and services.
            We are not responsible for the content, accuracy or availability of third party
            sites. The inclusion of any link does not imply endorsement by LifeFM.TV.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">Data Protection</h2>
          <p className="policy-text">
            Your use of this site is also governed by our Privacy Policy, which is incorporated
            into these terms by reference. By using this site you consent to the collection and
            use of your data as described in the Privacy Policy above.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">Limitation of Liability</h2>
          <p className="policy-text">
            LifeFM.TV is provided on an &ldquo;as is&rdquo; basis. To the fullest extent permitted by
            law, LifeFM.TV excludes all liability for loss or damage of any kind arising from
            your use of this site, including but not limited to loss of data, interruption of
            service or any indirect or consequential loss.
          </p>
        </div>

        <div className="policy-section">
          <h2 className="policy-section-title">Jurisdiction</h2>
          <p className="policy-text">
            These terms and conditions are governed by and construed in accordance with the
            laws of England and Wales. Any disputes arising from these terms shall be subject
            to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </div>
      </div>
    </main>
  );
}
