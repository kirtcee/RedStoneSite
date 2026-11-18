// pages/api/placeOrder.js
//
// Creates a "pay when you get it" order (Pay at Store / Pay at Door). Runs
// server-side only, so nothing here can be edited via devtools.
//
// The client sends what's in the cart — never a total. utils/orderBuilder.js
// re-prices everything from scratch (same pricing the UI uses, coupons
// included), and the order is written with the Firebase Admin SDK, which
// bypasses Firestore Security Rules — see firestore.rules, where direct
// client writes to /orders are denied outright.
//
// Card payments (Pay Now) don't come through here: see createPayment.js.
import { adminDb, adminSetupProblem } from "../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { buildOrder, isRateLimited, verifyUser } from "../../utils/orderBuilder";

function reject(res, status, reason) {
  res.status(status).json({ ok: false, reason });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "method_not_allowed");
  const setupProblem = adminSetupProblem();
  if (setupProblem) return reject(res, 500, setupProblem);
  if (isRateLimited(req, "order")) return reject(res, 429, "too_many_requests");

  const body = req.body || {};
  const uid = await verifyUser(body.idToken);
  if (!uid) return reject(res, 401, "invalid_auth");

  // Only the pay-later option is accepted here; a card order must go
  // through Stripe so it can never be created unpaid.
  const payment = body.paymentMethod === undefined ? "store" : body.paymentMethod;
  if (payment !== "store") return reject(res, 400, "payment_method_unavailable");

  let built;
  try {
    built = buildOrder(body, { uid, paymentMethod: "store" });
  } catch (e) {
    console.error("placeOrder: checking the order failed", e);
    return reject(res, 500, `order_check_failed: ${String(e?.message || e).slice(0, 100)}`);
  }
  if (!built.ok) return reject(res, built.status, built.reason);

  try {
    const ref = await adminDb.collection("orders").add({
      ...built.order,
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(200).json({ ok: true, id: ref.id });
  } catch (e) {
    console.error("placeOrder: Firestore write failed", e);
    reject(res, 500, "save_failed");
  }
}
