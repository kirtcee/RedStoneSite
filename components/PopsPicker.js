// components/PopsPicker.js
// Lets a customer distribute a fixed, included pop count (e.g. the Take
// Care Combo's "4 Pops") across any mix of can flavors — or skip picking
// entirely with "Assorted". Not priced per-can; the pops are already baked
// into the combo's flat price, this just captures what the kitchen should
// actually pack.
import React, { useMemo, useState } from "react";

export const CAN_OPTIONS = [
  "Coke", "Coke Zero", "Diet Coke", "Dr Pepper", "Mug Root Beer",
  "Brisk Iced Tea", "Fuze Iced Tea", "Pepsi", "Diet Pepsi", "Gingerale",
  "Sprite", "Orange Crush", "Grape Crush", "Crush Cream Soda",
];

export default function PopsPicker({
  count = 4,
  options = CAN_OPTIONS,
  initialData = {},
  onClose = () => {},
  onSave = () => {},
}) {
  const MAROON = "#8b1a1a";
  const LIGHT_BORDER = "#d9c49c"; // thin dark-brown-tan border (--menu-box-border)
  const LIGHT_BG = "#fdf7f0";     // cream box fill (--menu-box-bg)
  const TEXT_BROWN = "#6b3f22";   // body text color inside the box
  const BOX_RADIUS = ".1875rem";

  const [assorted, setAssorted] = useState(!!initialData.assorted);
  const [picks, setPicks] = useState(() => {
    const out = {};
    options.forEach((o) => {
      out[o] = Math.max(0, Number(initialData.picks?.[o]) || 0);
    });
    return out;
  });

  const total = useMemo(
    () => Object.values(picks).reduce((sum, n) => sum + (Number(n) || 0), 0),
    [picks]
  );
  const remaining = Math.max(0, count - total);

  const updatePick = (opt, delta) => {
    setAssorted(false);
    setPicks((prev) => {
      if (delta > 0 && total >= count) return prev;
      const next = Math.max(0, (prev[opt] || 0) + delta);
      return { ...prev, [opt]: next };
    });
  };

  const toggleAssorted = () => {
    setAssorted((prev) => !prev);
    setPicks((prev) => {
      const cleared = {};
      Object.keys(prev).forEach((k) => { cleared[k] = 0; });
      return cleared;
    });
  };

  const canSave = assorted || total === count;

  const buildSummary = () => {
    if (assorted) return `${count} Pops (Assorted)`;
    const bits = Object.entries(picks)
      .filter(([, n]) => n > 0)
      .map(([label, n]) => `${label} × ${n}`);
    return `${count} Pops: ${bits.join(", ")}`;
  };

  const circleBtn = (enabled) => ({
    background: enabled ? MAROON : "#ddd",
    color: enabled ? "#fff" : "#888",
    borderRadius: "50%",
    width: 34,
    height: 34,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1,
  });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 720,
        margin: "0 auto",
        background: "#fff",
        color: TEXT_BROWN,
        fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ border: `1px solid ${LIGHT_BORDER}`, borderRadius: BOX_RADIUS, overflow: "hidden", marginBottom: "1rem" }}>
        <div
          style={{
            background: "#000",
            color: "#fff",
            padding: "0.55rem 0.8rem",
            fontWeight: 900,
            textTransform: "uppercase",
            fontFamily: "var(--font-heading), Oswald, sans-serif",
          }}
        >
          Choose Your {count} Pops
        </div>
        <div style={{ padding: "1rem", background: LIGHT_BG }}>
          <p style={{ margin: "0 0 0.75rem", color: TEXT_BROWN, fontSize: ".9rem" }}>
            Mix and match any {count} cans, or let us pick an assortment for you.
          </p>

          <button
            type="button"
            onClick={toggleAssorted}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              marginBottom: "0.9rem",
              background: assorted ? MAROON : "#fff",
              color: assorted ? "#fff" : "#111",
              border: `2px solid ${MAROON}`,
              borderRadius: 8,
              fontWeight: 900,
              fontFamily: "var(--font-heading), Oswald, sans-serif",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {assorted ? "✓ Assorted (Staff's Choice)" : "Assorted (Staff's Choice)"}
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.6rem",
              opacity: assorted ? 0.45 : 1,
              pointerEvents: assorted ? "none" : "auto",
            }}
          >
            {options.map((opt) => {
              const qty = picks[opt] || 0;
              return (
                <div
                  key={opt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "0.5rem 0.6rem",
                    background: "#fff",
                    border: `1px solid ${LIGHT_BORDER}`,
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: ".85rem", fontWeight: 700, minWidth: 0 }}>{opt}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}>
                    <button
                      type="button"
                      onClick={() => updatePick(opt, -1)}
                      style={circleBtn(qty > 0)}
                      disabled={qty <= 0}
                      aria-label={`Decrease ${opt}`}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 18, textAlign: "center", fontWeight: 900 }}>{qty}</span>
                    <button
                      type="button"
                      onClick={() => updatePick(opt, 1)}
                      style={circleBtn(total < count)}
                      disabled={total >= count}
                      aria-label={`Increase ${opt}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "0.9rem",
              fontWeight: 900,
              color: assorted ? "#289c52" : remaining === 0 ? "#289c52" : MAROON,
            }}
          >
            {assorted
              ? "Assortment selected."
              : remaining === 0
              ? `All ${count} pops selected.`
              : `${remaining} more pop${remaining === 1 ? "" : "s"} to pick.`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, border: `1px solid ${LIGHT_BORDER}`, borderRadius: BOX_RADIUS, overflow: "hidden" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: "1rem",
            background: LIGHT_BG,
            color: TEXT_BROWN,
            border: "none",
            borderRight: `1px solid ${LIGHT_BORDER}`,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave({ assorted, picks, summary: buildSummary() })}
          style={{
            flex: 1,
            padding: "1rem",
            background: canSave ? MAROON : "#ccc",
            color: "#fff",
            border: "none",
            fontWeight: 900,
            cursor: canSave ? "pointer" : "not-allowed",
            textTransform: "uppercase",
            fontFamily: "var(--font-heading), Oswald, sans-serif",
          }}
        >
          Save Pops
        </button>
      </div>
    </div>
  );
}
