// components/Cart.js
import React from "react";
import { useCart } from "../components/CartSystem";
import { priceLineItem, formatMoney } from "../components/Pricing";

export default function Cart() {
  const { items, removeItem, clearCart } = useCart();
  const totalCents = items.reduce((sum, it) => sum + priceLineItem(it), 0);

  if (items.length === 0) {
    return (
      <div>
        <h2>🛒 Cart</h2>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>🛒 Cart</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: "0.5rem", display: "flex", gap: 8, alignItems: "center" }}>
            <strong>{item.name || item.summary || item.type}</strong>
            <span>{formatMoney(priceLineItem(item))}</span>
            <button onClick={() => removeItem(item.id)} style={{ marginLeft: "auto" }}>
              ❌ Remove
            </button>
          </li>
        ))}
      </ul>
      <p><strong>Total:</strong> {formatMoney(totalCents)}</p>
      <button onClick={clearCart}>🧹 Clear Cart</button>
    </div>
  );
}
