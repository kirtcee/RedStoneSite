// utils/stripeServer.js
//
// SERVER-ONLY. Never import from a component or page — it uses the Stripe
// secret key (STRIPE_SECRET_KEY, set in Vercel and .env.local).
//
// How a card order works:
//   1. pages/api/createPayment.js prices the order (utils/orderBuilder.js),
//      saves it in /pendingOrders (NOT /orders, so the kitchen never sees an
//      unpaid order) and creates a Stripe PaymentIntent for that exact total.
//   2. The browser collects the card with Stripe's Payment Element and
//      confirms the payment directly with Stripe.
//   3. finalizeCardOrder() below checks with Stripe that the payment really
//      succeeded for the full amount, then copies the order into /orders
//      (same document id) with paid: true — that's when it reaches the
//      kitchen. It's called by the browser right after paying
//      (pages/api/finalizePayment.js) AND by Stripe's webhook
//      (pages/api/stripeWebhook.js), whichever comes first; running it twice
//      is harmless.
import { emailOrderAndRecord } from "./orderEmail";
import { adminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { pickupTimeFor } from "./orderBuilder";
import { getWaitTimes } from "./waitTimesServer";
import { clampWait, waitKey } from "./waitTimes";

// The Stripe library is loaded on first use (not at import), so if it ever
// fails to load the route can say so instead of crashing with a bare 500.
let stripeClient = null;
export async function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || "").replace(/^[\s"']+|[\s"']+$/g, "");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set (Vercel env vars / .env.local).");
  if (!stripeClient) {
    const { default: Stripe } = await import("stripe");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Returns { ok: true, status } where status is "paid" | "processing" |
// "unpaid" | "not_found".
export async function finalizeCardOrder(orderId) {
  if (!orderId || typeof orderId !== "string" || orderId.length > 64) return { ok: false, status: "not_found" };

  const pendingRef = adminDb.collection("pendingOrders").doc(orderId);
  const orderRef = adminDb.collection("orders").doc(orderId);

  const pendingSnap = await pendingRef.get();
  if (!pendingSnap.exists) return { ok: false, status: "not_found" };
  const pending = pendingSnap.data();
  if (!pending.paymentIntentId) return { ok: true, status: "unpaid" };

  // Ask Stripe — never trust the browser's word that it paid.
  const intent = await (await getStripe()).paymentIntents.retrieve(pending.paymentIntentId);
  if (intent.status === "processing") return { ok: true, status: "processing" };
  if (intent.status !== "succeeded") return { ok: true, status: "unpaid" };
  if (intent.amount_received < pending.order.totalCents || intent.currency !== "cad") {
    console.error("finalizeCardOrder: amount mismatch", orderId, intent.amount_received, pending.order.totalCents);
    return { ok: true, status: "unpaid" };
  }

  const waitTimes = await getWaitTimes();

  // Create the real order exactly once, even if the browser and the
  // webhook both get here at the same moment.
  let created = null; // the order, if this call is the one that created it
  await adminDb.runTransaction(async (tx) => {
    created = null; // (a transaction can be retried)
    const existing = await tx.get(orderRef);
    if (existing.exists) return;
    const order = pending.order;
    created = {
      ...order,
      paid: true,
      paymentMethod: "card",
    };
    tx.set(orderRef, {
      ...order,
      paid: true,
      paymentMethod: "card",
      paymentIntentId: intent.id,
      // "Now" orders count from when they were paid, not when checkout began.
      pickupTime: pickupTimeFor(
        order.orderTiming,
        order.schedule,
        clampWait(order.serviceMethod, waitTimes[waitKey(order.serviceMethod)])
      ),
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(pendingRef, { status: "paid", paidAt: FieldValue.serverTimestamp() });
  });

  // Confirmation email, only from the call that created the order.
  if (created) {
    const saved = await orderRef.get();
    await emailOrderAndRecord(orderRef, saved.exists ? saved.data() : created, orderId, FieldValue);
  }

  return { ok: true, status: "paid" };
}
