// utils/waitTimes.js
//
// How long orders take (minutes): carryout and delivery. The kitchen can
// raise these when it's busy (pages/kitchen.js), but never below the
// minimums. Stored in Firestore at settings/waitTimes; shared by the
// browser (hooks/useWaitTimes.js) and the server (utils/waitTimesServer.js).
export const MIN_WAIT = { carryout: 20, delivery: 45 };
export const MAX_WAIT = 240;
export const WAIT_STEP = 5; // the kitchen's − / + buttons

// "Carryout" / "Delivery" / "carryout" -> "carryout" | "delivery"
export function waitKey(service) {
  return String(service || "").toLowerCase() === "delivery" ? "delivery" : "carryout";
}

// Never below the minimum, never silly-high, always whole minutes.
export function clampWait(service, minutes) {
  const key = waitKey(service);
  const n = Math.round(Number(minutes));
  if (!Number.isFinite(n)) return MIN_WAIT[key];
  return Math.min(MAX_WAIT, Math.max(MIN_WAIT[key], n));
}

// A settings/waitTimes document -> { carryout, delivery } (clamped)
export function readWaitTimes(data) {
  return {
    carryout: clampWait("carryout", data?.carryoutMinutes ?? MIN_WAIT.carryout),
    delivery: clampWait("delivery", data?.deliveryMinutes ?? MIN_WAIT.delivery),
  };
}
