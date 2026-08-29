// pages/api/validateDeal.js
// Runs server-side on Vercel (not in the browser bundle) — the authoritative
// check for whether a coupon code is currently real/active and valid for the
// order's service method. The deal catalog itself isn't secret (its prices
// and codes are meant to be customer-facing, shown right on the /coupons
// page), so the point of this route isn't hiding data — it's being the one
// place that decides "yes, this code is good" instead of trusting whatever
// the client's own JS happens to compute.
//
// Scope note: this only validates the coupon + its restrictions. It does not
// re-verify the rest of the cart/order total — this whole app still saves
// orders straight from client-computed data (see utils/saveOrder.js), which
// is a separate, pre-existing gap outside this feature's scope.
import { findDealByCode, dealAllowsService } from "../../utils/dealCatalog";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, reason: "method_not_allowed" });
    return;
  }

  const { code, service } = req.body || {};
  const deal = findDealByCode(code);

  if (!deal || !deal.active) {
    res.status(200).json({ ok: false, reason: "not_found" });
    return;
  }

  if (!dealAllowsService(deal, service)) {
    res.status(200).json({ ok: false, reason: "service_mismatch" });
    return;
  }

  res.status(200).json({ ok: true, deal });
}
