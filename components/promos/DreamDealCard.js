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

// ---- Phone rainbow: a ribbon that starts as a thin sliver in the top-right
// corner and widens as it sweeps down towards the viewer. Two curves (the
// rainbow's outer and inner edge) meet at the corner; each colour band is a
// slice between them. Coordinates are 0-100 across the whole card.
const RB_COLORS = ["#ff5a5a", "#ff9a3c", "#ffe45c", "#7fe07a", "#5fb8ff", "#6a7dff", "#b07bff"];
const RB_OUTER = [[99, 0], [54, 22], [14, 106]]; // start, bend, end (outer/left edge)
const RB_INNER = [[100, 1], [100, 50], [112, 106]]; // inner/right edge
function bez([a, b, c], t) {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
}
const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
const STEPS = 40;
const RB_BANDS = RB_COLORS.map((color, k) => {
  const a = [];
  const b = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const o = bez(RB_OUTER, t);
    const n = bez(RB_INNER, t);
    a.push(lerp(o, n, k / RB_COLORS.length));
    b.push(lerp(o, n, (k + 1) / RB_COLORS.length));
  }
  const pts = [...a, ...b.reverse()].map((p) => p.map((v) => v.toFixed(2)).join(",")).join(" ");
  return { color, pts };
});

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
      {/* a soft, photographic rainbow: it comes in from the top-right
          corner and curves down through the bottom of the card */}
      <svg className="dr-rb-phone" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="dr-rbp-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
          <linearGradient id="dr-rbp-fade" x1="1" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id="dr-rbp-mask">
            <rect width="100" height="100" fill="url(#dr-rbp-fade)" />
          </mask>
        </defs>
        <g filter="url(#dr-rbp-blur)" mask="url(#dr-rbp-mask)">
          {RB_BANDS.map((b) => (
            <polygon key={b.color} points={b.pts} fill={b.color} />
          ))}
        </g>
      </svg>
      <svg className="dr-rainbow" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="dr-rb-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>
        <g filter="url(#dr-rb-blur)" fill="none" strokeWidth="3.4">
          {["#ff5a5a", "#ff9a3c", "#ffe45c", "#7fe07a", "#5fb8ff", "#6a7dff", "#b07bff"].map((c, i) => (
            <circle key={c} cx="112" cy="128" r={112 - i * 3.2} stroke={c} />
          ))}
        </g>
      </svg>

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
        /* phone: the wide ribbon rainbow; laptop: the arc (below) */
        :global(.dr-rb-phone) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.72;
        }
        :global(.dr-rainbow) {
          display: none;
          position: absolute;
          right: 0;
          top: 0;
          width: 64cqw;
          height: 100cqh;
          opacity: 0.72;
          overflow: visible;
        }

        /* the meal, sliding down the rainbow towards you (phone: the box is
           the whole card, so these % are of the card) */
        .dr-food {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 100cqh;
        }
        .dr-img {
          position: absolute;
          height: auto;
          filter: saturate(1.15) contrast(0.95) brightness(1.04) drop-shadow(0.4cqw 1cqw 1cqw rgba(20, 30, 70, 0.4));
          user-select: none;
        }
        /* smallest (farthest) at the top-right, biggest (closest) at the bottom */
        .dr-img--bottle { height: 30%; width: auto; right: 7%; top: 6%; transform: rotate(18deg); }
        .dr-img--back { width: 21%; left: 72%; top: 30%; transform: rotate(-8deg); }
        .dr-img--front { width: 27%; left: 60%; top: 44%; transform: rotate(-12deg); }
        .dr-img--wings { width: 20%; left: 55%; bottom: 3%; transform: rotate(-14deg); }
        .dr-img--bread { width: 21%; right: 2%; bottom: 6%; transform: rotate(-6deg); }

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
          top: 16cqh;
          z-index: 3;
          width: 44cqw;
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
          font-size: 3.8cqw;
          line-height: 1.3;
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
          :global(.dr-rb-phone) { display: none; }
          :global(.dr-rainbow) { display: block; left: auto; right: 0; width: 70cqw; opacity: 0.6; }
          .dr-img { transform: none; }
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
