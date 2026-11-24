// components/promos/SoftClubCard.js
//
// Home page promo banner for the Party Combo. A mix of three things:
//   - a lab "experiment": cold teal fluorescent light, a clinical white
//     specimen tray with X markers and crosshairs, specimen labels
//   - Gen X soft club: blurred subway light streaks, teal/aqua glass,
//     tiny catalogue text and a barcode
//   - a 2000s computer: a Winamp / Windows 2000 style window
//     ("party_combo.exe") with a blue LCD screen showing the price and a
//     bouncing equalizer
// Every font is Red Stone Face except the glossy Aqua "Order Now" button,
// which uses Michroma (wide 2000s techno type).
//
// Two layouts from one card (container queries on the card's own shape):
//   - phones (16:9): the window on the left, the specimen tray on the right
//   - laptops (the 928x250 banner): tray | window | catalogue text + button
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "party";
const EQ = [5, 9, 6, 11, 8, 4, 10, 7, 12, 6, 9, 5]; // equalizer bar heights (animation offsets)

function Cross({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 3 L17 17 M17 3 L3 17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function SoftClubCard() {
  const deal = findDealById(DEAL_ID);
  const price = ((deal?.price ?? 6499) / 100).toFixed(2);

  return (
    <div className="px">
      {/* ---- background: teal fluorescent hall with light streaks ---- */}
      <div className="px-bg" aria-hidden="true" />
      <div className="px-streaks" aria-hidden="true" />
      <div className="px-lights" aria-hidden="true" />
      <div className="px-scan" aria-hidden="true" />

      {/* ---- the specimen tray with the food ---- */}
      <div className="px-lab" aria-hidden="true">
        <div className="px-tray" />
        <div className="px-target px-target--a" />
        <div className="px-target px-target--b" />
        <img className="px-img px-img--bottle" src="/images/drinks/2l-pepsi.webp" alt="" />
        <img className="px-img px-img--p1" src="/images/pizzas/angled/veggie-lover.webp" alt="" />
        <img className="px-img px-img--p2" src="/images/pizzas/angled/pepperoni.webp" alt="" />
        <img className="px-img px-img--p3" src="/images/pizzas/angled/meat-lover.webp" alt="" />
        <img className="px-img px-img--wings" src="/images/wings/plate-20.webp" alt="" />
        <img className="px-img px-img--bread" src="/images/sides/garlic-bread-plate.webp" alt="" />
        <Cross className="px-x px-x--1" />
        <Cross className="px-x px-x--2" />
        <Cross className="px-x px-x--3" />
        <span className="px-tag px-tag--1">Spec. 01, Pizza x3</span>
        <span className="px-tag px-tag--2">Spec. 02, Wings x20</span>
      </div>

      {/* ---- the 2000s program window ---- */}
      <div className="px-win">
        <div className="px-bar">
          <span className="px-bar__icon" aria-hidden="true">
            <Cross className="px-bar__x" />
          </span>
          <span className="px-bar__title">party_combo.exe</span>
          <span className="px-bar__btns" aria-hidden="true">
            <i>_</i>
            <i>□</i>
            <i>×</i>
          </span>
        </div>
        <div className="px-menu" aria-hidden="true">
          File&nbsp;&nbsp;Play&nbsp;&nbsp;Options&nbsp;&nbsp;Help
        </div>
        <div className="px-body">
          <div className="px-lcd">
            <div className="px-lcd__top" aria-hidden="true">
              <span>Experiment 03</span>
              <span>Serves 6+</span>
            </div>
            <h2 className="px-name">Party Combo</h2>
            <div className="px-lcd__row">
              <div className="px-price">${price}</div>
              <div className="px-eq" aria-hidden="true">
                {EQ.map((h, i) => (
                  <span key={i} style={{ "--h": h, animationDelay: `${-i * 0.13}s` }} />
                ))}
              </div>
            </div>
            <div className="px-scroll" aria-hidden="true">
              <span>Now Serving: 3 Large Pizzas + 20 Wings + Garlic Bread + 2L + 3 Dips ::: </span>
            </div>
          </div>
          <p className="px-items">
            3 Large 2-Topping Pizzas, 20 Wings{"\n"}Garlic Bread, 2L Drink, 3 Dips
          </p>
        </div>
      </div>

      {/* ---- catalogue text, barcode, button ---- */}
      <div className="px-side">
        <div className="px-cat" aria-hidden="true">
          Best In and Out the 06{"\n"}Red Stone Pizza Club
        </div>
        <div className="px-barcode" aria-hidden="true" />
        <Link href={`/coupons?deal=${DEAL_ID}`} className="px-btn">
          <span>Order Now</span>
        </Link>
      </div>

      <style jsx>{`
        .px {
          --teal: #0f3b3a;
          --mint: #9fe6d8;
          --aqua: #5ad1ff;
          --lcd: #0b2a6f;
          --lcd-text: #a9dcff;
          container-type: size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          font-family: var(--font-body);
          color: #e6f6f3;
        }

        /* fluorescent teal hall */
        .px-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(70% 60% at 70% 30%, rgba(190, 255, 240, 0.35), transparent 70%),
            linear-gradient(180deg, #1d5552 0%, #123f3e 45%, #0a2a2c 100%);
        }
        /* motion-blurred light streaks, like a train going past */
        .px-streaks {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(176deg, transparent 38%, rgba(220, 255, 245, 0.55) 40%, transparent 43%),
            linear-gradient(176deg, transparent 52%, rgba(160, 230, 255, 0.35) 53%, transparent 55%),
            linear-gradient(176deg, transparent 63%, rgba(255, 245, 210, 0.3) 63.6%, transparent 65%);
          filter: blur(0.6cqw);
          animation: px-pass 6s linear infinite;
        }
        @keyframes px-pass {
          0% { transform: translateX(-6%); }
          100% { transform: translateX(6%); }
        }
        /* rows of ceiling lights */
        .px-lights {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 18%;
          background: repeating-linear-gradient(90deg, rgba(230, 255, 250, 0.7) 0 6cqw, transparent 6cqw 14cqw);
          filter: blur(0.5cqw);
          opacity: 0.45;
          -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
          mask-image: linear-gradient(to bottom, #000, transparent);
        }
        /* faint CRT scanlines over everything */
        .px-scan {
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
          background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.07) 0 1px, transparent 1px 3px);
        }

        /* ---- specimen tray ---- */
        .px-lab {
          position: absolute;
          right: 2cqw;
          top: 6cqh;
          width: 48cqw;
          height: 90cqh;
        }
        .px-tray {
          position: absolute;
          left: 2%;
          right: 2%;
          bottom: 2%;
          height: 74%;
          border-radius: 2cqw;
          background: linear-gradient(180deg, #f7fbfa 0%, #dbe9e6 100%);
          border: 1px solid #ffffff;
          box-shadow: 0 1.4cqw 2.4cqw rgba(0, 0, 0, 0.45), inset 0 0 0 0.6cqw rgba(160, 200, 195, 0.35);
          transform: perspective(40cqw) rotateX(28deg);
          transform-origin: bottom;
        }
        /* crosshair targets on the tray */
        .px-target {
          position: absolute;
          width: 12cqw;
          height: 12cqw;
          border-radius: 50%;
          border: 1px dashed rgba(15, 59, 58, 0.55);
          background:
            linear-gradient(rgba(15, 59, 58, 0.5), rgba(15, 59, 58, 0.5)) center / 1px 100% no-repeat,
            linear-gradient(rgba(15, 59, 58, 0.5), rgba(15, 59, 58, 0.5)) center / 100% 1px no-repeat;
          transform: scaleY(0.45);
        }
        .px-target--a { left: 6%; bottom: 8%; }
        .px-target--b { right: 30%; bottom: 4%; }
        .px-img {
          position: absolute;
          height: auto;
          /* cold, clinical grade */
          filter: saturate(0.85) contrast(1.05) brightness(1.02) hue-rotate(-8deg) drop-shadow(0 0.8cqw 0.9cqw rgba(0, 0, 0, 0.45));
          user-select: none;
        }
        .px-img--bottle { height: 54%; width: auto; right: 3%; top: 12%; }
        .px-img--p1 { width: 42%; left: 16%; top: 24%; }
        .px-img--p2 { width: 42%; left: 40%; top: 36%; }
        .px-img--p3 { width: 46%; left: 4%; top: 46%; }
        .px-img--wings { width: 30%; right: 6%; bottom: 4%; }
        .px-img--bread { width: 26%; left: 10%; bottom: 3%; }
        :global(.px-x) {
          position: absolute;
          width: 3.4cqw;
          height: 3.4cqw;
          color: #0f3b3a;
          filter: drop-shadow(0 0 0.4cqw rgba(255, 255, 255, 0.8));
        }
        :global(.px-x--1) { left: 46%; top: 6%; color: #e6f6f3; }
        :global(.px-x--2) { left: 52%; bottom: 8%; }
        :global(.px-x--3) { right: 1%; top: 58%; color: #e6f6f3; }
        .px-tag {
          position: absolute;
          padding: 0.4cqh 1cqw 0.2cqh;
          background: #f7fbfa;
          border: 1px solid #9fbdb8;
          color: #0f3b3a;
          font-family: var(--font-display);
          font-size: 1.6cqw;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          box-shadow: 0.3cqw 0.3cqw 0 rgba(0, 0, 0, 0.25);
        }
        .px-tag--1 { left: 0; top: 18%; transform: rotate(-4deg); z-index: 2; }
        .px-tag--2 { right: 0; bottom: 0; transform: rotate(3deg); }

        /* ---- the program window (bevelled silver-blue chrome) ---- */
        .px-win {
          position: absolute;
          left: 3.5cqw;
          top: 6cqh;
          width: 47cqw;
          z-index: 3;
          border-radius: 1cqw 1cqw 0.6cqw 0.6cqw;
          background: linear-gradient(180deg, #d8e1ec 0%, #aebccf 100%);
          border: 1px solid #f2f6fb;
          box-shadow: 0 1.4cqw 3cqw rgba(0, 0, 0, 0.5), inset 0 0 0 1px #7d8ca3;
          overflow: hidden;
        }
        .px-bar {
          display: flex;
          align-items: center;
          gap: 1cqw;
          padding: 1cqh 1.2cqw 0.8cqh;
          background: linear-gradient(180deg, #3a64c8 0%, #1e3f99 55%, #2b55b8 100%);
          color: #fff;
          font-family: var(--font-display);
          font-size: 2cqw;
          letter-spacing: 0.04em;
          text-transform: none;
        }
        .px-bar__icon {
          display: inline-flex;
          width: 2.4cqw;
          height: 2.4cqw;
          border-radius: 0.4cqw;
          background: #e6f6f3;
          color: #1e3f99;
          padding: 0.3cqw;
        }
        :global(.px-bar__x) { width: 100%; height: 100%; }
        .px-bar__title { flex: 1 1 auto; }
        .px-bar__btns {
          display: flex;
          gap: 0.5cqw;
        }
        .px-bar__btns i {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.4cqw;
          height: 2.2cqw;
          border-radius: 0.3cqw;
          background: linear-gradient(180deg, #e9eef6, #b8c5d8);
          color: #1e3f99;
          font-style: normal;
          font-size: 1.6cqw;
          line-height: 1;
        }
        .px-menu {
          padding: 0.6cqh 1.4cqw;
          font-size: 1.6cqw;
          font-weight: var(--w-medium);
          color: #22324f;
          border-bottom: 1px solid #8c9bb2;
        }
        .px-body {
          padding: 1.4cqh 1.4cqw 1.8cqh;
        }
        /* the blue LCD screen */
        .px-lcd {
          padding: 1.2cqh 1.8cqw 1cqh;
          border-radius: 0.6cqw;
          background:
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 2px),
            linear-gradient(180deg, #0d2f7a 0%, #08205a 100%);
          box-shadow: inset 0 0.4cqw 1cqw rgba(0, 0, 0, 0.6), 0 0 0 1px #5e6f8c;
          color: var(--lcd-text);
          text-shadow: 0 0 0.8cqw rgba(120, 200, 255, 0.8);
        }
        .px-lcd__top {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-display);
          font-size: 1.5cqw;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .px-name {
          margin: 0.6cqh 0 0;
          font-family: var(--font-display);
          font-size: 4.6cqw;
          line-height: 1;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #dff1ff;
        }
        .px-lcd__row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 2cqw;
          margin-top: 0.6cqh;
        }
        .px-price {
          font-family: var(--font-display);
          font-size: 7.6cqw;
          line-height: 1;
          color: #ffffff;
          text-shadow: 0 0 1.2cqw rgba(120, 200, 255, 0.95), 0 0 0.3cqw rgba(255, 255, 255, 0.9);
        }
        .px-eq {
          display: flex;
          align-items: flex-end;
          gap: 0.35cqw;
          height: 6cqw;
          padding-bottom: 0.6cqw;
        }
        .px-eq span {
          width: 0.7cqw;
          height: calc(var(--h) * 0.45cqw);
          background: linear-gradient(0deg, #5ad1ff 0%, #9fe6d8 60%, #ffffff 100%);
          box-shadow: 0 0 0.6cqw rgba(90, 209, 255, 0.8);
          animation: px-eq 0.9s ease-in-out infinite alternate;
          transform-origin: bottom;
        }
        @keyframes px-eq {
          0% { transform: scaleY(0.25); }
          100% { transform: scaleY(1); }
        }
        /* scrolling "now playing" text */
        .px-scroll {
          margin-top: 0.8cqh;
          overflow: hidden;
          white-space: nowrap;
          font-size: 1.5cqw;
          font-weight: var(--w-semibold);
          letter-spacing: 0.04em;
        }
        .px-scroll span {
          display: inline-block;
          padding-left: 100%;
          animation: px-marquee 14s linear infinite;
        }
        @keyframes px-marquee {
          to { transform: translateX(-100%); }
        }
        .px-items {
          margin: 1.6cqh 0 0.4cqh;
          white-space: pre-line;
          font-size: 2.9cqw;
          font-weight: var(--w-bold);
          line-height: 1.35;
          color: #22324f;
        }

        /* ---- catalogue text + barcode + button (under the window on phones) ---- */
        .px-side {
          position: absolute;
          left: 3.5cqw;
          bottom: 6cqh;
          width: 47cqw;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2cqw;
        }
        .px-cat {
          white-space: pre; /* keep each line whole */
          font-family: var(--font-display);
          font-size: 1.5cqw;
          line-height: 1.4;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--mint);
        }
        .px-barcode {
          display: none;
          width: 12cqw;
          height: 4cqw;
          background: repeating-linear-gradient(90deg, #e6f6f3 0 1px, transparent 1px 2px, #e6f6f3 2px 4px, transparent 4px 5px, #e6f6f3 5px 6px, transparent 6px 8px);
          opacity: 0.85;
        }
        /* glossy 2000s Aqua button */
        .px :global(.px-btn) {
          position: relative;
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          padding: 2.2cqh 2.8cqw 2cqh;
          border-radius: 999px;
          background: linear-gradient(180deg, #c9f1ff 0%, #5ad1ff 50%, #1f9be6 51%, #6fd8ff 100%);
          border: 1px solid #e9fbff;
          box-shadow: 0 0.8cqw 1.6cqw rgba(0, 0, 0, 0.4), 0 0 2cqw rgba(90, 209, 255, 0.6);
          color: #062a5c;
          font-family: "Promo Michroma", var(--font-display);
          font-weight: 700;
          font-size: 2cqw;
          line-height: 1;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          overflow: hidden;
          transition: transform 0.15s ease;
        }
        .px :global(.px-btn::before) {
          content: "";
          position: absolute;
          left: 7%;
          right: 7%;
          top: 5%;
          height: 30%;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0));
          pointer-events: none;
        }
        .px :global(.px-btn span) { position: relative; }
        .px :global(.px-btn:hover),
        .px :global(.px-btn:focus-visible) {
          transform: translateY(-0.2cqw);
          outline: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .px *,
          .px :global(*) {
            animation: none !important;
          }
        }

        /* ===== Laptop banner (928x250): tray | window | catalogue + button ===== */
        @container (min-aspect-ratio: 3 / 1) {
          .px-lab { right: auto; left: 1.5cqw; top: 4cqh; width: 30cqw; height: 94cqh; }
          .px-tag { font-size: 0.85cqw; }
          :global(.px-x) { width: 1.8cqw; height: 1.8cqw; }
          .px-target { width: 6cqw; height: 6cqw; }
          .px-win { left: 34cqw; top: 50%; transform: translateY(-50%); width: 36cqw; }
          .px-bar { font-size: 1.1cqw; padding: 2cqh 0.8cqw 1.6cqh; }
          .px-bar__icon, .px-bar__btns i { width: 1.4cqw; height: 1.3cqw; }
          .px-bar__btns i { font-size: 0.9cqw; }
          .px-menu { font-size: 0.9cqw; padding: 1cqh 1cqw; }
          .px-body { padding: 2.6cqh 1cqw 3cqh; }
          .px-lcd { padding: 2.6cqh 1.4cqw 2cqh; }
          .px-lcd__top { font-size: 0.8cqw; }
          .px-name { font-size: 2.4cqw; margin-top: 1.4cqh; }
          .px-price { font-size: 4cqw; }
          .px-eq { height: 3.2cqw; padding-bottom: 0.3cqw; }
          .px-eq span { width: 0.4cqw; height: calc(var(--h) * 0.24cqw); }
          .px-scroll { font-size: 0.8cqw; margin-top: 1.6cqh; }
          .px-items { font-size: 1.35cqw; margin-top: 2.6cqh; }
          .px-side {
            left: auto;
            right: 3cqw;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
            width: 22cqw;
            flex-direction: column;
            align-items: flex-end;
            gap: 4cqh;
          }
          .px-cat { font-size: 0.9cqw; text-align: right; }
          .px-barcode { display: block; width: 10cqw; height: 3cqw; }
          .px :global(.px-btn) { font-size: 1.15cqw; padding: 6cqh 2.2cqw 5.4cqh; }
        }
      `}</style>
    </div>
  );
}
