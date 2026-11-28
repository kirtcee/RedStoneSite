// utils/orderBuilder.js
//
// SERVER-ONLY (imports firebaseAdmin). Shared by pages/api/placeOrder.js
// (Pay at Store / Pay at Door) and pages/api/createPayment.js (Pay Now):
// checks what the browser sent and re-prices the whole order from scratch,
// so both ways of paying go through the exact same rules.
//
// The client sends what's in the cart (items, coupons, service method,
// timing, contact info) — never a total. Every price is recomputed here
// with components/Pricing.js, the same pricing the UI shows, so a tampered
// browser can't change what an order costs.
import { soldOutIn } from "./availability";
import { priceLineItem, priceCart } from "../components/Pricing";
import { findDealById } from "./dealCatalog";
import { adminAuth } from "./firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

import { TAX_RATE, DELIVERY_FEE_CENTS, DELIVERY_MINIMUM_CENTS, taxOn, tipAllowed, MAX_TIP_CENTS, DOOR_METHODS, MAX_CASH_GIVEN_CENTS, cleanNote, NOTE_MAX, ORDER_NOTE_MAX } from "./orderRules";
import { MIN_WAIT, clampWait, waitKey } from "./waitTimes";
import { torontoToDate, canOrderNow, scheduleProblem, isPausedNow } from "./storeHours";
export { TAX_RATE, DELIVERY_FEE_CENTS };
const MAX_ITEMS = 100;
const MAX_QTY_PER_ITEM = 50;
const MAX_DEALS = 20;

// Every type priceLineItem() knows how to price. Anything else is rejected
// outright rather than silently priced at $0.
const KNOWN_ITEM_TYPES = new Set([
  "pizza-byo",
  "pizza-specialty",
  "wings",
  "side",
  "special",
  "combo",
  "drinks-dips",
]);

// ---- Basic per-IP rate limiting ----
// Just enough to stop a script from flooding orders. In-memory, so it resets
// on cold start / across serverless instances — fine at this app's scale.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitHits = new Map(); // key -> timestamps[]

export function isRateLimited(req, bucket = "order", max = RATE_LIMIT_MAX) {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (rateLimitHits.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitHits.set(key, hits);
  if (rateLimitHits.size > 5000) {
    for (const [k, timestamps] of rateLimitHits) {
      if (timestamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimitHits.delete(k);
    }
  }
  return hits.length > max;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// Requires a real Firebase session (anonymous auth included).
// Returns { uid } or { error: "invalid_auth: <why>" }.
export async function verifyUser(idToken) {
  if (!idToken || typeof idToken !== "string") return { error: "invalid_auth: no_token" };
  if (!adminAuth) return { error: "invalid_auth: server_not_ready" };
  try {
    const { uid } = await adminAuth.verifyIdToken(idToken);
    return { uid };
  } catch (e) {
    // e.g. the token is for a different Firebase project than the server's
    // FIREBASE_ADMIN_PROJECT_ID ("incorrect aud claim") — safe to show.
    const why = String(e?.message || e?.code || "unknown")
      .replace(/\s+/g, " ")
      .replace(/See https:\S+/g, "")
      .slice(0, 160);
    console.error("verifyUser failed:", e?.code, e?.message);
    return { error: `invalid_auth: ${why}` };
  }
}

// Fresh pickup/delivery time: the scheduled one for "later" orders,
// otherwise the kitchen's current wait time from now (utils/waitTimes.js;
// at least 20 min carryout, 45 min delivery).
export function pickupTimeFor(orderTiming, schedule, waitMinutes = 20) {
  const isLater = orderTiming === "later";
  const { date, time } = schedule || {};
  // the scheduled time is Toronto time (the server itself runs in UTC)
  const scheduled = isLater && date && time ? torontoToDate(date, time) : null;
  return Timestamp.fromDate(
    scheduled && !isNaN(scheduled.getTime()) ? scheduled : new Date(Date.now() + waitMinutes * 60000)
  );
}

// Validates + prices an order body. Returns { ok: true, order } with the
// Firestore fields (minus createdAt), or { ok: false, status, reason }.
// For delivery, `deliveryQuote` is the server's own quote for the address
// (utils/deliveryQuote.js); the fee comes from it, never from the browser.
export function buildOrder(body, { uid, paymentMethod, deliveryQuote = null, waitTimes = null, soldOut = null }) {
  const fail = (status, reason) => ({ ok: false, status, reason });
  const {
    items: rawItems,
    appliedDeals: rawDeals,
    serviceMethod,
    orderTiming,
    schedule,
    location,
    contact,
    deliveryAddress,
    tipCents: rawTip,
    doorPayment: rawDoor,
    orderNote: rawOrderNote,
  } = body || {};

  if (!Array.isArray(rawItems) || rawItems.length === 0) return fail(400, "empty_cart");
  if (rawItems.length > MAX_ITEMS) return fail(400, "too_many_items");
  // Every line needs its own id so coupon pricing can tell them apart.
  const items = rawItems.map((it, i) => {
    if (!it || typeof it !== "object") return it;
    const out = { ...it, id: typeof it.id === "string" && it.id ? it.id : `line-${i}` };
    // "Note for the kitchen" (components/ItemNote.js): plain text, kept short
    if (out.note != null) {
      const n = cleanNote(out.note, NOTE_MAX);
      if (n) out.note = n;
      else delete out.note;
    }
    return out;
  });
  const seenIds = new Set();
  for (const it of items) {
    if (it && seenIds.has(it.id)) return fail(400, "bad_item");
    if (it) seenIds.add(it.id);
  }

  // Coupons on the order: [{ id, dealId }]. Only real coupons are kept;
  // whether each one actually applies (right items, enough of them, right
  // service method) is decided by priceCart() below, not by the client.
  if (rawDeals != null && (!Array.isArray(rawDeals) || rawDeals.length > MAX_DEALS)) {
    return fail(400, "bad_deals");
  }
  const appliedDeals = (rawDeals || [])
    .filter((d) => d && typeof d.id === "string" && typeof d.dealId === "string")
    .filter((d) => findDealById(d.dealId)?.active && !findDealById(d.dealId)?.comboId)
    .map((d) => ({ id: d.id.slice(0, 64), dealId: d.dealId }));

  if (serviceMethod !== "Carryout" && serviceMethod !== "Delivery") return fail(400, "bad_service_method");

  // Store hours (utils/storeHours.js): "now" orders only while open,
  // scheduled orders only for a real opening-hours time slot.
  if (orderTiming === "later") {
    const problem = scheduleProblem(schedule?.date, schedule?.time);
    if (problem) return fail(400, problem === "too_far" ? "schedule_too_far" : "schedule_closed");
  } else if (isPausedNow()) {
    return fail(400, "ordering_paused"); // the kitchen paused online orders
  } else if (!canOrderNow()) {
    return fail(400, "store_closed");
  }

  const firstName = String(contact?.firstName || "").trim().slice(0, 60);
  const lastName = String(contact?.lastName || "").trim().slice(0, 60);
  // `name` stays the full name the kitchen screen / confirmation page show
  const name = (String(contact?.name || "").trim() || `${firstName} ${lastName}`.trim()).slice(0, 100);
  const phone = String(contact?.phone || "").trim().slice(0, 30);
  const email = String(contact?.email || "").trim().slice(0, 120);
  if (!name || !phone) return fail(400, "missing_contact");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "bad_email");

  // Sold out on the kitchen screen (utils/availability.js)
  if (soldOut && soldOut.size) {
    for (const item of items) {
      if (soldOutIn(item, soldOut).length) return fail(400, "item_sold_out");
    }
  }

  // ---- Authoritative pricing. priceLineItem() returns 0 for anything it
  // doesn't recognize, and no real menu item costs $0 — so 0 means the item
  // referenced something that isn't in the catalog. ----
  for (const item of items) {
    if (!item || typeof item !== "object" || !KNOWN_ITEM_TYPES.has(item.type)) return fail(400, "bad_item");
    const qty = Number(item.qty) || 1;
    if (qty < 1 || qty > MAX_QTY_PER_ITEM) return fail(400, "bad_qty");
    const lineCents = priceLineItem(item);
    if (!Number.isFinite(lineCents) || lineCents <= 0) return fail(400, "unpriceable_item");
  }

  // Coupon prices applied with the exact same rules the cart shows.
  const pricing = priceCart(items, appliedDeals, serviceMethod === "Delivery" ? "delivery" : "carryout");
  const subtotalCents = pricing.subtotalCents;
  const discountCents = pricing.savingsCents;
  const pricedItems = items.map((it) => ({
    ...it,
    regularCents: pricing.lines[it.id].regularCents,
    lineCents: pricing.lines[it.id].finalCents,
  }));
  const dealsSummary = pricing.deals.map((d) => ({
    id: d.id,
    dealId: d.dealId,
    name: d.deal?.name || d.dealId,
    active: d.active,
    savingsCents: d.savingsCents,
  }));

  // Delivery needs a minimum amount of food and drink (after coupons).
  if (serviceMethod === "Delivery" && subtotalCents < DELIVERY_MINIMUM_CENTS) {
    return fail(400, "delivery_minimum");
  }

  let deliveryCents = 0;
  let deliveryInfo = null;
  if (serviceMethod === "Delivery") {
    if (!deliveryQuote?.ok) return fail(400, "delivery_quote_failed");
    if (deliveryQuote.tooFar) return fail(400, "delivery_too_far");
    deliveryCents = deliveryQuote.feeCents;
    deliveryInfo = { minutes: deliveryQuote.minutes, km: deliveryQuote.km };
  }
  const taxCents = taxOn(subtotalCents + deliveryCents); // tax on food, drinks and delivery

  // Driver tip: delivery + Pay Now only (utils/orderRules.js). Not taxed.
  let tipCents = 0;
  if (rawTip != null && rawTip !== 0) {
    if (!tipAllowed(serviceMethod, paymentMethod)) return fail(400, "tip_not_allowed");
    if (!Number.isInteger(rawTip) || rawTip < 0 || rawTip > MAX_TIP_CENTS) return fail(400, "bad_tip");
    tipCents = rawTip;
  }
  const totalCents = subtotalCents + deliveryCents + taxCents + tipCents;

  // Pay at Door: cash or card, and what cash they're paying with.
  let doorPayment = null;
  if (serviceMethod === "Delivery" && paymentMethod === "store" && rawDoor && typeof rawDoor === "object") {
    if (!DOOR_METHODS.includes(rawDoor.method)) return fail(400, "bad_door_payment");
    let cashGivenCents = null;
    if (rawDoor.method === "cash" && rawDoor.cashGivenCents != null) {
      const g = rawDoor.cashGivenCents;
      if (!Number.isInteger(g) || g < totalCents || g > MAX_CASH_GIVEN_CENTS) return fail(400, "bad_cash_amount");
      cashGivenCents = g;
    }
    doorPayment = { method: rawDoor.method, cashGivenCents };
  }

  const isLater = orderTiming === "later";
  const { date, time } = schedule || {};

  return {
    ok: true,
    order: {
      items: pricedItems,
      appliedDeals: dealsSummary,
      serviceMethod,
      orderTiming: isLater ? "later" : "now",
      schedule: isLater ? { date: date || null, time: time || null } : { date: null, time: null },
      location: String(location || "").slice(0, 200),
      deliveryAddress: serviceMethod === "Delivery" ? deliveryAddress || null : null,
      delivery: deliveryInfo, // drive time / distance the fee was based on
      contact: { name, firstName, lastName, phone, email },
      paymentMethod,
      paid: false,
      fees: { deliveryCents, taxCents, tipCents },
      doorPayment,
      orderNote: cleanNote(rawOrderNote, ORDER_NOTE_MAX) || null, // note for the whole order (cart page)
      subtotalCents,
      discountCents,
      totalCents,
      uid,
      pickupTime: pickupTimeFor(
        orderTiming,
        schedule,
        clampWait(serviceMethod, waitTimes?.[waitKey(serviceMethod)] ?? MIN_WAIT[waitKey(serviceMethod)])
      ),
      completed: false,
    },
  };
}
