// components/promos/MenuDealBanner.js
//
// The deal banner under the "MENU" title (same 1322x370 box the old
// placeholder image used). A classic pizza-chain promo: the food spread out
// on a warm wooden table, big white heavy words on the left, a white price
// tag with a big red price, the code and conditions in small print, and a
// red Order Now pill in the bottom right.
// Shows the Choose Any 2 or More deal; price and code come from
// utils/dealCatalog.js.
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";

const DEAL_ID = "pick2mix";

export default function MenuDealBanner() {
  const deal = findDealById(DEAL_ID);
  const [dollars, cents] = ((deal?.price ?? 899) / 100).toFixed(2).split(".");

  return (
    <div className="mdb">
      {/* the table with the food on it */}
      <div className="mdb-table" aria-hidden="true" />
      <div className="mdb-food" aria-hidden="true">
        <img className="mdb-img mdb-img--pizza" src="/images/pizzas/overhead/pepperoni.webp" alt="" />
        <img className="mdb-img mdb-img--pizza2" src="/images/pizzas/overhead/hawaiian.webp" alt="" />
        <img className="mdb-img mdb-img--poutine" src="/images/sides/poutine-top.webp" alt="" />
        <img className="mdb-img mdb-img--bread" src="/images/sides/cheesy-garlic-bread-top.webp" alt="" />
        <img className="mdb-img mdb-img--wings" src="/images/wings/plate-6.webp" alt="" />
      </div>
      <div className="mdb-shade" aria-hidden="true" />

      <div className="mdb-words">
        <h2 className="mdb-title">
          <span>Choose</span>
          <span>Any 2</span>
          <span>or More</span>
        </h2>
        <div className="mdb-fine">
          <strong>Code: {deal?.code || "RSP-899"}</strong>
          <em>Price is per item. 2 item minimum.</em>
        </div>
      </div>

      {/* white price tag */}
      {/* drawn twice: the red outlines underneath, the white on top, so
          the outlines never cut across the white numbers */}
      <div className="mdb-tag" aria-label={`$${dollars}.${cents} each`}>
        {["stroke", "fill"].map((layer) => (
          <div key={layer} className={`mdb-tag__layer mdb-tag__layer--${layer}`} aria-hidden="true">
            <span className="mdb-tag__dollar">$</span>
            <span className="mdb-tag__num">{dollars}</span>
            <span className="mdb-tag__side">
              <span className="mdb-tag__cents">{cents}</span>
              <span className="mdb-tag__each">Each</span>
            </span>
          </div>
        ))}
      </div>

      <Link href={`/coupons?deal=${DEAL_ID}`} className="mdb-btn">
        Order Now
      </Link>

      <style jsx>{`
        .mdb {
          --red: #e3141c;
          container-type: size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 0.4rem;
          background: #6b4527;
        }
        /* warm wooden table, lit from the top right */
        .mdb-table {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(70% 120% at 78% 20%, rgba(255, 214, 160, 0.45), transparent 70%),
            repeating-linear-gradient(92deg, rgba(60, 32, 14, 0.18) 0 0.3cqw, transparent 0.3cqw 2.2cqw),
            repeating-linear-gradient(92deg, rgba(255, 220, 170, 0.08) 0 0.15cqw, transparent 0.15cqw 0.9cqw),
            linear-gradient(180deg, #a8754a 0%, #8a5a34 55%, #6b4326 100%);
        }
        .mdb-food {
          position: absolute;
          inset: 0;
        }
        .mdb-img {
          position: absolute;
          height: auto;
          filter: drop-shadow(0.6cqw 1cqw 1cqw rgba(40, 20, 5, 0.55));
          user-select: none;
        }
        .mdb-img--pizza { width: 30cqw; left: 47cqw; top: -14cqh; transform: rotate(-10deg); }
        .mdb-img--pizza2 { width: 26cqw; right: -6cqw; top: -24cqh; transform: rotate(14deg); }
        .mdb-img--poutine { width: 17cqw; right: 15cqw; top: 34cqh; }
        .mdb-img--bread { width: 17cqw; left: 37cqw; bottom: -30cqh; transform: rotate(8deg); }
        .mdb-img--wings { width: 19cqw; left: 58cqw; bottom: -14cqh; transform: rotate(-6deg); }
        /* darker on the left so the white words pop */
        .mdb-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(40, 20, 6, 0.75) 0%, rgba(40, 20, 6, 0.45) 30%, transparent 48%);
        }

        .mdb-words {
          position: absolute;
          left: 2.6cqw;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
        }
        .mdb-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          font-family: var(--font-display);
          font-size: 6.2cqw;
          line-height: 0.9;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 0.3cqw 1.2cqw rgba(0, 0, 0, 0.45);
        }
        .mdb-fine {
          display: flex;
          flex-direction: column;
          margin-top: 2cqh;
          color: #fff;
          text-shadow: 0 0.2cqw 0.6cqw rgba(0, 0, 0, 0.6);
        }
        .mdb-fine strong {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: max(var(--fs-xs), 1.5cqw);
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .mdb-fine em {
          font-size: max(var(--fs-xs), 1.25cqw);
          font-weight: var(--w-medium);
          opacity: 0.95;
        }

        /* the price, straight on the food: white numbers with one thick red
           outline that merges into a single shape, plus a soft shadow.
           --stroke is the outline thickness (the same for every part, so the
           outlines join up). */
        .mdb-tag {
          --stroke: 2.2cqw;
          position: absolute;
          left: 29cqw;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          font-family: var(--font-display);
          text-transform: uppercase;
          line-height: 0.8;
          filter: drop-shadow(0 0.6cqw 1cqw rgba(0, 0, 0, 0.45));
        }
        .mdb-tag__layer {
          display: flex;
          align-items: flex-start;
        }
        .mdb-tag__layer--stroke {
          color: var(--red);
        }
        .mdb-tag__layer--stroke span {
          -webkit-text-stroke: calc(var(--stroke) * 2) var(--red);
        }
        .mdb-tag__layer--fill {
          position: absolute;
          inset: 0;
          color: #fff;
        }
        .mdb-tag__dollar {
          font-size: 7.5cqw;
          margin-top: 2.4cqw;
        }
        .mdb-tag__num {
          font-size: 20cqw;
          letter-spacing: -0.02em;
          margin: 0 0.6cqw 0 -0.4cqw;
        }
        .mdb-tag__side {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 1.4cqw;
        }
        .mdb-tag__cents {
          font-size: 9.9cqw;
          letter-spacing: -0.02em;
        }
        .mdb-tag__each {
          margin-top: -0.2cqw;
          font-size: 4.9cqw;
          letter-spacing: 0.02em;
        }

        .mdb :global(.mdb-btn) {
          position: absolute;
          right: 2.6cqw;
          bottom: 9cqh;
          z-index: 3;
          padding: 1.4cqw 3cqw 1.2cqw;
          border-radius: 999px;
          background: var(--red);
          color: #fff;
          font-family: var(--font-display);
          font-size: 2.6cqw;
          line-height: 1;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 0.5cqw 1.4cqw rgba(0, 0, 0, 0.35);
          transition: filter 0.15s ease, transform 0.15s ease;
        }
        .mdb :global(.mdb-btn:hover),
        .mdb :global(.mdb-btn:focus-visible) {
          filter: brightness(1.08);
          transform: translateY(-0.15cqw);
          outline: none;
        }

        /* phones: the box is only about 100px tall, so the small print is
           left out (it's on the deal itself) and the words get bigger */
        @container (max-width: 560px) {
          .mdb-fine { display: none; }
          .mdb-title { font-size: 7.6cqw; }
          .mdb-tag { left: 33cqw; }
          .mdb :global(.mdb-btn) { font-size: 3.4cqw; padding: 1.8cqw 3.6cqw 1.5cqw; }
        }
      `}</style>
    </div>
  );
}
