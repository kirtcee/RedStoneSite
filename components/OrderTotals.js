// components/OrderTotals.js
//
// Food & Beverage / (Delivery) / Taxes / Order Total — the stacked,
// brown-bordered rows used on the cart and checkout pages. Same maths as the
// Order Settings sidebar (shared constants), so the numbers always agree.
// The parent decides where it sits (width/margins) via `className`.
import React from "react";
import { useCart } from "./CartSystem";
import { formatMoney } from "./Pricing";
import { taxOn } from "../utils/orderRules";

export function useOrderTotals() {
  const cart = useCart();
  const subtotal = cart?.subtotalCents ?? 0;
  const isDelivery = cart?.service === "delivery";
  // Fee from the drive-time quote; null while it's still being worked out.
  const deliveryFee = isDelivery ? cart?.deliveryFeeCents ?? null : 0;
  const delivery = deliveryFee || 0;
  const tax = taxOn(subtotal + delivery); // tax on food, drinks and delivery
  // What the coupons knock off the items' normal prices (before tax).
  const saved = cart?.pricing?.savingsCents ?? 0;
  return {
    subtotal,
    delivery,
    isDelivery,
    deliveryKnown: !isDelivery || deliveryFee != null,
    deliveryTooFar: !!cart?.deliveryTooFar,
    tax,
    total: subtotal + delivery + tax,
    saved,
    isLoaded: !!cart?.isLoaded,
  };
}

export default function OrderTotals({ className = "" }) {
  const { subtotal, delivery, isDelivery, deliveryKnown, deliveryTooFar, tax, total, isLoaded } = useOrderTotals();
  const show = (c) => (isLoaded ? formatMoney(c) : "···");
  return (
    <div className={`order-totals ${className}`}>
      <div className="order-totals__row">
        <span>Food &amp; Beverage:</span>
        <span>{show(subtotal)}</span>
      </div>
      {isDelivery && (
        <div className="order-totals__row">
          <span>Delivery:</span>
          <span>{deliveryTooFar ? "Call store" : deliveryKnown ? show(delivery) : "···"}</span>
        </div>
      )}
      <div className="order-totals__row order-totals__row--beforeTotal">
        <span>Taxes:</span>
        <span>{show(tax)}</span>
      </div>
      <div className="order-totals__row order-totals__row--total">
        <span>Order Total:</span>
        <span>{show(total)}</span>
      </div>
      <style jsx>{`
        .order-totals {
          width: min(100%, 230px);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          background: #fefaf6;
          font-family: var(--font-display);
          color: var(--text-brown);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        /* label right-aligned, snug against its price */
        .order-totals__row {
          display: grid;
          grid-template-columns: 1fr auto;
          column-gap: 8px;
          text-align: right;
          padding: 8px 12px;
          border-bottom: 1px solid var(--menu-box-border);
          font-size: 1rem;
        }
        .order-totals__row--beforeTotal {
          border-bottom: 0;
        }
        /* Food & Beverage / Delivery / Taxes in Red Stone Display Medium;
           Order Total stays in the display font */
        .order-totals__row:not(.order-totals__row--total) {
          font-family: var(--font-display-text);
          font-weight: 400;
        }
        .order-totals__row--total {
          border-bottom: 0;
          border-top: 3px solid var(--menu-box-border); /* thicker line above the total */
          font-size: 1.2rem;
          -webkit-text-stroke: 0.4px currentColor; /* a touch bolder */
        }
      `}</style>
    </div>
  );
}
