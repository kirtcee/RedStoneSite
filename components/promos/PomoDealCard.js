// components/promos/PomoDealCard.js
//
// Home page promo card for the "Choose Any 2 or More" deal ($8.99 each).
// Wacky postmodern style: blinding neon, 3D shapes everywhere, a wobbly 3D
// price. It looks like chaos, but the eye still follows one path (a "Z"):
//   1. the giant price, top left
//   2. the food, top right
//   3. the "Choose Any 2 or More" ribbon across the middle
//   4. the "More Choices" button, bottom right (opens the deal)
//
// Fills its box (the home page's 341x254 tile) and scales with it: sizes
// are cqw (percent of the card's width). Everything moving stops for people
// who ask for reduced motion.
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "pick2mix";

// chunky 3D side for big text: one shadow per step down-right
function extrude(steps, step, color) {
  const out = [];
  for (let i = 1; i <= steps; i++) out.push(`${(i * step).toFixed(2)}cqw ${(i * step).toFixed(2)}cqw 0 ${color}`);
  return out.join(", ");
}

export default function PomoDealCard() {
  const deal = findDealById(DEAL_ID);
  const cents = deal?.price ?? 899;
  const price = (cents / 100).toFixed(2); // "8.99"

  return (
    <div className="pomo">
      {/* ---- background chaos (decoration only) ---- */}
      <div className="pomo-floor" aria-hidden="true" />
      <div className="pomo-dots" aria-hidden="true" />
      <div className="pomo-cube" aria-hidden="true">
        {["front", "back", "right", "left", "top", "bottom"].map((f) => (
          <span key={f} className={`pomo-cube__face pomo-cube__face--${f}`} />
        ))}
      </div>
      <span className="pomo-ball" aria-hidden="true" />
      <span className="pomo-ring" aria-hidden="true" />
      <span className="pomo-tri" aria-hidden="true" />
      <svg className="pomo-squig" viewBox="0 0 120 30" aria-hidden="true">
        <path d="M4 20 Q 16 2, 28 16 T 52 16 T 76 16 T 100 16 T 116 12" className="pomo-squig__side" />
        <path d="M4 20 Q 16 2, 28 16 T 52 16 T 76 16 T 100 16 T 116 12" className="pomo-squig__top" />
      </svg>

      {/* ---- 2. the food ---- */}
      <img className="pomo-food pomo-food--pizza" src="/images/pizzas/angled/pepperoni.webp" alt="" aria-hidden="true" />
      <img className="pomo-food pomo-food--wings" src="/images/wings/plate-6.webp" alt="" aria-hidden="true" />
      <img className="pomo-food pomo-food--bread" src="/images/sides/cheesy-garlic-bread-top.webp" alt="" aria-hidden="true" />

      {/* ---- 1. the price ---- */}
      <div className="pomo-price" aria-label={`$${price} each`}>
        <span className="pomo-price__num" aria-hidden="true">
          {("$" + price).split("").map((ch, i) => (
            <span key={i} className="pomo-price__ch" style={{ animationDelay: `${i * 0.11}s` }}>
              {ch}
            </span>
          ))}
        </span>
        <span className="pomo-each" aria-hidden="true">Each</span>
      </div>

      {/* ---- 3. the ribbon ---- */}
      <h2 className="pomo-ribbon">
        <span>Choose Any 2 or More</span>
      </h2>

      {/* ---- 4. the button ---- */}
      <Link href={`/coupons?deal=${DEAL_ID}`} className="pomo-btn">
        More Choices <span aria-hidden="true">▶</span>
      </Link>

      <style jsx>{`
        .pomo {
          --pink: #ff1fcf;
          --cyan: #00f0ff;
          --yellow: #fff200;
          --lime: #39ff14;
          --violet: #7a00ff;
          --ink: #12001f;
          container-type: inline-size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          background:
            radial-gradient(60% 70% at 85% 15%, rgba(255, 242, 0, 0.95) 0%, rgba(255, 242, 0, 0) 60%),
            linear-gradient(135deg, #ff1fcf 0%, #ff4fa3 45%, #ff8a00 100%);
          font-family: var(--font-display);
          text-transform: uppercase;
          color: var(--ink);
          perspective: 600px;
        }

        /* glowing neon grid floor, tilted back in 3D */
        .pomo-floor {
          position: absolute;
          left: -30%;
          right: -30%;
          bottom: -30%;
          height: 78%;
          transform: rotateX(68deg);
          transform-origin: bottom;
          background:
            repeating-linear-gradient(90deg, rgba(0, 240, 255, 0.95) 0 0.5cqw, transparent 0.5cqw 7cqw),
            repeating-linear-gradient(0deg, rgba(0, 240, 255, 0.95) 0 0.5cqw, transparent 0.5cqw 7cqw),
            linear-gradient(180deg, rgba(122, 0, 255, 0.0), rgba(122, 0, 255, 0.85));
          filter: drop-shadow(0 0 1.2cqw var(--cyan));
          animation: pomo-floor 2.4s linear infinite;
        }
        @keyframes pomo-floor {
          to { background-position: 0 0, 0 7cqw, 0 0; }
        }
        /* Memphis dots */
        .pomo-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(18, 0, 31, 0.22) 18%, transparent 20%);
          background-size: 4.2cqw 4.2cqw;
          -webkit-mask-image: linear-gradient(160deg, #000 0%, transparent 55%);
          mask-image: linear-gradient(160deg, #000 0%, transparent 55%);
        }

        /* spinning 3D cube */
        .pomo-cube {
          --s: 9cqw;
          position: absolute;
          left: 43%;
          top: 72%;
          width: var(--s);
          height: var(--s);
          transform-style: preserve-3d;
          animation: pomo-spin 7s linear infinite;
        }
        .pomo-cube__face {
          position: absolute;
          inset: 0;
          border: 0.5cqw solid var(--ink);
        }
        .pomo-cube__face--front { background: var(--cyan); transform: translateZ(calc(var(--s) / 2)); }
        .pomo-cube__face--back { background: var(--violet); transform: rotateY(180deg) translateZ(calc(var(--s) / 2)); }
        .pomo-cube__face--right { background: var(--lime); transform: rotateY(90deg) translateZ(calc(var(--s) / 2)); }
        .pomo-cube__face--left { background: var(--yellow); transform: rotateY(-90deg) translateZ(calc(var(--s) / 2)); }
        .pomo-cube__face--top {
          background: repeating-linear-gradient(45deg, var(--pink) 0 1.2cqw, #fff 1.2cqw 2.4cqw);
          transform: rotateX(90deg) translateZ(calc(var(--s) / 2));
        }
        .pomo-cube__face--bottom { background: var(--ink); transform: rotateX(-90deg) translateZ(calc(var(--s) / 2)); }
        @keyframes pomo-spin {
          from { transform: rotateX(-24deg) rotateY(0deg); }
          to { transform: rotateX(-24deg) rotateY(360deg); }
        }

        /* glossy 3D ball */
        .pomo-ball {
          position: absolute;
          left: -4%;
          top: 46%;
          width: 15cqw;
          height: 15cqw;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 28%, #fff 0 6%, var(--lime) 22%, #0b9d00 70%, #064d00 100%);
          box-shadow: 1.2cqw 1.6cqw 0 rgba(18, 0, 31, 0.35);
          animation: pomo-bob 3.2s ease-in-out infinite;
        }
        /* 3D ring */
        .pomo-ring {
          position: absolute;
          left: 25%;
          top: 33%;
          width: 13cqw;
          height: 13cqw;
          border-radius: 50%;
          border: 2.6cqw solid var(--violet);
          box-shadow: inset 0 -0.8cqw 0 rgba(0, 0, 0, 0.35), 0 1cqw 0 #3d0080;
          transform: rotateX(62deg) rotateZ(20deg);
          animation: pomo-tilt 4s ease-in-out infinite;
        }
        /* extruded triangle */
        .pomo-tri {
          position: absolute;
          left: 28%;
          bottom: 5%;
          width: 10cqw;
          height: 9cqw;
          background: var(--yellow);
          clip-path: polygon(50% 0, 100% 100%, 0 100%);
          filter: drop-shadow(0.8cqw 0.8cqw 0 var(--ink));
          transform: rotate(-14deg);
          animation: pomo-wiggle 2.6s ease-in-out infinite;
        }
        /* 3D squiggle (a thick dark copy underneath gives it depth) */
        :global(.pomo-squig) {
          position: absolute;
          left: 2%;
          bottom: 3%;
          width: 30cqw;
          height: auto;
          overflow: visible;
        }
        .pomo-squig__side,
        .pomo-squig__top {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 6;
        }
        .pomo-squig__side { stroke: var(--ink); transform: translate(2px, 3px); }
        .pomo-squig__top { stroke: var(--cyan); }

        /* ---- the food: tumbling into the top right ---- */
        .pomo-food {
          position: absolute;
          height: auto;
          filter: drop-shadow(1.2cqw 1.6cqw 0 rgba(18, 0, 31, 0.45));
          user-select: none;
        }
        .pomo-food--pizza {
          right: -9%;
          top: -5%;
          width: 46cqw;
          transform: rotate(12deg);
          animation: pomo-float 4.2s ease-in-out infinite;
        }
        .pomo-food--wings {
          right: 26%;
          top: 21%;
          width: 21cqw;
          transform: rotate(-10deg);
          animation: pomo-float 3.6s ease-in-out -1.2s infinite;
        }
        .pomo-food--bread {
          right: -3%;
          top: 28%;
          width: 19cqw;
          transform: rotate(18deg);
          animation: pomo-float 3.9s ease-in-out -2.1s infinite;
        }

        /* ---- 1. the price: wobbly, chunky, extruded ---- */
        .pomo-price {
          position: absolute;
          left: 3.5%;
          top: 3%;
          z-index: 3;
          transform: rotate(-7deg);
        }
        .pomo-price__num {
          display: block;
          font-size: 24cqw;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: var(--yellow);
          -webkit-text-stroke: 0.55cqw var(--ink);
          paint-order: stroke fill;
          text-shadow: ${extrude(7, 0.32, "#12001f")}, 2.6cqw 2.6cqw 1.6cqw rgba(18, 0, 31, 0.35);
        }
        .pomo-price__ch {
          display: inline-block;
          animation: pomo-hop 1.4s ease-in-out infinite;
        }
        .pomo-price__ch:nth-child(odd) {
          color: var(--cyan);
        }
        .pomo-price__ch:first-child {
          font-size: 0.55em;
          vertical-align: 0.62em;
          color: var(--lime);
        }
        .pomo-each {
          position: absolute;
          right: -6cqw;
          bottom: -3.4cqw;
          padding: 0.8cqw 2.2cqw 0.5cqw;
          background: var(--lime);
          border: 0.55cqw solid var(--ink);
          box-shadow: 0.9cqw 0.9cqw 0 var(--ink);
          font-size: 5.6cqw;
          line-height: 1;
          transform: rotate(12deg);
        }

        /* ---- 3. the ribbon: a thick 3D band across the middle ---- */
        .pomo-ribbon {
          position: absolute;
          left: -3%;
          right: -3%;
          top: 53%;
          z-index: 4;
          margin: 0;
          padding: 1.6cqw 0 1.2cqw;
          background: var(--ink);
          box-shadow: 0 1.4cqw 0 var(--violet), 0 2.6cqw 0 var(--cyan), 0 3.2cqw 2cqw rgba(0, 0, 0, 0.35);
          transform: rotate(-4deg);
          text-align: center;
          font-family: var(--font-display);
          font-size: 7.4cqw;
          line-height: 1;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .pomo-ribbon span {
          color: var(--yellow);
          text-shadow: 0 0 1.4cqw rgba(255, 242, 0, 0.9), 0.5cqw 0.5cqw 0 var(--pink);
        }

        /* ---- 4. the button: a chunky 3D key you can press ---- */
        .pomo :global(.pomo-btn) {
          position: absolute;
          right: 4%;
          bottom: 6%;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: 1.6cqw;
          padding: 2.2cqw 4cqw 1.8cqw;
          border: 0.6cqw solid var(--ink);
          border-radius: 3cqw;
          background: var(--cyan);
          box-shadow: 0 1.6cqw 0 var(--ink), 0 0 3cqw rgba(0, 240, 255, 0.9);
          color: var(--ink);
          font-family: var(--font-display);
          font-size: 5.6cqw;
          line-height: 1;
          text-decoration: none;
          transform: rotate(3deg);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          animation: pomo-pulse 1.8s ease-in-out infinite;
        }
        .pomo :global(.pomo-btn:hover),
        .pomo :global(.pomo-btn:focus-visible) {
          background: var(--yellow);
          outline: none;
        }
        .pomo :global(.pomo-btn:active) {
          transform: rotate(3deg) translateY(1.2cqw);
          box-shadow: 0 0.4cqw 0 var(--ink), 0 0 3cqw rgba(0, 240, 255, 0.9);
        }

        @keyframes pomo-hop {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1.4cqw) rotate(-4deg); }
        }
        @keyframes pomo-float {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -1.6cqw; }
        }
        @keyframes pomo-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2cqw); }
        }
        @keyframes pomo-tilt {
          0%, 100% { transform: rotateX(62deg) rotateZ(20deg); }
          50% { transform: rotateX(58deg) rotateZ(40deg); }
        }
        @keyframes pomo-wiggle {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes pomo-pulse {
          0%, 100% { box-shadow: 0 1.6cqw 0 var(--ink), 0 0 2cqw rgba(0, 240, 255, 0.7); }
          50% { box-shadow: 0 1.6cqw 0 var(--ink), 0 0 4.5cqw rgba(0, 240, 255, 1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pomo *,
          .pomo :global(*) {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
