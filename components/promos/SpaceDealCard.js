// components/promos/SpaceDealCard.js
//
// Home page promo card for the 2 Medium Pizzas + 8 Wings deal.
// 70s "space age" look (the future as the 70s imagined it: chrome letters
// with stacked orange/amber/brown stripes, rounded capsule shapes, a starry
// purple sky), with a nod to a cosmic album-cover vibe: big vertically
// stacked glowing letters, a rainbow-glowing planet on the horizon and a
// chrome UFO beaming the food up.
//
// Reading order: the stacked "2 + 8" on the left, the UFO lifting the food,
// then the deal name, price and Order Now at the bottom right.
//
// Fills its box (the home page's 341x254 tile) and scales with it (cqw =
// percent of the card's width). Movement stops for reduced motion.
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "twopizzawings";

export default function SpaceDealCard() {
  const deal = findDealById(DEAL_ID);
  const price = ((deal?.price ?? 2999) / 100).toFixed(2);

  return (
    <div className="space">
      <div className="space-stars" aria-hidden="true" />
      <div className="space-stars space-stars--far" aria-hidden="true" />
      <div className="space-nebula" aria-hidden="true" />
      <div className="space-planet" aria-hidden="true" />

      {/* UFO + tractor beam lifting the food */}
      <div className="space-beam" aria-hidden="true" />
      <img className="space-food space-food--pizza" src="/images/pizzas/angled/pepperoni.webp" alt="" aria-hidden="true" />
      <img className="space-food space-food--wings" src="/images/wings/plate-6.webp" alt="" aria-hidden="true" />
      <svg className="space-ufo" viewBox="0 0 160 70" aria-hidden="true">
        <defs>
          <linearGradient id="space-chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#c9cbd6" />
            <stop offset="0.5" stopColor="#6b6f80" />
            <stop offset="0.75" stopColor="#d9dbe6" />
            <stop offset="1" stopColor="#8a8ea0" />
          </linearGradient>
          <radialGradient id="space-dome" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#e9fbff" />
            <stop offset="0.5" stopColor="#7de3ff" />
            <stop offset="1" stopColor="#2a6fb0" />
          </radialGradient>
        </defs>
        <ellipse cx="80" cy="30" rx="30" ry="22" fill="url(#space-dome)" stroke="#fff" strokeWidth="1.5" opacity="0.95" />
        <ellipse cx="80" cy="42" rx="76" ry="16" fill="url(#space-chrome)" stroke="#fff" strokeWidth="1.5" />
        <ellipse cx="80" cy="46" rx="48" ry="7" fill="#2b2d3a" opacity="0.55" />
        {[22, 42, 62, 80, 98, 118, 138].map((x, i) => (
          <circle key={x} className="space-ufo__light" cx={x} cy={i % 2 ? 44 : 43} r="3.2" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </svg>

      {/* 1. stacked "2 + 8" in a glowing capsule */}
      <div className="space-capsule" aria-hidden="true">
        <span className="space-big">2</span>
        <span className="space-big space-big--plus">+</span>
        <span className="space-big">8</span>
      </div>

      {/* 2. the deal */}
      <div className="space-info">
        <h2 className="space-name">
          <span>2 Medium Pizzas</span>
          <span>+ 8 Wings</span>
        </h2>
        <div className="space-row">
          <div className="space-price" data-text={`$${price}`}>
            ${price}
          </div>
          <Link href={`/coupons?deal=${DEAL_ID}`} className="space-btn">
            Order Now
          </Link>
        </div>
      </div>

      <style jsx>{`
        .space {
          --pink: #ff5fd2;
          --cyan: #5ff2ff;
          --violet: #2a0a4a;
          --orange: #ff7a1a;
          --amber: #ffb627;
          --brown: #8a3b12;
          container-type: inline-size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: radial-gradient(120% 90% at 70% 0%, #3b1270 0%, #1a0838 45%, #07021a 100%);
          font-family: var(--font-display);
          text-transform: uppercase;
          color: #fff;
        }

        /* stars (two layers, twinkling at different speeds) */
        .space-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1.2px 1.2px at 12% 18%, #fff 60%, transparent),
            radial-gradient(1px 1px at 37% 9%, #fff 60%, transparent),
            radial-gradient(1.5px 1.5px at 58% 26%, #fff 60%, transparent),
            radial-gradient(1px 1px at 81% 52%, #fff 60%, transparent),
            radial-gradient(1.3px 1.3px at 47% 61%, #ffe9a8 60%, transparent),
            radial-gradient(1px 1px at 28% 44%, #fff 60%, transparent),
            radial-gradient(1.4px 1.4px at 93% 12%, #bdf6ff 60%, transparent),
            radial-gradient(1px 1px at 66% 4%, #fff 60%, transparent);
          animation: space-twinkle 3s ease-in-out infinite;
        }
        .space-stars--far {
          transform: scale(1.6) rotate(23deg);
          opacity: 0.6;
          animation-duration: 4.6s;
          animation-delay: -1.5s;
        }
        @keyframes space-twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        /* pink/orange nebula glow */
        .space-nebula {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(40% 35% at 22% 30%, rgba(255, 95, 210, 0.35), transparent 70%),
            radial-gradient(35% 30% at 92% 70%, rgba(255, 122, 26, 0.3), transparent 70%);
        }
        /* glowing rainbow planet on the horizon */
        .space-planet {
          position: absolute;
          left: -20%;
          right: -20%;
          top: 62%;
          height: 120%;
          border-radius: 50%;
          background:
            radial-gradient(60% 40% at 30% 10%, rgba(120, 255, 150, 0.55), transparent 70%),
            radial-gradient(50% 35% at 70% 8%, rgba(255, 80, 120, 0.5), transparent 70%),
            radial-gradient(120% 80% at 50% 0%, #2c6fd8 0%, #10235f 45%, #050a24 80%);
          box-shadow:
            0 -1cqw 2cqw rgba(255, 255, 255, 0.85),
            0 -2cqw 5cqw rgba(255, 95, 210, 0.7),
            0 -3cqw 9cqw rgba(95, 242, 255, 0.55);
        }

        /* ---- UFO + beam ---- */
        :global(.space-ufo) {
          position: absolute;
          right: 7%;
          top: 3%;
          width: 34cqw;
          height: auto;
          z-index: 3;
          filter: drop-shadow(0 0.8cqw 1.4cqw rgba(95, 242, 255, 0.5));
          animation: space-hover 3.4s ease-in-out infinite;
        }
        .space-ufo__light {
          fill: #fff6a8;
          animation: space-blink 1.2s steps(2, jump-none) infinite;
        }
        @keyframes space-blink {
          0% { fill: #fff6a8; }
          50% { fill: #ff5fd2; }
          100% { fill: #5ff2ff; }
        }
        @keyframes space-hover {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(1.2cqw) rotate(2deg); }
        }
        .space-beam {
          position: absolute;
          right: 9%;
          top: 15%;
          width: 30cqw;
          height: 52%;
          z-index: 1;
          clip-path: polygon(38% 0, 62% 0, 100% 100%, 0 100%);
          background: linear-gradient(180deg, rgba(180, 255, 220, 0.75) 0%, rgba(95, 242, 255, 0.35) 55%, rgba(95, 242, 255, 0) 100%);
          animation: space-flicker 2.2s ease-in-out infinite;
        }
        @keyframes space-flicker {
          0%, 100% { opacity: 0.9; }
          45% { opacity: 0.65; }
          50% { opacity: 0.95; }
        }
        .space-food {
          position: absolute;
          height: auto;
          z-index: 2;
          filter: drop-shadow(0 0 1.6cqw rgba(160, 255, 230, 0.75));
          user-select: none;
        }
        .space-food--pizza {
          right: 12%;
          top: 24%;
          width: 25cqw;
          animation: space-lift 4s ease-in-out infinite;
        }
        .space-food--wings {
          right: 17%;
          top: 39%;
          width: 16cqw;
          animation: space-lift 4s ease-in-out -1.6s infinite;
        }
        @keyframes space-lift {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-2.2cqw) rotate(6deg); }
        }

        /* ---- 1. the capsule with stacked "2 + 8" ---- */
        .space-capsule {
          position: absolute;
          left: 4.5%;
          top: 5%;
          bottom: 6%;
          z-index: 4;
          width: 21cqw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-evenly;
          border-radius: 11cqw;
          background: linear-gradient(180deg, rgba(42, 10, 74, 0.85), rgba(7, 2, 26, 0.85));
          box-shadow:
            0 0 0 0.6cqw #fff,
            0 0 0 1.3cqw var(--pink),
            0 0 0 2cqw var(--cyan),
            0 0 4cqw rgba(255, 95, 210, 0.8);
        }
        .space-big {
          font-size: 23cqw;
          line-height: 0.85;
          background: linear-gradient(180deg, #ffd1f4 0%, var(--pink) 35%, #a46bff 62%, var(--cyan) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 1.2cqw rgba(255, 95, 210, 0.9)) drop-shadow(0 0 0.3cqw #fff);
          animation: space-glow 2.8s ease-in-out infinite;
        }
        .space-big--plus {
          font-size: 12cqw;
        }
        @keyframes space-glow {
          0%, 100% { filter: drop-shadow(0 0 1.2cqw rgba(255, 95, 210, 0.9)) drop-shadow(0 0 0.3cqw #fff); }
          50% { filter: drop-shadow(0 0 2.2cqw rgba(95, 242, 255, 0.95)) drop-shadow(0 0 0.3cqw #fff); }
        }

        /* ---- 2. the deal: name, chrome price, Order Now ---- */
        .space-info {
          position: absolute;
          left: 30%;
          right: 3.5%;
          bottom: 6%;
          z-index: 5;
        }
        .space-name {
          margin: 0 0 1.6cqw;
          display: flex;
          flex-direction: column;
          font-family: var(--font-display);
          font-size: 5.4cqw;
          line-height: 1.02;
          letter-spacing: 0.03em;
          color: #fff;
          text-shadow: 0 0 1.2cqw rgba(95, 242, 255, 0.9);
        }
        .space-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 2cqw;
        }
        /* chrome letters with stacked 70s stripes behind them */
        .space-price {
          position: relative;
          font-size: 12.2cqw;
          line-height: 0.9;
          background: linear-gradient(180deg, #ffffff 0%, #e6e8f2 42%, #6c6f82 50%, #ffffff 58%, #b9bccb 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow:
            0.45cqw 0.45cqw 0 var(--amber),
            0.9cqw 0.9cqw 0 var(--orange),
            1.35cqw 1.35cqw 0 #e04a12,
            1.8cqw 1.8cqw 0 var(--brown);
        }
        /* a clean chrome copy on top (text-shadow paints under the clipped fill) */
        .space-price::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          background: inherit;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: none;
        }
        .space :global(.space-btn) {
          flex: 0 0 auto;
          padding: 1.8cqw 3cqw 1.4cqw;
          border-radius: 999px;
          background: linear-gradient(180deg, #fff 0%, #ffe3f6 40%, var(--pink) 100%);
          box-shadow: 0 0 0 0.5cqw #fff, 0 0 0 1cqw var(--cyan), 0 0 3cqw rgba(95, 242, 255, 0.8);
          color: var(--violet);
          font-family: var(--font-display);
          font-size: 4.1cqw;
          line-height: 1;
          letter-spacing: 0.04em;
          text-decoration: none;
          white-space: nowrap;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .space :global(.space-btn:hover),
        .space :global(.space-btn:focus-visible) {
          box-shadow: 0 0 0 0.5cqw #fff, 0 0 0 1cqw var(--pink), 0 0 4cqw rgba(255, 95, 210, 0.95);
          outline: none;
        }
        .space :global(.space-btn:active) {
          transform: scale(0.95);
        }

        @media (prefers-reduced-motion: reduce) {
          .space *,
          .space :global(*) {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
