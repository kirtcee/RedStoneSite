// components/KitchenSoldOut.js
//
// Kitchen screen: mark items sold out (or back in stock). One tap switches
// an item; the website greys it out within seconds and won't let customers
// add it, and the server refuses orders with it. Saved to settings/menu
// (utils/availability.js).
import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import useSoldOut from "../hooks/useSoldOut";
import { AVAILABILITY_GROUPS, availabilityLabel } from "../utils/availability";

export default function KitchenSoldOut() {
  const soldOut = useSoldOut();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(null); // key being saved
  const [error, setError] = useState(null);

  const toggle = async (key) => {
    const next = new Set(soldOut);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSaving(key);
    setError(null);
    try {
      await setDoc(doc(db, "settings", "menu"), { soldOut: [...next].sort(), updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn("Could not save sold-out list", err?.code);
      setError(
        err?.code === "permission-denied"
          ? "Couldn't save: publish the updated Firestore rules (see TODO.md)."
          : "Couldn't save. Check the connection and try again."
      );
    } finally {
      setSaving(null);
    }
  };

  const names = [...soldOut].map(availabilityLabel);

  return (
    <div className={`kso${names.length ? " kso--some" : ""}`}>
      <div className="kso-row">
        <span className="kso-title">Sold out:</span>
        <span className="kso-list">{names.length ? names.join(", ") : "Nothing. Everything is available."}</span>
        <button type="button" className="kso-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Done" : "Change"}
        </button>
      </div>
      {error && <div className="kso-err">{error}</div>}
      {open && (
        <div className="kso-groups">
          <div className="kso-help">Tap an item to mark it sold out. Tap again when it's back.</div>
          {AVAILABILITY_GROUPS.map((g) => (
            <div key={g.title} className="kso-group">
              <div className="kso-group__title">{g.title}</div>
              <div className="kso-chips">
                {g.items.map((it) => {
                  const out = soldOut.has(it.key);
                  return (
                    <button
                      key={it.key}
                      type="button"
                      className={`kso-chip${out ? " is-out" : ""}`}
                      onClick={() => toggle(it.key)}
                      disabled={!!saving}
                      aria-pressed={out}
                    >
                      {saving === it.key ? "Saving..." : out ? `${it.label}: SOLD OUT` : it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .kso {
          margin: 0 0 12px;
          padding: 10px 14px;
          border: 2px solid #ccc;
          border-radius: 8px;
          background: #fff;
          font-size: 16px;
        }
        .kso--some {
          border-color: #c62828;
        }
        .kso-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .kso-title {
          font-weight: 700;
        }
        .kso-list {
          flex: 1 1 200px;
          font-weight: 600;
        }
        .kso--some .kso-list {
          color: #c62828;
        }
        .kso-btn {
          padding: 8px 14px;
          border: 0;
          border-radius: 6px;
          background: #333;
          color: #fff;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        .kso-err {
          margin-top: 8px;
          color: #c62828;
          font-weight: 700;
        }
        .kso-groups {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        .kso-help {
          margin-bottom: 8px;
          color: #555;
        }
        .kso-group {
          margin-bottom: 10px;
        }
        .kso-group__title {
          margin-bottom: 6px;
          font-weight: 800;
        }
        .kso-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .kso-chip {
          padding: 8px 12px;
          border: 1px solid #999;
          border-radius: 999px;
          background: #fff;
          color: #222;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }
        .kso-chip.is-out {
          border-color: #c62828;
          background: #c62828;
          color: #fff;
        }
        .kso-chip:disabled {
          cursor: default;
        }
      `}</style>
    </div>
  );
}
