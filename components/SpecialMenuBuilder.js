// components/SpecialMenuBuilder.js
import React, { useMemo, useState } from "react";
import { priceLineItem, formatMoney } from "./Pricing";
import { useCart } from "./CartSystem";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";

export default function SpecialMenuBuilder({
  itemType = "panzerotti",
  open = true,
  onAdd = () => {},
  onClose = () => {},
}) {
  const { addItem } = useCart();

  /* —— Fit + theme — mirrors Pizza/Wings builder —— */
  const PANEL_INNER_MAX = 840;   // fits inside 880px modal with breathing room
  const MAROON = "#8b1a1a";
  const PRIMARY_RED = "#E91E28";
  const LIGHT_BORDER = "#c5c5c5";
  const LIGHTER_BG = "#f9f9f9";

  const sectionBar = {
    background: MAROON,
    color: "#fff",
    padding: "0.55rem 0.8rem",
    fontFamily: "var(--font-heading, Oswald, sans-serif)",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".3px",
    margin: 0,
  };
  const subHeader = {
    margin: "0.9rem 0 0.45rem",
    color: MAROON,
    fontFamily: "var(--font-heading, Oswald, sans-serif)",
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: ".9rem",
  };
  const labelStyle = { fontSize: ".95rem", lineHeight: 1.25 };

  const dividerInset = {
    borderTop: `1px solid ${LIGHT_BORDER}`,
    width: "calc(100% - 2rem)",
    margin: "10px auto",
  };

  // big, but a touch smaller than before to fit better
  const circleButtonLg = {
    background: PRIMARY_RED,
    color: "#fff",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "none",
    cursor: "pointer",
    fontSize: "1.4rem",
    lineHeight: 1,
  };
  const circleButtonLgDisabled = {
    ...circleButtonLg,
    background: "#ddd",
    color: "#888",
    cursor: "not-allowed",
  };

  /* —— Data/state —— */
  const itemKey = String(itemType).toLowerCase();
  const ITEM_LABELS = {
    "panzerotti": "Panzerotti",
    "pizza-sub": "Pizza Sub",
    "meatball-sub": "Meatball Sub",
  };
  const selectedItem = ITEM_LABELS[itemKey] || "Panzerotti";

  const VEGGIES = [
    "Mushroom","Green Pepper","Onion","Pineapple","Tomato","Hot Peppers",
    "Green Olives","Black Olives","Broccoli","Jalapeno","Sun Dried Tomato",
    "Spinach","Fresh Garlic","Ginger","Coriander","Sumac Seasoning"
  ];
  const MEATS = [
    "Pepperoni","Real Bacon","Grilled Chicken","Shawarma Chicken","BBQ Chicken",
    "Butter Chicken","Beef","Hot Italian Sausage","Mild Sausage","Bacon Crumble"
  ];
  const CHEESES = ["Feta Cheese","Extra Cheese","Double Cheese"];
  const DIPS = ["Blue Cheese","Garlic","Ranch"];

  const [qty, setQty] = useState(1);
  const [selVeg, setSelVeg] = useState([]);
  const [selMeat, setSelMeat] = useState([]);
  const [selCheese, setSelCheese] = useState([]);
  const [dipQty, setDipQty] = useState(DIPS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {}));

  const toggleIn = (list, value, setter) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const inc = () => setQty((n) => n + 1);
  const dec = () => setQty((n) => Math.max(1, n - 1));

  const updateDip = (name, delta) => {
    setDipQty((prev) => ({ ...prev, [name]: Math.max(0, (prev[name] || 0) + delta) }));
  };

  const selectedDipsList = useMemo(
    () => Object.entries(dipQty).filter(([_, v]) => v > 0).map(([label, qty]) => ({ label, qty })),
    [dipQty]
  );

  const isMeatball = itemKey === "meatball-sub";
  const showsToppings = !isMeatball;
  const showsDips = itemKey === "panzerotti";

  const buildSummary = () => {
    if (isMeatball) return `${qty} × Meatball Sub`;
    const parts = [];
    if (selMeat.length) parts.push(`Meats: ${selMeat.join(", ")}`);
    if (selVeg.length) parts.push(`Veggies: ${selVeg.join(", ")}`);
    if (selCheese.length) parts.push(`Cheeses: ${selCheese.join(", ")}`);
    const toppingStr = parts.length ? ` — ${parts.join(" | ")}` : "";
    if (showsDips) {
      const dipsStr = selectedDipsList.length
        ? " | Dips: " + selectedDipsList.map(d => `${d.label} × ${d.qty}`).join(", ")
        : "";
      return `${qty} × Panzerotti${toppingStr}${dipsStr}`;
    }
    return `${qty} × Pizza Sub${toppingStr}`;
  };

  const unitPrice = useMemo(
    () => formatMoney(priceLineItem({ type: "special", name: selectedItem, qty: 1 })),
    [selectedItem]
  );
  const subtotal = useMemo(
    () => formatMoney(priceLineItem({ type: "special", name: selectedItem, qty })),
    [selectedItem, qty]
  );

  const addToCart = () => {
    const payload = {
      type: "special",
      name: selectedItem,
      qty,
      toppings: isMeatball
        ? undefined
        : {
            meats: selMeat.slice().sort(),
            veggies: selVeg.slice().sort(),
            cheeses: selCheese.slice().sort(),
          },
      dips: showsDips ? { ...dipQty } : undefined,
      summary: buildSummary(),
    };
    addItem(payload);
    onAdd(payload);
    onClose();
  };

  return (
    <DebugPizzaOverlay
      open={open}
      onClose={onClose}
      mode="portal"
      blockRogue
      title="Customize Special Item"
      showTopbar
      freezeChild={false}
    >
      {/* 👇 this stops the clicks from bubbling to the overlay */}
      <div
        onMouseDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: `${PANEL_INNER_MAX}px`,
          margin: "12px auto",
          background: "#fff",
        }}
      >
        <div style={{ padding: "12px 0 16px", background: LIGHTER_BG }}>
          <h3 style={sectionBar}>1. {selectedItem}</h3>

          <div style={{ padding: "1rem" }}>
            <div style={{ marginTop: 2, color: "#111", fontWeight: 800, fontSize: ".95rem" }}>
              Price: {unitPrice}
            </div>

            {showsToppings && (
              <>
                <h4 style={subHeader}>Choose Meats</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                  {MEATS.map((t) => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", ...labelStyle }}>
                      <input
                        type="checkbox"
                        checked={selMeat.includes(t)}
                        onChange={() => toggleIn(selMeat, t, setSelMeat)}
                      />
                      {t}
                    </label>
                  ))}
                </div>

                <div style={dividerInset} />

                <h4 style={subHeader}>Choose Veggies</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                  {VEGGIES.map((t) => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", ...labelStyle }}>
                      <input
                        type="checkbox"
                        checked={selVeg.includes(t)}
                        onChange={() => toggleIn(selVeg, t, setSelVeg)}
                      />
                      {t}
                    </label>
                  ))}
                </div>

                <div style={dividerInset} />

                <h4 style={subHeader}>Choose Cheeses</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                  {CHEESES.map((t) => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", ...labelStyle }}>
                      <input
                        type="checkbox"
                        checked={selCheese.includes(t)}
                        onChange={() => toggleIn(selCheese, t, setSelCheese)}
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </>
            )}

            {showsDips && (
              <>
                <div style={dividerInset} />
                <h3 style={{ ...sectionBar, marginTop: "1rem" }}>2. Dips</h3>

                <div style={{ paddingTop: "0.7rem" }}>
                  {DIPS.map((dip) => (
                    <div
                      key={dip}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.7rem",
                        gap: "0.7rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", minWidth: 0 }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            background: "#ddd",
                            borderRadius: "8px",
                            flex: "0 0 auto",
                          }}
                        />
                        <p style={{ margin: 0, fontWeight: 500 }}>{dip}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => updateDip(dip, -1)}
                          style={(dipQty[dip] || 0) > 0 ? circleButtonLg : circleButtonLgDisabled}
                          disabled={(dipQty[dip] || 0) <= 0}
                          aria-label={`Decrease ${dip}`}
                        >
                          −
                        </button>
                        <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 800 }}>
                          {dipQty[dip] || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDip(dip, 1)}
                          style={circleButtonLg}
                          aria-label={`Increase ${dip}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={dividerInset} />

            {/* Qty row */}
            <div
              style={{
                marginTop: "0.4rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ fontWeight: 900, margin: 0 }}>{selectedItem}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={dec}
                  style={qty > 1 ? circleButtonLg : circleButtonLgDisabled}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 900 }}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={inc}
                  style={circleButtonLg}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <hr style={{ border: "none", borderTop: `1px solid ${LIGHT_BORDER}`, margin: 0 }} />

        <div style={{ padding: "1rem", background: "#fff" }}>
          <h3 style={sectionBar}>3. Item</h3>
          <div style={{ marginTop: "0.7rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ color: "green", fontWeight: "bold" }}>✔</span>
              <span>{buildSummary()}</span>
            </div>
            {showsDips &&
              selectedDipsList.map((d, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}
                >
                  <span style={{ color: "green", fontWeight: "bold" }}>✔</span>
                  <span>({d.qty}) {d.label}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", gap: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "1rem",
              background: "#fff",
              border: `1px solid ${LIGHT_BORDER}`,
              fontWeight: 900,
              cursor: "pointer",
              textTransform: "uppercase",
              fontFamily: "var(--font-heading, Oswald, sans-serif)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={addToCart}
            style={{
              flex: 1,
              padding: "1rem",
              background: PRIMARY_RED,
              color: "#fff",
              border: "none",
              fontWeight: 900,
              cursor: "pointer",
              textTransform: "uppercase",
              fontFamily: "var(--font-heading, Oswald, sans-serif)",
            }}
            aria-label={`Add ${selectedItem} to order (Subtotal ${subtotal})`}
          >
            Add To Order
          </button>
        </div>
      </div>
    </DebugPizzaOverlay>
  );
}
