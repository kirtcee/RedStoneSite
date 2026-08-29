// pages/checkout.js
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart, DealCodeEntry } from "../components/CartSystem";
import { priceLineItem, formatMoney, describePizzaFull, describeByoPizzaTitle } from "../components/Pricing";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";
import { dealNameFor, dealSlotLabel, findDealById } from "../utils/dealCatalog";
import { saveOrder } from "../utils/saveOrder";

const TAX_RATE = 0.13;
const DELIVERY_FEE_CENTS = 499;

// Recomputes from the item's raw fields rather than trusting a possibly
// stale stored `.summary` string, so formatting stays consistent even for
// items added before a summary-format change.
function describeItem(item) {
  if (!item) return "";
  if (item.type === "pizza-byo") return describePizzaFull(item);
  if (item.type === "pizza-specialty") {
    const sizeLabel =
      ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(item.size)] ||
        `${item.size}"`);
    return [sizeLabel, item.crust].filter(Boolean).join(" ");
  }
  if (item.type === "wings") {
    const dipBits = Object.entries(item.dips || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([k, v]) => `${k} × ${v}`);
    return [`${item.count}-piece`, item.sauce, item.serveStyle, dipBits.length ? `Dips: ${dipBits.join(", ")}` : ""]
      .filter(Boolean)
      .join(" • ");
  }
  if (item.type === "side") return item.summary || item.name || "Side";
  if (item.type === "special") return item.summary || item.name || "Special";
  return item.summary || "";
}

function itemTitle(item) {
  return (
    item?.pizzaName ||
    item?.name ||
    (item?.type === "pizza-byo" ? describeByoPizzaTitle(item) : null) ||
    (item?.type === "combo" ? comboNameFor(item.comboId) : null) ||
    (item?.type === "deal" ? dealNameFor(item.dealId) : null) ||
    "Menu Item"
  );
}

function formatAddress(addr) {
  if (!addr) return "Enter address";
  const { street, suite, city, postal } = addr;
  return [street, suite ? `Unit ${suite}` : "", city, postal]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const items = cart?.items || [];
  const {
    service,
    deliveryAddress,
    isServiceConfirmed,
    openServiceGate,
    orderTiming,
    setOrderTiming,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
  } = cart || {};
  const serviceMethod = service === "delivery" ? "Delivery" : "Carryout";

  const [showHours, setShowHours] = useState(false);
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
    isServiceConfirmed &&
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
        orderTiming === "later"
          ? { date: scheduleDate, time: scheduleTime }
          : { date: null, time: null },
      location,
      contact: { name: contactName.trim(), phone: contactPhone.trim() },
      fees: { deliveryCents, taxCents },
      subtotalCents,
      totalCents,
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

  const sectionHeader = (title) => (
    <div
      style={{
        background: "#000",
        color: "white",
        padding: "0.6rem 0.9rem",
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: ".3px",
        fontFamily: "var(--font-heading, Oswald, sans-serif)",
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

        {!cart?.isLoaded ? (
          <div style={{ background: "#fdf7f0", border: "1px solid #d9c49c", borderRadius: ".1875rem", padding: 24, textAlign: "center", color: "#6b3f22" }}>
            Loading your cart…
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: "#fdf7f0", border: "1px solid #d9c49c", borderRadius: ".1875rem", padding: 24, textAlign: "center", color: "#6b3f22" }}>
            Your cart is empty.{" "}
            <Link href="/menu" style={{ color: "#6b3f22", fontWeight: 700, textDecoration: "underline" }}>
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
              <div style={{ marginBottom: 16, padding: 0, overflow: "hidden", background: "#fdf7f0", border: "1px solid #d9c49c", borderRadius: ".1875rem" }}>
                {sectionHeader("Contact Information")}
                <div style={{ padding: 12, display: "grid", gap: 10 }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6b3f22" }}>
                      Name *
                    </span>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                      style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #d9c49c" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6b3f22" }}>
                      Phone *
                    </span>
                    <input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone number"
                      style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #d9c49c" }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ padding: 0, overflow: "hidden", background: "#fdf7f0", border: "1px solid #d9c49c", borderRadius: ".1875rem" }}>
                {sectionHeader("Order Summary")}
                <div style={{ padding: "0.75rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ color: "#6b3f22", fontSize: 13 }}>
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </div>
                    <Link
                      href="/cart"
                      style={{ color: "#6b3f22", textDecoration: "underline", fontSize: 13, fontWeight: 700 }}
                    >
                      Edit Cart
                    </Link>
                  </div>

                  {items.map((it) => {
                    const lineCents = priceLineItem(it);
                    const isCombo = it.type === "combo" && it.meta?.items;
                    const isDealBundle = it.type === "deal" && it.meta?.items;
                    const isDealList = it.type === "deal" && it.meta?.builds;
                    return (
                      <div
                        key={it.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "8px 0",
                          borderBottom: "1px solid #d9c49c",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>
                            {itemTitle(it)}{" "}
                            <span style={{ fontWeight: 400, color: "#777" }}>× {it.qty || 1}</span>
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
                          ) : isDealBundle ? (
                            <div style={{ marginTop: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                              {Object.entries(it.meta.items).map(([key, child]) => (
                                <div key={key} style={{ display: "flex", gap: 6, fontSize: 12, color: "#555" }}>
                                  <span style={{ fontWeight: 700, color: "#333", flex: "0 0 auto" }}>
                                    {dealSlotLabel(findDealById(it.dealId), key)}:
                                  </span>
                                  <span>{child?.summary || "Not customized yet"}</span>
                                </div>
                              ))}
                            </div>
                          ) : isDealList ? (
                            <div style={{ marginTop: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                              {it.meta.builds.map((child, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 6, fontSize: 12, color: "#555" }}>
                                  <span style={{ fontWeight: 700, color: "#333", flex: "0 0 auto" }}>
                                    Item {idx + 1}:
                                  </span>
                                  <span>{child?.summary || "Not customized yet"}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: "#555" }}>{describeItem(it)}</div>
                          )}
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
              <div style={{ background: "#fdf7f0", border: "1px solid #d9c49c", borderRadius: ".1875rem", overflow: "hidden" }}>
                {sectionHeader("Review Order Settings")}

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
                        color: "#6b3f22",
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
                        style={{ flex: 1, padding: "6px 8px", border: "1px solid #d9c49c", borderRadius: 6 }}
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
                          border: "1px solid #d9c49c",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Service Method</div>
                    <button
                      onClick={() => openServiceGate?.()}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#6b3f22",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      CHANGE
                    </button>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {!service
                      ? "Not selected yet"
                      : service === "carryout"
                      ? "Carryout"
                      : `Delivery — ${formatAddress(deliveryAddress)}`}
                  </div>
                  {!isServiceConfirmed && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "#b00020" }}>
                      Please choose carryout or delivery before placing your order.
                    </div>
                  )}

                  <div style={{ marginTop: 16, fontWeight: 700 }}>Order Timing</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                    {[
                      { key: "now", label: "Now" },
                      { key: "later", label: "Later" },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "white",
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #d9c49c",
                        }}
                      >
                        <input
                          type="radio"
                          name="orderTiming"
                          checked={orderTiming === opt.key}
                          onChange={() => setOrderTiming(opt.key)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>

                  {orderTiming === "later" && (
                    <div
                      style={{
                        marginTop: 10,
                        background: "white",
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid #d9c49c",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span role="img" aria-label="calendar">📅</span>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #d9c49c" }}
                        />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          min={hours.open}
                          max={hours.close}
                          step={300}
                          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #d9c49c" }}
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
                      color: "#6b3f22",
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
                    <div style={{ fontSize: 12, marginBottom: 4 }}>Have a coupon or promotion code?</div>
                    <DealCodeEntry compact />
                  </div>

                  <div style={{ marginTop: 16, borderTop: "1px solid #d9c49c", paddingTop: 12 }}>
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

                  {!canPlaceOrder &&
                    !placing &&
                    isServiceConfirmed &&
                    (!contactName.trim() || !contactPhone.trim()) && (
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
                      background: "#8b1a1a",
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
