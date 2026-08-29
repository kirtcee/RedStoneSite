// pages/cart.js
import React, { useState } from "react";
import Link from "next/link";
import { useCart, DealCodeEntry } from "../components/CartSystem";
import { priceLineItem, formatMoney, describePizzaFull, describeByoPizzaTitle } from "../components/Pricing";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";
import { dealNameFor, dealSlotLabel, findDealById } from "../utils/dealCatalog";
import OrderSettingsAside from "../components/OrderSettingsAside";

/* ===== Theme (matches the menu/deals page cream-box makeover) ===== */
const MAROON = "#8b1a1a";
const LIGHT_BORDER = "#d9c49c"; // thin dark-brown-tan border (--menu-box-border)
const LIGHT_BG = "#fdf7f0";     // cream box fill (--menu-box-bg)
const TEXT_BROWN = "#6b3f22";   // body text color inside the boxes
const BOX_RADIUS = ".1875rem";

// Sides with a real size choice get an inline segmented picker (same S/R/L
// pattern as the Sides menu); sides with only one variant just add plain.
// Pricing keys use "Medium" for what the UI calls "Regular".
const SIDE_SIZE_OPTIONS = {
  "French Fries": [{ size: "Regular", abbr: "R" }, { size: "Large", abbr: "L" }],
  "Poutine": [{ size: "Small", abbr: "S" }, { size: "Regular", abbr: "R" }, { size: "Large", abbr: "L" }],
  "Onion Rings": [{ size: "Regular", abbr: "R" }, { size: "Large", abbr: "L" }],
};
const sideSizeToPricingLabel = (size) => (size === "Regular" ? "Medium" : size);

const SUGGESTED_SIDES = ["French Fries", "Poutine", "Cheesy Garlic Bread", "Onion Rings"];

const SUGGESTED_DRINKS = [
  { key: "Coke", label: "Coke 2L", categoryId: "twoLiters", categoryLabel: "2L Bottles" },
  { key: "Water", label: "Water", categoryId: "other", categoryLabel: "Other Drinks" },
];

const SUGGESTED_DIPS = [
  { key: "Blue Cheese", label: "Blue Cheese", categoryId: "dips", categoryLabel: "Dips" },
  { key: "Garlic", label: "Garlic", categoryId: "dips", categoryLabel: "Dips" },
  { key: "Ranch", label: "Ranch", categoryId: "dips", categoryLabel: "Dips" },
];

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
    return [
      `${item.count}-piece`,
      item.sauce,
      item.serveStyle,
      dipBits.length ? `Dips: ${dipBits.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  if (item.type === "side") return item.summary || item.name || "Side";
  if (item.type === "special") return item.summary || item.name || "Special";
  return item.summary || "";
}

function ItemRow({ item, onQty, onRemove, onEdit }) {
  const lineCents = priceLineItem(item);
  const qty = Math.max(1, Number(item?.qty) || 1);
  const title =
    item?.pizzaName ||
    item?.name ||
    (item?.type === "pizza-byo" ? describeByoPizzaTitle(item) : null) ||
    (item?.type === "combo" ? comboNameFor(item.comboId) : null) ||
    (item?.type === "deal" ? dealNameFor(item.dealId) : null) ||
    "Menu Item";
  const isCombo = item?.type === "combo" && item?.meta?.items;
  const isDealBundle = item?.type === "deal" && item?.meta?.items;
  const isDealList = item?.type === "deal" && item?.meta?.builds;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 220px",
        gap: 12,
        padding: "12px 0",
        borderBottom: `1px solid ${LIGHT_BORDER}`,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
        <div
          style={{
            width: 56,
            height: 56,
            background: "#eee",
            borderRadius: 8,
            flex: "0 0 56px",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <button
            onClick={() => onEdit?.(item)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              color: TEXT_BROWN,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              display: "inline",
            }}
          >
            {title}
          </button>
          {isCombo ? (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
              {Object.entries(item.meta.items).map(([key, child]) => (
                <div key={key} style={{ display: "flex", gap: 6, fontSize: 12, color: "#555" }}>
                  <span style={{ fontWeight: 700, color: "#333", flex: "0 0 auto" }}>
                    {comboItemLabel(key)}:
                  </span>
                  <span>{child?.summary || "Not customized yet"}</span>
                </div>
              ))}
            </div>
          ) : isDealBundle ? (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
              {Object.entries(item.meta.items).map(([key, child]) => (
                <div key={key} style={{ display: "flex", gap: 6, fontSize: 12, color: "#555" }}>
                  <span style={{ fontWeight: 700, color: "#333", flex: "0 0 auto" }}>
                    {dealSlotLabel(findDealById(item.dealId), key)}:
                  </span>
                  <span>{child?.summary || "Not customized yet"}</span>
                </div>
              ))}
            </div>
          ) : isDealList ? (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
              {item.meta.builds.map((child, idx) => (
                <div key={idx} style={{ display: "flex", gap: 6, fontSize: 12, color: "#555" }}>
                  <span style={{ fontWeight: 700, color: "#333", flex: "0 0 auto" }}>
                    Item {idx + 1}:
                  </span>
                  <span>{child?.summary || "Not customized yet"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: "#555",
                marginTop: 2,
                whiteSpace: "pre-wrap",
              }}
            >
              {describeItem(item)}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#777" }}>Quantity</div>
          <select
            value={qty}
            onChange={(e) =>
              onQty?.(item?.id, Math.max(1, Number(e.target.value) || 1))
            }
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: `1px solid ${LIGHT_BORDER}`,
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
            <button
              onClick={() => onRemove?.(item?.id)}
              style={{
                background: "none",
                border: "none",
                color: TEXT_BROWN,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Remove
            </button>
            <button
              onClick={() => onEdit?.(item)}
              style={{
                background: "none",
                border: "none",
                color: TEXT_BROWN,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Edit
            </button>
          </div>
        </div>

        <div style={{ textAlign: "right", fontWeight: 700 }}>
          {formatMoney(lineCents)}
        </div>
      </div>
    </div>
  );
}

const SEG_COLORS = { Small: "#e57373", Regular: "#e91e28", Large: "#b71c1c" };

// A suggested-item tile that adds directly to the cart — no navigating away.
// Plain items (no `sizes`) add on one click; sized items reveal an inline
// segmented size picker first, matching the same pattern used on the Sides
// menu. Either way it flashes "Added" instead of leaving the page.
function QuickAddTile({ label, sizes, onAdd }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const timerRef = React.useRef(null);

  const handleAdd = (size) => {
    onAdd(size);
    setPickerOpen(false);
    setAdded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div style={{ border: `1px solid ${LIGHT_BORDER}`, borderRadius: BOX_RADIUS, overflow: "hidden", background: LIGHT_BG }}>
      <div style={{ height: 90, background: "#f0f0f0" }} />
      <div style={{ padding: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: TEXT_BROWN }}>{label}</div>
        {added ? (
          <div
            style={{
              textAlign: "center",
              padding: "7px 8px",
              borderRadius: 6,
              background: "#e8f5e9",
              color: "#1b5e20",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            ✓ Added
          </div>
        ) : sizes && pickerOpen ? (
          <div style={{ display: "flex", gap: 4 }}>
            {sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                onClick={() => handleAdd(s.size)}
                title={s.size}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  background: s.color,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {s.abbr}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => (sizes ? setPickerOpen(true) : handleAdd(null))}
            style={{
              width: "100%",
              padding: "7px 8px",
              background: MAROON,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}

function SidesUpsellRow({ addItem }) {
  return (
    <>
      <div style={{ fontWeight: 700, margin: "16px 0 6px", color: TEXT_BROWN }}>Add Some Sides</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 12,
        }}
      >
        {SUGGESTED_SIDES.map((side) => {
          const sizeOpts = SIDE_SIZE_OPTIONS[side];
          const sizes = sizeOpts ? sizeOpts.map((s) => ({ ...s, color: SEG_COLORS[s.size] })) : null;
          return (
            <QuickAddTile
              key={side}
              label={side}
              sizes={sizes}
              onAdd={(size) => {
                const name = size ? `${side} (${sideSizeToPricingLabel(size)})` : side;
                const payload = {
                  type: "side",
                  name,
                  side,
                  size: size || null,
                  qty: 1,
                  summary: size ? `1 × ${side} (${size})` : `1 × ${side}`,
                };
                payload.lineSubtotalCents = priceLineItem(payload);
                addItem(payload);
              }}
            />
          );
        })}
      </div>
    </>
  );
}

function DrinksUpsellRow({ title, items, addItem }) {
  return (
    <>
      <div style={{ fontWeight: 700, margin: "16px 0 6px", color: TEXT_BROWN }}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 12,
        }}
      >
        {items.map((it) => (
          <QuickAddTile
            key={it.key}
            label={it.label}
            sizes={null}
            onAdd={() => {
              const payload = {
                type: "drinks-dips",
                categoryId: it.categoryId,
                categoryLabel: it.categoryLabel,
                items: [{ label: it.key, qty: 1 }],
                summary: `${it.categoryLabel}: ${it.key} × 1`,
                qty: 1,
              };
              addItem(payload);
            }}
          />
        ))}
      </div>
    </>
  );
}

export default function CartPage() {
  const cart = useCart();
  const items = cart?.items || [];

  const handleQty = (id, qty) => cart?.updateQty?.(id, qty);
  const handleRemove = (id) => cart?.removeItem?.(id);
  const handleEdit = (it) => cart?.onEditItem && cart.onEditItem(it);

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
    <main className="page page--cart">
      <div className="container" style={{ padding: "1rem 0" }}>
        <div className="menu-layout">
          <section className="menu-main">
            <div
              style={{
                marginBottom: 16,
                padding: 0,
                overflow: "hidden",
                background: LIGHT_BG,
                border: `1px solid ${LIGHT_BORDER}`,
                borderRadius: BOX_RADIUS,
                color: TEXT_BROWN,
              }}
            >
              {sectionHeader("Food & Drink Details")}

              <div style={{ padding: "0.75rem 0.75rem 0.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    Review and modify your items here.
                  </div>
                  <Link
                    href="/menu"
                    style={{
                      background: MAROON,
                      color: "white",
                      padding: "0.55rem 0.9rem",
                      borderRadius: BOX_RADIUS,
                      fontWeight: "bold",
                      cursor: "pointer",
                      textDecoration: "none",
                    }}
                  >
                    Add More Items
                  </Link>
                </div>
                <div style={{ marginTop: 4, fontStyle: "italic", fontSize: 12 }}>
                  Note: Some crust types, toppings, sauces, and premium items may come with an
                  additional charge.
                </div>
              </div>

              <div style={{ padding: "0.75rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) 220px",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: `2px solid ${LIGHT_BORDER}`,
                    fontWeight: 700,
                  }}
                >
                  <div>Your Items</div>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                    <div>Quantity</div>
                    <div style={{ textAlign: "right" }}>Price</div>
                  </div>
                </div>

                {!cart?.isLoaded ? (
                  <div style={{ padding: "16px 0" }}>Loading your cart…</div>
                ) : items.length === 0 ? (
                  <div style={{ padding: "16px 0" }}>
                    Your cart is empty.{" "}
                    <Link href="/menu" style={{ color: TEXT_BROWN, fontWeight: 700, textDecoration: "underline" }}>
                      Add items
                    </Link>
                    .
                  </div>
                ) : (
                  items.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      onQty={handleQty}
                      onRemove={handleRemove}
                      onEdit={handleEdit}
                    />
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div style={{ padding: "0.75rem" }}>
                  <SidesUpsellRow addItem={cart.addItem} />
                  <DrinksUpsellRow title="Add Some Drinks" items={SUGGESTED_DRINKS} addItem={cart.addItem} />
                  <DrinksUpsellRow title="Add Some Flavour" items={SUGGESTED_DIPS} addItem={cart.addItem} />
                </div>
              )}

              {items.length > 0 && (
                <div style={{ padding: "0.75rem", borderTop: `1px solid ${LIGHT_BORDER}` }}>
                  <DealCodeEntry />
                </div>
              )}
            </div>
          </section>

          <OrderSettingsAside />
        </div>
      </div>
    </main>
  );
}
