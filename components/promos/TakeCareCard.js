// components/promos/TakeCareCard.js
//
// Home page promo banner for the Take Care Combo. Elegant, late-night look:
// all black, one gold (#c48c56), a brush-script "Take Care" title, thin
// gold frame lines, candlelight glow, and the food photos toned down with a
// warm sepia filter so they look moody and bespoke instead of bright.
//
// Two layouts from one card (container queries on the card's own shape):
//   - phones (16:9): text on the left, food on the right
//   - laptops (the 928x140 strip): food | title | details, price, button
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "takecare";

// Optional logo image for the title. Put a file at this path (transparent
// PNG, or the gold logo on black) and the card shows it instead of the
// brush-script text. If it's missing, the text is used.
const LOGO_SRC = "/images/promos/take-care-logo.png";

// The 4 pops, front (lowest) to back, stepping up and to the right.
const CANS = ["can-pepsi", "can-canada-dry", "can-crush-orange", "can-coke"];
// fanned out like a hand of cards: tilt (degrees) and sideways spread
const FAN = [-38, -13, 13, 38];

export default function TakeCareCard() {
  const deal = findDealById(DEAL_ID);
  const price = ((deal?.price ?? 3599) / 100).toFixed(2);

  // Show the logo image only once it has really loaded.
  const logoRef = useRef(null);
  const [logoOk, setLogoOk] = useState(false);
  useEffect(() => {
    const img = logoRef.current;
    if (img?.complete && img.naturalWidth) setLogoOk(true);
  }, []);

  return (
    <div className="tc">
      <div className="tc-glow" aria-hidden="true" />
      <div className="tc-frame" aria-hidden="true" />

      <div className="tc-food" aria-hidden="true">
        <div className="tc-cans">
          {CANS.map((c, i) => (
            <img
              key={c}
              className="tc-img tc-can"
              src={`/images/drinks/${c}.webp`}
              alt=""
              style={{ "--tilt": `${FAN[i]}deg`, "--spread": i - (CANS.length - 1) / 2 }}
            />
          ))}
        </div>
        <img className="tc-img tc-img--back" src="/images/pizzas/angled/veggie-lover.webp" alt="" />
        <img className="tc-img tc-img--front" src="/images/pizzas/angled/meat-lover.webp" alt="" />
        <img className="tc-img tc-img--bread" src="/images/sides/garlic-bread-plate.webp" alt="" />
      </div>

      <div className="tc-title">
        <h2 className={`tc-script${logoOk ? " tc-script--hidden" : ""}`}>Take Care</h2>
        <img
          ref={logoRef}
          className={`tc-logo${logoOk ? " is-on" : ""}`}
          src={LOGO_SRC}
          alt=""
          aria-hidden="true"
          onLoad={() => setLogoOk(true)}
          onError={() => setLogoOk(false)}
        />
        <div className="tc-combo">Combo</div>
      </div>

      <div className="tc-info">
        <p className="tc-items">
          2 Large 3-Topping Pizzas{"\n"}Garlic Bread, 4 Pops, 2 Dips
        </p>
        <div className="tc-buy">
          <div className="tc-price">${price}</div>
          <Link href={`/coupons?deal=${DEAL_ID}`} className="tc-btn">
            Order Now
          </Link>
        </div>
      </div>

      <style jsx>{`
        .tc {
          --gold: #c48c56;
          --gold-hi: #e2b27c;
          --gold-lo: #8a5f33;
          container-type: size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #050403;
          color: var(--gold);
          font-family: var(--font-body);
        }
        /* candlelight: a warm glow behind the food, dark everywhere else */
        .tc-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(45% 70% at 72% 55%, rgba(196, 140, 86, 0.28), transparent 70%),
            radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.85) 100%);
        }
        /* thin double gold frame, like the picture frames on the cover */
        .tc-frame {
          position: absolute;
          inset: 2.2cqh 1.6cqw;
          border: 1px solid rgba(196, 140, 86, 0.75);
          box-shadow: inset 0 0 0 3px #050403, inset 0 0 0 4px rgba(196, 140, 86, 0.35),
            0 0 0 60cqw #050403; /* blacks out everything outside the frame */
          pointer-events: none;
          z-index: 5;
        }

        /* ---- the food: warm sepia, low light, a soft gold rim ---- */
        .tc-food {
          position: absolute;
          right: 3.5cqw;
          top: 6cqh;
          bottom: 6cqh;
          width: 44cqw;
        }
        .tc-img {
          position: absolute;
          height: auto;
          filter: sepia(0.45) saturate(0.85) contrast(1.12) brightness(0.82)
            drop-shadow(0 0 0.8cqw rgba(196, 140, 86, 0.35)) drop-shadow(0.6cqw 1cqw 1.2cqw rgba(0, 0, 0, 0.9));
          user-select: none;
        }
        /* 4 flat cans fanned out behind the pizzas: they all pivot from
           the same point, the outer two tilt the most, the middle two less,
           and the pizzas cover their bottom half */
        /* the pivot (bottom centre of this box) sits just behind the top of
           the pizzas; each can swings out from it */
        .tc-cans {
          position: absolute;
          left: 8%;
          top: -2%;
          width: 74%;
          height: 44%;
          z-index: 0;
        }
        .tc-can {
          height: 92%;
          width: auto;
          left: 50%;
          bottom: 0;
          transform-origin: 50% 100%;
          transform: translateX(calc(-50% + var(--spread) * 18%)) rotate(var(--tilt));
        }
        .tc-img--back { width: 70%; right: 0; top: 14%; z-index: 1; }
        .tc-img--front { width: 74%; left: 0; top: 30%; z-index: 1; }
        /* garlic bread tucked over the front of both pizzas */
        /* garlic bread over the gap between the two pizzas */
        .tc-img--bread { width: 40%; right: 0; top: 56%; z-index: 2; }

        /* ---- title: brush script + spaced-out caps ---- */
        .tc-title {
          position: absolute;
          left: 7cqw;
          top: 9cqh;
          z-index: 2;
          text-align: left;
        }
        .tc-script {
          margin: 0;
          font-family: "Promo Mr Dafoe", cursive;
          font-weight: 400;
          font-size: 12cqw;
          line-height: 0.9;
          color: var(--gold);
          text-transform: none;
          text-shadow: 0 0 2cqw rgba(196, 140, 86, 0.3);
        }
        .tc-script--hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        .tc-logo {
          display: none;
          margin-left: -6.2cqw;
          width: 50cqw;
          height: auto;
        }
        .tc-logo.is-on {
          display: block;
        }
        .tc-combo {
          margin: 0.6cqh 0 0 3.4cqw;
          font-family: var(--font-display);
          font-size: 3.2cqw;
          letter-spacing: 0.55em;
          text-transform: uppercase;
          color: var(--gold);
        }

        /* ---- details, price, button ---- */
        .tc-info {
          position: absolute;
          left: 7cqw;
          bottom: 10cqh;
          z-index: 2;
          width: 46cqw;
        }
        .tc-items {
          margin: 0 0 3cqh;
          white-space: pre-line;
          font-size: 3.8cqw;
          font-weight: var(--w-regular);
          line-height: 1.35;
          letter-spacing: 0.02em;
          color: rgba(226, 178, 124, 0.85);
        }
        .tc-buy {
          display: flex;
          align-items: center;
          gap: 3.5cqw;
        }
        .tc-price {
          font-family: var(--font-display);
          font-size: 7cqw;
          line-height: 1;
          background: linear-gradient(180deg, var(--gold-hi) 0%, var(--gold) 55%, var(--gold-lo) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .tc :global(.tc-btn) {
          display: inline-flex;
          align-items: center;
          padding: 2.6cqh 5cqw 2.1cqh;
          border: 1px solid var(--gold);
          border-radius: 999px;
          background: transparent;
          color: var(--gold);
          font-family: var(--font-display);
          font-size: 3.6cqw;
          line-height: 1;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .tc :global(.tc-btn:hover),
        .tc :global(.tc-btn:focus-visible) {
          background: var(--gold);
          color: #050403;
          outline: none;
        }

        /* ===== Laptop strip (928x140): food | title | details ===== */
        @container (min-aspect-ratio: 3 / 1) {
          .tc-frame { inset: 7cqh 0.8cqw; }
          .tc-glow {
            background:
              radial-gradient(22% 90% at 20% 55%, rgba(196, 140, 86, 0.3), transparent 70%),
              radial-gradient(120% 140% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.85) 100%);
          }
          .tc-food { left: 2.5cqw; right: auto; top: 10cqh; bottom: 10cqh; width: 30cqw; }
          .tc-cans { left: 10%; top: -6%; width: 56%; height: 54%; }
          .tc-img--back { width: 44%; right: 18%; top: 4%; }
          .tc-img--front { width: 46%; left: 14%; top: 20%; }
          .tc-img--bread { width: 28%; right: 4%; top: 34%; bottom: auto; }
          .tc-title {
            left: 35cqw;
            top: 50%;
            transform: translateY(-50%);
            text-align: center;
          }
          .tc-script { font-size: 5.6cqw; }
          .tc-logo { width: 18cqw; margin: 0 auto; }
          .tc-combo { font-size: 1.35cqw; margin: 2cqh 0 0 0.6cqw; }
          .tc-info {
            left: auto;
            right: 3.5cqw;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
            width: 30cqw;
            text-align: right;
          }
          .tc-items { font-size: 1.5cqw; margin-bottom: 8cqh; }
          .tc-buy { justify-content: flex-end; gap: 1.8cqw; }
          .tc-price { font-size: 3cqw; }
          .tc :global(.tc-btn) { font-size: 1.5cqw; padding: 9cqh 2.4cqw 7.5cqh; }
        }
      `}</style>
    </div>
  );
}
