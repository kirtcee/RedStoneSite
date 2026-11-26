// utils/orderingStatus.js
//
// The kitchen's "Online Ordering" switch, stored in Firestore at
// settings/ordering (written from the kitchen screen,
// components/KitchenOrderingControl.js):
//   paused       true while online orders are paused
//   pausedUntil  when the pause ends (Timestamp), or null = until turned back on
//   closedDates  ["2026-12-25", ...] whole days the store is closed (Toronto dates)
// Read in the browser by hooks/useOrderingStatus.js and on the server by
// utils/orderingStatusServer.js; utils/storeHours.js applies it to the hours.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_CLOSED_DATES = 60;

export const OPEN_STATUS = { paused: false, pausedUntilMs: null, closedDates: [] };

export function readOrderingStatus(data) {
  if (!data || typeof data !== "object") return { ...OPEN_STATUS };
  const until = data.pausedUntil;
  const untilMs = until?.toMillis ? until.toMillis() : typeof until === "number" ? until : null;
  const closedDates = (Array.isArray(data.closedDates) ? data.closedDates : [])
    .filter((d) => typeof d === "string" && DATE_RE.test(d))
    .slice(0, MAX_CLOSED_DATES)
    .sort();
  return { paused: data.paused === true, pausedUntilMs: untilMs, closedDates };
}
