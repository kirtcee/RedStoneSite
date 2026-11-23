// components/PopsPicker.js
// Lets a customer distribute a fixed, included pop count (e.g. the Take
// Care Combo's "4 Pops") across any mix of can flavors — or skip picking
// entirely with "Assorted". Not priced per-can; the pops are already baked
// into the combo's flat price, this just captures what the kitchen should
// actually pack.
import React, { useMemo, useState } from "react";

export const CAN_OPTIONS = [
  "Coke", "Coke Zero", "Diet Coke", "Dr Pepper", "Mug Root Beer",
  "Brisk Iced Tea", "Pepsi", "Diet Pepsi", "Gingerale",
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
  const LIGHT_BORDER = "var(--menu-box-border)"; // thin dark-brown-tan border (--menu-box-border)
  const LIGHT_BG = "var(--menu-box-bg)";     // cream box fill (--menu-box-bg)
  const TEXT_BROWN = "var(--text-brown)";   // body text color inside the box
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
  // e.g. { Coke: 2, Sprite: 1 } -> ["Coke", "Coke", "Sprite"]
  const slots = useMemo(
    () => options.flatMap((o) => Array.from({ length: picks[o] || 0 }, () => o)),
    [options, picks]
  );

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
            className={`pops-assorted${assorted ? " is-on" : ""}`}
            aria-pressed={assorted}
          >
            {assorted ? "✓ Assorted (Staff's Choice)" : "Assorted (Staff's Choice)"}
          </button>

          {/* Your picks: one slot per included pop. Tap a filled slot to
              take that pop back out. */}
          <div className="pops-slots" aria-label="Your pops">
            {Array.from({ length: count }).map((_, i) => {
              const flavor = assorted ? "Assorted" : slots[i];
              return flavor && !assorted ? (
                <button
                  key={i}
                  type="button"
                  className="pops-slot is-filled"
                  onClick={() => updatePick(flavor, -1)}
                  aria-label={`Remove one ${flavor}`}
                >
                  <span className="pops-slot__name">{flavor}</span>
                  <span className="pops-slot__x" aria-hidden="true">✕</span>
                </button>
              ) : (
                <div key={i} className={`pops-slot${assorted ? " is-assorted" : ""}`}>
                  {assorted ? "Assorted" : `Pop ${i + 1}`}
                </div>
              );
            })}
          </div>

          {/* Flavours: tap to add one (again for another). */}
          <div className={`pops-grid${assorted ? " is-disabled" : ""}`}>
            {options.map((opt) => {
              const qty = picks[opt] || 0;
              const full = total >= count;
              return (
                <button
                  key={opt}
                  type="button"
                  className={`pops-flavor${qty ? " is-picked" : ""}`}
                  onClick={() => updatePick(opt, 1)}
                  disabled={assorted || (full && qty === 0) || full}
                  aria-label={`Add ${opt}${qty ? ` (${qty} picked)` : ""}`}
                >
                  <span className="pops-flavor__name">{opt}</span>
                  {qty > 0 && <span className="pops-flavor__count">×{qty}</span>}
                </button>
              );
            })}
          </div>

          <div
            className="pops-status"
            style={{ color: assorted || remaining === 0 ? "#289c52" : MAROON }}
          >
            {assorted
              ? "Assortment selected."
              : remaining === 0
              ? `All ${count} pops selected.`
              : `Tap a flavour to add it. ${remaining} more pop${remaining === 1 ? "" : "s"} to pick.`}
          </div>
        </div>
      </div>

      <div className="rs-pill-row">
        <button
          type="button"
          onClick={onClose}
          className="rs-pill-btn rs-pill-btn--outline"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave({ assorted, picks, summary: buildSummary() })}
          className="rs-pill-btn"
        >
          Save Pops
        </button>
      </div>
      <style jsx>{`
        .pops-assorted {
          width: 100%;
          padding: 0.75rem 1rem;
          margin-bottom: 0.9rem;
          background: #fff;
          color: #111;
          border: 2px solid ${MAROON};
          border-radius: 30px;
          font-weight: 900;
          font-family: var(--font-heading), Oswald, sans-serif;
          font-size: 1.05rem;
          text-transform: uppercase;
          cursor: pointer;
        }
        .pops-assorted.is-on {
          background: ${MAROON};
          color: #fff;
        }
        .pops-slots {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 0.9rem;
        }
        .pops-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 44px;
          padding: 0.4rem 0.6rem;
          border: 2px dashed var(--menu-box-border);
          border-radius: 8px;
          background: #fff;
          color: #999;
          font-size: 0.9rem;
          font-weight: 700;
          text-align: center;
        }
        .pops-slot.is-assorted {
          border-style: solid;
          color: #289c52;
        }
        .pops-slot.is-filled {
          border: 2px solid ${MAROON};
          background: ${MAROON};
          color: #fff;
          cursor: pointer;
        }
        .pops-slot__name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pops-slot__x {
          flex: 0 0 auto;
          font-size: 0.8rem;
          opacity: 0.85;
        }
        .pops-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        @media (min-width: 640px) {
          .pops-grid,
          .pops-slots {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        .pops-grid.is-disabled {
          opacity: 0.45;
        }
        .pops-flavor {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0.5rem 0.6rem;
          border: 1px solid var(--menu-box-border);
          border-radius: 8px;
          background: #fff;
          color: #111;
          font-weight: 700;
          font-size: 0.92rem;
          line-height: 1.15;
          text-align: center;
          cursor: pointer;
        }
        .pops-flavor:disabled {
          cursor: default;
          opacity: 0.5;
        }
        .pops-flavor.is-picked {
          border-color: ${MAROON};
          box-shadow: inset 0 0 0 1px ${MAROON};
          opacity: 1;
        }
        .pops-flavor__name {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .pops-flavor__count {
          position: absolute;
          top: -8px;
          right: -6px;
          min-width: 24px;
          height: 24px;
          padding: 0 6px;
          border-radius: 12px;
          background: ${MAROON};
          color: #fff;
          font-size: 0.8rem;
          font-weight: 900;
          line-height: 24px;
        }
        .pops-status {
          margin-top: 0.9rem;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}
