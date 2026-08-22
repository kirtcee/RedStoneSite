// pages/cart.js
import React, { useMemo } from "react";
import Link from "next/link";
import { useCart } from "../components/CartSystem";
import { priceLineItem, formatMoney } from "../components/Pricing";

const SUGGESTED_SIDES = [
  { name: "French Fries (Medium)", href: "/menu?tab=sides" },
  { name: "Poutine (Medium)", href: "/menu?tab=sides" },
  { name: "Cheesy Garlic Bread", href: "/menu?tab=sides" },
  { name: "Onion Rings (Medium)", href: "/menu?tab=sides" },
];

const SUGGESTED_DRINKS = [
  { name: "Coke 2L", href: "/menu?tab=drinks" },
  { name: "Water", href: "/menu?tab=drinks" },
];

const SUGGESTED_DIPS = [
  { name: "Blue Cheese", href: "/menu?tab=drinks" },
  { name: "Garlic", href: "/menu?tab=drinks" },
  { name: "Ranch", href: "/menu?tab=drinks" },
];

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
  if (item.type === "wings") {
    const dips = item?.dips
      ? Object.entries(item.dips)
          .filter(([, q]) => q > 0)
          .map(([k, v]) => `${k} × ${v}`)
          .join(", ")
      : "";
    return [`${item.count}-piece`, item.sauce, dips && `Dips: ${dips}`]
      .filter(Boolean)
      .join(" — ");
  }
  if (item.type === "side") return item.name || "Side";
  if (item.type === "special") return item.name || "Special";
  if (item.type === "combo") return item.comboId || "Combo";
  return item.summary || "";
}

function ItemRow({ item, onQty, onRemove, onEdit }) {
  const lineCents = priceLineItem(item);
  const qty = Math.max(1, Number(item?.qty) || 1);
  const title =
    item?.name ||
    item?.summary ||
    (item?.type === "pizza-byo" ? "Build Your Own Pizza" : "Menu Item");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 220px",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #eee",
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
              color: "#0b61d6",
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              display: "inline",
            }}
          >
            {title}
          </button>
          <div
            style={{
              fontSize: 12,
              color: "#555",
              marginTop: 2,
              whiteSpace: "pre-wrap",
            }}
          >
            {item?.summary || describeItem(item)}
          </div>
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
              border: "1px solid #ccc",
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
                color: "#0b61d6",
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
                color: "#0b61d6",
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

function UpsellRow({ title, items }) {
  return (
    <>
      <div style={{ fontWeight: 700, margin: "16px 0 6px" }}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 12,
        }}
      >
        {items.map((it) => (
          <div
            key={it.name}
            style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}
          >
            <div style={{ height: 90, background: "#f0f0f0" }} />
            <Link
              href={it.href}
              style={{ display: "block", padding: "8px", textAlign: "left", textDecoration: "none" }}
            >
              {it.name}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

export default function CartPage() {
  const cart = useCart();
  const items = cart?.items || [];

  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + priceLineItem(it), 0),
    [items]
  );

  const handleQty = (id, qty) => cart?.updateQty?.(id, qty);
  const handleRemove = (id) => cart?.removeItem?.(id);
  const handleEdit = (it) => cart?.onEditItem && cart.onEditItem(it);

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
    <main className="page page--cart">
      <div className="container" style={{ padding: "16px 0 32px" }}>
        <h1 className="page-title" style={{ margin: "0 0 16px", textTransform: "uppercase" }}>
          Cart
        </h1>

        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="card" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
            {redHeader("Food & Drink Details")}

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
                <div style={{ color: "#333", fontWeight: 600 }}>
                  Review and modify your items here.
                </div>
                <Link
                  href="/menu"
                  style={{
                    background: "#E91E28",
                    color: "white",
                    padding: "0.55rem 0.9rem",
                    borderRadius: 8,
                    fontWeight: "bold",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  Add More Items
                </Link>
              </div>
              <div style={{ marginTop: 4, color: "#666", fontStyle: "italic", fontSize: 12 }}>
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
                  borderBottom: "2px solid #ddd",
                  fontWeight: 700,
                  color: "#333",
                }}
              >
                <div>Your Items</div>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                  <div>Quantity</div>
                  <div style={{ textAlign: "right" }}>Price</div>
                </div>
              </div>

              {items.length === 0 ? (
                <div style={{ padding: "16px 0", color: "#666" }}>
                  Your cart is empty.{" "}
                  <Link href="/menu" style={{ color: "#0b61d6", textDecoration: "none" }}>
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
                <UpsellRow title="Add Some Sides" items={SUGGESTED_SIDES} />
                <UpsellRow title="Add Some Drinks" items={SUGGESTED_DRINKS} />
                <UpsellRow title="Add Some Flavour" items={SUGGESTED_DIPS} />
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {redHeader("Order Total")}
              <div style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>Subtotal:</div>
                  <div style={{ fontWeight: 700 }}>{formatMoney(subtotalCents)}</div>
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                  Delivery fees and taxes are calculated at checkout.
                </div>
                <Link
                  href="/checkout"
                  style={{
                    display: "block",
                    textAlign: "center",
                    width: "100%",
                    padding: "0.9rem 1rem",
                    background: "#E91E28",
                    color: "white",
                    borderRadius: 8,
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
