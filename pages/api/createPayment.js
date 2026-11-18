// pages/api/createPayment.js
//
// Step 1 of a Pay Now (card) order — see utils/stripeServer.js for the
// whole flow. Prices the order on the server, parks it in /pendingOrders,
// and creates a Stripe PaymentIntent for that exact amount. Returns the
// PaymentIntent's client secret so the browser can confirm the card
// payment with Stripe, plus the order id.
import { adminDb } from "../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { buildOrder, isRateLimited, verifyUser } from "../../utils/orderBuilder";
import { getStripe } from "../../utils/stripeServer";

function reject(res, status, reason) {
  res.status(status).json({ ok: false, reason });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "method_not_allowed");
  if (isRateLimited(req, "payment")) return reject(res, 429, "too_many_requests");

  const body = req.body || {};
  const uid = await verifyUser(body.idToken);
  if (!uid) return reject(res, 401, "invalid_auth");

  const built = buildOrder(body, { uid, paymentMethod: "card" });
  if (!built.ok) return reject(res, built.status, built.reason);
  const order = built.order;

  try {
    const pendingRef = adminDb.collection("pendingOrders").doc();
    const orderId = pendingRef.id;
    await pendingRef.set({ order, status: "awaiting_payment", createdAt: FieldValue.serverTimestamp() });

    const intent = await getStripe().paymentIntents.create(
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

    await pendingRef.update({ paymentIntentId: intent.id });
    res.status(200).json({ ok: true, orderId, clientSecret: intent.client_secret, amount: order.totalCents });
  } catch (e) {
    console.error("createPayment failed", e);
    reject(res, 500, "payment_setup_failed");
  }
}
