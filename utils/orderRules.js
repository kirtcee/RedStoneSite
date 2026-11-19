// utils/orderRules.js
//
// Order money rules shared by the browser (cart, checkout, Order Settings)
// and the server (utils/orderBuilder.js), so both always agree.

export const TAX_RATE = 0.13; // on food and drinks only: delivery isn't taxed

// Tax (in cents) on an order's food and drinks. The delivery fee is not taxed.
export function taxOn(subtotalCents) {
  return Math.round(TAX_RATE * (Number(subtotalCents) || 0));
}
export const DELIVERY_FEE_CENTS = 499; // flat for now; distance/time formula coming next

// Delivery needs at least this much food and drink: the subtotal after
// coupons, before tax and the delivery fee.
export const DELIVERY_MINIMUM_CENTS = 2000;

// How much more (in cents) a delivery order needs; 0 when it's enough.
export function deliveryShortfallCents(subtotalCents) {
  return Math.max(0, DELIVERY_MINIMUM_CENTS - (Number(subtotalCents) || 0));
}
