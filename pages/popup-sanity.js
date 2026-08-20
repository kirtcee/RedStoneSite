// pages/popup-sanity.js
'use client';

import React, { useState } from "react";
import DebugPizzaOverlay from "../components/modals/DebugPizzaOverlay";

// Universal import so this page never crashes if the export shape changes
import * as PB from "../components/PizzaBuilder";
const PizzaBuilder = (PB && (PB.default || PB.PizzaBuilder)) || null;

export default function PopupSanity() {
  const [openMode, setOpenMode] = useState(null); // "takeover" | "portal" | null
  const [initialData] = useState({
    type: "pizza-byo",
    size: "12",
    crust: "",
    toppings: [],
  });

  const content = PizzaBuilder ? (
    <PizzaBuilder
      presetToppings={[]}
      initialData={initialData}
      onSave={(payload) => {
        console.log("[sanity] payload:", payload);
        alert("Saved (see console). Closing overlay.");
        setOpenMode(null);
      }}
    />
  ) : (
    <div style={{ padding: 16, color: "#b00", background: "#fff3f3", border: "1px solid #f6caca", borderRadius: 6 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>PizzaBuilder export not found.</div>
      <div>We tried both <code>default</code> and <code>named</code> (<code>PizzaBuilder</code>) exports from <code>components/PizzaBuilder</code>.</div>
      <div style={{ marginTop: 8 }}>
        Module keys: <code>{JSON.stringify(Object.keys(PB || {}))}</code>
      </div>
    </div>
  );

  return (
    <main style={{ padding: 20 }}>
      <h1>Popup Sanity Test</h1>
      <p>Compare behavior with and without a nested scroller.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => setOpenMode("takeover")} style={btn}>
          Open TAKEOVER (document scroll)
        </button>
        <button type="button" onClick={() => setOpenMode("portal")} style={btn}>
          Open PORTAL (nested scroll)
        </button>
        {openMode && (
          <button type="button" onClick={() => setOpenMode(null)} style={btnSecondary}>
            Close
          </button>
        )}
      </div>

      {/* Some filler below so you can scroll the page when takeover is open */}
      <div style={{ height: 600, background: "#fafafa", border: "1px dashed #ddd", padding: 12 }}>
        Page content placeholder
      </div>

      {/* Overlay */}
      {openMode && (
        <DebugPizzaOverlay
          open={true}
          onClose={() => setOpenMode(null)}
          mode={openMode}         // "takeover" uses page scroll; "portal" has its own scroller
          blockRogue={true}       // blocks a[href="#"] and form submits at capture phase
        >
          {content}
        </DebugPizzaOverlay>
      )}
    </main>
  );
}

const btn = {
  padding: "8px 12px",
  background: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
};
const btnSecondary = {
  padding: "8px 12px",
  background: "#eee",
  color: "#111",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
};
