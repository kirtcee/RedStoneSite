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
import { priceLineItem, priceCart } from "../components/Pricing";
import { findDealById } from "./dealCatalog";
import { adminAuth } from "./firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export const TAX_RATE = 0.13;
export const DELIVERY_FEE_CENTS = 499;
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

export function isRateLimited(req, bucket = "order") {
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
  return hits.length > RATE_LIMIT_MAX;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// Requires a real Firebase session (anonymous auth included).
// Returns the uid, or null if the token is missing/invalid.
export async function verifyUser(idToken) {
  if (!idToken || typeof idToken !== "string" || !adminAuth) return null;
  try {
    const { uid } = await adminAuth.verifyIdToken(idToken);
    return uid;
  } catch {
    return null;
  }
}

// Fresh pickup/delivery time: the scheduled one for "later" orders,
// otherwise 20 minutes from now.
export function pickupTimeFor(orderTiming, schedule) {
  const isLater = orderTiming === "later";
  const { date, time } = schedule || {};
  const scheduled = isLater && date && time ? new Date(`${date}T${time}:00`) : null;
  return Timestamp.fromDate(
    scheduled && !isNaN(scheduled.getTime()) ? scheduled : new Date(Date.now() + 20 * 60000)
  );
}

// Validates + prices an order body. Returns { ok: true, order } with the
// Firestore fields (minus createdAt), or { ok: false, status, reason }.
export function buildOrder(body, { uid, paymentMethod }) {
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
  } = body || {};

  if (!Array.isArray(rawItems) || rawItems.length === 0) return fail(400, "empty_cart");
  if (rawItems.length > MAX_ITEMS) return fail(400, "too_many_items");
  // Every line needs its own id so coupon pricing can tell them apart.
  const items = rawItems.map((it, i) =>
    it && typeof it === "object" ? { ...it, id: typeof it.id === "string" && it.id ? it.id : `line-${i}` } : it
  );
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
    .filter((d) => findDealById(d.dealId)?.active)
    .map((d) => ({ id: d.id.slice(0, 64), dealId: d.dealId }));

  if (serviceMethod !== "Carryout" && serviceMethod !== "Delivery") return fail(400, "bad_service_method");

  const firstName = String(contact?.firstName || "").trim().slice(0, 60);
  const lastName = String(contact?.lastName || "").trim().slice(0, 60);
  // `name` stays the full name the kitchen screen / confirmation page show
  const name = (String(contact?.name || "").trim() || `${firstName} ${lastName}`.trim()).slice(0, 100);
  const phone = String(contact?.phone || "").trim().slice(0, 30);
  const email = String(contact?.email || "").trim().slice(0, 120);
  if (!name || !phone) return fail(400, "missing_contact");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "bad_email");

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

  const deliveryCents = serviceMethod === "Delivery" ? DELIVERY_FEE_CENTS : 0;
  const taxCents = Math.round((subtotalCents + deliveryCents) * TAX_RATE);
  const totalCents = subtotalCents + deliveryCents + taxCents;

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
      contact: { name, firstName, lastName, phone, email },
      paymentMethod,
      paid: false,
      fees: { deliveryCents, taxCents },
      subtotalCents,
      discountCents,
      totalCents,
      uid,
      pickupTime: pickupTimeFor(orderTiming, schedule),
      completed: false,
    },
  };
}
