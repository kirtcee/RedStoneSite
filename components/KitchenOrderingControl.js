// components/KitchenOrderingControl.js
//
// Kitchen screen panel: the Online Ordering switch.
//   Pause: stop new online orders for 30 min / 1 hr / 2 hr / the rest of
//   today / until turned back on. While paused, customers can't order for
//   "now" and can only schedule for after the pause ends.
//   Closed days: whole days the store is closed (holidays). No orders or
//   scheduled times on those days.
// Every change asks "are you sure?" first. Saved to settings/ordering
// (utils/orderingStatus.js); the website and the server follow it within
// seconds.
import { useState } from "react";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import useOrderingStatus from "../hooks/useOrderingStatus";
import { MAX_CLOSED_DATES } from "../utils/orderingStatus";
import { torontoParts, addDays, torontoToDate, MAX_SCHEDULE_DAYS } from "../utils/storeHours";

const PAUSES = [
  { key: "30", label: "30 min", minutes: 30 },
  { key: "60", label: "1 hour", minutes: 60 },
  { key: "120", label: "2 hours", minutes: 120 },
  { key: "today", label: "Rest of today" },
  { key: "off", label: "Until I turn it back on" },
];

const clock = (ms) =>
  new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });
const dayLabel = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export default function KitchenOrderingControl() {
  const status = useOrderingStatus();
  const now = Date.now();
  const today = torontoParts(now).date;
  const pausedNow = status.paused && (status.pausedUntilMs == null || status.pausedUntilMs > now);
  const upcomingClosed = status.closedDates.filter((d) => d >= today);
  const closedToday = upcomingClosed.includes(today);

  const [asking, setAsking] = useState(null); // { text, apply: () => data }
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null); // { ok, text }
  const [showDays, setShowDays] = useState(false);
  const [newDay, setNewDay] = useState("");

  const save = async (data, okText) => {
    setSaving(true);
    setNote(null);
    try {
      await setDoc(doc(db, "settings", "ordering"), { ...data, updatedAt: serverTimestamp() });
      setNote({ ok: true, text: okText });
      setAsking(null);
    } catch (err) {
      console.warn("Could not save the ordering switch", err?.code);
      setNote({
        ok: false,
        text:
          err?.code === "permission-denied"
            ? "Couldn't save: publish the updated Firestore rules (see TODO.md)."
            : "Couldn't save. Check the connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // closed days kept: today onward only, sorted, no repeats
  const cleanDays = (list) => [...new Set(list.filter((d) => d >= today))].sort().slice(0, MAX_CLOSED_DATES);
  const base = (over) => ({
    paused: pausedNow,
    pausedUntil: pausedNow && status.pausedUntilMs ? Timestamp.fromMillis(status.pausedUntilMs) : null,
    closedDates: cleanDays(status.closedDates),
    ...over,
  });

  const askPause = (p) => {
    let untilMs = null;
    if (p.minutes) untilMs = Date.now() + p.minutes * 60000;
    if (p.key === "today") untilMs = torontoToDate(addDays(today, 1), "00:00").getTime();
    const until = untilMs ? (p.key === "today" ? "the end of today" : clock(untilMs)) : "you turn it back on";
    setNote(null);
    setAsking({
      text: untilMs
        ? `Pause online orders until ${until}? Customers can only schedule orders for after that.`
        : "Pause online orders until you turn them back on? Customers can't order or schedule at all.",
      yes: "Yes, Pause",
      run: () =>
        save(
          base({ paused: true, pausedUntil: untilMs ? Timestamp.fromMillis(untilMs) : null }),
          `Online orders paused until ${until}.`
        ),
    });
  };
  const askResume = () => {
    setNote(null);
    setAsking({
      text: "Start taking online orders again now?",
      yes: "Yes, Resume",
      run: () => save(base({ paused: false, pausedUntil: null }), "Online orders are on again."),
    });
  };
  const askAddDay = () => {
    if (!newDay || newDay < today) return;
    setNote(null);
    setAsking({
      text: `Close online ordering all day on ${dayLabel(newDay)}? Customers can't order or schedule for that day.`,
      yes: "Yes, Close That Day",
      run: () =>
        save(base({ closedDates: cleanDays([...status.closedDates, newDay]) }), `${dayLabel(newDay)} is now closed.`).then(
          () => setNewDay("")
        ),
    });
  };
  const askRemoveDay = (d) => {
    setNote(null);
    setAsking({
      text: `Open ${dayLabel(d)} again (normal hours)?`,
      yes: "Yes, Open It",
      run: () => save(base({ closedDates: cleanDays(status.closedDates.filter((x) => x !== d)) }), `${dayLabel(d)} is open again.`),
    });
  };

  return (
    <div className={`ko${pausedNow || closedToday ? " ko--off" : ""}`}>
      <div className="ko-row">
        <span className="ko-title">Online ordering:</span>
        {pausedNow ? (
          <span className="ko-state ko-state--off">
            PAUSED {status.pausedUntilMs ? `until ${clock(status.pausedUntilMs)}` : "until you turn it back on"}
          </span>
        ) : closedToday ? (
          <span className="ko-state ko-state--off">CLOSED TODAY</span>
        ) : (
          <span className="ko-state ko-state--on">ON</span>
        )}

        <div className="ko-actions">
          {pausedNow ? (
            <button type="button" className="ko-btn ko-btn--go" onClick={askResume} disabled={saving}>
              Resume Orders Now
            </button>
          ) : (
            <>
              <span className="ko-label">Pause for:</span>
              {PAUSES.map((p) => (
                <button key={p.key} type="button" className="ko-btn" onClick={() => askPause(p)} disabled={saving}>
                  {p.label}
                </button>
              ))}
            </>
          )}
          <button type="button" className="ko-btn ko-btn--plain" onClick={() => setShowDays((v) => !v)}>
            Closed Days ({upcomingClosed.length})
          </button>
        </div>
      </div>

      {asking && (
        <div className="ko-ask">
          <span>{asking.text}</span>
          <button type="button" className="ko-btn ko-btn--plain" onClick={() => setAsking(null)} disabled={saving}>
            No
          </button>
          <button type="button" className="ko-btn ko-btn--go" onClick={asking.run} disabled={saving}>
            {saving ? "Saving..." : asking.yes}
          </button>
        </div>
      )}
      {note && <div className={note.ok ? "ko-ok" : "ko-err"}>{note.ok ? "✓ " : ""}{note.text}</div>}

      {showDays && (
        <div className="ko-days">
          <div className="ko-days__add">
            <span>Close a whole day (holiday):</span>
            <input
              type="date"
              value={newDay}
              min={today}
              max={addDays(today, 365)}
              onChange={(e) => setNewDay(e.target.value)}
            />
            <button type="button" className="ko-btn" onClick={askAddDay} disabled={!newDay || newDay < today || saving}>
              Add Closed Day
            </button>
          </div>
          {upcomingClosed.length ? (
            <ul>
              {upcomingClosed.map((d) => (
                <li key={d}>
                  <span>{dayLabel(d)}</span>
                  <button type="button" className="ko-btn ko-btn--plain" onClick={() => askRemoveDay(d)} disabled={saving}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ko-none">No closed days set. Customers can schedule up to {MAX_SCHEDULE_DAYS} days ahead.</div>
          )}
        </div>
      )}

      <style jsx>{`
        .ko {
          margin: 0 0 12px;
          padding: 12px 14px;
          border: 2px solid #1b7a3a;
          border-radius: 8px;
          background: #fff;
          font-size: 16px;
        }
        .ko--off {
          border-color: #c62828;
          background: #fff5f5;
        }
        .ko-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .ko-title {
          font-weight: 700;
        }
        .ko-state {
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 800;
          color: #fff;
        }
        .ko-state--on {
          background: #1b7a3a;
        }
        .ko-state--off {
          background: #c62828;
        }
        .ko-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        .ko-label {
          font-weight: 600;
        }
        .ko-btn {
          padding: 8px 12px;
          border: 0;
          border-radius: 6px;
          background: #333;
          color: #fff;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        .ko-btn--go {
          background: #1b7a3a;
        }
        .ko-btn--plain {
          border: 1px solid #999;
          background: #fff;
          color: #222;
        }
        .ko-btn:disabled {
          opacity: 0.55;
          cursor: default;
        }
        .ko-ask {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 10px;
          border-radius: 6px;
          background: #fff8e1;
          font-weight: 600;
        }
        .ko-ok {
          margin-top: 8px;
          color: #1b7a3a;
          font-weight: 700;
        }
        .ko-err {
          margin-top: 8px;
          color: #c62828;
          font-weight: 700;
        }
        .ko-days {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        .ko-days__add {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .ko-days__add input {
          padding: 6px 8px;
          font: inherit;
        }
        .ko-days ul {
          margin: 10px 0 0;
          padding: 0;
          list-style: none;
        }
        .ko-days li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid #eee;
          font-weight: 600;
        }
        .ko-none {
          margin-top: 8px;
          color: #555;
        }
      `}</style>
    </div>
  );
}
