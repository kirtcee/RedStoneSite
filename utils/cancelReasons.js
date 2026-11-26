// utils/cancelReasons.js
//
// Why the kitchen cancelled an order (components/KitchenCancelOrder.js,
// pages/api/cancelOrder.js). Staff see these labels; customers only ever
// see a general "we had to cancel" (or "as you asked" for "customer").
export const CANCEL_REASONS = [
  { key: "customer", label: "Customer asked" },
  { key: "unavailable", label: "Item not available" },
  { key: "cant_deliver", label: "Can't deliver there" },
  { key: "too_busy", label: "Too busy / closing" },
  { key: "suspicious", label: "Looks fake / prank" },
  { key: "other", label: "Other" },
];
export const cancelReasonLabel = (key) => CANCEL_REASONS.find((r) => r.key === key)?.label || "Cancelled";
