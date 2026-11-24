// components/LegalPage.js
//
// Shared layout for the Privacy Policy (pages/privacy.js) and Terms of
// Ordering (pages/terms.js): title, "last updated" line, then sections.
// sections: [{ heading, body: [paragraph strings or React nodes] }]
import Link from "next/link";

export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <main className="container legal">
      <h1 className="menu-title legal-title">{title}</h1>
      <p className="legal-updated">Last updated: {updated}</p>
      {intro && <p className="legal-intro">{intro}</p>}

      <div className="legal-card">
        {sections.map((s) => (
          <section key={s.heading} className="legal-section">
            <h2>{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
      </div>

      <p className="legal-other">
        See also: <Link href="/privacy">Privacy Policy</Link>, <Link href="/terms">Terms of Ordering</Link>,{" "}
        <Link href="/contact">Contact Us</Link>
      </p>

      <style jsx>{`
        .legal {
          max-width: 860px;
          padding-top: 24px;
          padding-bottom: 40px;
          color: var(--text-brown);
        }
        .legal-title {
          margin: 0 0 4px;
        }
        .legal-updated {
          margin: 0 0 14px;
          font-size: var(--fs-sm);
          font-weight: var(--w-medium);
        }
        .legal-intro {
          margin: 0 0 16px;
          font-size: var(--fs-base);
          line-height: 1.5;
        }
        .legal-card {
          padding: 6px 20px 8px;
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
        }
        .legal-section {
          padding: 14px 0;
          border-bottom: 1px solid var(--menu-box-border);
        }
        .legal-section:last-child {
          border-bottom: 0;
        }
        .legal-section h2 {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: var(--fs-lg);
          line-height: 1.1;
          text-transform: uppercase;
          color: #000;
        }
        .legal-section p {
          margin: 0 0 10px;
          font-size: var(--fs-base);
          font-weight: var(--w-regular);
          line-height: 1.55;
        }
        .legal-section p:last-child {
          margin-bottom: 0;
        }
        .legal-other {
          margin: 18px 0 0;
          font-size: var(--fs-sm);
        }
        .legal :global(a) {
          color: #8b1a1a;
          font-weight: var(--w-semibold);
        }
        @media (max-width: 640px) {
          .legal-card {
            padding: 4px 14px 6px;
          }
        }
      `}</style>
    </main>
  );
}
