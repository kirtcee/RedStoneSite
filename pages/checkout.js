// pages/checkout.js
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "../components/CartSystem";
import { priceLineItem, formatMoney } from "../components/Pricing";
import { saveOrder } from "../utils/saveOrder";

const TAX_RATE = 0.13;
const DELIVERY_FEE_CENTS = 499;

function describeItem(item) {
  if (!item) return "";
  if (item.type === "pizza-byo") {
    const toppings = Array.isArray(item.toppings) ? item.toppings.join(", ") : "";
    const size = item.size ? `${item.size}"` : "";
    return [size, item.crust, toppings].filter(Boolean).join(" — ");
  }
  if (item.type === "pizza-specialty") {
    const sizeLabel =
      ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(item.size)] ||
        `${item.size}"`);
    return [sizeLabel, item.crust].filter(Boolean).join(" • ");
  }
  if (item.type === "wings") return `${item.count}-piece — ${item.sauce || ""}`;
  if (item.type === "side") return item.name || "Side";
  if (item.type === "special") return item.name || "Special";
  if (item.type === "combo") return item.comboId || "Combo";
  return item.summary || "";
}

function itemTitle(item) {
  return (
    item?.name ||
    item?.summary ||
    (item?.type === "pizza-byo" ? "Build Your Own Pizza" : "Menu Item")
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const items = cart?.items || [];

  const [serviceMethod, setServiceMethod] = useState("Carryout");
  const [orderTiming, setOrderTiming] = useState("Now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showHours, setShowHours] = useState(false);
  const [promo, setPromo] = useState("");
  const [location, setLocation] = useState("Red Stone Pizza — Hamilton (Main St)");
  const [changingLoc, setChangingLoc] = useState(false);
  const [newLoc, setNewLoc] = useState(location);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + priceLineItem(it), 0),
    [items]
  );
  const deliveryCents = serviceMethod === "Delivery" ? DELIVERY_FEE_CENTS : 0;
  const taxCents = Math.round((subtotalCents + deliveryCents) * TAX_RATE);
  const totalCents = subtotalCents + deliveryCents + taxCents;

  const openHoursForDate = (yyyyMmDd) => {
    if (!yyyyMmDd) return null;
    const d = new Date(yyyyMmDd + "T00:00:00");
    const dow = d.getDay();
    if (dow === 0) return { open: "12:00", close: "21:00" };
    return { open: "11:00", close: "22:00" };
  };
  const hours = openHoursForDate(scheduleDate) || { open: "11:00", close: "22:00" };

  const canPlaceOrder =
    items.length > 0 &&
    contactName.trim().length > 0 &&
    contactPhone.trim().length > 0 &&
    !placing;

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) return;
    setPlacing(true);
    setError(null);

    const orderData = {
      items,
      serviceMethod,
      orderTiming,
      schedule:
        orderTiming === "Later"
          ? { date: scheduleDate, time: scheduleTime }
          : { date: null, time: null },
      location,
      contact: { name: contactName.trim(), phone: contactPhone.trim() },
      fees: { deliveryCents, taxCents },
      subtotalCents,
      totalCents,
      promo: promo || null,
    };

    const id = await saveOrder(orderData);
    setPlacing(false);

    if (!id) {
      setError("Something went wrong placing your order. Please try again.");
      return;
    }

    cart?.clearCart?.();
    router.push(`/order-confirmation?orderId=${id}`);
  };

  const redHeader = (title) => (
    <div
      style={{
        background: "#E91E28",
        color: "white",
        padding: "0.6rem 0.9rem",
        fontWeight: "bold",
      }}
    >
      {title}
    </div>
  );

  return (
    <main className="page page--checkout">
      <div className="container" style={{ padding: "16px 0 32px" }}>
        <h1 className="page-title" style={{ margin: "0 0 16px", textTransform: "uppercase" }}>
          Checkout
        </h1>

        {items.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            Your cart is empty.{" "}
            <Link href="/menu" style={{ color: "#0b61d6", textDecoration: "none" }}>
              Browse the menu
            </Link>
            .
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.9fr) 360px",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            {/* LEFT COLUMN: contact + order summary */}
            <div>
              <div className="card" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
                {redHeader("Contact Information")}
                <div style={{ padding: 12, display: "grid", gap: 10 }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>
                      Name *
                    </span>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                      style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>
                      Phone *
                    </span>
                    <input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone number"
                      style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                    />
                  </label>
                </div>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {redHeader("Order Summary")}
                <div style={{ padding: "0.75rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ color: "#666", fontSize: 13 }}>
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </div>
                    <Link
                      href="/cart"
                      style={{ color: "#0b61d6", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
                    >
                      Edit Cart
                    </Link>
                  </div>

                  {items.map((it) => {
                    const lineCents = priceLineItem(it);
                    return (
                      <div
                        key={it.id}
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
                            {itemTitle(it)}{" "}
                            <span style={{ fontWeight: 400, color: "#777" }}>× {it.qty || 1}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#555" }}>
                            {it.summary || describeItem(it)}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                          {formatMoney(lineCents)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: order settings / totals / place order */}
            <aside style={{ position: "sticky", top: 16 }}>
              <div style={{ background: "#f8f8f8" }}>
                {redHeader("Review Order Settings")}

                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>My Location</div>
                    <button
                      onClick={() => setChangingLoc((v) => !v)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0b61d6",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      CHANGE
                    </button>
                  </div>

                  {!changingLoc ? (
                    <div style={{ marginTop: 4 }}>{location}</div>
                  ) : (
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <input
                        value={newLoc}
                        onChange={(e) => setNewLoc(e.target.value)}
                        style={{ flex: 1, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}
                        placeholder="Enter address or postal code"
                      />
                      <button
                        onClick={() => {
                          setLocation(newLoc || location);
                          setChangingLoc(false);
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: 16, fontWeight: 700 }}>Service Method</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                    {["Carryout", "Delivery"].map((opt) => (
                      <label
                        key={opt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "white",
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      >
                        <input
                          type="radio"
                          name="serviceMethod"
                          checked={serviceMethod === opt}
                          onChange={() => setServiceMethod(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>

                  <div style={{ marginTop: 16, fontWeight: 700 }}>Order Timing</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                    {["Now", "Later"].map((opt) => (
                      <label
                        key={opt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "white",
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      >
                        <input
                          type="radio"
                          name="orderTiming"
                          checked={orderTiming === opt}
                          onChange={() => setOrderTiming(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>

                  {orderTiming === "Later" && (
                    <div
                      style={{
                        marginTop: 10,
                        background: "white",
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span role="img" aria-label="calendar">📅</span>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          min={hours.open}
                          max={hours.close}
                          step={300}
                          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                        />
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                        Available hours for selected day: {hours.open}–{hours.close}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowHours((v) => !v)}
                    style={{
                      marginTop: 8,
                      background: "none",
                      border: "none",
                      color: "#0b61d6",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    View Store Hours
                  </button>
                  {showHours && (
                    <div style={{ marginTop: 6, fontSize: 13, color: "#333", lineHeight: 1.4 }}>
                      Mon–Sat: 11:00–22:00
                      <br />
                      Sun: 12:00–21:00
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 12 }}>Have a coupon or promotion code?</div>
                      <input
                        value={promo}
                        onChange={(e) => setPromo(e.target.value)}
                        placeholder="e.g. SAVE-10"
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>Food &amp; Beverage:</div>
                      <div style={{ fontWeight: 700 }}>{formatMoney(subtotalCents)}</div>
                    </div>

                    {serviceMethod === "Delivery" && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>Delivery:</div>
                        <div style={{ fontWeight: 700 }}>{formatMoney(deliveryCents)}</div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>Taxes:</div>
                      <div style={{ fontWeight: 700 }}>{formatMoney(taxCents)}</div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 8,
                        fontWeight: 900,
                        fontSize: 18,
                      }}
                    >
                      <div>Order Total:</div>
                      <div>{formatMoney(totalCents)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                    Pay at {serviceMethod === "Delivery" ? "the door" : "pickup"} — online payment
                    isn&apos;t available yet.
                  </div>

                  {error && (
                    <div style={{ marginTop: 10, color: "#b00020", fontSize: 13, fontWeight: 600 }}>
                      {error}
                    </div>
                  )}

                  {!canPlaceOrder && !placing && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#b00020" }}>
                      Please enter your name and phone number to place the order.
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={!canPlaceOrder}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      padding: "0.9rem 1rem",
                      background: "#E91E28",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 800,
                      cursor: canPlaceOrder ? "pointer" : "not-allowed",
                      opacity: canPlaceOrder ? 1 : 0.6,
                    }}
                  >
                    {placing ? "Placing Order…" : "Place Order"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
