// pages/order-confirmation.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../utils/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { formatMoney, priceLineItem } from "../components/Pricing";

function getNameAndSubtitle(item) {
  if (item.type === "pizza-byo") {
    const name = item.pizzaName || "Custom Pizza";
    const toppings =
      Array.isArray(item.toppings) && item.toppings.length
        ? item.toppings.join(", ")
        : "No toppings";
    const sizeLabel = item.size ? `${item.size}"` : "";
    const subtitle = item.summary || `${sizeLabel} ${item.crust || ""} – ${toppings}`;
    return { name, subtitle };
  }
  if (item.type === "pizza-specialty") {
    const sizeLabel =
      ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(item.size)] ||
        `${item.size}"`);
    const name = item.name || "Specialty Pizza";
    const subtitle = `${sizeLabel}${item.crust ? ` • ${item.crust}` : ""}`;
    return { name, subtitle };
  }
  if (item.type === "wings") return { name: `${item.count} Wings`, subtitle: item.sauce || "" };
  if (item.type === "side") return { name: item.name || "Side", subtitle: "Side item" };
  if (item.type === "special") return { name: item.name || "Special", subtitle: "Special menu item" };
  if (item.type === "combo") return { name: "Combo", subtitle: item.comboId || "Deal" };
  return { name: item.summary || "Item", subtitle: "" };
}

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder(docSnap.data());
        } else {
          setOrder(null);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="container" style={{ padding: "32px 0" }}>
        <p>Loading your order...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="container" style={{ padding: "32px 0" }}>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <p>Order not found. Please call the store.</p>
          <Link href="/menu" style={{ color: "#0b61d6", textDecoration: "none" }}>
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const pickupTime = order.pickupTime?.toDate
    ? order.pickupTime.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const fees = order.fees || {};

  const redHeader = (title) => (
    <div style={{ background: "#E91E28", color: "white", padding: "0.6rem 0.9rem", fontWeight: "bold" }}>
      {title}
    </div>
  );

  return (
    <main className="container" style={{ padding: "16px 0 32px" }}>
      <h1 className="page-title" style={{ margin: "0 0 4px", textTransform: "uppercase" }}>
        Order Confirmed
      </h1>
      <p style={{ color: "#289c52", fontWeight: 700, margin: "0 0 16px" }}>
        Thank you for ordering from Red Stone Pizza!
      </p>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="card" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
          {redHeader("Order Details")}
          <div style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ color: "#666" }}>Name:</div>
              <div style={{ fontWeight: 700 }}>{order.contact?.name || "—"}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ color: "#666" }}>Phone:</div>
              <div style={{ fontWeight: 700 }}>{order.contact?.phone || "—"}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ color: "#666" }}>Service Method:</div>
              <div style={{ fontWeight: 700 }}>{order.serviceMethod || "—"}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ color: "#666" }}>Location:</div>
              <div style={{ fontWeight: 700, textAlign: "right" }}>{order.location || "—"}</div>
            </div>
            {order.orderTiming === "Later" && order.schedule?.date && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ color: "#666" }}>Scheduled For:</div>
                <div style={{ fontWeight: 700 }}>
                  {order.schedule.date} {order.schedule.time}
                </div>
              </div>
            )}
            {pickupTime && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ color: "#666" }}>Estimated Ready Time:</div>
                <div style={{ fontWeight: 700 }}>{pickupTime}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {redHeader("Items")}
          <div style={{ padding: "0.75rem" }}>
            {items.map((it, i) => {
              const { name, subtitle } = getNameAndSubtitle(it);
              const lineCents = priceLineItem(it);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {name} <span style={{ fontWeight: 400, color: "#777" }}>× {it.qty || 1}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#555" }}>{it.summary || subtitle}</div>
                  </div>
                  <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatMoney(lineCents)}</div>
                </div>
              );
            })}

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>Food &amp; Beverage:</div>
                <div style={{ fontWeight: 700 }}>{formatMoney(order.subtotalCents || 0)}</div>
              </div>
              {order.serviceMethod === "Delivery" && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>Delivery:</div>
                  <div style={{ fontWeight: 700 }}>{formatMoney(fees.deliveryCents || 0)}</div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>Taxes:</div>
                <div style={{ fontWeight: 700 }}>{formatMoney(fees.taxCents || 0)}</div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                <div>Order Total:</div>
                <div>{formatMoney(order.totalCents || 0)}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/menu" style={{ color: "#0b61d6", textDecoration: "none", fontWeight: 700 }}>
            Order Something Else
          </Link>
        </div>
      </div>
    </main>
  );
}
