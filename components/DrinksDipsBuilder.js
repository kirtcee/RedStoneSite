// components/DrinksDipsBuilder.js
import React, { useMemo, useState, useEffect } from "react";
import { priceLineItem, formatMoney } from "./Pricing";
import { useCart } from "./CartSystem";

/* ===== Theme ===== */
const PANEL_INNER_MAX = 840;
const MAROON = "#8b1a1a";
const PRIMARY_RED = "#E91E28";
const LIGHT_BORDER = "#c5c5c5";
const LIGHTER_BG = "#f9f9f9";

const sectionBar = {
  background: MAROON,
  color: "#fff",
  padding: "0.6rem 0.85rem",
  fontFamily: "var(--font-heading, Oswald, sans-serif)",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: ".3px",
  margin: 0,
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
  width: 48,
  height: 48,
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

/**
 * Drinks/Dips category panel (no overlay). Render this INSIDE your page modal.
 */
export function DrinksCategoryPanel({
  title,
  categoryId,        // 'twoLiters' | 'cans' | 'other' | 'dips'
  categoryLabel,
  options = [],
  initialItems = [],
  onClose = () => {},
  onAdd = () => {},
}) {
  const { addItem } = useCart();

  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isNarrow = vw < 800;

  const [active, setActive] = useState(options[0] || "");
  const [qty, setQty] = useState(1);
  const [items, setItems] = useState(
    Array.isArray(initialItems) && initialItems.length ? initialItems : []
  );

  const addCurrent = () => {
    if (!active) return;
    setItems((prev) => {
      const i = prev.findIndex((x) => x.label === active);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { label: active, qty }];
    });
    setQty(1);
  };

  const changeQty = (label, delta) => {
    setItems((prev) =>
      prev
        .map((x) =>
          x.label === label ? { ...x, qty: Math.max(1, x.qty + delta) } : x
        )
        .filter((x) => x.qty > 0)
    );
  };

  const removeItem = (label) => {
    setItems((prev) => prev.filter((x) => x.label !== label));
  };

  const summary = useMemo(() => {
    if (!items.length) return `${categoryLabel} — none selected`;
    return `${categoryLabel}: ` + items.map((i) => `${i.label} × ${i.qty}`).join(", ");
  }, [items, categoryLabel]);

  const currentPickPrice = formatMoney(
    priceLineItem({
      type: "drinks-dips",
      categoryId,
      items: active ? [{ label: active, qty }] : [],
      qty: 1,
    })
  );

  const panelSubtotal = formatMoney(
    priceLineItem({
      type: "drinks-dips",
      categoryId,
      items,
      qty: 1,
    })
  );

  const finishAndAdd = () => {
    const payload = {
      type: "drinks-dips",
      categoryId,
      categoryLabel,
      items,
      summary,
      qty: 1,
    };
    addItem(payload);
    onAdd(payload);
    onClose();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: `${PANEL_INNER_MAX}px`,
        margin: "0 auto",
        background: "#fff",
        // Extra breathing room inside the popup container
        paddingTop: "16px",
        paddingBottom: "16px",
      }}
    >
      <div style={{ padding: 0, background: LIGHTER_BG }}>
        <h3 style={sectionBar}>1. {title}</h3>

        <div style={{ padding: "1.15rem 1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(3, 1fr)",
              gap: "0.6rem",
              marginBottom: "0.9rem",
            }}
          >
            {options.map((opt) => {
              const selected = opt === active;
              return (
                <button
                  key={opt}
                  onClick={() => setActive(opt)}
                  style={{
                    padding: "0.7rem",
                    backgroundColor: selected ? PRIMARY_RED : "#f0f0f0",
                    color: selected ? "#fff" : "#111",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "var(--font-heading, Oswald, sans-serif)",
                    fontWeight: 800,
                  }}
                  title={opt}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div style={{ fontWeight: 800, marginBottom: 8, color: "#111" }}>
            Price: {currentPickPrice}
          </div>

          <div style={dividerInset} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontWeight: 900,
                  fontFamily: "var(--font-heading, Oswald, sans-serif)",
                }}
              >
                Quantity
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={qty > 1 ? circleButtonLg : circleButtonLgDisabled}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                style={{
                  padding: "0 0.6rem",
                  minWidth: 30,
                  textAlign: "center",
                  fontWeight: 900,
                }}
              >
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                style={circleButtonLg}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={addCurrent}
              style={{
                background: PRIMARY_RED,
                color: "#fff",
                border: "none",
                padding: "0.8rem 1.2rem",
                borderRadius: "10px",
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
                fontFamily: "var(--font-heading, Oswald, sans-serif)",
              }}
              title="Add this item"
            >
              Add Item — {currentPickPrice}
            </button>
          </div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${LIGHT_BORDER}`, margin: 0 }} />

      <div style={{ padding: "1.15rem 1rem", background: "#fff" }}>
        <h3 style={sectionBar}>2. Item</h3>

        {items.length === 0 ? (
          <p style={{ margin: "0.8rem 0 0 0", color: "#555" }}>
            No items added yet.
          </p>
        ) : (
          <div style={{ marginTop: "0.8rem" }}>
            {items.map((it) => {
              const linePrice = formatMoney(
                priceLineItem({
                  type: "drinks-dips",
                  categoryId,
                  items: [{ label: it.label, qty: it.qty }],
                  qty: 1,
                })
              );
              return (
                <div
                  key={it.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.7rem",
                    marginBottom: "0.65rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <span style={{ color: "green", fontWeight: "bold" }}>✔</span>
                    <span style={{ fontWeight: 900 }}>({it.qty})</span>
                    <span>{it.label}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 800 }}>{linePrice}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(it.label, -1)}
                      style={it.qty > 1 ? circleButtonLg : circleButtonLgDisabled}
                      disabled={it.qty <= 1}
                      aria-label={`Decrease ${it.label}`}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => changeQty(it.label, +1)}
                      style={circleButtonLg}
                      aria-label={`Increase ${it.label}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(it.label)}
                      style={{
                        background: "#fff",
                        color: "#333",
                        border: `1px solid ${LIGHT_BORDER}`,
                        padding: "0.55rem 0.8rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: "1.05rem",
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
          onClick={finishAndAdd}
          style={{
            flex: 1,
            padding: "1.05rem",
            background: PRIMARY_RED,
            color: "#fff",
            border: "none",
            fontWeight: 900,
            cursor: "pointer",
            textTransform: "uppercase",
            fontFamily: "var(--font-heading, Oswald, sans-serif)",
          }}
          aria-label={`Add ${categoryLabel} to order (Subtotal ${panelSubtotal})`}
        >
          Add To Order — {panelSubtotal}
        </button>
      </div>
    </div>
  );
}

/* You can still keep the old grid builder as default export if you need it elsewhere. */
export default function DrinksDipsBuilder() {
  return null; // not used anymore by the modal flow
}
