// components/SideBuilder.js
import React, { useState, useMemo } from "react";
import { priceLineItem, formatMoney } from "./Pricing";
import { useCart } from "./CartSystem";

export default function SideBuilder({ side, onClose, onAdd = () => {} }) {
  const { addItem } = useCart();

  /* —— Theme: match Pizza/Wings builder —— */
  const PANEL_INNER_MAX = 840; // fits nicely inside your modal
  const MAROON = "#8b1a1a";
  const PRIMARY_RED = "#E91E28";
  const LIGHT_BORDER = "#c5c5c5";
  const LIGHT_BG = "#f9f9f9";
  const PAD_Y = "1.25rem"; // extra vertical padding in sections

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
  const dividerInset = {
    borderTop: `1px solid ${LIGHT_BORDER}`,
    width: "calc(100% - 2rem)",
    margin: "12px auto",
  };
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
  const chip = (active) => ({
    flex: 1,
    padding: ".7rem .9rem",
    borderRadius: 6,
    border: active ? "2px solid transparent" : `2px solid ${LIGHT_BORDER}`,
    background: active ? PRIMARY_RED : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 800,
    fontFamily: "var(--font-heading, Oswald, sans-serif)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    cursor: "pointer",
  });

  /* —— Logic —— */
  // Poutine offers a Small tier too; everything else stays Regular/Large.
  const SIZE_OPTIONS = side === "Poutine" ? ["Small", "Regular", "Large"] : ["Regular", "Large"];
  const DIPS = ["Garlic", "Ranch", "Blue Cheese"];
  const isSizeSelectable = ["French Fries", "Poutine", "Shawarma Poutine", "Onion Rings"].includes(side);
  const hasDips = ["Cheesy Garlic Bread", "Garlic Bread"].includes(side);
  const hasGravy = side === "French Fries";
  const hasHotSauceToggle = side === "Shawarma Poutine";

  const [selectedSize, setSelectedSize] = useState("Regular");
  const [quantity, setQuantity] = useState(1);
  const [gravyQty, setGravyQty] = useState(0);
  const [dipQty, setDipQty] = useState({ Garlic: 0, Ranch: 0, "Blue Cheese": 0 });
  const [hotSauce, setHotSauce] = useState("No");

  const updateDipQty = (dip, delta) =>
    setDipQty((prev) => ({ ...prev, [dip]: Math.max(0, prev[dip] + delta) }));

  const selectedDipsList = Object.entries(dipQty)
    .filter(([_, qty]) => qty > 0)
    .map(([label, qty]) => ({ label, qty }));

  // Pricing names use "Medium" for Regular to match your Pricing table
  const sizeToPricingLabel = (size) => (size === "Regular" ? "Medium" : size);

  const pricingName = useMemo(() => {
    if (isSizeSelectable) return `${side} (${sizeToPricingLabel(selectedSize)})`;
    return side;
  }, [isSizeSelectable, side, selectedSize]);

  const currentItem = useMemo(
    () => ({ type: "side", name: pricingName, qty: quantity }),
    [pricingName, quantity]
  );

  const lineSubtotal = formatMoney(priceLineItem(currentItem));

  const buildSummary = () => {
    const bits = [];
    bits.push(`${quantity} × ${side}${isSizeSelectable ? ` - ${selectedSize}` : ""}`);
    if (hasHotSauceToggle) bits.push(`Hot Sauce Drizzle: ${hotSauce}`);
    if (hasGravy && gravyQty > 0) bits.push(`Gravy × ${gravyQty}`);
    if (selectedDipsList.length) bits.push(`Dips: ${selectedDipsList.map((d) => `${d.label} × ${d.qty}`).join(", ")}`);
    return bits.join(" | ");
  };

  /* —— Render —— */
  return (
    <div
      style={{
        width: "100%",
        maxWidth: `${PANEL_INNER_MAX}px`,
        margin: "0 auto",
        background: "#fff",
        padding: "0.9rem 0",            // EXTRA top/bottom padding for the whole popup
      }}
    >
      {/* Section 1 – Serving Options */}
      <div style={{ padding: ".5rem 0", background: LIGHT_BG }}> {/* extra top/bottom */}
        <h3 style={sectionBar}>1. Serving Options</h3>

        <div style={{ padding: `${PAD_Y} 1rem` }}>
          {isSizeSelectable && (
            <>
              <h4 style={subHeader}>Choose Size</h4>
              <div style={{ display: "flex", gap: "0.7rem", marginBottom: ".9rem" }}>
                {SIZE_OPTIONS.map((size) => {
                  const optionName = `${side} (${sizeToPricingLabel(size)})`;
                  const optionPrice = formatMoney(priceLineItem({ type: "side", name: optionName, qty: 1 }));
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={chip(active)}
                      type="button"
                    >
                      <span>{size}</span>
                      <span style={{ fontWeight: 900 }}>{optionPrice}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {hasHotSauceToggle && (
            <>
              <h4 style={subHeader}>Hot Sauce Drizzle</h4>
              <div style={{ display: "flex", gap: "0.7rem" }}>
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHotSauce(opt)}
                    style={chip(hotSauce === opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={dividerInset} />

          {/* Qty row */}
          <div
            style={{
              marginTop: "0.2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ fontWeight: 900, margin: 0 }}>{side}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={quantity > 1 ? circleButtonLg : circleButtonLgDisabled}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 900 }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                style={circleButtonLg}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {(hasDips || hasGravy) && (
        <>
          <hr style={{ border: "none", borderTop: `1px solid ${LIGHT_BORDER}`, margin: 0 }} />
          <div style={{ padding: ".5rem 0", background: "#fff" }}> {/* extra top/bottom */}
            <h3 style={sectionBar}>2. {hasGravy ? "Gravy" : "Dips"}</h3>

            <div style={{ padding: `${PAD_Y} 1rem` }}>
              {hasGravy ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>Gravy</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setGravyQty((g) => Math.max(0, g - 1))}
                      style={gravyQty > 0 ? circleButtonLg : circleButtonLgDisabled}
                      disabled={gravyQty <= 0}
                    >
                      −
                    </button>
                    <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 800 }}>
                      {gravyQty}
                    </span>
                    <button type="button" onClick={() => setGravyQty((g) => g + 1)} style={circleButtonLg}>
                      +
                    </button>
                  </div>
                </div>
              ) : (
                DIPS.map((dip) => (
                  <div
                    key={dip}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.9rem",
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => updateDipQty(dip, -1)}
                        style={(dipQty[dip] || 0) > 0 ? circleButtonLg : circleButtonLgDisabled}
                        disabled={(dipQty[dip] || 0) <= 0}
                      >
                        −
                      </button>
                      <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 800 }}>
                        {dipQty[dip] || 0}
                      </span>
                      <button type="button" onClick={() => updateDipQty(dip, 1)} style={circleButtonLg}>
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Summary */}
      <hr style={{ border: "none", borderTop: `1px solid ${LIGHT_BORDER}`, margin: 0 }} />
      <div style={{ padding: ".5rem 0", background: "#fff" }}> {/* extra top/bottom */}
        <h3 style={sectionBar}>3. Item</h3>
        <div style={{ padding: `${PAD_Y} 1rem` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <span style={{ color: "green", fontWeight: "bold" }}>✔</span>
            <span style={{ fontWeight: "bold" }}>({quantity})</span>
            <span>
              {side}
              {isSizeSelectable ? ` - ${selectedSize}` : ""}
            </span>
          </div>

          {hasHotSauceToggle && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <span style={{ color: "green", fontWeight: "bold" }}>✔</span>
              <span>{`Hot Sauce Drizzle: ${hotSauce}`}</span>
            </div>
          )}

          {hasGravy && gravyQty > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <span style={{ color: "green", fontWeight: "bold" }}>✔</span>
              <span style={{ fontWeight: "bold" }}>({gravyQty})</span>
              <span>Gravy</span>
            </div>
          )}

          {selectedDipsList.map((item, idx) => (
            <div
              key={idx}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}
            >
              <span style={{ color: "green", fontWeight: "bold" }}>✔</span>
              <span style={{ fontWeight: "bold" }}>({item.qty})</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions with a little bottom padding from container */}
      <div style={{ display: "flex", gap: 0, paddingBottom: ".6rem" }}>
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
          onClick={() => {
            const payload = {
              type: "side",
              name: pricingName,
              qty: quantity,
              gravy: gravyQty,
              dips: dipQty,
              hotSauce,
              summary: buildSummary(),
            };
            addItem(payload);
            onAdd(payload); // parent closes the modal
          }}
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
        >
          Add To Order — {lineSubtotal}
        </button>
      </div>
    </div>
  );
}
