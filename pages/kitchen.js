import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { db, auth } from "../utils/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { formatMoney, describePizzaFull } from "../components/Pricing";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";
import { STAFF_EMAIL } from "../utils/kitchenAuth";
import KitchenHealth from "../components/KitchenHealth";
import KitchenPastOrders from "../components/KitchenPastOrders";
import { MIN_WAIT, MAX_WAIT, WAIT_STEP, readWaitTimes } from "../utils/waitTimes";

const UNDO_MS = 8000; // how long "Undo" shows after Mark Completed
const LATER_AFTER_MS = 30 * 60000; // scheduled orders due further out than this go in "Later"
const RING_EVERY_MS = 5000; // repeat chime while an order hasn't been accepted

const toMs = (ts) => (ts?.toDate ? ts.toDate().getTime() : null);

function describeItem(item) {
  if (!item) return "Item";
  if (item.type === "pizza-byo") return describePizzaFull(item);
  if (item.type === "pizza-specialty") return item.name || "Specialty Pizza";
  if (item.type === "wings") return [`${item.count} Wings`, item.sauce].filter(Boolean).join(", ");
  if (item.type === "side") return item.summary || item.name || "Side";
  if (item.type === "special") return item.summary || item.name || "Special";
  if (item.type === "combo") return comboNameFor(item.comboId);
  return item.summary || "Item";
}

function formatScheduled(order) {
  if (order.orderTiming !== "later" || !order.schedule?.date) return null;
  const d = new Date(`${order.schedule.date}T${order.schedule.time || "00:00"}:00`);
  if (isNaN(d.getTime())) return `${order.schedule.date} ${order.schedule.time || ""}`.trim();
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KitchenDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  // When the order feed started running only from the device's own copy
  // (not live from the server); null while it's live. KitchenHealth alerts
  // if this lasts more than a few seconds.
  const [fromCacheSince, setFromCacheSince] = useState(null);

  // A clock for the "due in / late" timers and the Later section
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Mark Completed waits UNDO_MS before saving, so a mis-tap can be undone.
  // id -> { name } while waiting; the timers live in completeTimersRef.
  const [completing, setCompleting] = useState({});
  const completeTimersRef = useRef({});
  const startComplete = (order) => {
    const id = order.id;
    setCompleting((c) => ({ ...c, [id]: { name: order.contact?.name || "this order" } }));
    completeTimersRef.current[id] = setTimeout(async () => {
      delete completeTimersRef.current[id];
      try {
        await updateDoc(doc(db, "orders", id), { completed: true });
      } catch (err) {
        console.error("Could not complete order", err);
      }
      setCompleting((c) => {
        const next = { ...c };
        delete next[id];
        return next;
      });
    }, UNDO_MS);
  };
  const undoComplete = (id) => {
    clearTimeout(completeTimersRef.current[id]);
    delete completeTimersRef.current[id];
    setCompleting((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  };

  const acceptOrder = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { acceptedAt: serverTimestamp() });
    } catch (err) {
      console.error("Could not accept order", err);
      alert("Couldn't accept the order. Check the connection and try again.");
    }
  };

  // Carryout / delivery wait times (settings/waitTimes): the kitchen can
  // raise them when busy, never below 20 / 45 minutes.
  const [waitTimes, setWaitTimes] = useState({ ...MIN_WAIT });
  const [waitError, setWaitError] = useState(null);

  // New-order sound + visual alert. Browsers block audio until a real user
  // gesture unlocks it, so staff click "Enable Order Alerts" once per page
  // load (it stays open on a tablet all shift) — see enableAlerts below.
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const alertsEnabledRef = useRef(false);
  const audioCtxRef = useRef(null);
  const knownIdsRef = useRef(null); // null until the first snapshot lands
  const [newOrderIds, setNewOrderIds] = useState(() => new Set());
  const flashTimeoutsRef = useRef({});

  // Manual print fallback (no automatic kitchen printer hooked up yet —
  // see printingOrder effect below, which fires window.print() for just
  // this one order via the .print-receipt/@media print rules).
  const [printingOrder, setPrintingOrder] = useState(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    alertsEnabledRef.current = alertsEnabled;
  }, [alertsEnabled]);

  const enableAlerts = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      audioCtxRef.current.resume();
      setAlertsEnabled(true);
    } catch (err) {
      console.error("Could not enable order alerts:", err);
    }
  };

  const playNewOrderChime = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const start = now + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  };

  useEffect(() => {
    if (!printingOrder) return;
    const timer = setTimeout(() => window.print(), 50);
    const onAfterPrint = () => setPrintingOrder(null);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printingOrder]);

  // Anonymous customers are also "signed in" (see firebaseConfig.js), so
  // staff access requires the specific staff account, not just any user.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const staff = !!user && user.email === STAFF_EMAIL;
      setIsStaff(staff);
      setAuthChecked(true);
      if (!staff) router.replace("/kitchen-login");
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isStaff) return;

    const q = query(
      collection(db, "orders"),
      where("completed", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true }, // also tells us when the server connection drops
      (snapshot) => {
        const cached = snapshot.metadata.fromCache;
        setFromCacheSince((prev) => (cached ? prev || Date.now() : null));
        const liveOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(liveOrders);
        setOrdersError(null);

        const currentIds = new Set(liveOrders.map((o) => o.id));
        // Skip the very first snapshot — every already-open order would
        // otherwise read as "new" the moment the dashboard loads.
        if (knownIdsRef.current) {
          const arrivedIds = liveOrders
            .map((o) => o.id)
            .filter((id) => !knownIdsRef.current.has(id));
          if (arrivedIds.length > 0) {
            if (alertsEnabledRef.current) playNewOrderChime();
            setNewOrderIds((prev) => new Set([...prev, ...arrivedIds]));
            arrivedIds.forEach((id) => {
              clearTimeout(flashTimeoutsRef.current[id]);
              flashTimeoutsRef.current[id] = setTimeout(() => {
                setNewOrderIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }, 10000);
            });
          }
        }
        knownIdsRef.current = currentIds;
      },
      (err) => {
        console.error("Kitchen orders listener failed:", err);
        setOrdersError(err.message || "Failed to load orders.");
      }
    );

    return () => unsubscribe();
  }, [isStaff]);

  useEffect(() => {
    if (!isStaff) return undefined;
    return onSnapshot(
      doc(db, "settings", "waitTimes"),
      (snap) => setWaitTimes(readWaitTimes(snap.exists() ? snap.data() : null)),
      // Usually "permission denied" until the Firestore rules with
      // settings/waitTimes are published (see TODO.md). Shown in the wait
      // bar instead of console.error (which Next.js shows as a red overlay).
      (err) =>
        setWaitError(
          err?.code === "permission-denied"
            ? "Wait times can't be saved yet: publish the updated Firestore rules (see TODO.md)."
            : "Couldn't load the wait times. Check the connection."
        )
    );
  }, [isStaff]);

  // − / + only change a draft; Confirm, then "Yes, Change It", saves it.
  const [waitDraft, setWaitDraft] = useState(null); // null = no unsaved change
  const [waitAsking, setWaitAsking] = useState(false);
  const [waitSaving, setWaitSaving] = useState(false);
  const [waitSaved, setWaitSaved] = useState(null); // success note text
  const shownWait = waitDraft || waitTimes;
  const waitDirty =
    !!waitDraft && (waitDraft.carryout !== waitTimes.carryout || waitDraft.delivery !== waitTimes.delivery);

  const changeWait = (key, delta) => {
    const base = waitDraft || waitTimes;
    const next = { ...base, [key]: Math.min(MAX_WAIT, Math.max(MIN_WAIT[key], base[key] + delta)) };
    setWaitDraft(next);
    setWaitAsking(false);
    setWaitSaved(null);
    setWaitError(null);
  };

  const saveWait = async () => {
    if (!waitDirty) return;
    setWaitSaving(true);
    setWaitError(null);
    try {
      await setDoc(doc(db, "settings", "waitTimes"), {
        carryoutMinutes: waitDraft.carryout,
        deliveryMinutes: waitDraft.delivery,
        updatedAt: serverTimestamp(),
      });
      setWaitTimes(waitDraft);
      setWaitSaved(
        `Changed. Customers now see ${waitDraft.carryout} min for carryout and ${waitDraft.delivery} min for delivery.`
      );
      setWaitDraft(null);
    } catch (err) {
      console.warn("Could not save wait times", err?.code);
      setWaitError(
        err?.code === "permission-denied"
          ? "Couldn't save: publish the updated Firestore rules (see TODO.md)."
          : "Couldn't save. Check the connection and try again."
      );
    }
    setWaitSaving(false);
    setWaitAsking(false);
  };

  // the success note fades after a while
  useEffect(() => {
    if (!waitSaved) return undefined;
    const t = setTimeout(() => setWaitSaved(null), 15000);
    return () => clearTimeout(t);
  }, [waitSaved]);

  // Keep chiming until every new order has been accepted.
  const unacceptedCount = orders.filter((o) => !o.acceptedAt && !completing[o.id]).length;
  useEffect(() => {
    if (!unacceptedCount || !alertsEnabled) return undefined;
    const id = setInterval(() => playNewOrderChime(), RING_EVERY_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unacceptedCount, alertsEnabled]);

  // Due time = the order's pickup / delivery time.
  const dueMs = (o) => toMs(o.pickupTime) ?? (toMs(o.createdAt) || 0) + 20 * 60000;
  const visible = orders.filter((o) => !completing[o.id]);
  const isLater = (o) => o.orderTiming === "later" && dueMs(o) - now > LATER_AFTER_MS;
  const byDue = (a, b) => dueMs(a) - dueMs(b);
  const nowOrders = visible.filter((o) => !isLater(o)).sort(byDue);
  const laterOrders = visible.filter(isLater).sort(byDue);

  const renderCard = (order) => {
            const scheduledLabel = formatScheduled(order);
            const accepted = !!order.acceptedAt;
            // due-time timer: green, then amber in the last 5 min, red when late
            const leftMin = Math.round((dueMs(order) - now) / 60000);
            const placedMin = toMs(order.createdAt) ? Math.max(0, Math.round((now - toMs(order.createdAt)) / 60000)) : null;
            const timerState = leftMin < 0 ? "late" : leftMin <= 5 ? "soon" : "ok";
            const timerText =
              leftMin < 0 ? `${-leftMin} min late` : leftMin === 0 ? "Due now" : `Due in ${leftMin} min`;
            return (
            <article
              key={order.id}
              className={`order-card ${scheduledLabel ? "order-card--scheduled" : ""} ${
                newOrderIds.has(order.id) ? "order-card--new" : ""
              } ${accepted ? "" : "order-card--unaccepted"}`}
            >
              {!accepted && (
                <button type="button" className="accept-btn" onClick={() => acceptOrder(order.id)}>
                  New Order: Tap to Accept
                </button>
              )}
              <div className={`order-timer order-timer--${timerState}`}>
                <span className="order-timer__due">{timerText}</span>
                {placedMin != null && <span className="order-timer__placed">Placed {placedMin} min ago</span>}
              </div>
              <div className="order-card__top">
                <div>
                  <div className="order-name">{order.contact?.name || "N/A"}</div>
                  <div className="order-phone">{order.contact?.phone || "N/A"}</div>
                </div>
                <div className="order-badges">
                  <span className="order-service">{order.serviceMethod || "N/A"}</span>
                  {/* So staff never charge a customer who already paid online */}
                  <span className={`order-pay${order.paid ? " order-pay--paid" : ""}`}>
                    {order.paid ? "Paid Online" : order.serviceMethod === "Delivery" ? "Pay at Door" : "Pay at Store"}
                  </span>
                  {order.delivery?.minutes != null && (
                    <span className="order-drive">
                      {order.delivery.minutes} min drive{order.delivery.km ? `, ${order.delivery.km} km` : ""}
                    </span>
                  )}
                </div>
              </div>

              {scheduledLabel ? (
                <div className="order-timing order-timing--scheduled">
                  <span className="order-timing__badge">SCHEDULED</span>
                  <span className="order-timing__value">{scheduledLabel}</span>
                </div>
              ) : (
                <div className="order-timing order-timing--asap">
                  <span className="order-timing__badge">ASAP</span>
                </div>
              )}

              <ul className="order-items">
                {(order.items || []).map((it, i) => (
                  <li key={i}>
                    <span className="order-items__qty">{it.qty || 1}×</span>
                    {describeItem(it)}
                    {it.type === "combo" && it.meta?.items && (
                      <ul className="order-items__combo-children">
                        {Object.entries(it.meta.items).map(([key, child]) => (
                          <li key={key}>
                            <strong>{comboItemLabel(key)}:</strong>{" "}
                            {child?.summary || "Not customized yet"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              <div className="order-card__meta">
                <span>
                  Placed {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : "N/A"}
                </span>
                {!scheduledLabel && order.pickupTime?.toDate && (
                  <span>Pickup {order.pickupTime.toDate().toLocaleTimeString()}</span>
                )}
              </div>

              <div className="order-card__footer">
                <div className="order-total">
                  {order.totalCents != null ? formatMoney(order.totalCents) : "N/A"}
                </div>
                <div className="order-card__actions">
                  <button className="print-btn" onClick={() => setPrintingOrder(order)}>
                    🖨️ Print Receipt
                  </button>
                  <button className="complete-btn" onClick={() => startComplete(order)}>
                    Mark Completed
                  </button>
                </div>
              </div>
            </article>
            );
  };

  if (!authChecked || !isStaff) {
    return (
      <div className="kitchen">
        <p style={{ padding: 24 }}>Checking staff login…</p>
      </div>
    );
  }

  return (
    <div className="kitchen">
      <header className="kitchen-header">
        <div className="kitchen-header__inner">
          <h1>Kitchen Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="kitchen-count">
              {visible.length} order{visible.length === 1 ? "" : "s"} open
            </span>
            {alertsEnabled ? (
              <span className="kitchen-alerts kitchen-alerts--on">🔔 Alerts On</span>
            ) : (
              <button className="kitchen-alerts kitchen-alerts--off" onClick={enableAlerts}>
                🔔 Enable Order Alerts
              </button>
            )}
            <button className="kitchen-logout" onClick={() => setShowPast(true)}>
              Past Orders
            </button>
            <button
              className="kitchen-logout"
              onClick={() => signOut(auth).then(() => router.push("/kitchen-login"))}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="kitchen-body">
        {/* Wait times customers see; can only go up from 20 / 45 min */}
        <div className="wait-panel">
          <span className="wait-panel__title">Wait times customers see:</span>
          {[
            ["carryout", "Carryout"],
            ["delivery", "Delivery"],
          ].map(([key, label]) => (
            <div key={key} className="wait-ctl">
              <span className="wait-ctl__label">{label}</span>
              <button
                type="button"
                onClick={() => changeWait(key, -WAIT_STEP)}
                disabled={shownWait[key] <= MIN_WAIT[key]}
                aria-label={`Shorter ${label} time`}
              >
                −
              </button>
              <span className={`wait-ctl__value${waitDraft && waitDraft[key] !== waitTimes[key] ? " is-changed" : ""}`}>
                {shownWait[key]} min
              </span>
              <button type="button" onClick={() => changeWait(key, WAIT_STEP)} aria-label={`Longer ${label} time`}>
                +
              </button>
            </div>
          ))}
          <div className="wait-panel__actions">
            {waitDirty && !waitAsking && (
              <>
                <button type="button" className="wait-cancel" onClick={() => setWaitDraft(null)}>
                  Cancel
                </button>
                <button type="button" className="wait-confirm" onClick={() => setWaitAsking(true)}>
                  Confirm
                </button>
              </>
            )}
            {waitDirty && waitAsking && (
              <div className="wait-ask">
                <span>
                  Change to {waitDraft.carryout} min carryout and {waitDraft.delivery} min delivery? Customers see it right
                  away.
                </span>
                <button type="button" className="wait-cancel" onClick={() => setWaitAsking(false)} disabled={waitSaving}>
                  No
                </button>
                <button type="button" className="wait-confirm" onClick={saveWait} disabled={waitSaving}>
                  {waitSaving ? "Saving..." : "Yes, Change It"}
                </button>
              </div>
            )}
          </div>
          {(waitSaved || waitError || waitDirty) && (
            <div className="wait-panel__msg">
              {waitError ? (
                <span className="wait-panel__error">{waitError}</span>
              ) : waitSaved ? (
                <span className="wait-panel__ok">✓ {waitSaved}</span>
              ) : (
                <span className="wait-panel__pending">Not changed yet. Tap Confirm to change it on the site.</span>
              )}
            </div>
          )}
        </div>
        <KitchenHealth
          ordersError={ordersError}
          fromCacheSince={fromCacheSince}
          alertsEnabled={alertsEnabled}
          audioCtxRef={audioCtxRef}
          onEnableAlerts={enableAlerts}
        />
        {ordersError && (
          <p className="kitchen-error">
            ⚠ Couldn't load live orders ({ordersError}). This dashboard needs a Firestore
            index on "orders" for completed + createdAt — check the Firebase console, or
            reload once it's fixed.
          </p>
        )}
        {!ordersError && orders.length === 0 && <p className="kitchen-empty">No orders yet.</p>}

        <div className="kitchen-grid">
          {nowOrders.map((order) => renderCard(order))}
        </div>

        {laterOrders.length > 0 && (
          <section className="kitchen-later">
            <h2>Later ({laterOrders.length})</h2>
            <p>Scheduled orders. Each one moves up to the main list 30 minutes before it's due.</p>
            <div className="kitchen-grid">{laterOrders.map((order) => renderCard(order))}</div>
          </section>
        )}
      </main>

      <KitchenPastOrders
        open={showPast}
        onClose={() => setShowPast(false)}
        describeItem={describeItem}
        onPrint={(o) => setPrintingOrder(o)}
      />

      {/* "Undo" for Mark Completed (it only saves after UNDO_MS) */}
      {Object.keys(completing).length > 0 && (
        <div className="undo-stack">
          {Object.entries(completing).map(([id, c]) => (
            <div key={id} className="undo-bar">
              <span>Order for {c.name} completed.</span>
              <button type="button" onClick={() => undoComplete(id)}>
                Undo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden on screen; shown (and isolated) only inside @media print
          below, for the one order the staff clicked "Print Receipt" on —
          see printingOrder's effect, which triggers window.print(). This is
          the manual fallback until a real networked kitchen printer is set
          up; see the project notes for the recommended hardware. */}
      {printingOrder && (
        <div className="print-receipt">
          <h2>Red Stone Pizza</h2>
          <p>576 Concession Street, 905-385-9888</p>
          <hr />
          <p>
            Order: {printingOrder.id}
            <br />
            Placed:{" "}
            {printingOrder.createdAt?.toDate
              ? printingOrder.createdAt.toDate().toLocaleString()
              : "N/A"}
            <br />
            Service: {printingOrder.serviceMethod || "N/A"}
            {formatScheduled(printingOrder) ? (
              <>
                <br />
                Scheduled: {formatScheduled(printingOrder)}
              </>
            ) : null}
          </p>
          <hr />
          <p>
            {printingOrder.contact?.name || "N/A"}
            <br />
            {printingOrder.contact?.phone || "N/A"}
          </p>
          <hr />
          <ul>
            {(printingOrder.items || []).map((it, i) => (
              <li key={i}>
                {it.qty || 1}× {describeItem(it)}
                {it.type === "combo" && it.meta?.items && (
                  <ul>
                    {Object.entries(it.meta.items).map(([key, child]) => (
                      <li key={key}>
                        {comboItemLabel(key)}: {child?.summary || "Not customized yet"}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <hr />
          <p className="print-receipt__total">
            Total: {printingOrder.totalCents != null ? formatMoney(printingOrder.totalCents) : "N/A"}
          </p>
          <p className="print-receipt__total">
            {printingOrder.paid
              ? "PAID ONLINE"
              : printingOrder.serviceMethod === "Delivery"
              ? "PAY AT DOOR"
              : "PAY AT STORE"}
          </p>
        </div>
      )}

      {/* global: the order cards are drawn by renderCard(), outside this
          JSX, so scoped styles wouldn't reach them. All names are kitchen-only. */}
      <style jsx global>{`
        /* ---- wait times ---- */
        .wait-panel {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 18px;
          margin: 0 0 12px;
          padding: 10px 14px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #ddd;
          font-family: var(--font-plain);
        }
        .wait-panel__title { font-weight: 700; font-size: 16px; }
        .wait-ctl { display: flex; align-items: center; gap: 8px; }
        .wait-ctl__label { font-weight: 600; font-size: 16px; }
        .wait-ctl button {
          width: 40px; height: 40px; border-radius: 50%; border: 0;
          background: #111; color: #fff; font-size: 22px; line-height: 1; cursor: pointer;
        }
        .wait-ctl button:disabled { background: #ccc; cursor: not-allowed; }
        .wait-ctl__value { min-width: 64px; text-align: center; font-weight: 800; font-size: 18px; }
        .wait-panel__error { color: #c62828; font-weight: 700; }
        .wait-ctl__value.is-changed { color: #e31837; }
        .wait-panel__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .wait-confirm, .wait-cancel {
          padding: 9px 18px; border-radius: 8px; font: inherit; font-size: 16px; font-weight: 800; cursor: pointer;
        }
        .wait-confirm { border: 0; background: #1b7a3a; color: #fff; }
        .wait-cancel { border: 1px solid #999; background: #fff; color: #222; }
        .wait-confirm:disabled, .wait-cancel:disabled { opacity: 0.6; cursor: default; }
        .wait-ask {
          display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
          padding: 8px 10px; border-radius: 8px; background: #fff4d6; border: 1px solid #e0b400;
          font-size: 15px; font-weight: 700;
        }
        .wait-panel__msg { flex-basis: 100%; font-size: 15px; }
        .wait-panel__ok { color: #1b7a3a; font-weight: 700; }
        .wait-panel__pending { color: #8a5a00; font-weight: 600; }

        /* ---- accept ---- */
        .order-card--unaccepted {
          box-shadow: 0 0 0 4px #e31837, 0 6px 18px rgba(227, 24, 55, 0.35) !important;
        }
        .accept-btn {
          display: block;
          width: 100%;
          margin: 0 0 10px;
          padding: 14px;
          border: 0;
          border-radius: 8px;
          background: #e31837;
          color: #fff;
          font-family: var(--font-plain);
          font-size: 20px;
          font-weight: 800;
          cursor: pointer;
          animation: accept-pulse 1.2s ease-in-out infinite;
        }
        @keyframes accept-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.25); }
        }

        /* ---- due timer ---- */
        .order-timer {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          margin: 0 0 10px;
          padding: 8px 12px;
          border-radius: 8px;
          font-family: var(--font-plain);
        }
        .order-timer__due { font-size: 20px; font-weight: 800; }
        .order-timer__placed { font-size: 15px; font-weight: 600; opacity: 0.85; }
        .order-timer--ok { background: #e8f5e9; color: #1b5e20; }
        .order-timer--soon { background: #ffe08a; color: #4a3200; }
        .order-timer--late { background: #c62828; color: #fff; }

        /* ---- later section ---- */
        .kitchen-later { margin-top: 28px; padding-top: 16px; border-top: 3px dashed #bbb; }
        .kitchen-later h2 { margin: 0 0 4px; font-family: var(--font-plain); font-size: 22px; }
        .kitchen-later p { margin: 0 0 12px; color: #555; font-family: var(--font-plain); }

        /* ---- undo ---- */
        .undo-stack {
          position: fixed;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: min(560px, calc(100% - 24px));
        }
        .undo-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #222;
          color: #fff;
          font-family: var(--font-plain);
          font-size: 17px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }
        .undo-bar button {
          padding: 8px 18px;
          border: 0;
          border-radius: 6px;
          background: #ffd54f;
          color: #222;
          font-weight: 800;
          font-size: 17px;
          cursor: pointer;
        }

        .kitchen {
          min-height: 100vh;
          background: #f1f2f4;
          /* Kitchen screens stay in the device's plain, very legible font
             (not the brand font): every font name points at it in here. */
          --font-body: var(--font-plain);
          --font-face: var(--font-plain);
          --font-text: var(--font-plain);
          --font-display-text: var(--font-plain);
          --font-heading: var(--font-plain);
          --font-display: var(--font-plain);
          font-family: var(--font-plain);
        }
        .kitchen-header {
          background: #000000;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        .kitchen-header__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .kitchen-header h1 {
          margin: 0;
          font-family: var(--font-heading, "Oswald", sans-serif);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-size: 1.4rem;
        }
        .kitchen-count {
          font-size: 0.9rem;
          opacity: 0.9;
          font-weight: 600;
        }
        .kitchen-logout {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .kitchen-logout:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .kitchen-alerts {
          font-size: 0.85rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
        .kitchen-alerts--off {
          background: #c0392b;
          color: #fff;
          cursor: pointer;
          animation: alertPulse 1.6s ease-in-out infinite;
        }
        .kitchen-alerts--on {
          background: rgba(255, 255, 255, 0.12);
          color: #9be39b;
        }
        @keyframes alertPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.35); }
        }
        .kitchen-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .kitchen-empty {
          color: #777;
          font-size: 1rem;
        }
        .kitchen-error {
          background: #fdecea;
          border: 1px solid #f5c2c0;
          color: #a12622;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .kitchen-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .order-card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 2px solid transparent;
        }
        .order-card--scheduled {
          border-color: #f59e0b;
          background: #fffaf0;
        }
        .order-timing {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .order-timing__badge {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .order-timing--scheduled .order-timing__badge {
          background: #f59e0b;
          color: #fff;
        }
        .order-timing--scheduled .order-timing__value {
          font-weight: 800;
          color: #92400e;
          font-size: 0.9rem;
        }
        .order-timing--asap .order-timing__badge {
          background: #eef2f6;
          color: #555;
        }
        .order-card__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }
        .order-name {
          font-weight: 700;
          font-family: var(--font-heading, "Oswald", sans-serif);
        }
        .order-phone {
          font-size: 0.85rem;
          color: #666;
        }
        .order-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .order-pay {
          background: #fff3cd;
          color: #7a5b00;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .order-drive {
          font-size: 0.8rem;
          font-weight: 700;
          color: #333;
        }
        .order-pay--paid {
          background: #2e7d32;
          color: #fff;
        }
        .order-service {
          background: #e91e28;
          color: #fff;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 3px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        /* item details can run over several lines */
        .order-items li,
        .print-receipt li {
          white-space: pre-line;
        }
        .order-items {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.9rem;
          color: #222;
        }
        .order-items__qty {
          font-weight: 700;
          color: #000000;
          margin-right: 6px;
        }
        .order-items__combo-children {
          list-style: none;
          margin: 3px 0 0;
          padding: 0 0 0 18px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.82rem;
          color: #555;
        }
        .order-card__meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #888;
        }
        .order-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-top: 2px;
        }
        .order-total {
          font-weight: 800;
          font-size: 1.05rem;
          color: #111;
        }
        .complete-btn {
          background: #289c52;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: filter 0.12s ease;
        }
        .complete-btn:hover {
          filter: brightness(0.92);
        }
        .order-card--new {
          animation: newOrderFlash 1s ease-in-out 5;
        }
        @keyframes newOrderFlash {
          0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
          50% { box-shadow: 0 0 0 4px #c0392b; }
        }
        .order-card__actions {
          display: flex;
          gap: 8px;
        }
        .print-btn {
          background: #fff;
          color: #333;
          border: 1px solid #ccc;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #f5f5f5;
        }
        .print-receipt {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt,
          .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 12px;
            font-family: "Courier New", monospace;
            font-size: 13px;
          }
          .print-receipt h2 {
            text-align: center;
            margin: 0 0 4px;
          }
          .print-receipt__total {
            font-weight: 800;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}
