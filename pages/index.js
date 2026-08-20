// pages/index.js
import Link from "next/link";

/** Temporary inline SVG (300x92). Replace with your own later. */
function RewardsLogo(props) {
  return (
    <svg
      viewBox="0 0 300 92"
      width="300"
      height="92"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Red Stone Rewards"
      {...props}
    >
      <defs>
        <linearGradient id="rsBlueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b61d6" />
          <stop offset="100%" stopColor="#006491" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="300" height="92" fill="url(#rsBlueGrad)" />
      <g>
        <text
          x="18"
          y="40"
          fill="#ffffff"
          fontFamily="Oswald, Montserrat, Arial, sans-serif"
          fontWeight="700"
          fontSize="22"
          letterSpacing="1"
        >
          RED STONE
        </text>
        <text
          x="18"
          y="70"
          fill="#ffffff"
          fontFamily="Oswald, Montserrat, Arial, sans-serif"
          fontWeight="900"
          fontSize="28"
          letterSpacing="1.2"
        >
          REWARDS
        </text>
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <div className="home">
      <div className="container">
        {/* ===== Top: START YOUR ORDER + buttons (centered) ===== */}
        <div className="start-row">
          <h1 className="home-title">START YOUR ORDER</h1>

          <Link href="/menu" className="button start-btn">Delivery</Link>
          <span className="order-or" aria-hidden="true">or</span>
          <Link href="/menu" className="button start-btn">Carryout</Link>
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

          {/* Gap then 928x140 rewards banner (SVG + text + button) */}
          <div className="rewards-928x140">
            <img src="/images/home/rewards-logo.svg" alt="Red Stone Rewards" className="rewards-svg" />
            <div className="rewards-copy">
              <div className="rewards-title">EARN FREE RED STONE EVERY 2 ORDERS</div>
              <div className="rewards-sub">1 Order of $10 or more = 10 points</div>
            </div>
            <Link href="/rewards" className="button rewards-cta">Join Now</Link>
          </div>

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
              <img src="/images/logo_small.png" alt="Red Stone Pizza" />
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

        /* Rewards banner (styled like a tile) */
        .rewards-928x140 {
          border: 1px solid #e9e9e9;
          border-radius: 6px;
          background: #fff;
          box-shadow: var(--shadow);
          box-sizing: border-box;

          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 16px;
          padding: 12px 16px;

          aspect-ratio: 928 / 140;
          width: 100%;
        }
        .rewards-svg {
          width: 300px;
          height: 92px;
          flex: 0 0 auto;
          display: block;
        }
        .rewards-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }
        .rewards-title {
          font-family: 'Oswald', sans-serif;
          font-weight: 900;
          font-size: 1.35rem;
          letter-spacing: 0.4px;
          color: var(--brand-blue);
          line-height: 1.1;
        }
        .rewards-sub { color: #777; font-size: 0.95rem; }
        .rewards-cta {
          margin-left: auto;
          align-self: center;
          padding: 0.55rem 0.95rem;
          font-weight: 900;
        }

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
          .start-row { gap: 10px; }
          .home-title { font-size: 1.6rem; margin-right: 0; }
          .deals-right { grid-template-columns: 1fr; row-gap: 12px; }

          .rewards-928x140 {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            aspect-ratio: auto;
          }
          .rewards-svg { width: 100%; height: auto; }
          .rewards-cta { margin-left: 0; align-self: flex-start; }

          .disclaimers { grid-template-columns: 1fr; text-align: center; }
        }
      `}</style>
    </div>
  );
}
