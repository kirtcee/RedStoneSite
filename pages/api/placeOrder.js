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
import { quoteDelivery } from "../../utils/deliveryQuote";
import { getWaitTimes } from "../../utils/waitTimesServer";
import { getOrderingStatus } from "../../utils/orderingStatusServer";
import { getSoldOut } from "../../utils/availabilityServer";
import { emailOrderAndRecord } from "../../utils/orderEmail";

function reject(res, status, reason) {
  res.status(status).json({ ok: false, reason });
}

async function handle(req, res) {
  if (req.method !== "POST") return reject(res, 405, "method_not_allowed");
  const setupProblem = adminSetupProblem();
  if (setupProblem) return reject(res, 500, setupProblem);
  if (isRateLimited(req, "order")) return reject(res, 429, "too_many_requests");

  const body = req.body || {};
  const auth = await verifyUser(body.idToken);
  if (auth.error) return reject(res, 401, auth.error);
  const uid = auth.uid;

  // Only the pay-later option is accepted here; a card order must go
  // through Stripe so it can never be created unpaid.
  const payment = body.paymentMethod === undefined ? "store" : body.paymentMethod;
  if (payment !== "store") return reject(res, 400, "payment_method_unavailable");

  // Delivery fee: worked out here from the address, never taken from the browser.
  const deliveryQuote = body.serviceMethod === "Delivery" ? await quoteDelivery(body.deliveryAddress) : null;

  const waitTimes = await getWaitTimes();
  await getOrderingStatus(); // kitchen pause / closed days, applied to the store hours
  const soldOut = await getSoldOut();

  let built;
  try {
    built = buildOrder(body, { uid, paymentMethod: "store", deliveryQuote, waitTimes, soldOut });
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
    // Confirmation email (utils/orderEmail.js). Finished before replying so
    // the confirmation page can say it was sent; it never fails the order.
    await emailOrderAndRecord(ref, built.order, ref.id, FieldValue);
    res.status(200).json({ ok: true, id: ref.id });
  } catch (e) {
    console.error("placeOrder: Firestore write failed", e);
    reject(res, 500, "save_failed");
  }
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
