// pages/api/finalizePayment.js
//
// Called by the browser right after Stripe says the card payment went
// through (and by the order-confirmation page after a bank redirect). It
// doesn't take the browser's word for it: finalizeCardOrder() checks the
// payment with Stripe before turning the pending order into a real one.
import { finalizeCardOrder } from "../../utils/stripeServer";
import { adminSetupProblem } from "../../utils/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, reason: "method_not_allowed" });
    return;
  }
  const setupProblem = adminSetupProblem();
  if (setupProblem) {
    res.status(500).json({ ok: false, status: "error", reason: setupProblem });
    return;
  }
  try {
    const result = await finalizeCardOrder(req.body?.orderId);
    res.status(result.ok ? 200 : 404).json(result);
  } catch (e) {
    console.error("finalizePayment failed", e);
    res.status(500).json({ ok: false, status: "error" });
  }
}
