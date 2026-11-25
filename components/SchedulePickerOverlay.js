// components/SchedulePickerOverlay.js
//
// "Pick a time" popup for checkout. Opens when the store is closed (or the
// scheduled time no longer works) and the customer taps Place Your Order or
// Schedule for Later. They choose a day and a time (same pickers as Order
// Settings, same rules from utils/storeHours.js); Schedule This Time saves
// it as the order's time, then they place the order as normal.
import React, { useEffect, useMemo, useState } from "react";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";
import { DateDropdown, TimeDropdown } from "./OrderSettingsAside";
import { useCart } from "./CartSystem";
import { firstOpenSlot, timeSlotsFor, scheduleProblem, hoursFor, formatClock, torontoParts } from "../utils/storeHours";
import { track } from "../utils/analytics";

// reason: "closed" (closed right now) or "badTime" (their scheduled time no
// longer works). opens: when the store next opens, e.g. "tomorrow at 11:00 AM".
export default function SchedulePickerOverlay({ open, onClose, reason = "closed", opens = null }) {
  const cart = useCart();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Start on their current scheduled time if it still works, otherwise the
  // first time we're open.
  useEffect(() => {
    if (!open) return;
    track("schedule_picker_opened", { reason });
    const cur = cart?.scheduleDate && cart?.scheduleTime && !scheduleProblem(cart.scheduleDate, cart.scheduleTime);
    const start = cur ? { date: cart.scheduleDate, time: cart.scheduleTime } : firstOpenSlot();
    setDate(start?.date || torontoParts().date);
    setTime(start?.time || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const timeOptions = useMemo(() => (date ? timeSlotsFor(date) : []), [date]);
  // keep the time one that's offered on the chosen day
  useEffect(() => {
    if (!date) return;
    if (timeOptions.length && !timeOptions.some((o) => o.value === time)) setTime(timeOptions[0].value);
    if (!timeOptions.length) setTime("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeOptions]);

  const dayHours = date ? hoursFor(date) : null;
  const ok = !!date && !!time && !scheduleProblem(date, time);

  const confirm = () => {
    if (!ok) return;
    track("schedule_picker_confirmed", { reason });
    cart?.setOrderTiming?.("later");
    cart?.setScheduleDate?.(date);
    cart?.setScheduleTime?.(time);
    onClose?.();
  };

  return (
    <DebugPizzaOverlay open={!!open} onClose={onClose} mode="portal" blockRogue freezeChild={false} title="Schedule Your Order">
      {open && (
        <div className="sp">
          <p className="sp-lead">
            {reason === "badTime"
              ? "We're not open at the time you picked, or it's too soon. Choose another time for your order."
              : `We're closed for online orders right now${opens ? ` (we open ${opens})` : ""}. Choose a time and we'll have your order ready then.`}
          </p>

          <div className="sp-box">
            <div className="sp-label">Day</div>
            <DateDropdown value={date} onChange={setDate} />

            <div className="sp-label">Time</div>
            {timeOptions.length > 0 ? (
              <TimeDropdown value={time} onChange={setTime} options={timeOptions} />
            ) : (
              <div className="sp-warn">No times left on this day. Please pick another day.</div>
            )}

            {dayHours && (
              <div className="sp-hours">
                Hours that day: {formatClock(dayHours.open)} to {formatClock(dayHours.close)}
              </div>
            )}
          </div>

          <div className="sp-actions">
            <button type="button" className="rs-pill-btn sp-actions__main" onClick={confirm} disabled={!ok}>
              Schedule This Time
            </button>
            <button type="button" className="sp-actions__link" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .sp {
          padding: 4px 0 18px;
          color: var(--text-brown);
        }
        .sp-lead {
          margin: 0 0 14px;
          font-size: var(--fs-base);
          line-height: 1.4;
        }
        .sp-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          padding: 14px 16px 16px;
          margin-bottom: 18px;
        }
        .sp-label {
          margin-top: 4px;
          font-family: var(--font-display);
          font-size: var(--fs-md);
          text-transform: uppercase;
          color: #000;
        }
        .sp-warn {
          font-size: var(--fs-min);
          font-weight: var(--w-semibold);
          color: #b00020;
        }
        .sp-hours {
          margin-top: 4px;
          font-size: var(--fs-min);
        }
        .sp-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .sp-actions :global(.sp-actions__main) {
          width: 100%;
        }
        .sp-actions :global(.sp-actions__main:disabled) {
          opacity: 0.5;
          cursor: default;
        }
        .sp-actions__link {
          padding: 0;
          border: 0;
          background: none;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          letter-spacing: 0.03em;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: var(--text-brown);
          cursor: pointer;
        }
      `}</style>
    </DebugPizzaOverlay>
  );
}
