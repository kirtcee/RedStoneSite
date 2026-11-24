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
import { quoteDelivery } from "../../utils/deliveryQuote";
import { getWaitTimes } from "../../utils/waitTimesServer";
import { getStripe } from "../../utils/stripeServer";

function reject(res, status, reason) {
  res.status(status).json({ ok: false, reason });
}

async function handle(req, res) {
  if (req.method !== "POST") return reject(res, 405, "method_not_allowed");
  const setupProblem = adminSetupProblem();
  if (setupProblem) return reject(res, 500, setupProblem);
  if (isRateLimited(req, "payment")) return reject(res, 429, "too_many_requests");

  const body = req.body || {};
  const auth = await verifyUser(body.idToken);
  if (auth.error) return reject(res, 401, auth.error);
  const uid = auth.uid;

  // Delivery fee: worked out here from the address, never taken from the browser.
  const deliveryQuote = body.serviceMethod === "Delivery" ? await quoteDelivery(body.deliveryAddress) : null;

  const waitTimes = await getWaitTimes();

  let built;
  try {
    built = buildOrder(body, { uid, paymentMethod: "card", deliveryQuote, waitTimes });
  } catch (e) {
    console.error("createPayment: checking the order failed", e);
    return reject(res, 500, `order_check_failed: ${String(e?.message || e).slice(0, 100)}`);
  }
  if (!built.ok) return reject(res, built.status, built.reason);
  const order = built.order;

  if (!process.env.STRIPE_SECRET_KEY) return reject(res, 500, "stripe_key_missing");

  // The order's id is made here, without touching the database yet.
  const pendingRef = adminDb.collection("pendingOrders").doc();
  const orderId = pendingRef.id;

  let intent;
  try {
    intent = await (await getStripe()).paymentIntents.create(
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
    return reject(res, 502, `stripe_${e?.code || e?.type || String(e?.message || "error").slice(0, 80)}`);
  }

  // Park the order until it's paid (never in /orders, so the kitchen can't
  // see it) — one save, with the payment's id already on it.
  try {
    await pendingRef.set({
      order,
      paymentIntentId: intent.id,
      status: "awaiting_payment",
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("createPayment: saving the pending order failed", e);
    // Nothing was charged; cancel the unused payment so it doesn't linger.
    (await getStripe()).paymentIntents.cancel(intent.id).catch(() => {});
    return reject(res, 500, "order_save_failed");
  }

  res.status(200).json({ ok: true, orderId, clientSecret: intent.client_secret, amount: order.totalCents });
}

// Any unexpected error comes back as a short readable reason instead of a
// bare "500", so problems can be diagnosed from the checkout message.
export default async function handler(req, res) {
  try {
    await handle(req, res);
  } catch (e) {
    console.error("unexpected error", e);
    if (!res.headersSent) reject(res, 500, `server_error: ${String(e?.message || e).replace(/\s+/g, " ").slice(0, 140)}`);
  }
}
