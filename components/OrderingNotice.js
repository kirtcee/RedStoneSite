// components/OrderingNotice.js
//
// Thin notice under the header on every customer page while the kitchen has
// paused online orders, or the store is closed today (a closed day set on
// the kitchen screen). Normal after-hours closing doesn't show it; Order
// Settings and checkout explain that.
import useOrderingStatus from "../hooks/useOrderingStatus";
import { closedNowText, isPausedNow, isClosedDate, torontoParts, firstOpenSlot } from "../utils/storeHours";

export default function OrderingNotice() {
  useOrderingStatus(); // live; re-renders on changes
  const paused = isPausedNow();
  const closedToday = isClosedDate(torontoParts().date);
  if (!paused && !closedToday) return null;
  const canSchedule = !!firstOpenSlot();
  return (
    <div className="ordering-notice" role="status">
      {closedNowText()}
      {canSchedule ? " You can still schedule an order for later." : ""}
      <style jsx>{`
        .ordering-notice {
          padding: 10px 16px;
          background: #1a1a1a;
          color: #fff;
          text-align: center;
          font-size: var(--fs-min);
          font-weight: var(--w-medium);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
