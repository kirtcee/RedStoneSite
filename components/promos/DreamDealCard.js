// components/promos/DreamDealCard.js
//
// Home page promo banner for Feed 4. Dreamcore: a deep lapis-blue sky,
// soft glowing clouds, glossy too-green grass, a rainbow arching down into
// the grass with a pizza riding on top of it, and the rest of the meal
// sitting on the grass. Everything slightly too vivid and floaty, like a
// dream.
//
// Two layouts from one card (container queries on the card's own shape):
//   - phones (16:9): words on the left, the rainbow scene on the right
//   - laptops (the 928x140 strip): scene | title | details, price, button
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "feed4";

export default function DreamDealCard() {
  const deal = findDealById(DEAL_ID);
  const price = ((deal?.price ?? 3999) / 100).toFixed(2);

  return (
    <div className="dr">
      <div className="dr-sky" aria-hidden="true" />
      <div className="dr-sun" aria-hidden="true" />
      <span className="dr-cloud dr-cloud--a" aria-hidden="true" />
      <span className="dr-cloud dr-cloud--b" aria-hidden="true" />
      <span className="dr-cloud dr-cloud--c" aria-hidden="true" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`dr-spark dr-spark--${i}`} aria-hidden="true" />
      ))}

      <div className="dr-scene" aria-hidden="true">
        <div className="dr-rainbow" />
        <img className="dr-food dr-food--pizza" src="/images/pizzas/angled/pepperoni.webp" alt="" />
        <img className="dr-food dr-food--bottle" src="/images/drinks/2l-coke.webp" alt="" />
        <img className="dr-food dr-food--wings" src="/images/wings/plate-6.webp" alt="" />
        <img className="dr-food dr-food--bread" src="/images/sides/garlic-bread-plate.webp" alt="" />
      </div>
      <div className="dr-grass" aria-hidden="true" />

      <div className="dr-title">
        <h2 className="dr-name">Feed 4</h2>
        <p className="dr-items">
          2 Large 2-Topping Pizzas, 8 Wings{"\n"}Garlic Bread, 2L Drink, 2 Dips
        </p>
      </div>

      <div className="dr-buy">
        <div className="dr-price">${price}</div>
        <Link href={`/coupons?deal=${DEAL_ID}`} className="dr-btn">
          Order Now
        </Link>
      </div>

      <style jsx>{`
        .dr {
          --lapis: #1d3fb8;
          --lapis-deep: #0b1f78;
          --grass: #29e33c;
          container-type: size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          font-family: var(--font-display);
          text-transform: uppercase;
          color: #fff;
        }
        .dr-sky {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, var(--lapis-deep) 0%, var(--lapis) 45%, #4c7dff 78%, #9fd0ff 100%);
        }
        /* a soft white sun bloom behind the rainbow */
        .dr-sun {
          position: absolute;
          right: 18cqw;
          top: 18cqh;
          width: 34cqw;
          height: 34cqw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 210, 0.55) 25%, rgba(255, 255, 255, 0) 65%);
          animation: dr-breathe 6s ease-in-out infinite;
        }
        /* puffy clouds: a rounded base with two round puffs on top */
        .dr-cloud {
          --w: 20cqw;
          position: absolute;
          width: var(--w);
          height: calc(var(--w) * 0.3);
          border-radius: 999px;
          background: #fff;
          filter: drop-shadow(0 0 1.2cqw rgba(255, 255, 255, 0.9));
          opacity: 0.95;
          animation: dr-drift 18s ease-in-out infinite;
        }
        .dr-cloud::before,
        .dr-cloud::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: #fff;
        }
        .dr-cloud::before {
          left: 14%;
          bottom: 30%;
          width: 34%;
          aspect-ratio: 1;
        }
        .dr-cloud::after {
          left: 40%;
          bottom: 25%;
          width: 46%;
          aspect-ratio: 1;
        }
        .dr-cloud--a { left: 46cqw; top: 14cqh; --w: 15cqw; }
        .dr-cloud--b { left: 3cqw; top: 3cqh; --w: 11cqw; animation-duration: 24s; opacity: 0.7; }
        .dr-cloud--c { right: 3cqw; top: 18cqh; --w: 12cqw; animation-duration: 21s; opacity: 0.85; }
        /* tiny twinkles */
        .dr-spark {
          position: absolute;
          width: 1.4cqw;
          height: 1.4cqw;
          background: #fff;
          clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
          filter: drop-shadow(0 0 0.6cqw #fff);
          animation: dr-twinkle 2.4s ease-in-out infinite;
        }
        .dr-spark--0 { left: 36cqw; top: 6cqh; }
        .dr-spark--1 { left: 47cqw; top: 40cqh; animation-delay: -0.6s; width: 1cqw; height: 1cqw; }
        .dr-spark--2 { right: 6cqw; top: 12cqh; animation-delay: -1.2s; }
        .dr-spark--3 { left: 44cqw; top: 56cqh; animation-delay: -1.8s; width: 0.9cqw; height: 0.9cqw; }
        .dr-spark--4 { right: 30cqw; top: 6cqh; animation-delay: -0.3s; width: 1cqw; height: 1cqw; }
        .dr-spark--5 { left: 22cqw; top: 8cqh; animation-delay: -1.5s; width: 0.8cqw; height: 0.8cqw; }

        /* ---- the rainbow scene (right side on phones) ---- */
        .dr-scene {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 54cqw;
          height: 100cqh;
        }
        /* rainbow arching down into the grass */
        .dr-rainbow {
          position: absolute;
          left: 6%;
          right: 6%;
          bottom: 12cqh;
          aspect-ratio: 2 / 1;
          border-radius: 999px 999px 0 0;
          background: radial-gradient(
            circle farthest-side at 50% 100%,
            transparent 0 50%,
            #a24bff 50% 55%,
            #3b6bff 55% 61%,
            #19d7ff 61% 67%,
            #3dff5a 67% 73%,
            #fff23a 73% 79%,
            #ff9d1c 79% 85%,
            #ff2d55 85% 92%,
            transparent 92%
          );
          filter: saturate(1.25) drop-shadow(0 0 1.6cqw rgba(255, 255, 255, 0.7));
          opacity: 0.95;
        }
        .dr-food {
          position: absolute;
          height: auto;
          filter: saturate(1.35) contrast(1.05) drop-shadow(0 0 1.4cqw rgba(255, 255, 255, 0.75))
            drop-shadow(0.6cqw 1cqw 0.8cqw rgba(11, 31, 120, 0.45));
          user-select: none;
        }
        /* the pizza rides the top of the rainbow, bobbing gently */
        .dr-food--pizza {
          left: 31%;
          top: 26cqh;
          width: 40%;
          transform: rotate(-8deg);
          animation: dr-ride 4.5s ease-in-out infinite;
        }
        .dr-food--bottle { right: 3%; bottom: 9cqh; height: 44cqh; width: auto; z-index: 2; }
        .dr-food--wings { left: 16%; bottom: 2cqh; width: 30%; z-index: 3; }
        .dr-food--bread { right: 14%; bottom: 2cqh; width: 30%; z-index: 3; }

        /* glossy, too-green grass hill */
        .dr-grass {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: -26cqh;
          height: 48cqh;
          border-radius: 50% 50% 0 0 / 70% 70% 0 0;
          background:
            radial-gradient(60% 50% at 50% 10%, rgba(255, 255, 255, 0.55), transparent 70%),
            linear-gradient(180deg, #7dff6a 0%, var(--grass) 30%, #0f9e2a 100%);
          box-shadow: 0 -0.6cqw 2cqw rgba(160, 255, 140, 0.7);
          z-index: 1;
        }

        /* ---- words (left side on phones) ---- */
        .dr-title {
          position: absolute;
          left: 5cqw;
          top: 12cqh;
          z-index: 4;
          width: 42cqw;
        }
        .dr-name {
          margin: 0;
          font-family: var(--font-display);
          font-size: 13cqw;
          line-height: 0.9;
          color: #fff;
          background: linear-gradient(180deg, #ffffff 0%, #ffe6fb 45%, #b9f3ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 1.2cqw rgba(255, 255, 255, 0.9)) drop-shadow(0 0.5cqw 0 #ff5fd2);
        }
        .dr-items {
          margin: 2.4cqh 0 0;
          white-space: pre-line;
          font-family: var(--font-body);
          font-weight: var(--w-semibold);
          font-size: 2.9cqw;
          line-height: 1.35;
          text-transform: none;
          color: #eef4ff;
          text-shadow: 0 0 1cqw rgba(11, 31, 120, 0.9);
        }
        .dr-buy {
          position: absolute;
          left: 5cqw;
          bottom: 9cqh;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 3cqw;
        }
        .dr-price {
          font-size: 8cqw;
          line-height: 1;
          color: #fff23a;
          text-shadow: 0 0.4cqw 0 #ff2d55, 0 0 1.6cqw rgba(255, 255, 255, 0.8);
        }
        /* a puffy cloud-white pill with a rainbow rim */
        .dr :global(.dr-btn) {
          display: inline-flex;
          align-items: center;
          padding: 2.4cqh 4.4cqw 2cqh;
          border-radius: 999px;
          background: linear-gradient(180deg, #ffffff 0%, #eaf3ff 100%) padding-box,
            linear-gradient(90deg, #ff2d55, #ff9d1c, #fff23a, #3dff5a, #19d7ff, #a24bff) border-box;
          border: 0.6cqw solid transparent;
          box-shadow: 0 0 2cqw rgba(255, 255, 255, 0.85);
          color: var(--lapis);
          font-family: var(--font-display);
          font-size: 3.4cqw;
          line-height: 1;
          letter-spacing: 0.06em;
          text-decoration: none;
          white-space: nowrap;
          transition: transform 0.15s ease;
        }
        .dr :global(.dr-btn:hover),
        .dr :global(.dr-btn:focus-visible) {
          transform: scale(1.05);
          outline: none;
        }

        @keyframes dr-drift {
          0%, 100% { translate: 0 0; }
          50% { translate: 3cqw 0; }
        }
        @keyframes dr-breathe {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes dr-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes dr-ride {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(-1.6cqh) rotate(-3deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dr *,
          .dr :global(*) {
            animation: none !important;
          }
        }

        /* ===== Laptop strip (928x140): scene | title | details ===== */
        @container (min-aspect-ratio: 3 / 1) {
          .dr-scene { left: 1cqw; right: auto; width: 30cqw; }
          .dr-rainbow { bottom: 14cqh; left: 14%; right: 6%; }
          .dr-food--pizza { left: 36%; top: 2cqh; width: 32%; }
          .dr-food--bottle { left: 2%; right: auto; bottom: 10cqh; height: 70cqh; }
          .dr-food--wings { left: 16%; bottom: 4cqh; width: 25%; }
          .dr-food--bread { right: 2%; bottom: 4cqh; width: 24%; }
          .dr-grass { bottom: -40cqh; height: 70cqh; }
          .dr-sun { left: 8cqw; right: auto; top: -30cqh; width: 22cqw; height: 22cqw; }
          .dr-cloud--a { left: 34cqw; top: 12cqh; --w: 7cqw; }
          .dr-cloud--b { left: 60cqw; top: 6cqh; --w: 5cqw; }
          .dr-cloud--c { right: 25cqw; top: 14cqh; --w: 5.5cqw; }
          .dr-spark { width: 0.7cqw; height: 0.7cqw; }
          .dr-title {
            left: 34cqw;
            top: 50%;
            transform: translateY(-50%);
            width: 34cqw;
            display: flex;
            align-items: center;
            gap: 2.4cqw;
          }
          .dr-name { font-size: 6.4cqw; white-space: nowrap; }
          .dr-items { margin: 0; font-size: 1.25cqw; }
          .dr-buy {
            left: auto;
            right: 3cqw;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
            gap: 2cqw;
          }
          .dr-price { font-size: 3.6cqw; }
          .dr :global(.dr-btn) { font-size: 1.5cqw; padding: 9cqh 2.2cqw 7.5cqh; border-width: 0.3cqw; }
        }
      `}</style>
    </div>
  );
}
