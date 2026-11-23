// components/promos/DreamDealCard.js
//
// Home page promo banner for Feed 4. Dreamcore, the photographic kind: a
// hazy evening sky with a heavy green-tinted cloud band fading into clear
// blue, a huge smooth grass hill seen from low down (the way a kid sees a
// playground hill), the meal sitting on top of it. Soft bloom, film grain
// and a vignette make it feel like an old, half-remembered photo instead of
// a cartoon.
//
// Two layouts from one card (container queries on the card's own shape):
//   - phones (16:9): words on the left in the sky, hill + food on the right
//   - laptops (the 928x140 strip): hill + food | title | price, button
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "feed4";

export default function DreamDealCard() {
  const deal = findDealById(DEAL_ID);
  const price = ((deal?.price ?? 3999) / 100).toFixed(2);

  return (
    <div className="dr">
      {/* sky: clear blue, a pale glow near the horizon */}
      <div className="dr-sky" aria-hidden="true" />
      {/* the heavy, slightly green storm-cloud band across the top */}
      <svg className="dr-clouds" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="dr-cloud-f" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="4" seed="7" />
            <feColorMatrix
              values="0 0 0 0 0.22
                      0 0 0 0 0.34
                      0 0 0 0 0.30
                      0 0 0 2.4 -0.45"
            />
          </filter>
          <linearGradient id="dr-cloud-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="dr-cloud-m">
            <rect width="400" height="120" fill="url(#dr-cloud-fade)" />
          </mask>
        </defs>
        <rect width="400" height="120" filter="url(#dr-cloud-f)" mask="url(#dr-cloud-m)" />
      </svg>
      {/* a faint, washed-out rainbow, the kind you half see */}
      <div className="dr-rainbow" aria-hidden="true" />

      {/* the hill, with a fine grass texture */}
      <div className="dr-hill" aria-hidden="true">
        <svg className="dr-grass" viewBox="0 0 200 100" preserveAspectRatio="none">
          <filter id="dr-grass-f">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 2.2" numOctaves="2" seed="3" />
            <feColorMatrix
              values="0 0 0 0 0.10
                      0 0 0 0 0.35
                      0 0 0 0 0.05
                      0 0 0 0.9 0"
            />
          </filter>
          <rect width="200" height="100" filter="url(#dr-grass-f)" />
        </svg>
      </div>

      <div className="dr-food" aria-hidden="true">
        <img className="dr-img dr-img--bottle" src="/images/drinks/2l-coke.webp" alt="" />
        <img className="dr-img dr-img--back" src="/images/pizzas/angled/veggie-lover.webp" alt="" />
        <img className="dr-img dr-img--front" src="/images/pizzas/angled/pepperoni.webp" alt="" />
        <img className="dr-img dr-img--wings" src="/images/wings/plate-6.webp" alt="" />
        <img className="dr-img dr-img--bread" src="/images/sides/garlic-bread-plate.webp" alt="" />
      </div>

      {/* photo feel: haze, grain, vignette */}
      <div className="dr-haze" aria-hidden="true" />
      <svg className="dr-grain" aria-hidden="true">
        <filter id="dr-grain-f">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#dr-grain-f)" />
      </svg>

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
          container-type: size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #6f8fd6;
          font-family: var(--font-display);
          text-transform: uppercase;
          color: #fff;
        }
        .dr-sky {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(70% 40% at 60% 62%, rgba(255, 236, 214, 0.75), transparent 70%),
            linear-gradient(180deg, #3c5a8c 0%, #5d86cf 34%, #8fb0e8 60%, #d9cde6 82%, #f3dccd 100%);
        }
        :global(.dr-clouds) {
          position: absolute;
          left: -5%;
          top: -6%;
          width: 110%;
          height: 52%;
          filter: blur(0.35cqw) saturate(1.3);
          opacity: 1;
        }
        .dr-rainbow {
          position: absolute;
          right: -6cqw;
          top: 20cqh;
          width: 70cqw;
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(
            circle closest-side,
            transparent 0 80%,
            rgba(160, 110, 255, 0.5) 81%,
            rgba(90, 160, 255, 0.5) 84%,
            rgba(110, 230, 150, 0.45) 87%,
            rgba(255, 240, 120, 0.45) 90%,
            rgba(255, 170, 90, 0.45) 93%,
            rgba(255, 110, 120, 0.4) 96%,
            transparent 99%
          );
          filter: blur(0.5cqw);
          opacity: 0.55;
          mix-blend-mode: screen;
        }

        /* the hill: one big smooth dome, lit from the top-left */
        .dr-hill {
          position: absolute;
          left: 30cqw;
          right: -18cqw;
          bottom: -62cqh;
          height: 118cqh;
          border-radius: 50%;
          overflow: hidden;
          background:
            radial-gradient(55% 35% at 40% 8%, rgba(240, 255, 170, 0.6), transparent 70%),
            radial-gradient(120% 90% at 50% 0%, #86e044 0%, #5cc12c 30%, #3a9a1c 60%, #276f14 100%);
          box-shadow: 0 -0.4cqw 1.4cqw rgba(230, 255, 200, 0.45);
          filter: blur(0.12cqw);
        }
        :global(.dr-grass) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          mix-blend-mode: multiply;
          opacity: 0.55;
        }

        /* the meal on top of the hill */
        .dr-food {
          position: absolute;
          left: 40cqw;
          right: 1cqw;
          top: 10cqh;
          height: 58cqh;
        }
        .dr-img {
          position: absolute;
          height: auto;
          filter: saturate(1.15) contrast(0.95) brightness(1.04) drop-shadow(0.4cqw 0.8cqw 0.8cqw rgba(20, 50, 10, 0.45));
          user-select: none;
        }
        .dr-img--bottle { height: 78%; width: auto; right: 5%; top: 0; }
        .dr-img--back { width: 44%; left: 22%; top: 18%; }
        .dr-img--front { width: 46%; left: 6%; top: 38%; }
        .dr-img--wings { width: 28%; left: 44%; bottom: -14%; }
        .dr-img--bread { width: 26%; right: 0; bottom: -10%; }

        .dr-haze {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(60% 50% at 55% 55%, rgba(255, 240, 230, 0.18), transparent 70%),
            radial-gradient(130% 120% at 50% 45%, transparent 55%, rgba(30, 20, 60, 0.45) 100%);
        }
        :global(.dr-grain) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.14;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        /* ---- words: soft, glowing, a little faded ---- */
        .dr-title {
          position: absolute;
          left: 5cqw;
          top: 34cqh;
          z-index: 3;
          width: 40cqw;
        }
        .dr-name {
          margin: 0;
          font-family: var(--font-display);
          font-size: 12cqw;
          line-height: 0.9;
          color: rgba(255, 255, 255, 0.96);
          text-shadow: 0 0.2cqw 1.2cqw rgba(30, 45, 100, 0.55), 0 0 4cqw rgba(255, 220, 240, 0.5);
          letter-spacing: 0.02em;
        }
        .dr-items {
          margin: 2.2cqh 0 0;
          white-space: pre-line;
          font-family: var(--font-body);
          font-weight: var(--w-semibold);
          font-size: 2.8cqw;
          line-height: 1.35;
          text-transform: none;
          color: rgba(255, 255, 255, 0.92);
          text-shadow: 0 0.2cqw 1cqw rgba(30, 40, 90, 0.6);
        }
        .dr-buy {
          position: absolute;
          left: 5cqw;
          bottom: 9cqh;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 3cqw;
        }
        .dr-price {
          font-size: 7.5cqw;
          line-height: 1;
          color: #fff;
          text-shadow: 0 0.2cqw 1.2cqw rgba(30, 45, 100, 0.55);
        }
        /* a frosted, glowing pill */
        .dr :global(.dr-btn) {
          display: inline-flex;
          align-items: center;
          padding: 2.4cqh 4.4cqw 2cqh;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          -webkit-backdrop-filter: blur(1cqw);
          backdrop-filter: blur(1cqw);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 2.4cqw rgba(255, 245, 235, 0.7);
          color: #3a4f9a;
          font-family: var(--font-display);
          font-size: 3.4cqw;
          line-height: 1;
          letter-spacing: 0.08em;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s ease;
        }
        .dr :global(.dr-btn:hover),
        .dr :global(.dr-btn:focus-visible) {
          background: #fff;
          outline: none;
        }

        /* ===== Laptop strip (928x140): hill + food | title | buy ===== */
        @container (min-aspect-ratio: 3 / 1) {
          :global(.dr-clouds) { height: 62%; }
          .dr-rainbow { left: 2cqw; right: auto; top: 10cqh; width: 34cqw; }
          .dr-hill { left: -6cqw; right: auto; width: 44cqw; bottom: -150cqh; height: 230cqh; }
          .dr-food { left: 2cqw; right: auto; width: 32cqw; top: 6cqh; height: 90cqh; }
          .dr-img--bottle { height: 84%; right: auto; left: 0; top: 0; }
          .dr-img--back { width: 40%; left: 26%; top: 6%; }
          .dr-img--front { width: 42%; left: 12%; top: 30%; }
          .dr-img--wings { width: 26%; left: 50%; bottom: 0; }
          .dr-img--bread { width: 24%; right: 0; bottom: 4%; }
          .dr-title {
            left: 39cqw;
            top: 50%;
            transform: translateY(-50%);
            width: 34cqw;
            display: flex;
            align-items: center;
            gap: 2.4cqw;
          }
          .dr-name { font-size: 5.6cqw; white-space: nowrap; }
          .dr-items { margin: 0; font-size: 1.2cqw; }
          .dr-buy {
            left: auto;
            right: 3cqw;
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
            gap: 2cqw;
          }
          .dr-price { font-size: 3.4cqw; }
          .dr :global(.dr-btn) { font-size: 1.5cqw; padding: 9cqh 2.2cqw 7.5cqh; }
        }
      `}</style>
    </div>
  );
}
