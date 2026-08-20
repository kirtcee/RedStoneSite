import React, { useState } from "react";
import PizzaBuilder from "../components/PizzaBuilder";
import WingsBuilder from "../components/WingsBuilder";
import SideBuilder from "../components/SideBuilder";

const comboData = [
  {
    type: "Two Pizzas",
    combos: [
      { name: "2 Medium Pizzas", subtitle: "3 toppings each, 2 dips" },
      { name: "2 Large Pizzas", subtitle: "3 toppings each, 2 dips" },
      { name: "2 X-Large Pizzas", subtitle: "3 toppings each, 2 dips" },
    ],
  },
  {
    type: "Double Combo",
    combos: [
      { name: "2 Medium Pizzas + 16 Wings", subtitle: "3 toppings each, 2 dips" },
      { name: "2 Large Pizzas + 20 Wings", subtitle: "3 toppings each, 2 dips" },
      { name: "2 X-Large Pizzas + 25 Wings", subtitle: "3 toppings each, 2 dips" },
    ],
  },
  {
    type: "Pizza & Wings",
    combos: [
      { name: "1 Small Pizza + 6 Wings", subtitle: "3 toppings, 1 dip, upgrade to Medium available" },
      { name: "1 Large Pizza + 12 Wings", subtitle: "3 toppings, 1 dip, upgrade to XL available" },
    ],
  },
  {
    type: "Take Care Combo",
    combos: [
      { name: "2 Large Pizzas + Garlic Bread + 4 Pops", subtitle: "3 toppings each, 2 dips" },
    ],
  },
];

export default function ComboPage() {
  const [selectedCombo, setSelectedCombo] = useState(null);

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#E91E28" }}>🥡 Combos</h1>

      {!selectedCombo && (
        <>
          {comboData.map((section) => (
            <div key={section.type} style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#E91E28", marginBottom: "1rem" }}>{section.type}</h2>
              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                }}
              >
                {section.combos.map((combo, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      background: "white",
                    }}
                  >
                    <h3>{combo.name}</h3>
                    <p style={{ fontSize: "0.9rem", color: "#555" }}>{combo.subtitle}</p>
                    <button
                      onClick={() => setSelectedCombo(combo)}
                      style={{
                        marginTop: "1rem",
                        backgroundColor: "#E91E28",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Order
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {selectedCombo && (
        <div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem" }}>
          <button
            onClick={() => setSelectedCombo(null)}
            style={{
              background: "none",
              border: "1px solid #E91E28",
              color: "#E91E28",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              marginBottom: "1rem",
              cursor: "pointer",
            }}
          >
            ← Back to Combos
          </button>
          <h2>{selectedCombo.name}</h2>
          <p>{selectedCombo.subtitle}</p>

          {/* Customization logic will go here */}
          <p style={{ marginTop: "1rem", fontStyle: "italic" }}>Customization coming next...</p>
        </div>
      )}
    </div>
  );
}
