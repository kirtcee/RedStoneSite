// pages/api/cancelOrder.js
//
// Kitchen "Cancel Order" (components/KitchenCancelOrder.js). Staff only:
// the request carries the kitchen account's Firebase sign-in token, checked
// here. Then:
//   1. card orders paid online are refunded in full through Stripe
//   2. the order is marked cancelled (and completed, so it leaves the board)
//   3. the customer gets an email saying so (and about the refund)
// Safe to repeat: a second cancel of the same order changes nothing, and
// Stripe's idempotency key stops a double refund.
import { adminDb, adminAuth, adminSetupProblem } from "../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { STAFF_EMAIL } from "../../utils/kitchenAuth";
import { getStripe } from "../../utils/stripeServer";
import { sendEmail } from "../../utils/orderEmail";
import { formatMoney } from "../../components/Pricing";
import { orderRef } from "../../utils/orderText";
import { STORE_PHONE } from "../../utils/orderRules";
import { CANCEL_REASONS } from "../../utils/cancelReasons";

const reject = (res, status, reason) => res.status(status).json({ ok: false, reason });

function cancelEmail(order, id, refund) {
  const ref = orderRef(id);
  const first = order.contact?.firstName || "";
  const asked = order.cancelReason === "customer";
  const subject = `Your Red Stone Pizza order #${ref} was cancelled`;
  const lead = asked
    ? `As you asked, we've cancelled order #${ref}.`
    : `We're sorry${first ? `, ${first}` : ""}. We had to cancel order #${ref}.`;
  const money = refund
    ? `We've refunded ${formatMoney(refund.amount)} to the card you paid with. It usually shows up within 5 to 10 business days, depending on your bank.`
    : "You haven't been charged for this order.";
  const help = `Questions? Call us at ${STORE_PHONE} and mention order #${ref}.`;
  const p = (t, extra = "") => `<p style="margin:0 0 14px;${extra}">${t}</p>`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.55;color:#1a1a1a;max-width:560px;">
  ${p("Order cancelled", "font-size:22px;font-weight:600;")}
  ${p(lead)}
  ${p(money)}
  ${p(help, "color:#6b6b6b;font-size:15px;")}
</div>`;
  const text = ["Order cancelled", "", lead, money, "", help].join("\n");
  return { subject, html, text };
}

async function handle(req, res) {
  if (req.method !== "POST") return reject(res, 405, "method_not_allowed");
  const setup = adminSetupProblem();
  if (setup) return reject(res, 500, setup);

  const { idToken, orderId, reason } = req.body || {};
  // staff only
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(String(idToken || ""));
  } catch {
    return reject(res, 401, "not_signed_in");
  }
  if (decoded.email !== STAFF_EMAIL) return reject(res, 403, "staff_only");
  if (typeof orderId !== "string" || !orderId || orderId.length > 64 || orderId.includes("/")) {
    return reject(res, 400, "bad_order_id");
  }
  if (!CANCEL_REASONS.some((r) => r.key === reason)) return reject(res, 400, "bad_reason");

  const ref = adminDb.collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return reject(res, 404, "not_found");
  const order = snap.data();
  if (order.cancelled) return res.status(200).json({ ok: true, already: true, refunded: !!order.refundId });

  // 1. refund a card order (full amount)
  let refund = null;
  if (order.paid && order.paymentMethod === "card" && order.paymentIntentId) {
    try {
      const stripe = await getStripe();
      refund = await stripe.refunds.create(
        { payment_intent: order.paymentIntentId, reason: "requested_by_customer", metadata: { orderId } },
        { idempotencyKey: `cancel-${orderId}` }
      );
    } catch (e) {
      console.error("cancelOrder: refund failed", orderId, e?.message);
      return reject(res, 502, `refund_failed: ${String(e?.message || e).slice(0, 120)}`);
    }
  }

  // 2. mark it cancelled
  await ref.update({
    cancelled: true,
    cancelReason: reason,
    cancelledAt: FieldValue.serverTimestamp(),
    completed: true,
    ...(refund ? { refundId: refund.id, refundStatus: refund.status, refundCents: refund.amount } : {}),
  });

  // 3. tell the customer (never blocks the cancel)
  let email = "no_email";
  if (order.contact?.email) {
    const { subject, html, text } = cancelEmail({ ...order, cancelReason: reason }, orderId, refund);
    email = (await sendEmail({ to: order.contact.email, subject, html, text, idempotencyKey: `cancel-${orderId}` })).status;
  }
  return res.status(200).json({ ok: true, refunded: !!refund, refundCents: refund?.amount || 0, email });
}

export default async function handler(req, res) {
  try {
    await handle(req, res);
  } catch (e) {
    console.error("cancelOrder: unexpected error", e);
    if (!res.headersSent) reject(res, 500, `server_error: ${String(e?.message || e).slice(0, 140)}`);
  }
}
