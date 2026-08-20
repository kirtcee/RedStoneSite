import { useEffect, useState } from "react";
import { db } from "../utils/firebaseConfig";
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

function describeItem(item) {
  if (!item) return "Item";
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
  return item.summary || "Item";
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
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
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🍕 Kitchen Dashboard</h1>
      {orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((order) => (
        <div key={order.id} style={{ border: "1px solid #ccc", padding: "1rem", margin: "1rem 0" }}>
          <p><strong>🧑 Name:</strong> {order.contact?.name || "N/A"}</p>
          <p><strong>📞 Phone:</strong> {order.contact?.phone || "N/A"}</p>
          <p><strong>🚗 Service:</strong> {order.serviceMethod || "N/A"}</p>
          <p><strong>🧾 Items:</strong></p>
          <ul style={{ marginTop: 0 }}>
            {(order.items || []).map((it, i) => (
              <li key={i}>
                {describeItem(it)} × {it.qty || 1}
              </li>
            ))}
          </ul>
          <p><strong>💵 Total:</strong> {order.totalCents != null ? formatMoney(order.totalCents) : "N/A"}</p>
          <p><strong>🕒 Time:</strong> {order.createdAt?.toDate().toLocaleTimeString()}</p>
          <p><strong>⏱️ Pickup Time:</strong> {order.pickupTime?.toDate().toLocaleTimeString()}</p>


          {/* ✅ The button is inside the .map() now */}
          <button
            onClick={async () => {
              const orderRef = doc(db, "orders", order.id);
              await updateDoc(orderRef, { completed: true });
            }}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Mark as Completed
          </button>
        </div>
      ))}
    </div>
  );
}
