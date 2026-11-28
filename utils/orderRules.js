// utils/orderRules.js
//
// Order money rules shared by the browser (cart, checkout, Order Settings)
// and the server (utils/orderBuilder.js), so both always agree.

export const TAX_RATE = 0.13; // on the whole order: food, drinks AND delivery

// Tax (in cents) on an amount. Pass food + drinks + delivery fee.
export function taxOn(amountCents) {
  return Math.round(TAX_RATE * (Number(amountCents) || 0));
}
// Old flat fee. Only used as a placeholder before an address's real fee
// (deliveryFeeForMinutes below) has been worked out.
export const DELIVERY_FEE_CENTS = 499;

export const STORE_ADDRESS = "576 Concession Street, Hamilton, ON, Canada";
export const STORE_PHONE = "905-385-9888";

// ---- Delivery fee: priced on DRIVE TIME from the store (one way, normal
// traffic, rounded up to the whole minute). Distance isn't used: on the
// escarpment a house under 1 km away can be a 10-minute drive.
//   4 min or less $3.99, then $1 more for every extra minute
//   (5 min $4.99, 6 min $5.99 ... 25 min $24.99)
//   over 25 min: no online price; ask them to check the address or call.
export const DELIVERY_MAX_MINUTES = 25;

// Fee in cents for a drive of `minutes`, or null when it's too far to
// price online (over DELIVERY_MAX_MINUTES).
export function deliveryFeeForMinutes(minutes) {
  const m = Math.max(0, Math.ceil(Number(minutes) || 0));
  if (m > DELIVERY_MAX_MINUTES) return null;
  if (m <= 4) return 399; // minimum delivery fee
  return 399 + (m - 4) * 100; // +$1 per minute after 4 (5 min $4.99, 25 min $24.99)
}

// Delivery needs at least this much food and drink: the subtotal after
// coupons, before tax and the delivery fee.
export const DELIVERY_MINIMUM_CENTS = 2000;

// How much more (in cents) a delivery order needs; 0 when it's enough.
export function deliveryShortfallCents(subtotalCents) {
  return Math.max(0, DELIVERY_MINIMUM_CENTS - (Number(subtotalCents) || 0));
}

// ---- Driver tips: delivery orders paid online (Pay Now) only. A percent of
// the food & drink total (after coupons), or a dollar amount. Not taxed.
export const TIP_PERCENTS = [10, 15, 20];
export const MAX_TIP_CENTS = 10000; // $100
export function tipAllowed(serviceMethod, paymentMethod) {
  return String(serviceMethod).toLowerCase() === "delivery" && paymentMethod === "card";
}
// choice: { kind: "none" } | { kind: "pct", pct: 15 } | { kind: "custom", cents: 500 }
export function tipCentsFor(choice, foodCents) {
  if (!choice || choice.kind === "none") return 0;
  const cents =
    choice.kind === "pct" ? Math.round(((Number(foodCents) || 0) * Number(choice.pct || 0)) / 100) : Math.round(Number(choice.cents) || 0);
  return Math.max(0, Math.min(MAX_TIP_CENTS, cents));
}

// ---- Pay at Door: cash or card, and for cash what they're paying with so
// the driver brings change.
export const DOOR_METHODS = ["cash", "card"];
export const MAX_CASH_GIVEN_CENTS = 100000; // $1,000

// One line for staff and receipts about how an order is being paid.
export function paymentLineFor(order, formatMoney) {
  const tip = order?.fees?.tipCents || 0;
  if (order?.paid) return `Paid online${tip ? ` (includes ${formatMoney(tip)} tip)` : ""}`;
  if (order?.serviceMethod !== "Delivery") return "Pay at store";
  const door = order?.doorPayment;
  if (door?.method === "card") return "Pay at door: card (bring the card machine)";
  if (door?.method === "cash") {
    const given = door.cashGivenCents;
    if (given && given > (order.totalCents || 0)) {
      return `Pay at door: cash, paying with ${formatMoney(given)} (bring ${formatMoney(given - order.totalCents)} change)`;
    }
    return "Pay at door: cash";
  }
  return "Pay at door";
}

// ---- Notes: one per food item (components/ItemNote.js) and one for the
// whole order (cart page). Kept short; the server trims anything longer.
export const NOTE_MAX = 140;
export const ORDER_NOTE_MAX = 300;
export function cleanNote(text, max = NOTE_MAX) {
  return String(text || "")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}
