// components/promos/ConsoleDealCard.js
//
// Home page promo card for the Large 2-Topping deal, styled like an old
// console's menu screen: a rounded CRT-style panel with a green-to-white
// glow, blue arrows on the sides, the deal in the middle (two specialty
// pizzas, name, price) and a grey bar along the bottom with one glossy
// "Order Now" pill.
//
// It fills whatever box it's put in (the home page's 577x519 tile) and
// scales with it: every size below is in cqw/cqh (percent of the card's
// width/height). When the box is wide (tablets and phones, 16:9) the
// pizzas move to the left of the text.
//
// Font: --promo-font. "Promo Rodin" is FOT-Rodin (only used if a web licence
// is bought and its @font-face is added in styles/globals.css); until then
// the free M PLUS 1p (OFL) is used, which looks very close.
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";
import { formatMoney } from "../Pricing";

const DEAL_ID = "large2topping";
const PIZZAS = ["deluxe", "hawaiian"]; // back, front (public/images/pizzas/angled)

function Arrow({ side }) {
  return (
    <svg className={`cdc-arrow cdc-arrow--${side}`} viewBox="0 0 40 56" aria-hidden="true">
      <defs>
        <linearGradient id={`cdc-arrow-fill-${side}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fdcfb" />
          <stop offset="1" stopColor="#2fb4ee" />
        </linearGradient>
      </defs>
      <path
        d={side === "left" ? "M32 6 L8 28 L32 50 Z" : "M8 6 L32 28 L8 50 Z"}
        fill={`url(#cdc-arrow-fill-${side})`}
        stroke="#fff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ConsoleDealCard() {
  const deal = findDealById(DEAL_ID);
  const price = deal ? formatMoney(deal.price) : "";
  const name = "Large 2-Topping Pizza";

  return (
    <div className="cdc">
      <div className="cdc-screen">
        <Arrow side="left" />
        <Arrow side="right" />

        <div className="cdc-body">
          <div className="cdc-pizzas" aria-hidden="true">
            <img className="cdc-pizza cdc-pizza--back" src={`/images/pizzas/angled/${PIZZAS[0]}.webp`} alt="" />
            <img className="cdc-pizza cdc-pizza--front" src={`/images/pizzas/angled/${PIZZAS[1]}.webp`} alt="" />
          </div>

          <div className="cdc-text">
            <div className="cdc-tag">Carryout Special</div>
            <h2 className="cdc-title">
              {name}
              <span className="cdc-title__mirror" aria-hidden="true">
                {name}
              </span>
            </h2>
            <div className="cdc-price">
              {price}
              <span className="cdc-price__each"> each</span>
            </div>
            <div className="cdc-fine">2 pizza minimum</div>
          </div>
        </div>
      </div>

      <div className="cdc-bar">
        <Link href={`/coupons?deal=${DEAL_ID}`} className="cdc-btn">
          Order Now
        </Link>
      </div>

      <style jsx>{`
        .cdc {
          --promo-font: "Promo Rodin", "Promo M PLUS 1p", sans-serif;
          container-type: size;
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: #111;
          font-family: var(--promo-font);
          font-weight: 500;
          color: #4d4d4d;
          overflow: hidden;
        }

        /* The screen: bulging CRT corners (elliptical radius), pale green at
           the top fading to white, a soft inner glow at the edges */
        .cdc-screen {
          position: relative;
          flex: 1 1 auto;
          margin: 2.2cqw 2.2cqw 0;
          border-radius: 9cqw 9cqw 0 0 / 8cqh 8cqh 0 0;
          background:
            radial-gradient(120% 90% at 50% 45%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%),
            linear-gradient(180deg, #bfe9a8 0%, #e3f5d8 38%, #ffffff 78%);
          box-shadow:
            inset 0 0 2.6cqw rgba(60, 120, 40, 0.28),
            inset 0 0.4cqw 0 rgba(255, 255, 255, 0.9);
          overflow: hidden;
        }

        /* Grey bar along the bottom, joined to the screen like the reference */
        .cdc-bar {
          position: relative;
          flex: 0 0 18cqh;
          margin: 0 2.2cqw 2.2cqw;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0 0 9cqw 9cqw / 0 0 8cqh 8cqh;
          background: linear-gradient(180deg, #f1f1f1 0%, #d9d9d9 55%, #c9c9c9 100%);
          border-top: 0.35cqw solid #b9b9b9;
          box-shadow: inset 0 0.35cqw 0 #fff;
        }

        /* Glossy white pill with a blue outline */
        .cdc-bar :global(.cdc-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44cqw;
          height: 10.5cqh;
          padding: 0 6cqw;
          border: 0.7cqw solid #35bdf2;
          border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 45%, rgba(232, 232, 232, 1) 52%, #f7f7f7 100%);
          box-shadow:
            0 0.5cqw 1.2cqw rgba(0, 0, 0, 0.22),
            inset 0 -0.6cqw 1cqw rgba(0, 0, 0, 0.08),
            inset 0 0.5cqw 0 #fff;
          color: #4a4a4a;
          font-family: var(--promo-font);
          font-weight: 500;
          font-size: 4.6cqw;
          letter-spacing: 0.01em;
          text-decoration: none;
          transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
        }
        .cdc-bar :global(.cdc-btn:hover),
        .cdc-bar :global(.cdc-btn:focus-visible) {
          border-color: #1aa9e8;
          box-shadow:
            0 0 0 0.6cqw rgba(53, 189, 242, 0.35),
            0 0.6cqw 1.4cqw rgba(0, 0, 0, 0.25),
            inset 0 0.5cqw 0 #fff;
          outline: none;
        }
        .cdc-bar :global(.cdc-btn:active) {
          transform: scale(0.97);
        }

        /* Side arrows, gently nudging outwards */
        .cdc :global(.cdc-arrow) {
          position: absolute;
          top: 50%;
          z-index: 2;
          width: 5.2cqw;
          height: auto;
          filter: drop-shadow(0 0.3cqw 0.5cqw rgba(0, 60, 100, 0.35));
        }
        .cdc :global(.cdc-arrow--left) {
          left: 2.4cqw;
          animation: cdc-nudge-l 1.6s ease-in-out infinite;
        }
        .cdc :global(.cdc-arrow--right) {
          right: 2.4cqw;
          animation: cdc-nudge-r 1.6s ease-in-out infinite;
        }
        @keyframes cdc-nudge-l {
          0%, 100% { transform: translate(0, -50%); }
          50% { transform: translate(-0.8cqw, -50%); }
        }
        @keyframes cdc-nudge-r {
          0%, 100% { transform: translate(0, -50%); }
          50% { transform: translate(0.8cqw, -50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cdc :global(.cdc-arrow) { animation: none; transform: translateY(-50%); }
        }

        /* ---- Tall box (the home page's 577x519 tile): pizzas on top, text below ---- */
        .cdc-body {
          position: absolute;
          inset: 0 9cqw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .cdc-pizzas {
          position: relative;
          width: 100%;
          height: 36cqh;
          margin-top: 1cqh;
        }
        .cdc-pizza {
          position: absolute;
          height: auto;
          filter: drop-shadow(1.2cqw 1.4cqw 1.1cqw rgba(0, 0, 0, 0.35));
          user-select: none;
        }
        /* sized by width so both pizzas always show, overlapping */
        .cdc-pizza--back {
          right: 0;
          top: -4%;
          width: 62%;
        }
        .cdc-pizza--front {
          left: 0;
          bottom: -6%;
          width: 70%;
        }
        .cdc-text {
          text-align: center;
          margin-top: 2.5cqh;
        }
        .cdc-tag {
          display: inline-block;
          padding: 0.6cqh 3cqw;
          border-radius: 999px;
          background: rgba(53, 189, 242, 0.14);
          color: #1d8fc4;
          font-size: 3.1cqw;
        }
        .cdc-title {
          position: relative;
          margin: 1.2cqh 0 3.6cqh;
          font-family: var(--promo-font);
          font-weight: 500;
          font-size: 6.3cqw;
          line-height: 1.1;
          color: #555;
          white-space: nowrap;
          text-transform: none;
          letter-spacing: 0.005em;
        }
        /* the soft mirror under the title, like a glossy floor */
        .cdc-title__mirror {
          position: absolute;
          left: 0;
          right: 0;
          top: 100%;
          transform: scaleY(-1);
          margin-top: 0.05em;
          opacity: 0.16;
          -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 70%);
          mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 70%);
          pointer-events: none;
        }
        .cdc-price {
          font-weight: 800;
          font-size: 10.5cqw;
          line-height: 1;
          color: #2f8a1f;
          text-shadow: 0 0.3cqw 0 #fff;
        }
        .cdc-price__each {
          font-weight: 500;
          font-size: 4.2cqw;
          color: #4d4d4d;
        }
        .cdc-fine {
          margin-top: 0.8cqh;
          font-size: 3.6cqw;
          color: #666;
        }

        /* ---- Wide box (tablets/phones, 16:9): pizzas left, text right ---- */
        @container (min-aspect-ratio: 13 / 10) {
          .cdc-body {
            flex-direction: row;
            inset: 0 7.5cqw;
            gap: 3cqw;
          }
          .cdc-pizzas {
            flex: 0 0 46%;
            height: 64cqh;
            margin-top: 0;
          }
          .cdc-pizza--back { width: 74%; top: 2%; }
          .cdc-pizza--front { width: 84%; bottom: 2%; }
          .cdc-text {
            flex: 1 1 auto;
            margin-top: 0;
          }
          .cdc-tag { font-size: 2.3cqw; }
          .cdc-title { font-size: 3.7cqw; margin: 2cqh 0 7cqh; }
          .cdc-price { font-size: 7.4cqw; }
          .cdc-price__each { font-size: 3cqw; }
          .cdc-fine { font-size: 2.6cqw; }
          .cdc-bar :global(.cdc-btn) { font-size: 3.2cqw; min-width: 30cqw; height: 11cqh; border-width: 0.5cqw; }
          .cdc :global(.cdc-arrow) { width: 3.4cqw; }
        }
      `}</style>
    </div>
  );
}
