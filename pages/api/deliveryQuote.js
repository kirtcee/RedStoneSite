// pages/api/deliveryQuote.js
//
// The delivery fee for an address, so the browser can show it before
// checkout. The order routes (placeOrder / createPayment) work it out again
// themselves rather than trusting this answer.
import { quoteDelivery } from "../../utils/deliveryQuote";
import { isRateLimited } from "../../utils/orderBuilder";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, reason: "method_not_allowed" });
    return;
  }
  if (isRateLimited(req, "quote", 30)) {
    res.status(429).json({ ok: false, reason: "too_many_requests" });
    return;
  }
  try {
    const quote = await quoteDelivery(req.body?.address);
    res.status(quote.ok ? 200 : 400).json(quote);
  } catch (e) {
    console.error("deliveryQuote failed", e);
    res.status(500).json({ ok: false, reason: "error" });
  }
}
