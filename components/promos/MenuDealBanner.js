// components/promos/MenuDealBanner.js
//
// The deal banner under the "MENU" title (same 1322x370 box the old
// placeholder image used). A plain promo in the menu page's own style:
// cream box, brown border, Red Stone Face caps, the site's red pill button.
// Shows the Choose Any 2 or More deal ($8.99 each); the price and the list
// of choices come from utils/dealCatalog.js.
import Link from "next/link";
import { findDealById } from "../../utils/dealCatalog";
import { formatMoney } from "../Pricing";

const DEAL_ID = "pick2mix";

export default function MenuDealBanner() {
  const deal = findDealById(DEAL_ID);
  const price = formatMoney(deal?.price ?? 899);
  // "Get Any 2 or More: A, B, C. Price is per item." -> "A, B, C"
  const choices = String(deal?.description || "")
    .replace(/^[^:]*:\s*/, "")
    .replace(/\.\s*Price is per item\.?$/i, "")
    .trim();

  return (
    <div className="mdb">
      <div className="mdb-pic">
        <img src="/images/deals/pick2mix.jpg" alt="" />
      </div>

      <div className="mdb-text">
        <div className="mdb-tag">Deal</div>
        <h2 className="mdb-name">Choose Any 2 or More</h2>
        <p className="mdb-choices">{choices}</p>
      </div>

      <div className="mdb-buy">
        <div className="mdb-price">
          {price}
          <span className="mdb-each">Each</span>
        </div>
        <Link href={`/coupons?deal=${DEAL_ID}`} className="rs-pill-btn mdb-btn">
          Order Now
        </Link>
      </div>

      <style jsx>{`
        .mdb {
          container-type: size;
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          gap: 2.5cqw;
          padding: 0 3cqw 0 0;
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          color: var(--text-brown);
          overflow: hidden;
        }
        .mdb-pic {
          flex: 0 0 auto;
          height: 100%;
          aspect-ratio: 4 / 3;
          background: #fff;
          border-right: 1px solid var(--menu-box-border);
        }
        .mdb-pic img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mdb-text {
          flex: 1 1 auto;
          min-width: 0;
        }
        .mdb-tag {
          display: inline-block;
          padding: 0.6cqw 1.4cqw 0.4cqw;
          border-radius: 999px;
          background: #8b1a1a;
          color: #fff;
          font-family: var(--font-display);
          font-size: max(var(--fs-xs), 1.4cqw);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .mdb-name {
          margin: 1.2cqw 0 1cqw;
          font-family: var(--font-display);
          font-size: 3.6cqw;
          line-height: 1;
          text-transform: uppercase;
          color: #000;
        }
        .mdb-choices {
          margin: 0;
          font-size: max(var(--fs-xs), 1.5cqw);
          font-weight: var(--w-medium);
          line-height: 1.35;
        }
        .mdb-buy {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.6cqw;
        }
        .mdb-price {
          font-family: var(--font-display);
          font-size: 5.4cqw;
          line-height: 1;
          color: #000;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .mdb-each {
          margin-left: 0.6cqw;
          font-size: 0.42em;
          color: var(--text-brown);
        }
        .mdb :global(.mdb-btn) {
          padding: 1.2cqw 2.6cqw 1cqw;
          font-size: 1.9cqw;
          white-space: nowrap;
          box-shadow: none;
        }

        /* phones: the box is small, so the choices list is left out and the
           words are a little bigger */
        @container (max-width: 560px) {
          .mdb { gap: 3cqw; }
          .mdb-choices { display: none; }
          .mdb-tag { font-size: 2.6cqw; padding: 1cqw 2.4cqw 0.7cqw; }
          .mdb-name { font-size: 5.2cqw; margin-bottom: 0; }
          .mdb-price { font-size: 7.4cqw; }
          .mdb :global(.mdb-btn) { font-size: 3cqw; padding: 1.8cqw 3.6cqw 1.5cqw; }
          .mdb-buy { gap: 2.4cqw; }
        }
      `}</style>
    </div>
  );
}
