// pages/api/validateDeal.js
// Runs server-side on Vercel (not in the browser bundle) — the authoritative
// check for whether a coupon code is currently real/active and valid for the
// order's service method. The deal catalog itself isn't secret (its prices
// and codes are meant to be customer-facing, shown right on the /coupons
// page), so the point of this route isn't hiding data — it's being the one
// place that decides "yes, this code is good" instead of trusting whatever
// the client's own JS happens to compute.
//
// Scope note: this only validates the coupon + its restrictions. The rest of
// the order total is re-derived server-side from item structure in
// pages/api/placeOrder.js, which never trusts a client-sent total.
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
