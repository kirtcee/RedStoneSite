// utils/storeHours.js
//
// Store hours and Toronto-time helpers, shared by the browser and the
// server (the server runs in UTC on Vercel, so every time here is worked
// out in America/Toronto explicitly, never in the machine's own time zone).
//
// Change hours in HOURS below; pages/contact.js and the Order Settings panel
// read them from here.
export const STORE_TZ = "America/Toronto";

// Minutes after midnight, by weekday (0 = Sunday)
const H = (h, m = 0) => h * 60 + m;
export const HOURS = {
  0: { open: H(12), close: H(21) }, // Sunday 12 PM to 9 PM
  1: { open: H(11), close: H(22) },
  2: { open: H(11), close: H(22) },
  3: { open: H(11), close: H(22) },
  4: { open: H(11), close: H(22) },
  5: { open: H(11), close: H(22) },
  6: { open: H(11), close: H(22) },
};

// "Order now" closes this long before closing time, so the food is ready
// before the doors lock.
export const LAST_ORDER_BEFORE_CLOSE = 15;
// A scheduled time must be at least this far away.
export const MIN_SCHEDULE_AHEAD = 20;
// How far ahead an order can be scheduled.
export const MAX_SCHEDULE_DAYS = 14;
const SLOT_STEP = 15;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// "13:30" style <-> minutes
export const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fromHHMM = (s) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export function formatClock(min) {
  const h24 = Math.floor(min / 60);
  const mm = min % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
}

// The Toronto date ("2026-12-05"), weekday and minutes-after-midnight for a moment.
export function torontoParts(ms = Date.now()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: STORE_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(ms))
      .map((p) => [p.type, p.value])
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, minutes: Number(parts.hour) * 60 + Number(parts.minute), weekday: weekdayOf(date) };
}

// weekday (0 = Sunday) of a "YYYY-MM-DD" date
export function weekdayOf(date) {
  const [y, m, d] = String(date).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// "YYYY-MM-DD" + n days
export function addDays(date, n) {
  const [y, m, d] = String(date).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// A Toronto wall-clock date + "HH:MM" -> the real moment (a Date), whatever
// time zone this code is running in. Handles daylight saving.
export function torontoToDate(date, time) {
  const [y, mo, d] = String(date).split("-").map(Number);
  const min = fromHHMM(time);
  if (!y || !mo || !d || min == null) return null;
  const asUtc = Date.UTC(y, mo - 1, d, Math.floor(min / 60), min % 60);
  // how far Toronto is behind UTC at (about) that moment, checked twice
  // so a daylight-saving change on that day lands right
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = torontoParts(guess);
    const shownAsUtc = Date.UTC(...p.date.split("-").map((v, k) => (k === 1 ? Number(v) - 1 : Number(v))), Math.floor(p.minutes / 60), p.minutes % 60);
    guess += asUtc - shownAsUtc;
  }
  return new Date(guess);
}

// ---- Kitchen overrides (settings/ordering in Firestore, see
// utils/orderingStatus.js): days the store is closed (holidays) and a pause
// on online orders. Set with applyOrderingStatus(): in the browser by
// hooks/useOrderingStatus.js (live), on the server before checking an order.
let CLOSED_DATES = new Set(); // "YYYY-MM-DD" (Toronto)
let PAUSE_UNTIL = 0; // ms; 0 = not paused, Infinity = until turned back on

export function applyOrderingStatus(status) {
  CLOSED_DATES = new Set(Array.isArray(status?.closedDates) ? status.closedDates : []);
  PAUSE_UNTIL = !status?.paused ? 0 : status.pausedUntilMs == null ? Infinity : Number(status.pausedUntilMs) || 0;
}
// Online ordering is paused at this moment
export function isPausedNow(ms = Date.now()) {
  return PAUSE_UNTIL > ms;
}
// When the pause ends (ms), Infinity if until turned back on, 0 if not paused
export function pauseEndsAt(ms = Date.now()) {
  return PAUSE_UNTIL > ms ? PAUSE_UNTIL : 0;
}
export function isClosedDate(date) {
  return CLOSED_DATES.has(date);
}

export function hoursFor(date) {
  if (CLOSED_DATES.has(date)) return null;
  return HOURS[weekdayOf(date)] || null;
}

// Can a customer place an "order now" right now?
export function canOrderNow(ms = Date.now()) {
  if (isPausedNow(ms)) return false;
  const { date, minutes } = torontoParts(ms);
  const h = hoursFor(date);
  return !!h && minutes >= h.open && minutes < h.close - LAST_ORDER_BEFORE_CLOSE;
}

// The scheduled times offered for a day: every 15 min from opening to
// closing, minus any too soon (today only).
export function timeSlotsFor(date, ms = Date.now()) {
  const h = hoursFor(date);
  if (!h) return [];
  const now = torontoParts(ms);
  if (date < now.date) return [];
  let earliest = date === now.date ? now.minutes + MIN_SCHEDULE_AHEAD : -1;
  // paused: nothing before the pause ends
  const pauseEnd = pauseEndsAt(ms);
  if (pauseEnd === Infinity) return [];
  if (pauseEnd) {
    const p = torontoParts(pauseEnd);
    if (date < p.date) return [];
    if (date === p.date) earliest = Math.max(earliest, p.minutes);
  }
  const out = [];
  for (let m = h.open; m <= h.close - LAST_ORDER_BEFORE_CLOSE; m += SLOT_STEP) {
    if (m >= earliest) out.push({ value: toHHMM(m), label: formatClock(m) });
  }
  return out;
}

// Is this a time we can schedule for? Returns null if fine, or a reason.
export function scheduleProblem(date, time, ms = Date.now()) {
  if (!date || !time) return "missing";
  const now = torontoParts(ms);
  if (date > addDays(now.date, MAX_SCHEDULE_DAYS)) return "too_far";
  return timeSlotsFor(date, ms).some((s) => s.value === time) ? null : "closed";
}

// When "order now" opens next, e.g. "today at 11:00 AM" / "tomorrow at 12:00 PM"
// (or when a pause ends, "today at 7:30 PM"). null if not known (paused
// until turned back on).
export function nextOpening(ms = Date.now()) {
  const pauseEnd = pauseEndsAt(ms);
  if (pauseEnd === Infinity) return null;
  const now = torontoParts(ms);
  const from = torontoParts(pauseEnd || ms);
  for (let i = 0; i < 15; i++) {
    const date = addDays(from.date, i);
    const h = hoursFor(date);
    if (!h) continue;
    let at = h.open;
    if (i === 0 && from.minutes >= h.open) {
      // the pause ends during opening hours: open again right then
      if (!pauseEnd || from.minutes >= h.close - LAST_ORDER_BEFORE_CLOSE) continue;
      at = Math.ceil(from.minutes / 5) * 5;
    }
    const when = date === now.date ? "today" : date === addDays(now.date, 1) ? "tomorrow" : DAY_NAMES[weekdayOf(date)];
    return `${when} at ${formatClock(at)}`;
  }
  return null;
}

// For display: [{ days: "Mon to Sat", hours: "11:00 AM to 10:00 PM" }, ...]
export function hoursSummary() {
  const short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const order = [1, 2, 3, 4, 5, 6, 0];
  const rows = [];
  for (const d of order) {
    const h = HOURS[d];
    const text = h ? `${formatClock(h.open)} to ${formatClock(h.close)}` : "Closed";
    const last = rows[rows.length - 1];
    if (last && last.hours === text) last.to = d;
    else rows.push({ from: d, to: d, hours: text });
  }
  return rows.map((r) => ({ days: r.from === r.to ? short[r.from] : `${short[r.from]} to ${short[r.to]}`, hours: r.hours }));
}

// The first time an order can be scheduled for (today or a later day).
export function firstOpenSlot(ms = Date.now()) {
  const today = torontoParts(ms).date;
  for (let i = 0; i <= MAX_SCHEDULE_DAYS; i++) {
    const date = addDays(today, i);
    const slots = timeSlotsFor(date, ms);
    if (slots.length) return { date, time: slots[0].value };
  }
  return null;
}

// Customer-facing sentence for why "order now" isn't available, covering a
// kitchen pause, a closed day (holiday) and normal closing time.
export function closedNowText(ms = Date.now()) {
  const at = nextOpening(ms);
  if (isPausedNow(ms)) {
    return at
      ? `We've paused online orders for a little while. We'll be taking orders again ${at}.`
      : "We've paused online orders for now.";
  }
  if (isClosedDate(torontoParts(ms).date)) {
    return `We're closed today${at ? `. We open again ${at}` : ""}.`;
  }
  return `We're closed for online orders right now${at ? ` (we open ${at})` : ""}.`;
}
