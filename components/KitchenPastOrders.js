// components/KitchenPastOrders.js
//
// The kitchen's "Past Orders" panel: completed orders, newest first, with a
// search box (customer name, phone number, or order number). For "where's
// my order?" calls and refunds. Each order can be opened to see its items,
// reprinted, or put back on the live board ("Reopen").
//
// Loads the latest 100 completed orders; "Load More" fetches 100 more.
// Uses the same Firestore index as the live board (completed + createdAt).
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { formatMoney } from "./Pricing";

const PAGE = 100;
const digits = (s) => String(s || "").replace(/\D/g, "");

function when(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "N/A";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function KitchenPastOrders({ open, onClose, describeItem, onPrint }) {
  const [count, setCount] = useState(PAGE);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    setLoading(true);
    const q = query(collection(db, "orders"), where("completed", "==", true), orderBy("createdAt", "desc"), limit(count));
    return onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Past orders failed", err);
        setError(err.message || "Couldn't load past orders.");
        setLoading(false);
      }
    );
  }, [open, count]);

  const results = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return orders;
    const td = digits(t);
    return orders.filter(
      (o) =>
        String(o.contact?.name || "").toLowerCase().includes(t) ||
        (td.length >= 3 && digits(o.contact?.phone).includes(td)) ||
        o.id.toLowerCase().includes(t)
    );
  }, [orders, search]);

  const reopen = async (o) => {
    if (!window.confirm(`Put the order for ${o.contact?.name || "this customer"} back on the live board?`)) return;
    try {
      await updateDoc(doc(db, "orders", o.id), { completed: false });
    } catch (err) {
      alert("Couldn't reopen the order. Check the connection and try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="po-backdrop" onClick={onClose}>
      <div className="po" role="dialog" aria-label="Past orders" onClick={(e) => e.stopPropagation()}>
        <div className="po-head">
          <h2>Past Orders</h2>
          <button type="button" className="po-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <input
          className="po-search"
          type="search"
          placeholder="Search by name, phone number or order number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="po-note">
          {loading
            ? "Loading..."
            : error
            ? error
            : `${results.length} of the last ${orders.length} completed orders`}
        </div>

        <div className="po-list">
          {results.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="po-row">
                <button type="button" className="po-row__main" onClick={() => setExpanded(isOpen ? null : o.id)}>
                  <span className="po-row__name">{o.contact?.name || "N/A"}</span>
                  <span className="po-row__phone">{o.contact?.phone || "N/A"}</span>
                  <span className="po-row__when">{when(o.createdAt)}</span>
                  <span className="po-row__svc">{o.serviceMethod || "N/A"}</span>
                  <span className={`po-row__pay${o.paid ? " is-paid" : ""}`}>{o.paid ? "Paid Online" : "Paid in Person"}</span>
                  <span className="po-row__total">{o.totalCents != null ? formatMoney(o.totalCents) : "N/A"}</span>
                  <span className="po-row__toggle" aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
                </button>
                {isOpen && (
                  <div className="po-row__more">
                    <div className="po-row__id">Order number: {o.id}</div>
                    {o.deliveryAddress && (
                      <div className="po-row__addr">
                        Deliver to:{" "}
                        {[
                          o.deliveryAddress.street,
                          o.deliveryAddress.suite ? `Unit ${o.deliveryAddress.suite}` : "",
                          o.deliveryAddress.city,
                          o.deliveryAddress.postal,
                        ]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </div>
                    )}
                    <ul>
                      {(o.items || []).map((it, i) => (
                        <li key={i}>
                          <strong>{it.qty || 1}×</strong> {describeItem(it)}
                        </li>
                      ))}
                    </ul>
                    <div className="po-row__btns">
                      <button type="button" onClick={() => onPrint(o)}>🖨️ Print Receipt</button>
                      <button type="button" onClick={() => reopen(o)}>Reopen</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && !error && orders.length >= count && (
          <button type="button" className="po-more" onClick={() => setCount((c) => c + PAGE)}>
            Load More
          </button>
        )}
      </div>

      <style jsx>{`
        .po-backdrop {
          position: fixed;
          inset: 0;
          z-index: 5000; /* above the site header */
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 24px 12px;
          background: rgba(0, 0, 0, 0.45);
          overflow-y: auto;
          font-family: var(--font-plain);
        }
        .po {
          width: min(980px, 100%);
          padding: 18px;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
        }
        .po-head { display: flex; justify-content: space-between; align-items: center; }
        .po-head h2 { margin: 0; font-size: 24px; }
        .po-close { border: 0; background: none; font-size: 26px; cursor: pointer; padding: 4px 8px; }
        .po-search {
          width: 100%;
          margin: 12px 0 6px;
          padding: 12px 14px;
          border: 2px solid #ccc;
          border-radius: 8px;
          font: inherit;
          font-size: 18px;
        }
        .po-search:focus { outline: none; border-color: #111; }
        .po-note { margin: 0 0 10px; color: #555; font-size: 15px; }
        .po-row { border-top: 1px solid #e5e5e5; }
        .po-row__main {
          display: grid;
          grid-template-columns: 1.4fr 1.2fr 1.4fr 0.8fr 1fr 0.7fr 20px;
          gap: 10px;
          align-items: center;
          width: 100%;
          padding: 12px 4px;
          border: 0;
          background: none;
          font: inherit;
          font-size: 16px;
          text-align: left;
          cursor: pointer;
        }
        .po-row__main:hover { background: #f6f6f6; }
        .po-row__name { font-weight: 700; }
        .po-row__when, .po-row__phone { color: #444; }
        .po-row__pay { font-size: 14px; color: #8a5a00; }
        .po-row__pay.is-paid { color: #1b7a3a; }
        .po-row__total { font-weight: 700; text-align: right; }
        .po-row__more { padding: 4px 8px 14px; font-size: 16px; }
        .po-row__id, .po-row__addr { color: #555; font-size: 15px; margin-bottom: 4px; }
        .po-row__more ul { margin: 8px 0; padding-left: 18px; }
        .po-row__btns { display: flex; gap: 10px; }
        .po-row__btns button, .po-more {
          padding: 9px 16px;
          border: 1px solid #111;
          border-radius: 8px;
          background: #fff;
          font: inherit;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .po-more { display: block; margin: 14px auto 0; }
        @media (max-width: 760px) {
          .po-row__main { grid-template-columns: 1fr auto 20px; }
          .po-row__phone, .po-row__svc, .po-row__pay { display: none; }
          .po-row__when { grid-column: 1 / 2; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
