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

export function hoursFor(date) {
  return HOURS[weekdayOf(date)] || null;
}

// Can a customer place an "order now" right now?
export function canOrderNow(ms = Date.now()) {
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
  const earliest = date === now.date ? now.minutes + MIN_SCHEDULE_AHEAD : -1;
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
export function nextOpening(ms = Date.now()) {
  const now = torontoParts(ms);
  for (let i = 0; i < 8; i++) {
    const date = addDays(now.date, i);
    const h = hoursFor(date);
    if (!h) continue;
    if (i === 0 && now.minutes >= h.open) continue;
    const when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_NAMES[weekdayOf(date)];
    return `${when} at ${formatClock(h.open)}`;
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
