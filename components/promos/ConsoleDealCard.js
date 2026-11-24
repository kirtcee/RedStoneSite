// components/promos/ConsoleDealCard.js
//
// Home page promo card for the Large 2-Topping deal, styled like an old
// console's menu screen: a rounded CRT-style panel with a blue-to-white
// glow, blue arrows on the sides, the deal in the middle (two specialty
// pizzas, name, price) and a grey bar along the bottom with one glossy
// "Order Now" pill.
//
// It fills whatever box it's put in (the home page's 577x519 tile) and
// scales with it: every size below is in cqw/cqh (percent of the card's
// width/height). When the box is wide (tablets and phones, 16:9) the
// pizzas move to the left of the text.
//
// Fonts: Red Stone Face like the rest of the site; only the Order Now pill
// uses --promo-font ("Promo Rodin" = FOT-Rodin if a web licence is ever
// bought and its @font-face added in styles/globals.css; until then the free
// M PLUS 1p, which looks very close). Colour: the Order Now outline blue.
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
            <h2 className="cdc-title" aria-label={name}>
              <span aria-hidden="true">Large</span>
              <span aria-hidden="true">2-Topping</span>
              <span className="cdc-title__last" aria-hidden="true">
                Pizza
                <span className="cdc-title__mirror">Pizza</span>
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
        /* Phone first: the base styles are the wide layout (phones/tablets,
           pizzas on the left, text on the right); the @container block at
           the bottom is the tall laptop tile (pizzas on top, text below). */
        .cdc {
          --blue: #35bdf2; /* the Order Now outline blue, used for all the card's colour */
          --promo-font: "Promo Rodin", "Promo M PLUS 1p", sans-serif; /* Order Now button only */
          container-type: size;
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: transparent;
          filter: drop-shadow(0 0.6cqw 1.2cqw rgba(0, 0, 0, 0.22));
          font-family: var(--font-body);
          font-weight: var(--w-medium);
          color: #4d4d4d;
          overflow: hidden;
        }

        /* The screen: bulging CRT corners (elliptical radius), pale blue at
           the top fading to white, a soft blue glow at the edges */
        .cdc-screen {
          position: relative;
          flex: 1 1 auto;
          margin: 0;
          border-radius: 9cqw 9cqw 0 0 / 8cqh 8cqh 0 0;
          background:
            radial-gradient(120% 90% at 50% 45%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%),
            linear-gradient(180deg, #b4e6fb 0%, #dff4fd 38%, #ffffff 78%);
          box-shadow:
            inset 0 0 2.6cqw rgba(53, 189, 242, 0.35),
            inset 0 0.4cqw 0 rgba(255, 255, 255, 0.9);
          overflow: hidden;
        }

        /* Grey bar along the bottom */
        .cdc-bar {
          position: relative;
          flex: 0 0 19cqh;
          margin: 0;
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
          min-width: 32cqw;
          height: 12cqh;
          padding: 0 5cqw;
          border: 0.55cqw solid var(--blue);
          border-radius: 999px;
          background:
            linear-gradient(180deg, #fff 0%, rgba(255, 255, 255, 0.95) 45%, #e8e8e8 52%, #f7f7f7 100%);
          box-shadow:
            0 0.5cqw 1.2cqw rgba(0, 0, 0, 0.22),
            inset 0 -0.6cqw 1cqw rgba(0, 0, 0, 0.08),
            inset 0 0.5cqw 0 #fff;
          color: #4a4a4a;
          font-family: var(--promo-font);
          font-weight: 500;
          font-size: 3.6cqw;
          letter-spacing: 0.01em;
          text-transform: none;
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
          width: 3.6cqw;
          height: auto;
          filter: drop-shadow(0 0.3cqw 0.5cqw rgba(0, 60, 100, 0.35));
        }
        .cdc :global(.cdc-arrow--left) {
          left: 2.2cqw;
          animation: cdc-nudge-l 1.6s ease-in-out infinite;
        }
        .cdc :global(.cdc-arrow--right) {
          right: 2.2cqw;
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

        /* ---- Wide (phones/tablets): pizzas left, text right ---- */
        .cdc-body {
          position: absolute;
          inset: 0 6cqw;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 2.5cqw;
        }
        .cdc-pizzas {
          position: relative;
          flex: 0 0 47%;
          height: 74cqh;
        }
        .cdc-pizza {
          position: absolute;
          height: auto;
          filter: drop-shadow(1.2cqw 1.4cqw 1.1cqw rgba(0, 0, 0, 0.35));
          user-select: none;
        }
        /* sized by width so both pizzas always show, overlapping */
        .cdc-pizza--back { right: -4%; top: 9%; width: 92%; }
        .cdc-pizza--front { left: -4%; bottom: 9%; width: 100%; }
        .cdc-text {
          flex: 1 1 auto;
          min-width: 0;
          height: 74cqh; /* same height as the pizzas, so the text lines up with them */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          text-align: left;
        }
        .cdc-tag {
          display: inline-block;
          padding: 1cqh 3cqw 0.7cqh;
          border-radius: 999px;
          background: rgba(53, 189, 242, 0.16);
          color: #1d8fc4;
          font-family: var(--font-display);
          font-size: 3.4cqw;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .cdc-title {
          position: relative;
          display: flex;
          flex-direction: column;
          margin: 0;
          font-family: var(--font-display);
          font-size: 8cqw;
          line-height: 0.92;
          color: #4d4d4d;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.01em;
        }
        /* the soft mirror under the title, like a glossy floor */
        .cdc-title__last {
          position: relative;
        }
        .cdc-title__mirror {
          position: absolute;
          left: 0;
          right: 0;
          top: 100%;
          transform: scaleY(-1);
          margin-top: 0.08em;
          opacity: 0.16;
          -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 70%);
          mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 70%);
          pointer-events: none;
        }
        .cdc-price {
          font-family: var(--font-display);
          font-size: 12cqw;
          white-space: nowrap;
          line-height: 1;
          color: var(--blue);
          text-transform: uppercase;
          text-shadow: 0 0.25cqw 0 #1d8fc4, 0 0.6cqw 1cqw rgba(29, 143, 196, 0.25);
        }
        .cdc-price__each {
          font-size: 3.6cqw;
          color: #4d4d4d;
          text-shadow: none;
        }
        .cdc-fine {
          margin-top: 0.6cqh;
          font-size: 3.4cqw;
          font-weight: var(--w-semibold);
          color: #666;
        }

        /* ---- Tall (the laptop's 577x519 tile): pizzas on top, text below ---- */
        @container (max-aspect-ratio: 13 / 10) {
          .cdc-body {
            flex-direction: column;
            inset: 0 9cqw;
            gap: 0;
          }
          .cdc-pizzas {
            flex: 0 0 auto;
            width: 100%;
            height: 28cqh;
            margin-top: 4cqh;
          }
          .cdc-pizza--back { right: 2%; top: -2%; width: 58%; }
          .cdc-pizza--front { left: 2%; bottom: -4%; width: 64%; }
          /* laptop: tag on top, the 3-line title on the left, price and
             "2 pizza minimum" on the right, lined up with the title's bottom */
          .cdc-text {
            flex: 0 0 auto;
            height: auto;
            margin-top: 3cqh;
            align-self: stretch;
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-areas: "tag tag" "title price" "title fine";
            grid-template-rows: auto 1fr auto;
            column-gap: 4cqw;
            row-gap: 1.4cqh;
          }
          .cdc-tag { grid-area: tag; justify-self: start; }
          .cdc-title { grid-area: title; }
          .cdc-price { grid-area: price; align-self: end; justify-self: end; }
          .cdc-fine { grid-area: fine; justify-self: end; }
          .cdc-tag { font-size: 3.3cqw; }
          .cdc-title { font-size: 8cqw; margin: 0; }
          .cdc-price { font-size: 12cqw; }
          .cdc-price__each { font-size: 4.6cqw; }
          .cdc-fine { font-size: 3.6cqw; margin-top: 1cqh; }
          .cdc-bar { flex-basis: 18cqh; }
          .cdc-bar :global(.cdc-btn) { font-size: 4.6cqw; min-width: 44cqw; height: 10.5cqh; border-width: 0.7cqw; padding: 0 6cqw; }
          .cdc :global(.cdc-arrow) { width: 5.2cqw; left: auto; right: auto; }
          .cdc :global(.cdc-arrow--left) { left: 2.4cqw; }
          .cdc :global(.cdc-arrow--right) { right: 2.4cqw; }
        }
      `}</style>
    </div>
  );
}
