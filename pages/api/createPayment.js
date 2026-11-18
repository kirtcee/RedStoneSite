// pages/api/createPayment.js
//
// Step 1 of a Pay Now (card) order — see utils/stripeServer.js for the
// whole flow. Prices the order on the server, parks it in /pendingOrders,
// and creates a Stripe PaymentIntent for that exact amount. Returns the
// PaymentIntent's client secret so the browser can confirm the card
// payment with Stripe, plus the order id.
import { adminDb, adminSetupProblem } from "../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { buildOrder, isRateLimited, verifyUser } from "../../utils/orderBuilder";
import { getStripe } from "../../utils/stripeServer";

function reject(res, status, reason) {
  res.status(status).json({ ok: false, reason });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "method_not_allowed");
  const setupProblem = adminSetupProblem();
  if (setupProblem) return reject(res, 500, setupProblem);
  if (isRateLimited(req, "payment")) return reject(res, 429, "too_many_requests");

  const body = req.body || {};
  const auth = await verifyUser(body.idToken);
  if (auth.error) return reject(res, 401, auth.error);
  const uid = auth.uid;

  let built;
  try {
    built = buildOrder(body, { uid, paymentMethod: "card" });
  } catch (e) {
    console.error("createPayment: checking the order failed", e);
    return reject(res, 500, `order_check_failed: ${String(e?.message || e).slice(0, 100)}`);
  }
  if (!built.ok) return reject(res, built.status, built.reason);
  const order = built.order;

  if (!process.env.STRIPE_SECRET_KEY) return reject(res, 500, "stripe_key_missing");

  // Park the order until it's paid (never in /orders, so the kitchen can't see it).
  let pendingRef;
  try {
    pendingRef = adminDb.collection("pendingOrders").doc();
    await pendingRef.set({ order, status: "awaiting_payment", createdAt: FieldValue.serverTimestamp() });
  } catch (e) {
    console.error("createPayment: saving the pending order failed", e);
    return reject(res, 500, "order_save_failed");
  }
  const orderId = pendingRef.id;

  let intent;
  try {
    intent = await getStripe().paymentIntents.create(
      {
        amount: order.totalCents,
        currency: "cad",
        automatic_payment_methods: { enabled: true },
        description: `Red Stone Pizza online order ${orderId}`,
        receipt_email: order.contact.email || undefined,
        metadata: { pendingOrderId: orderId, serviceMethod: order.serviceMethod },
      },
      { idempotencyKey: `order-${orderId}` }
    );
  } catch (e) {
    // Stripe's own error code (e.g. "api_key_expired"), safe to show — never the key.
    console.error("createPayment: Stripe refused", e?.type, e?.code, e?.message);
    return reject(res, 502, `stripe_${e?.code || e?.type || "error"}`);
  }

  try {
    await pendingRef.update({ paymentIntentId: intent.id });
  } catch (e) {
    console.error("createPayment: saving the payment id failed", e);
    return reject(res, 500, "order_update_failed");
  }
  res.status(200).json({ ok: true, orderId, clientSecret: intent.client_secret, amount: order.totalCents });
}
