// pages/diddle.js
import React, { useState } from "react";
import PizzaBuilder from "../components/PizzaBuilder";

export default function DiddlePage() {
  // Keep it super minimal: give the builder a reasonable default BYO payload
  const [initialData] = useState({
    type: "pizza-byo",
    size: "12",
    crust: "",
    toppings: [],
  });

  return (
    <main className="container" style={{ padding: "24px 0" }}>
      <h1 style={{ marginBottom: 12 }}>Pizza Builder — Isolated Test</h1>

      <PizzaBuilder
        presetToppings={[]}          // no preselection
        initialData={initialData}    // simple BYO base
        onSave={(payload) => {
          // Don’t touch cart/openCart here — just log so we can test the component alone
          console.log("[diddle] PizzaBuilder onSave payload:", payload);
          alert("Saved! Check the console for the payload.");
        }}
      />

      {/* Optional: a little spacer so you can scroll the page and try to reproduce jumps */}
      <div style={{ height: 200 }} />
    </main>
  );
}
