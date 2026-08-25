import { useEffect, useState } from "react";
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
  updateDoc
} from "firebase/firestore";
import { formatMoney } from "../components/Pricing";
import { STAFF_EMAIL } from "../utils/kitchenAuth";

function describeItem(item) {
  if (!item) return "Item";
  if (item.summary) return item.summary;
  if (item.type === "pizza-byo") {
    const toppings = Array.isArray(item.toppings) ? item.toppings.join(", ") : "";
    const size = item.size ? `${item.size}"` : "";
    return [size, item.crust, toppings].filter(Boolean).join(" — ") || "Build Your Own Pizza";
  }
  if (item.type === "pizza-specialty") return item.name || "Specialty Pizza";
  if (item.type === "wings") return `${item.count} Wings — ${item.sauce || ""}`;
  if (item.type === "side") return item.name || "Side";
  if (item.type === "special") return item.name || "Special";
  if (item.type === "combo") return item.comboId || "Combo";
  return "Item";
}

export default function KitchenDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(liveOrders);
    });

    return () => unsubscribe();
  }, [isStaff]);

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
          <h1>🍕 Kitchen Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="kitchen-count">
              {orders.length} order{orders.length === 1 ? "" : "s"} open
            </span>
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
        {orders.length === 0 && <p className="kitchen-empty">No orders yet.</p>}

        <div className="kitchen-grid">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card__top">
                <div>
                  <div className="order-name">{order.contact?.name || "N/A"}</div>
                  <div className="order-phone">{order.contact?.phone || "N/A"}</div>
                </div>
                <span className="order-service">{order.serviceMethod || "N/A"}</span>
              </div>

              <ul className="order-items">
                {(order.items || []).map((it, i) => (
                  <li key={i}>
                    <span className="order-items__qty">{it.qty || 1}×</span>
                    {describeItem(it)}
                  </li>
                ))}
              </ul>

              <div className="order-card__meta">
                <span>
                  Placed {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : "—"}
                </span>
                {order.pickupTime?.toDate && (
                  <span>Pickup {order.pickupTime.toDate().toLocaleTimeString()}</span>
                )}
              </div>

              <div className="order-card__footer">
                <div className="order-total">
                  {order.totalCents != null ? formatMoney(order.totalCents) : "N/A"}
                </div>
                <button
                  className="complete-btn"
                  onClick={async () => {
                    const orderRef = doc(db, "orders", order.id);
                    await updateDoc(orderRef, { completed: true });
                  }}
                >
                  Mark Completed
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <style jsx>{`
        .kitchen {
          min-height: 100vh;
          background: #f1f2f4;
          font-family: var(--font-body, "Inter", sans-serif);
        }
        .kitchen-header {
          background: #006491;
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
        .kitchen-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .kitchen-empty {
          color: #777;
          font-size: 1rem;
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
          color: #006491;
          margin-right: 6px;
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
      `}</style>
    </div>
  );
}
