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

const DELIVERY_FEE_CENTS = 499;
const TAX_RATE = 0.13;
const STORE_HOURS = { open: "11:00", close: "22:00" };
const BORDER = "#d9c49c";
const LIGHT = "#faf2e9";
const DARK = "#f0decc";
const BROWN = "#6b3f22";

function formatAddress(addr) {
  if (!addr) return "Enter address";
  const { street, suite, city, postal } = addr;
  return [street, suite ? `Unit ${suite}` : "", city, postal].filter(Boolean).join(", ");
}

// 15-minute increments across the store's open hours, e.g. "11:00"->"11:15 AM".
function buildTimeOptions(open, close) {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;
  const opts = [];
  for (let m = start; m <= end; m += 15) {
    const h24 = Math.floor(m / 60);
    const min = m % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    opts.push({
      value: `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      label: `${h12}:${String(min).padStart(2, "0")} ${period}`,
    });
  }
  return opts;
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
          font-size: 0.88rem;
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
          font-size: 0.85rem;
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

  const pickDay = (day) => {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
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
          font-size: 0.85rem;
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
          font-size: 0.85rem;
          text-transform: uppercase;
        }
        .os-dateMenu__weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 0.68rem;
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
          font-size: 0.8rem;
          cursor: pointer;
        }
        .os-dateMenu__day:hover {
          background: ${DARK};
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

export default function OrderSettingsAside() {
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
  } = useCart();
  const subtotalCents = cartSubtotalCents ?? 0;

  const [location, setLocation] = useState("Hamilton, ON L8N1G3");
  const [changingLoc, setChangingLoc] = useState(false);
  const [newLoc, setNewLoc] = useState("");
  const [showHours, setShowHours] = useState(false);
  const timeOptions = useMemo(() => buildTimeOptions(STORE_HOURS.open, STORE_HOURS.close), []);

  useEffect(() => {
    const today = new Date();
    const yyyyMmDd = today.toISOString().slice(0, 10);
    if (!scheduleDate) setScheduleDate(yyyyMmDd);
    if (!scheduleTime) setScheduleTime("18:00");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliveryCents = service === "delivery" ? DELIVERY_FEE_CENTS : 0;
  const taxCents = Math.round(TAX_RATE * (subtotalCents + deliveryCents));
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
    if (typeof window === "undefined") return;
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
    <aside className="menu-aside">
      <div className="menu-aside__follower" ref={followerRef}>
        <button
          type="button"
          className="os-checkout"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/checkout");
          }}
        >
          CHECKOUT
        </button>

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

          {/* Service Method */}
          <div className="os-box" style={{ background: DARK }}>
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

                <TimeDropdown value={scheduleTime} onChange={setScheduleTime} options={timeOptions} />

                <div className="os-small">
                  Available hours for selected day: {STORE_HOURS.open}–{STORE_HOURS.close}
                </div>
              </div>
            )}

            <button onClick={() => setShowHours((v) => !v)} className="os-link">
              View Store Hours
            </button>
            {showHours && (
              <div className="os-hours">
                Mon–Sat: 11:00–22:00
                <br />
                Sun: 12:00–21:00
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="os-box" style={{ background: DARK }}>
            <div className="os-totalRow">
              <div>Food &amp; Beverage:</div>
              <div className="os-totalNum">{formatMoney(subtotalCents)}</div>
            </div>
            {service === "delivery" && (
              <div className="os-totalRow">
                <div>Delivery:</div>
                <div className="os-totalNum">{formatMoney(DELIVERY_FEE_CENTS)}</div>
              </div>
            )}
            <div className="os-totalRow">
              <div>Taxes:</div>
              <div className="os-totalNum">{formatMoney(taxCents)}</div>
            </div>
            <div className="os-grandRow">
              <div>Order Total:</div>
              <div>{formatMoney(totalCents)}</div>
            </div>
          </div>
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
          font-size: 0.95rem;
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
          font-weight: 800;
          color: #000;
          font-family: var(--font-heading, Oswald, sans-serif);
          text-transform: uppercase;
          font-size: 0.85rem;
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
          font-size: 0.85rem;
          cursor: pointer;
          text-decoration: none;
          font-family: var(--font-heading, Oswald, sans-serif);
        }
        .os-value {
          margin-top: 4px;
          color: ${BROWN};
          font-size: 0.88rem;
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
        .os-radios {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }
        .os-radio {
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${BROWN};
          font-size: 0.88rem;
          cursor: pointer;
        }
        .os-schedule {
          margin-top: 10px;
        }
        .os-small {
          margin-top: 6px;
          font-size: 12px;
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
          font-size: 0.78rem;
          cursor: pointer;
          text-decoration: underline;
          font-family: var(--font-heading, Oswald, sans-serif);
          display: block;
        }
        .os-hours {
          margin-top: 6px;
          font-size: 13px;
          color: ${BROWN};
          line-height: 1.4;
        }
        .os-totalRow {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          color: ${BROWN};
          font-size: 0.88rem;
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
          font-size: 1.05rem;
          color: #000;
          font-family: var(--font-heading, Oswald, sans-serif);
        }
      `}</style>
    </aside>
  );
}
