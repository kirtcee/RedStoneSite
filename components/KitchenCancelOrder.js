// components/KitchenCancelOrder.js
//
// "Cancel Order" on a kitchen ticket. Tap it, pick a reason, then confirm.
// pages/api/cancelOrder.js does the rest: refunds a card order in full,
// marks the order cancelled (it leaves the board) and emails the customer.
import { useState } from "react";
import { auth } from "../utils/firebaseConfig";
import { CANCEL_REASONS } from "../utils/cancelReasons";
import { formatMoney } from "./Pricing";

export default function KitchenCancelOrder({ order }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const paidOnline = order.paid && order.paymentMethod === "card";

  const close = () => {
    setOpen(false);
    setReason(null);
    setError(null);
  };

  const confirm = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/cancelOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, orderId: order.id, reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setError(
          String(body.reason || "").startsWith("refund_failed")
            ? "The refund didn't go through, so the order was NOT cancelled. Try again, or refund it in Stripe."
            : `Couldn't cancel (${body.reason || `error ${res.status}`}). Check the connection and try again.`
        );
        return;
      }
      // success: the order leaves the board on its own (it's now completed)
    } catch {
      setError("Couldn't cancel. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="kc-open" onClick={() => setOpen(true)}>
        Cancel Order
        <style jsx>{`
          .kc-open {
            padding: 8px 12px;
            border: 1px solid #c62828;
            border-radius: 6px;
            background: #fff;
            color: #c62828;
            font: inherit;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
      </button>
    );
  }

  return (
    <div className="kc">
      <div className="kc-title">Cancel this order? Why?</div>
      <div className="kc-reasons">
        {CANCEL_REASONS.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`kc-reason${reason === r.key ? " is-on" : ""}`}
            onClick={() => setReason(r.key)}
            disabled={busy}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="kc-note">
        {paidOnline
          ? `Paid online: ${formatMoney(order.totalCents || 0)} will be refunded to their card automatically.`
          : "Not paid yet: nothing to refund."}{" "}
        {order.contact?.email ? "The customer gets an email." : "No email on this order, so call the customer."}
      </div>
      {error && <div className="kc-err">{error}</div>}
      <div className="kc-btns">
        <button type="button" className="kc-no" onClick={close} disabled={busy}>
          Keep Order
        </button>
        <button type="button" className="kc-yes" onClick={confirm} disabled={!reason || busy}>
          {busy ? "Cancelling..." : paidOnline ? "Cancel and Refund" : "Cancel Order"}
        </button>
      </div>
      <style jsx>{`
        .kc {
          flex-basis: 100%;
          margin-top: 10px;
          padding: 12px;
          border: 2px solid #c62828;
          border-radius: 8px;
          background: #fff5f5;
          font-size: 15px;
        }
        .kc-title {
          margin-bottom: 8px;
          font-weight: 800;
          font-size: 16px;
        }
        .kc-reasons {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .kc-reason {
          padding: 8px 10px;
          border: 1px solid #999;
          border-radius: 6px;
          background: #fff;
          color: #222;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }
        .kc-reason.is-on {
          border-color: #c62828;
          background: #c62828;
          color: #fff;
        }
        .kc-note {
          margin-top: 8px;
          color: #444;
        }
        .kc-err {
          margin-top: 8px;
          color: #c62828;
          font-weight: 700;
        }
        .kc-btns {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
        .kc-no,
        .kc-yes {
          padding: 8px 14px;
          border-radius: 6px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        .kc-no {
          border: 1px solid #999;
          background: #fff;
          color: #222;
        }
        .kc-yes {
          border: 0;
          background: #c62828;
          color: #fff;
        }
        .kc-yes:disabled,
        .kc-no:disabled,
        .kc-reason:disabled {
          opacity: 0.5;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
