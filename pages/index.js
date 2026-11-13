// pages/index.js
import Link from "next/link";

export default function Home() {
  return (
    <div className="home">
      <div className="container">
        {/* ===== Top: START YOUR ORDER + buttons (centered) =====
            Two markups, one CSS-toggled pair (.start-row / .mobile-start-row)
            — both always render; only visibility flips at the mobile
            breakpoint. Kept this way (not a JS width check) because this
            content is part of the page's initial server render, where a
            JS-only decision would disagree with the server's guess and
            cause a visible flash/hydration warning on real phones. */}
        <div className="start-row">
          <h1 className="home-title">START YOUR ORDER</h1>

          <Link href="/order?method=delivery" className="button start-btn">Delivery</Link>
          <span className="order-or" aria-hidden="true">or</span>
          <Link href="/order?method=carryout" className="button start-btn">Carryout</Link>
        </div>

        <div className="mobile-start-row">
          <Link href="/order" className="button mobile-start-btn">Order Online</Link>
        </div>

        {/* ===== Deals collage ===== */}
        <section className="deals-wrap">
          {/* Row 1: 577x519 + (341x254 stacked) */}
          <div className="deals-grid-1">
            <Link href="/menu" className="tile tile-577x519">
              <img src="/images/home/deal-577x519.jpg" alt="Deal — large feature" />
            </Link>

            <div className="deals-right">
              <Link href="/menu" className="tile tile-341x254">
                <img src="/images/home/deal-341x254-a.jpg" alt="Deal — top right" />
              </Link>
              <Link href="/menu" className="tile tile-341x254">
                <img src="/images/home/deal-341x254-b.jpg" alt="Deal — bottom right" />
              </Link>
            </div>
          </div>

          {/* Gap then 928x140 image/button */}
          <Link href="/menu" className="tile tile-928x140">
            <img src="/images/home/deal-928x140-a.jpg" alt="Limited-time offer" />
          </Link>

          {/* Gap then 928x140 image/button */}
          <Link href="/menu" className="tile tile-928x140">
            <img src="/images/home/deal-928x140-b.jpg" alt="Online coupons" />
          </Link>

          {/* Gap then 928x250 image/button */}
          <Link href="/menu" className="tile tile-928x250">
            <img src="/images/home/deal-928x250.jpg" alt="Family bundle" />
          </Link>

          {/* Gap then 928x148 image/button */}
          <Link href="/menu" className="tile tile-928x148">
            <img src="/images/home/deal-928x148.jpg" alt="Sides & desserts" />
          </Link>
        </section>

        {/* ===== Footer disclaimers with centered logo ===== */}
        <footer className="home-footer">
          <div className="disclaimers">
            <p className="disc disc-left">
              Prices and participation may vary. Limited time offers subject to change.
            </p>

            <div className="footer-logo">
              <img src="/images/storelogo.svg" alt="Red Stone Pizza" />
            </div>

            <p className="disc disc-right">
              Delivery areas, charges, and minimums apply. Taxes extra where applicable.
            </p>
          </div>
        </footer>
      </div>

      {/* ===== Styles (scoped) ===== */}
      <style jsx>{`
        .home :global(.container) {}

        /* Top row */
        .start-row {
          margin: 28px 0 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          text-align: center;
        }
        .home-title {
          margin: 0 10px 0 0;
          font-family: 'Oswald', sans-serif;
          font-weight: 900;
          letter-spacing: 0.5px;
          font-size: 1.9rem;
          line-height: 1;
          color: var(--brand-blue);
        }
        .start-btn { padding: 0.6rem 1.1rem; font-weight: 800; }

        /* Mobile-only single CTA — hidden by default, swapped in for
           .start-row at the same 640px breakpoint used elsewhere on this
           page (see the existing @media (max-width: 640px) block below). */
        .mobile-start-row {
          display: none;
          margin: 28px 0 24px;
          text-align: center;
        }
        /* Mobile "Order Online": long red pill with heavy condensed text */
        .mobile-start-row :global(.mobile-start-btn) {
          display: block;
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          padding: 0.85rem 1.25rem;
          background: #ea3323;
          color: #fff;
          border-radius: 999px;
          font-family: var(--font-display);
          font-weight: 400;
          font-size: 1.55rem;
          line-height: 1.15;
          letter-spacing: 0.04em;
          text-align: center;
          box-shadow: 0 4px 14px rgba(234, 51, 35, 0.35);
        }
        .mobile-start-row :global(.mobile-start-btn:hover),
        .mobile-start-row :global(.mobile-start-btn:active) {
          background: #d42a1b;
        }
        .order-or {
          font-family: "Hoefler Text", "Times New Roman", serif;
          color: #a9a9a9;
          font-size: 0.95rem;
          line-height: 1;
          user-select: none;
        }

        /* Collage scaffold
           Make every child share ONE centered column whose inline size is min(100%, 928px).
           This avoids intrinsic-width quirks (e.g., column-gap not contributing to item width). */
        .deals-wrap {
          margin: 6px auto 28px;
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 928px);
          justify-content: center; /* center the single column */
        }
        /* Every row/item should fill the column */
        .deals-wrap > * {
          width: 100%;
        }

        .deals-grid-1 {
          display: grid;
          grid-template-columns: 577px 341px;
          column-gap: 10px; /* 577 + 10 + 341 = 928 total */
          width: 100%;
        }
        .deals-right {
          display: grid;
          grid-template-rows: 254px 254px;
          row-gap: 11px; /* 254 + 11 + 254 = 519 */
        }

        .tile {
          display: block;
          position: relative;
          width: 100%;
          overflow: hidden;
          border: 1px solid #e9e9e9;
          border-radius: 6px;
          background: #fff;
          box-shadow: var(--shadow);
          box-sizing: border-box; /* include border in set width/height */
        }
        .tile img { display: block; width: 100%; height: 100%; object-fit: cover; }

        .tile-577x519 { aspect-ratio: 577 / 519; }
        .tile-341x254 { aspect-ratio: 341 / 254; }
        .tile-928x140 { aspect-ratio: 928 / 140; }
        .tile-928x250 { aspect-ratio: 928 / 250; }
        .tile-928x148 { aspect-ratio: 928 / 148; }

        /* Footer disclaimers + logo */
        .home-footer { margin: 28px 0 36px; }
        .disclaimers {
          max-width: 928px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
        }
        .disc { color: #888; font-size: 0.85rem; line-height: 1.35; }
        .footer-logo img {
          width: 42px; height: 42px; object-fit: contain; display: block;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
        }

        .tile:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }

        @media (max-width: 1024px) {
          .deals-grid-1 { grid-template-columns: 1fr; row-gap: 12px; }
          .deals-right { grid-template-rows: none; grid-template-columns: 1fr 1fr; column-gap: 10px; }
          .tile-577x519 { aspect-ratio: 16 / 9; }
        }

        @media (max-width: 640px) {
          .start-row { display: none; }
          .mobile-start-row { display: block; }
          .deals-right { grid-template-columns: 1fr; row-gap: 12px; }

          .disclaimers { grid-template-columns: 1fr; text-align: center; }
        }
      `}</style>
    </div>
  );
}
