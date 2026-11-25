// components/OrderSettingsAside.js
// The right-side sticky "Order Settings" panel (checkout button, location,
// service method, order timing, running totals) — originally built inline
// in pages/menu.js, now shared by every page that needs it (pages/menu.js,
// pages/coupons.js, ...). Self-contained: reads everything it needs from
// useCart()/useRouter() directly, no required props.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useCart } from "./CartSystem";
import { formatMoney } from "./Pricing";

import { DELIVERY_FEE_CENTS, TAX_RATE, taxOn } from "../utils/orderRules";
export { DELIVERY_FEE_CENTS, TAX_RATE }; // older imports still point here
import {
  torontoParts,
  addDays,
  timeSlotsFor,
  hoursFor,
  formatClock,
  hoursSummary,
  canOrderNow,
  nextOpening,
  MAX_SCHEDULE_DAYS,
  LAST_ORDER_BEFORE_CLOSE,
} from "../utils/storeHours";
const BORDER = "var(--menu-box-border)";
const LIGHT = "#faf2e9";
const DARK = "#f0decc";
const BROWN = "var(--text-brown)";

function formatAddress(addr) {
  if (!addr) return "Enter address";
  const { street, suite, city, postal } = addr;
  return [street, suite ? `Unit ${suite}` : "", city, postal].filter(Boolean).join(", ");
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginRight: 8, flex: "0 0 auto" }}>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8v1H4v-1z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

// Custom-styled time picker — a native <input type="time"> can't be themed
// to match the site's font/colors, so this is a plain dropdown of 15-minute
// slots across the store's open hours instead.
function TimeDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="os-timeDropdown" ref={wrapRef}>
      <button type="button" className="os-timeTrigger" onClick={() => setOpen((v) => !v)}>
        <span>{selected ? selected.label : "Select Time"}</span>
        <span className={`os-timeChevron${open ? " is-open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="os-timeMenu">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`os-timeOption${opt.value === value ? " is-selected" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <style jsx>{`
        .os-timeDropdown {
          position: relative;
          margin-top: 8px;
        }
        .os-timeTrigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid ${BORDER};
          background: ${LIGHT};
          color: ${BROWN};
          font-family: var(--font-body, Inter, system-ui, sans-serif);
          font-weight: 700;
          font-size: var(--fs-min);
          cursor: pointer;
        }
        .os-timeChevron {
          color: ${BROWN};
          transition: transform 0.15s ease;
        }
        .os-timeChevron.is-open {
          transform: rotate(180deg);
        }
        .os-timeMenu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 220px;
          overflow-y: auto;
          background: ${LIGHT};
          border: 1px solid ${BORDER};
          border-radius: 10px;
          z-index: 20;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
        }
        .os-timeOption {
          display: block;
          width: 100%;
          text-align: left;
          padding: 9px 14px;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          color: ${BROWN};
          font-family: var(--font-body, Inter, system-ui, sans-serif);
          font-size: var(--fs-min);
          cursor: pointer;
        }
        .os-timeOption:last-child {
          border-bottom: none;
        }
        .os-timeOption:hover {
          background: ${DARK};
        }
        .os-timeOption.is-selected {
          font-weight: 800;
          background: ${DARK};
        }
      `}</style>
    </div>
  );
}

function formatDateDisplay(isoDate) {
  if (!isoDate) return "Select Date";
  const [y, m, d] = isoDate.split("-");
  return `${m}-${d}-${y}`;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Custom-styled date picker — a native <input type="date"> renders its value
// (and its own picker UI) in whatever format the browser/OS locale dictates,
// which can't be forced to match the site's MM-DD-YYYY look via CSS. This is
// a small calendar dropdown instead, still storing the same "YYYY-MM-DD"
// value everywhere else already expects.
function DateDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const initial = value ? value.split("-").map(Number) : null;
  const now = new Date();
  const [viewYear, setViewYear] = useState(initial ? initial[0] : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial ? initial[1] - 1 : now.getMonth());
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const [selY, selM, selD] = value ? value.split("-").map(Number) : [null, null, null];
  const selectedInView = value && selY === viewYear && selM - 1 === viewMonth;

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const dayValue = (day) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  // only today (Toronto) up to MAX_SCHEDULE_DAYS ahead can be picked
  const firstDay = torontoParts().date;
  const lastDay = addDays(firstDay, MAX_SCHEDULE_DAYS);
  const dayOff = (day) => dayValue(day) < firstDay || dayValue(day) > lastDay;
  const pickDay = (day) => {
    if (dayOff(day)) return;
    onChange(dayValue(day));
    setOpen(false);
  };

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="os-dateDropdown" ref={wrapRef}>
      <button type="button" className="os-dateTrigger" onClick={() => setOpen((v) => !v)}>
        <CalendarIcon />
        <span>{formatDateDisplay(value)}</span>
      </button>
      {open && (
        <div className="os-dateMenu">
          <div className="os-dateMenu__header">
            <button type="button" className="os-dateMenu__nav" onClick={goPrevMonth} aria-label="Previous month">
              ‹
            </button>
            <div className="os-dateMenu__month">{monthLabel}</div>
            <button type="button" className="os-dateMenu__nav" onClick={goNextMonth} aria-label="Next month">
              ›
            </button>
          </div>
          <div className="os-dateMenu__weekdays">
            {WEEKDAY_LETTERS.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
          <div className="os-dateMenu__grid">
            {cells.map((day, i) =>
              day == null ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  className={`os-dateMenu__day${selectedInView && day === selD ? " is-selected" : ""}`}
                  onClick={() => pickDay(day)}
                  disabled={dayOff(day)}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .os-dateDropdown {
          position: relative;
        }
        .os-dateTrigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 10px;
          border: 1px solid ${BORDER};
          border-radius: 4px;
          background: #fff;
          color: ${BROWN};
          font-family: var(--font-body, Inter, system-ui, sans-serif);
          font-size: var(--fs-min);
          cursor: pointer;
          text-align: left;
        }
        .os-dateMenu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: ${LIGHT};
          border: 1px solid ${BORDER};
          border-radius: 10px;
          z-index: 20;
          padding: 10px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
        }
        .os-dateMenu__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .os-dateMenu__nav {
          background: none;
          border: none;
          color: ${BROWN};
          font-size: 1.2rem;
          font-weight: 900;
          cursor: pointer;
          padding: 2px 10px;
          line-height: 1;
        }
        .os-dateMenu__nav:hover {
          background: ${DARK};
        }
        .os-dateMenu__month {
          font-weight: 800;
          color: ${BROWN};
          font-family: var(--font-heading, Oswald, sans-serif);
          font-size: var(--fs-min);
          text-transform: uppercase;
        }
        .os-dateMenu__weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: var(--fs-min);
          font-weight: 800;
          color: ${BROWN};
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .os-dateMenu__grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .os-dateMenu__day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          border-radius: 6px;
          color: ${BROWN};
          font-size: var(--fs-min);
          cursor: pointer;
        }
        .os-dateMenu__day:hover {
          background: ${DARK};
        }
        .os-dateMenu__day:disabled {
          opacity: 0.3;
          cursor: default;
          background: none;
        }
        .os-dateMenu__day.is-selected {
          background: #8b1a1a;
          color: #fff;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}

// variant="aside" (default): the sticky desktop sidebar on menu/cart/coupons
//   (hidden on phones, which reach checkout through the Cart page).
// variant="drawer": just the ORDER SETTINGS card, for the mobile hamburger
//   menu (components/Header.js) — no checkout button, sticky follower or
//   bottom bar.
// hideMobileBar: no longer used (the phones' Total/Checkout bar was removed).
export default function OrderSettingsAside({ variant = "aside", hideMobileBar = false }) {
  const isDrawer = variant === "drawer";
  const router = useRouter();
  const {
    subtotalCents: cartSubtotalCents,
    service,
    deliveryAddress,
    openServiceGate,
    confirmCarryout,
    confirmDelivery,
    orderTiming,
    setOrderTiming,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    isLoaded,
    goToCheckout,
  } = useCart();
  const subtotalCents = cartSubtotalCents ?? 0;

  const [location, setLocation] = useState("Hamilton, ON L8N1G3");
  const [changingLoc, setChangingLoc] = useState(false);
  const [newLoc, setNewLoc] = useState("");
  const [showHours, setShowHours] = useState(false);
  // Scheduled times offered for the chosen day (Toronto time, store hours,
  // nothing too soon); see utils/storeHours.js
  const timeOptions = useMemo(() => timeSlotsFor(scheduleDate || torontoParts().date), [scheduleDate]);
  const dayHours = scheduleDate ? hoursFor(scheduleDate) : null;
  const openNow = canOrderNow();

  // Keep the chosen date/time valid: never a past day, and a time that's
  // actually offered for that day (first one available otherwise).
  useEffect(() => {
    const today = torontoParts().date;
    if (!scheduleDate || scheduleDate < today) {
      setScheduleDate(today);
      return;
    }
    if (timeOptions.length && !timeOptions.some((o) => o.value === scheduleTime)) {
      setScheduleTime(timeOptions[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleDate, timeOptions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The delivery fee is only shown in the cart and at checkout, so these
  // running totals are food and drinks (plus their tax) only.
  const deliveryCents = 0;
  const taxCents = taxOn(subtotalCents);
  const totalCents = subtotalCents + deliveryCents + taxCents;

  // Selecting Carryout applies instantly (no extra info needed). Selecting
  // Delivery re-confirms a previously-entered address instantly, or opens
  // the existing address picker if none is on file yet — there's no way to
  // pick "delivery" without an address, so this is as close to an instant
  // radio toggle as that requirement allows.
  const handleSelectCarryout = () => confirmCarryout();
  const handleSelectDelivery = () => {
    if (deliveryAddress) confirmDelivery(deliveryAddress);
    else openServiceGate();
  };

  // Elastic "follows the scroll with a little lag" effect on the sticky
  // panel — same as the one built for pages/menu.js.
  const followerRef = useRef(null);
  const lagRef = useRef(0);
  const prevScrollRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (isDrawer || typeof window === "undefined") return;
    prevScrollRef.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - prevScrollRef.current;
      prevScrollRef.current = y;
      lagRef.current = Math.max(-220, Math.min(220, lagRef.current - delta));
      if (!rafRef.current) {
        const tick = () => {
          lagRef.current *= 0.88;
          if (followerRef.current) {
            followerRef.current.style.transform = `translateY(${lagRef.current}px)`;
          }
          if (Math.abs(lagRef.current) > 0.5) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            lagRef.current = 0;
            if (followerRef.current) followerRef.current.style.transform = "translateY(0px)";
            rafRef.current = 0;
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  return (
    <>
      <aside className={isDrawer ? "os-drawer" : "menu-aside"}>
      <div
        className={isDrawer ? undefined : "menu-aside__follower"}
        ref={isDrawer ? undefined : followerRef}
      >
        {!isDrawer && (
        <button
          type="button"
          className="os-checkout"
          onClick={(e) => {
            e.stopPropagation();
            goToCheckout();
          }}
        >
          CHECKOUT
        </button>
        )}

        <div className="os-card">
          <div className="os-bar">
            <PersonIcon />
            ORDER SETTINGS
          </div>

          {/* My Location */}
          <div className="os-box" style={{ background: LIGHT }}>
            <div className="os-label">
              My Location
              <button type="button" className="os-change" onClick={() => setChangingLoc((v) => !v)}>
                (Change)
              </button>
            </div>
            {!changingLoc ? (
              <div className="os-value">{location}</div>
            ) : (
              <div className="os-editRow">
                <input
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="os-editInput"
                  placeholder="Enter address or postal code"
                />
                <button
                  onClick={() => {
                    setLocation(newLoc || location);
                    setChangingLoc(false);
                  }}
                  className="os-editSave"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Service Method — dimmed until the persisted service method has
              loaded, so it reads as "still syncing" rather than "you have
              no service method selected" during the brief hydration gap. */}
          <div className="os-box" style={{ background: DARK, opacity: isLoaded ? 1 : 0.5 }}>
            <div className="os-label">Service Method</div>
            <div className="os-radios">
              <label className="os-radio">
                <input type="radio" name="serviceMethod" checked={service === "carryout"} onChange={handleSelectCarryout} />
                Carryout
              </label>
              <label className="os-radio">
                <input type="radio" name="serviceMethod" checked={service === "delivery"} onChange={handleSelectDelivery} />
                Delivery
              </label>
            </div>
            {service === "delivery" && (
              <div className="os-value" style={{ marginTop: 6 }}>
                {formatAddress(deliveryAddress)}
              </div>
            )}
          </div>

          {/* Order Timing */}
          <div className="os-box" style={{ background: LIGHT }}>
            <div className="os-label">Order Timing</div>
            <div className="os-radios">
              <label className="os-radio">
                <input type="radio" name="orderTiming" checked={orderTiming === "now"} onChange={() => setOrderTiming("now")} />
                Now
              </label>
              <label className="os-radio">
                <input type="radio" name="orderTiming" checked={orderTiming === "later"} onChange={() => setOrderTiming("later")} />
                Later
              </label>
            </div>

            {orderTiming === "later" && (
              <div className="os-schedule">
                <DateDropdown value={scheduleDate} onChange={setScheduleDate} />

                {timeOptions.length > 0 ? (
                  <TimeDropdown value={scheduleTime} onChange={setScheduleTime} options={timeOptions} />
                ) : (
                  <div className="os-small os-small--warn">No times left on this day. Please pick another day.</div>
                )}

                {dayHours && (
                  <div className="os-small">
                    Hours that day: {formatClock(dayHours.open)} to {formatClock(dayHours.close)}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setShowHours((v) => !v)} className="os-link">
              View Store Hours
            </button>
            {orderTiming === "now" && !openNow && (
              <div className="os-small os-small--warn">
                We're closed for online orders right now{nextOpening() ? ` (we open ${nextOpening()})` : ""}. Choose
                Later to schedule your order.
              </div>
            )}
            {showHours && (
              <div className="os-hours">
                {hoursSummary().map((r) => (
                  <div key={r.days}>
                    {r.days}: {r.hours}
                  </div>
                ))}
                <div>Last online order {LAST_ORDER_BEFORE_CLOSE} min before closing.</div>
              </div>
            )}
          </div>

          {/* Totals — while the cart is still hydrating, subtotalCents reads
              0 (not yet "genuinely empty"); show a neutral placeholder
              instead of a misleading "$0.00" that looks like the order was
              wiped (see project memory: Order Settings $0.00 flash). */}
          {!isDrawer && (
          <div className="os-box" style={{ background: DARK }}>
            <div className="os-totalRow">
              <div>Food &amp; Beverage:</div>
              <div className="os-totalNum">{isLoaded ? formatMoney(subtotalCents) : "···"}</div>
            </div>
            <div className="os-totalRow">
              <div>Taxes:</div>
              <div className="os-totalNum">{isLoaded ? formatMoney(taxCents) : "···"}</div>
            </div>
            <div className="os-grandRow">
              <div>Order Total:</div>
              <div>{isLoaded ? formatMoney(totalCents) : "···"}</div>
            </div>
            {service === "delivery" && <div className="os-small">Delivery fee is added in your cart.</div>}
          </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .os-checkout {
          width: 100%;
          margin-bottom: 8px;
          padding: 0.9rem 1rem;
          border-radius: .1875rem;
          background: #000;
          color: #fff;
          border: none;
          font-weight: 900;
          cursor: pointer;
          font-family: var(--font-heading, Oswald, sans-serif);
          text-transform: uppercase;
        }
        .os-card {
          border: 1px solid ${BORDER};
          border-radius: .1875rem;
          overflow: visible;
        }
        .os-bar {
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          padding: 0.65rem 0.9rem;
          font-weight: 900;
          text-transform: uppercase;
          font-family: var(--font-heading, Oswald, sans-serif);
          letter-spacing: 0.3px;
          font-size: var(--fs-min);
          border-top-left-radius: .1875rem;
          border-top-right-radius: .1875rem;
        }
        .os-box {
          padding: 12px 14px;
          border-bottom: 1px solid ${BORDER};
        }
        .os-box:last-child {
          border-bottom: none;
          border-bottom-left-radius: .1875rem;
          border-bottom-right-radius: .1875rem;
        }
        .os-label {
          display: flex;
          align-items: baseline;
          white-space: nowrap; /* "MY LOCATION" stays on one line beside (CHANGE) */
          font-weight: 800;
          color: #000;
          font-family: var(--font-heading, Oswald, sans-serif);
          text-transform: uppercase;
          font-size: var(--fs-sm);
          letter-spacing: 0.2px;
        }
        .os-change {
          background: none;
          border: none;
          padding: 0;
          margin-left: 6px;
          color: #000;
          font-weight: 800;
          text-transform: uppercase;
          font-size: var(--fs-xs);
          cursor: pointer;
          text-decoration: none;
          font-family: var(--font-heading, Oswald, sans-serif);
        }
        .os-value {
          margin-top: 4px;
          color: ${BROWN};
          font-size: var(--fs-sm);
        }
        .os-editRow {
          margin-top: 8px;
          display: flex;
          gap: 8px;
        }
        .os-editInput {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid ${BORDER};
          border-radius: 0;
          background: #fff;
        }
        .os-editSave {
          padding: 6px 10px;
          border: 1px solid ${BORDER};
          border-radius: 0;
          background: #fff;
          cursor: pointer;
        }
        /* Hamburger-drawer version: a bit tighter so it fits on screen */
        .os-drawer .os-box {
          padding: 9px 12px;
        }
        .os-drawer .os-bar {
          padding: 0.55rem 0.8rem;
        }
        .os-drawer .os-radios {
          gap: 4px;
          margin-top: 6px;
        }
        .os-radios {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }
        .os-radio {
          font-weight: var(--w-black); /* as heavy as the SERVICE METHOD label */
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${BROWN};
          font-size: var(--fs-sm);
          cursor: pointer;
        }
        .os-schedule {
          margin-top: 10px;
        }
        .os-small--warn {
          color: #a71318 !important;
          font-weight: 700;
        }
        .os-small {
          margin-top: 6px;
          font-size: var(--fs-xs);
          color: ${BROWN};
        }
        .os-link {
          background: none;
          border: none;
          padding: 0;
          margin-top: 10px;
          color: #000;
          font-weight: 800;
          text-transform: uppercase;
          font-size: var(--fs-xs);
          cursor: pointer;
          text-decoration: underline;
          font-family: var(--font-heading, Oswald, sans-serif);
          display: block;
        }
        .os-hours {
          margin-top: 6px;
          font-size: var(--fs-xs);
          color: ${BROWN};
          line-height: 1.4;
        }
        .os-totalRow {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          color: ${BROWN};
          font-size: var(--fs-sm);
        }
        .os-totalNum {
          font-weight: 700;
          color: ${BROWN};
        }
        .os-grandRow {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-weight: 900;
          font-size: var(--fs-min);
          color: #000;
          font-family: var(--font-heading, Oswald, sans-serif);
          text-transform: uppercase; /* Red Stone Face has lowercase; headings stay caps */
        }
      `}</style>
    </aside>
    </>
  );
}
