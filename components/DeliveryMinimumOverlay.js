// components/DeliveryMinimumOverlay.js
//
// Opens when someone heads to checkout with a delivery order under the
// delivery minimum (utils/orderRules.js). Shows how much more they need,
// one-tap items that get them over it (utils/quickAddCatalog.js), and the
// option to switch to carryout instead. Rendered once in pages/_app.js;
// opened by CartSystem's goToCheckout().
import React, { useMemo } from "react";
import { useRouter } from "next/router";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";
import { useCart } from "./CartSystem";
import { formatMoney } from "./Pricing";
import { DELIVERY_MINIMUM_CENTS, deliveryShortfallCents } from "../utils/orderRules";
import { suggestQuickAdds } from "../utils/quickAddCatalog";

const FALLBACK_IMG = { side: "/images/menu_sides.png", "drinks-dips": "/images/menu_drinks.png" };

function QuickAddImg({ src, type }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <img
      className="dm-tile__img"
      src={failed ? FALLBACK_IMG[type] || FALLBACK_IMG.side : src}
      alt=""
      loading="lazy"
      onError={() => !failed && setFailed(true)}
    />
  );
}

export default function DeliveryMinimumOverlay() {
  const router = useRouter();
  const cart = useCart();
  const { minGateOpen, closeMinGate, subtotalCents, addItem, confirmCarryout } = cart;

  const short = deliveryShortfallCents(subtotalCents);
  const reached = short === 0;
  const pct = Math.min(100, Math.round(((subtotalCents || 0) / DELIVERY_MINIMUM_CENTS) * 100));
  // Picked when the popup opens and as the gap shrinks.
  const suggestions = useMemo(() => suggestQuickAdds(short), [short]);

  const goCheckout = () => {
    closeMinGate();
    router.push("/checkout");
  };
  const switchToCarryout = () => {
    confirmCarryout();
    goCheckout();
  };

  return (
    <DebugPizzaOverlay
      open={!!minGateOpen}
      onClose={closeMinGate}
      mode="portal"
      blockRogue
      freezeChild={false}
      title="Delivery Minimum"
    >
      {minGateOpen && (
        <div className="dm">
          <div className="dm-box">
            <p className="dm-lead">
              Delivery orders need at least <strong>{formatMoney(DELIVERY_MINIMUM_CENTS)}</strong> of food and
              drinks (before tax and the delivery fee).
            </p>
            <div className="dm-progress" aria-hidden="true">
              <div className="dm-progress__bar" style={{ width: `${pct}%` }} />
            </div>
            <div className="dm-status">
              {reached ? (
                <span className="dm-status__ok">You're all set for delivery!</span>
              ) : (
                <span>
                  Add <strong>{formatMoney(short)}</strong> more to get delivery.
                </span>
              )}
              <span className="dm-status__total">
                {formatMoney(subtotalCents || 0)} of {formatMoney(DELIVERY_MINIMUM_CENTS)}
              </span>
            </div>
          </div>

          {!reached && (
            <>
              <div className="dm-h">Quick Add</div>
              <div className="dm-grid">
                {suggestions.map((q) => (
                  <div key={q.key} className="dm-tile">
                    {q.coversGap && <span className="dm-tile__tag">Gets you there</span>}
                    <QuickAddImg src={q.img} type={q.item.type} />
                    <div className="dm-tile__name">{q.label}</div>
                    <div className="dm-tile__price">{formatMoney(q.priceCents)}</div>
                    <button type="button" className="rs-pill-btn dm-tile__add" onClick={() => addItem({ ...q.item })}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="dm-actions">
            {reached ? (
              <button type="button" className="rs-pill-btn dm-actions__main" onClick={goCheckout}>
                Continue to Checkout
              </button>
            ) : (
              <button type="button" className="rs-pill-btn rs-pill-btn--outline dm-actions__main" onClick={switchToCarryout}>
                Switch to Carryout
              </button>
            )}
            <button type="button" className="dm-actions__link" onClick={closeMinGate}>
              Keep Shopping
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .dm {
          padding: 4px 0 18px;
          color: var(--text-brown);
        }
        .dm-box {
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          padding: 14px 16px;
          margin-bottom: 16px;
        }
        .dm-lead {
          margin: 0 0 12px;
          font-size: var(--fs-base);
          line-height: 1.35;
        }
        .dm-lead strong,
        .dm-status strong {
          font-weight: var(--w-bold);
          color: #000;
        }
        .dm-progress {
          height: 12px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid var(--menu-box-border);
          overflow: hidden;
        }
        .dm-progress__bar {
          height: 100%;
          background: #e31837;
          transition: width 0.25s ease;
        }
        .dm-status {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          margin-top: 10px;
          font-size: var(--fs-base);
          font-weight: var(--w-medium);
        }
        .dm-status__ok {
          color: #1b7a3a;
          font-weight: var(--w-bold);
        }
        .dm-status__total {
          flex: 0 0 auto;
          font-size: var(--fs-sm);
        }
        .dm-h {
          margin: 0 0 10px;
          font-family: var(--font-display);
          font-size: var(--fs-lg);
          text-transform: uppercase;
          color: #000;
        }
        .dm-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        @media (min-width: 640px) {
          .dm-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .dm-tile {
          position: relative;
          display: flex;
          flex-direction: column;
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          padding: 10px;
        }
        .dm-tile__tag {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 1;
          padding: 3px 8px;
          border-radius: 999px;
          background: #1b7a3a;
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .dm-tile :global(.dm-tile__img) {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 3px;
          background: #fff;
          margin-bottom: 8px;
        }
        .dm-tile__name {
          font-family: var(--font-display);
          font-size: var(--fs-sm);
          line-height: 1.1;
          text-transform: uppercase;
          color: #000;
        }
        .dm-tile__price {
          margin: 4px 0 8px;
          font-size: var(--fs-base);
          font-weight: var(--w-semibold);
        }
        .dm-tile :global(.dm-tile__add) {
          margin-top: auto;
          width: 100%;
          padding: 0.35rem 0.5rem;
          font-size: var(--fs-md);
        }
        .dm-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .dm-actions :global(.dm-actions__main) {
          width: 100%;
        }
        .dm-actions__link {
          padding: 0;
          border: 0;
          background: none;
          font-family: var(--font-display);
          font-size: var(--fs-sm);
          letter-spacing: 0.03em;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: var(--text-brown);
          cursor: pointer;
        }
      `}</style>
    </DebugPizzaOverlay>
  );
}
