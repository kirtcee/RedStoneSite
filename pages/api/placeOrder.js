// pages/api/placeOrder.js
//
// The one and only place an order gets created. Runs server-side (never
// shipped to the browser), so nothing here can be edited via devtools.
//
// The client sends what's in the cart (items, service method, timing,
// contact info) — it does NOT send a total. Every price is recomputed here
// from scratch using components/Pricing.js, the exact same pricing logic
// the UI already uses for display, now acting as the single source of
// truth instead of something the client could tamper with. The order is
// then written with the Firebase Admin SDK (utils/firebaseAdmin.js), which
// bypasses Firestore Security Rules entirely — see firestore.rules, where
// direct client writes to /orders are denied outright. A tampered client
// can no longer submit a fake total because it can no longer submit a
// total at all.
import { priceLineItem } from "../../components/Pricing";
import { adminAuth, adminDb } from "../../utils/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const TAX_RATE = 0.13;
const DELIVERY_FEE_CENTS = 499;
const MAX_ITEMS = 100;
const MAX_QTY_PER_ITEM = 50;

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
  "deal",
]);

function reject(res, status, reason) {
  res.status(status).json({ ok: false, reason });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    reject(res, 405, "method_not_allowed");
    return;
  }

  const body = req.body || {};
  const { items, serviceMethod, orderTiming, schedule, location, contact, deliveryAddress, idToken } = body;

  // ---- Require a real Firebase session, same as the old Firestore rule's
  // "request.auth != null" (anonymous auth included) — just enforced here
  // instead, since the Admin SDK write below doesn't go through rules. ----
  if (!idToken || typeof idToken !== "string") {
    reject(res, 401, "missing_auth");
    return;
  }
  let uid;
  try {
    ({ uid } = await adminAuth.verifyIdToken(idToken));
  } catch (e) {
    reject(res, 401, "invalid_auth");
    return;
  }

  // ---- Shape validation ----
  if (!Array.isArray(items) || items.length === 0) return reject(res, 400, "empty_cart");
  if (items.length > MAX_ITEMS) return reject(res, 400, "too_many_items");
  if (serviceMethod !== "Carryout" && serviceMethod !== "Delivery") {
    return reject(res, 400, "bad_service_method");
  }

  const name = String(contact?.name || "").trim().slice(0, 100);
  const phone = String(contact?.phone || "").trim().slice(0, 30);
  if (!name || !phone) return reject(res, 400, "missing_contact");

  // ---- Authoritative pricing: recompute every line item from scratch.
  // priceLineItem() returns 0 for a type/id/name it doesn't recognize
  // (e.g. a made-up comboId) rather than throwing, and no real menu item
  // ever legitimately costs $0 — so a 0 here means the item referenced
  // something that doesn't actually exist in the catalog. ----
  let subtotalCents = 0;
  for (const item of items) {
    if (!item || typeof item !== "object" || !KNOWN_ITEM_TYPES.has(item.type)) {
      return reject(res, 400, "bad_item");
    }
    const qty = Number(item.qty) || 1;
    if (qty < 1 || qty > MAX_QTY_PER_ITEM) return reject(res, 400, "bad_qty");

    const lineCents = priceLineItem(item);
    if (!Number.isFinite(lineCents) || lineCents <= 0) {
      return reject(res, 400, "unpriceable_item");
    }
    subtotalCents += lineCents;
  }

  const deliveryCents = serviceMethod === "Delivery" ? DELIVERY_FEE_CENTS : 0;
  const taxCents = Math.round((subtotalCents + deliveryCents) * TAX_RATE);
  const totalCents = subtotalCents + deliveryCents + taxCents;

  // ---- Pickup/delivery time (moved here from the old client-side
  // saveOrder.js — same logic, just now server-side with everything else) ----
  const isLater = orderTiming === "later";
  const { date, time } = schedule || {};
  const scheduled = isLater && date && time ? new Date(`${date}T${time}:00`) : null;
  const pickupTime = Timestamp.fromDate(
    scheduled && !isNaN(scheduled.getTime()) ? scheduled : new Date(Date.now() + 20 * 60000)
  );

  try {
    const ref = await adminDb.collection("orders").add({
      items,
      serviceMethod,
      orderTiming: isLater ? "later" : "now",
      schedule: isLater ? { date, time } : { date: null, time: null },
      location: String(location || "").slice(0, 200),
      deliveryAddress: serviceMethod === "Delivery" ? deliveryAddress || null : null,
      contact: { name, phone },
      fees: { deliveryCents, taxCents },
      subtotalCents,
      totalCents,
      uid,
      createdAt: FieldValue.serverTimestamp(),
      pickupTime,
      completed: false,
    });
    res.status(200).json({ ok: true, id: ref.id });
  } catch (e) {
    console.error("placeOrder: Firestore write failed", e);
    reject(res, 500, "save_failed");
  }
}
