// components/promos/SoftClubCard.js
//
// Home page promo banner for the Party Combo, in the Gen X "soft club" style
// (late 90s / early 2000s): icy pastel blue and lilac, frosted glass panels,
// glossy see-through bubbles, chrome, a faint perspective grid, and wide
// techno lettering (Michroma) with a pearly chrome price.
//
// Two layouts from one card (container queries on the card's own shape):
//   - phones (16:9): words + price on the left, food on a glass disc right
//   - laptops (the 928x250 banner): food | glass panel with words | price, button
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "party";

export default function SoftClubCard() {
  const deal = findDealById(DEAL_ID);
  const price = ((deal?.price ?? 6499) / 100).toFixed(2);

  return (
    <div className="sc">
      <div className="sc-bg" aria-hidden="true" />
      <div className="sc-grid" aria-hidden="true" />
      <div className="sc-ring sc-ring--a" aria-hidden="true" />
      <div className="sc-ring sc-ring--b" aria-hidden="true" />
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`sc-bubble sc-bubble--${i}`} aria-hidden="true" />
      ))}

      <div className="sc-food" aria-hidden="true">
        <div className="sc-disc" />
        <img className="sc-img sc-img--bottle" src="/images/drinks/2l-pepsi.webp" alt="" />
        <img className="sc-img sc-img--p1" src="/images/pizzas/angled/veggie-lover.webp" alt="" />
        <img className="sc-img sc-img--p2" src="/images/pizzas/angled/pepperoni.webp" alt="" />
        <img className="sc-img sc-img--p3" src="/images/pizzas/angled/meat-lover.webp" alt="" />
        <img className="sc-img sc-img--wings" src="/images/wings/plate-20.webp" alt="" />
        <img className="sc-img sc-img--bread" src="/images/sides/garlic-bread-plate.webp" alt="" />
      </div>

      <div className="sc-panel">
        <div className="sc-kicker">
          <span className="sc-dot" aria-hidden="true" />
          Feeds the Crew
        </div>
        <h2 className="sc-name">Party Combo</h2>
        <p className="sc-items">
          3 Large 2-Topping Pizzas, 20 Wings{"\n"}Garlic Bread, 2L Drink, 3 Dips
        </p>
      </div>

      <div className="sc-buy">
        <div className="sc-price" data-text={`$${price}`}>
          ${price}
        </div>
        <Link href={`/coupons?deal=${DEAL_ID}`} className="sc-btn">
          <span>Order Now</span>
        </Link>
      </div>

      <style jsx>{`
        .sc {
          --ice: #dff1ff;
          --sky: #9fd3ff;
          --aqua: #5ec8ff;
          --lilac: #c9b8ff;
          --navy: #1d3a78;
          --techno: "Promo Michroma", var(--font-display);
          container-type: size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          color: var(--navy);
          font-family: var(--font-body);
        }
        .sc-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(60% 80% at 82% 30%, rgba(255, 255, 255, 0.95), transparent 60%),
            radial-gradient(70% 90% at 10% 100%, rgba(201, 184, 255, 0.75), transparent 60%),
            linear-gradient(160deg, #eef8ff 0%, #c4e5ff 45%, #a9cfff 75%, #d8ccff 100%);
        }
        /* faint perspective grid on the floor */
        .sc-grid {
          position: absolute;
          left: -20%;
          right: -20%;
          bottom: -10%;
          height: 55%;
          transform: perspective(40cqw) rotateX(62deg);
          transform-origin: bottom;
          background:
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.7) 0 1px, transparent 1px 5cqw),
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.7) 0 1px, transparent 1px 5cqw);
          -webkit-mask-image: linear-gradient(to top, #000 10%, transparent 90%);
          mask-image: linear-gradient(to top, #000 10%, transparent 90%);
          opacity: 0.8;
        }
        /* thin chrome orbit rings */
        .sc-ring {
          position: absolute;
          border-radius: 50%;
          border: 0.3cqw solid rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 1.2cqw rgba(255, 255, 255, 0.8), inset 0 0 1cqw rgba(94, 200, 255, 0.35);
        }
        .sc-ring--a { width: 70cqw; height: 22cqw; right: -8cqw; top: 26cqh; transform: rotate(-12deg); }
        .sc-ring--b { width: 40cqw; height: 12cqw; left: -10cqw; top: 6cqh; transform: rotate(8deg); opacity: 0.6; }
        /* glossy see-through bubbles */
        .sc-bubble {
          position: absolute;
          border-radius: 50%;
          background:
            radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.95) 0 10%, rgba(255, 255, 255, 0) 24%),
            radial-gradient(circle at 70% 75%, rgba(201, 184, 255, 0.55), rgba(94, 200, 255, 0.15) 60%, rgba(255, 255, 255, 0.05) 72%);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: inset -0.6cqw -0.8cqw 1.4cqw rgba(94, 160, 255, 0.35), 0 0.6cqw 1.6cqw rgba(29, 58, 120, 0.12);
          animation: sc-float 7s ease-in-out infinite;
        }
        .sc-bubble--0 { width: 9cqw; height: 9cqw; left: 44cqw; top: 8cqh; }
        .sc-bubble--1 { width: 5cqw; height: 5cqw; left: 52cqw; top: 56cqh; animation-delay: -2s; }
        .sc-bubble--2 { width: 13cqw; height: 13cqw; right: -3cqw; top: -6cqh; animation-delay: -4s; }
        .sc-bubble--3 { width: 4cqw; height: 4cqw; left: 47cqw; top: 58cqh; animation-delay: -1s; }
        .sc-bubble--4 { width: 6cqw; height: 6cqw; right: 3cqw; bottom: 4cqh; animation-delay: -5s; }
        @keyframes sc-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.6cqw); }
        }

        /* ---- the food on a frosted glass disc ---- */
        .sc-food {
          position: absolute;
          right: 1cqw;
          top: 8cqh;
          width: 52cqw;
          height: 88cqh;
        }
        .sc-disc {
          position: absolute;
          left: 4%;
          right: 4%;
          bottom: 4%;
          height: 34%;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(201, 225, 255, 0.35));
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 1.4cqw 3cqw rgba(29, 58, 120, 0.25), inset 0 0.6cqw 1.4cqw rgba(255, 255, 255, 0.9);
          -webkit-backdrop-filter: blur(1cqw);
          backdrop-filter: blur(1cqw);
        }
        .sc-img {
          position: absolute;
          height: auto;
          /* a cool, airy grade: a touch brighter, slightly blue */
          filter: brightness(1.06) saturate(0.95) hue-rotate(-6deg) drop-shadow(0 0.8cqw 1cqw rgba(29, 58, 120, 0.3));
          user-select: none;
        }
        .sc-img--bottle { height: 52%; width: auto; right: 4%; top: 0; }
        .sc-img--p1 { width: 44%; left: 18%; top: 4%; }
        .sc-img--p2 { width: 44%; left: 40%; top: 18%; }
        .sc-img--p3 { width: 48%; left: 6%; top: 28%; }
        .sc-img--wings { width: 34%; right: 6%; bottom: 8%; }
        .sc-img--bread { width: 30%; left: 2%; bottom: 6%; }

        /* ---- frosted glass panel with the words ---- */
        .sc-panel {
          position: absolute;
          left: 4cqw;
          top: 7cqh;
          width: 46cqw;
          padding: 3cqh 3cqw 3.4cqh;
          border-radius: 3cqw;
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.3));
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 1cqw 2.6cqw rgba(29, 58, 120, 0.15), inset 0 0.3cqw 0.6cqw rgba(255, 255, 255, 0.9);
          -webkit-backdrop-filter: blur(1.4cqw);
          backdrop-filter: blur(1.4cqw);
          z-index: 2;
        }
        .sc-kicker {
          display: flex;
          align-items: center;
          gap: 1.2cqw;
          font-family: var(--techno);
          font-size: 1.9cqw;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #4a6fb3;
        }
        .sc-dot {
          width: 1.6cqw;
          height: 1.6cqw;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fff 0 20%, var(--aqua) 50%, #1f8fe0 100%);
          box-shadow: 0 0 1cqw var(--aqua);
        }
        .sc-name {
          margin: 1.6cqh 0 1.6cqh;
          font-family: var(--techno);
          font-weight: 400;
          font-size: 5cqw;
          line-height: 1.05;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--navy);
        }
        .sc-items {
          margin: 0;
          white-space: pre-line;
          font-size: 2.5cqw;
          font-weight: var(--w-medium);
          line-height: 1.35;
          color: #3b5a96;
        }

        /* ---- pearly chrome price + glossy aqua pill ---- */
        .sc-buy {
          position: absolute;
          left: 4cqw;
          bottom: 6cqh;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2.4cqh;
        }
        .sc-price {
          position: relative;
          font-family: var(--techno);
          font-size: 7.4cqw;
          line-height: 1;
          letter-spacing: 0.01em;
          font-weight: 400;
          /* darker chrome: navy, a bright sky band, white, then navy again */
          background: linear-gradient(180deg, #2a4f9e 0%, #5f8fe0 30%, #e9f4ff 48%, #1d3a78 52%, #4f7fd0 76%, #a9c8ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-stroke: 0.12cqw rgba(255, 255, 255, 0.9);
          filter: drop-shadow(0 0.25cqw 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 0.6cqw 1.2cqw rgba(29, 58, 120, 0.35));
        }
        .sc :global(.sc-btn) {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 2.2cqh 4.2cqw 2cqh;
          border-radius: 999px;
          background: linear-gradient(180deg, #bff0ff 0%, #5ec8ff 52%, #2aa4f0 53%, #6fd4ff 100%);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 0.8cqw 1.6cqw rgba(29, 120, 200, 0.35), inset 0 -0.6cqw 1cqw rgba(0, 80, 160, 0.25);
          color: #fff;
          font-family: var(--techno);
          font-size: 2.6cqw;
          line-height: 1;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          text-shadow: 0 0.2cqw 0.4cqw rgba(0, 70, 140, 0.45);
          white-space: nowrap;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        /* the glossy shine on the top half */
        .sc :global(.sc-btn::before) {
          content: "";
          position: absolute;
          left: 6%;
          right: 6%;
          top: 6%;
          height: 44%;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.1));
          pointer-events: none;
        }
        .sc :global(.sc-btn span) { position: relative; }
        .sc :global(.sc-btn:hover),
        .sc :global(.sc-btn:focus-visible) {
          transform: translateY(-0.2cqw);
          box-shadow: 0 1.2cqw 2.2cqw rgba(29, 120, 200, 0.45), 0 0 0 0.5cqw rgba(255, 255, 255, 0.7);
          outline: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .sc * { animation: none !important; }
        }

        /* ===== Laptop banner (928x250): food | panel | price, button ===== */
        @container (min-aspect-ratio: 3 / 1) {
          .sc-food { left: 1cqw; right: auto; top: 4cqh; width: 33cqw; height: 94cqh; }
          .sc-panel { left: 36cqw; top: 50%; transform: translateY(-50%); width: 32cqw; padding: 6cqh 2.2cqw; border-radius: 1.8cqw; }
          .sc-kicker { font-size: 0.9cqw; gap: 0.6cqw; }
          .sc-dot { width: 0.8cqw; height: 0.8cqw; }
          .sc-name { font-size: 2.6cqw; margin: 4cqh 0; }
          .sc-items { font-size: 1.15cqw; }
          .sc-buy {
            left: auto;
            right: 3cqw;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
            flex-direction: column;
            align-items: flex-end;
            gap: 6cqh;
          }
          .sc-price { font-size: 4.2cqw; -webkit-text-stroke-width: 0.07cqw; }
          .sc :global(.sc-btn) { font-size: 1.15cqw; padding: 6cqh 2.2cqw 5.4cqh; }
          .sc-ring--a { width: 46cqw; height: 9cqw; right: auto; left: 30cqw; top: 54cqh; }
          .sc-ring--b { width: 30cqw; height: 6cqw; left: 68cqw; top: 8cqh; }
          .sc-bubble--0 { width: 4cqw; height: 4cqw; left: 32cqw; top: 6cqh; }
          .sc-bubble--1 { width: 2.4cqw; height: 2.4cqw; left: 70cqw; top: 70cqh; }
          .sc-bubble--2 { width: 6cqw; height: 6cqw; right: 20cqw; top: -10cqh; }
          .sc-bubble--3 { width: 2cqw; height: 2cqw; left: 2cqw; top: 6cqh; }
          .sc-bubble--4 { width: 3cqw; height: 3cqw; right: 22cqw; bottom: 8cqh; }
        }
      `}</style>
    </div>
  );
}
