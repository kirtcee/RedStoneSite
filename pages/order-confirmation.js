// pages/order-confirmation.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../utils/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { formatMoney, priceLineItem, describePizzaFull, describeByoPizzaTitle } from "../components/Pricing";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";

function getNameAndSubtitle(item) {
  if (item.type === "pizza-byo") {
    const name = item.pizzaName || describeByoPizzaTitle(item);
    return { name, subtitle: describePizzaFull(item) };
  }
  if (item.type === "pizza-specialty") {
    const sizeLabel =
      ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(item.size)] ||
        `${item.size}"`);
    const name = item.name || "Specialty Pizza";
    const subtitle = `${sizeLabel}${item.crust ? ` • ${item.crust}` : ""}`;
    return { name, subtitle };
  }
  if (item.type === "wings") {
    const dipBits = Object.entries(item.dips || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([k, v]) => `${k} × ${v}`);
    const subtitle = [item.sauce, item.serveStyle, dipBits.length ? `Dips: ${dipBits.join(", ")}` : ""]
      .filter(Boolean)
      .join(" • ");
    return { name: `${item.count} Wings`, subtitle };
  }
  if (item.type === "side") {
    // .name doubles as the priceSide() lookup key ("Onion Rings (Medium)",
    // an internal pricing label) — build the customer-facing name from the
    // raw .side/.size fields instead (see pages/cart.js's itemTitle).
    const name = item.side ? `${item.side}${item.size ? ` (${item.size})` : ""}` : item.name || "Side";
    return { name, subtitle: item.summary || "" };
  }
  if (item.type === "special") return { name: item.name || "Special", subtitle: item.summary || "" };
  if (item.type === "combo") return { name: comboNameFor(item.comboId), subtitle: "" };
  return { name: item.summary || "Item", subtitle: "" };
}

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // router.query isn't populated until the router finishes hydrating —
    // wait for that before deciding there's no orderId, so a real id in the
    // URL doesn't get mistaken for "not found" during that gap.
    if (!router.isReady) return;

    // Firestore doc IDs can't contain "/" and can't be "." or ".." — a URL
    // with anything else in orderId is never going to match a real order,
    // so treat it as "not found" immediately rather than issuing a lookup.
    const isPlausibleId =
      typeof orderId === "string" &&
      orderId.length > 0 &&
      orderId.length <= 1500 &&
      !orderId.includes("/") &&
      orderId !== "." &&
      orderId !== "..";

    if (!orderId || !isPlausibleId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setOrder(null);
        setLoading(false);
      }
    }, 15000);

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (cancelled) return;
        setOrder(docSnap.exists() ? docSnap.data() : null);
      } catch (error) {
        console.error("Error fetching order:", error);
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) {
          cancelled = true;
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    fetchOrder();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router.isReady, orderId]);

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>
        <p>Loading your order...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>
        <div style={{ background: "var(--menu-box-bg)", border: "1px solid var(--menu-box-border)", borderRadius: ".1875rem", padding: 24, textAlign: "center", color: "var(--text-brown)" }}>
          <p>Order not found. Please call the store.</p>
          <Link href="/menu" style={{ color: "var(--text-brown)", fontWeight: 700, textDecoration: "underline" }}>
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

  const sectionHeader = (title) => (
    <div style={{ background: "#000", color: "white", padding: "0.6rem 0.9rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".3px", fontFamily: "var(--font-heading, Oswald, sans-serif)" }}>
      {title}
    </div>
  );

  return (
    <main className="container" style={{ paddingTop: "16px", paddingBottom: "32px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="page-title" style={{ margin: "0 0 4px", textTransform: "uppercase" }}>
          Order Confirmed
        </h1>
        <p style={{ color: "#289c52", fontWeight: 700, margin: "0 0 16px" }}>
          Thank you for ordering from Red Stone Pizza!
        </p>

        <div style={{ marginBottom: 16, padding: 0, overflow: "hidden", background: "var(--menu-box-bg)", border: "1px solid var(--menu-box-border)", borderRadius: ".1875rem" }}>
          {sectionHeader("Order Details")}
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
            {order.orderTiming === "later" && order.schedule?.date && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ color: "#666" }}>Scheduled For:</div>
                <div style={{ fontWeight: 700 }}>
                  {order.schedule.date} {order.schedule.time}
                </div>
              </div>
            )}
            {pickupTime && order.orderTiming !== "later" && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ color: "#666" }}>Estimated Ready Time:</div>
                <div style={{ fontWeight: 700 }}>{pickupTime}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 0, overflow: "hidden", background: "var(--menu-box-bg)", border: "1px solid var(--menu-box-border)", borderRadius: ".1875rem" }}>
          {sectionHeader("Items")}
          <div style={{ padding: "0.75rem" }}>
            {items.map((it, i) => {
              const { name, subtitle } = getNameAndSubtitle(it);
              const lineCents = priceLineItem(it);
              const isCombo = it.type === "combo" && it.meta?.items;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--menu-box-border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {name} <span style={{ fontWeight: 400, color: "#777" }}>× {it.qty || 1}</span>
                    </div>
                    {isCombo ? (
                      <div style={{ marginTop: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                        {Object.entries(it.meta.items).map(([key, child]) => (
                          <div key={key} style={{ display: "flex", gap: 6, fontSize: 12, color: "#555" }}>
                            <span style={{ fontWeight: 700, color: "#333", flex: "0 0 auto" }}>
                              {comboItemLabel(key)}:
                            </span>
                            <span>{child?.summary || "Not customized yet"}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#555" }}>{subtitle}</div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatMoney(lineCents)}</div>
                </div>
              );
            })}

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--menu-box-border)" }}>
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
          <Link href="/menu" style={{ color: "var(--text-brown)", textDecoration: "underline", fontWeight: 700 }}>
            Order Something Else
          </Link>
        </div>
      </div>
    </main>
  );
}
