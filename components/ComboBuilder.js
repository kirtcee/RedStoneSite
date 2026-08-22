// components/ComboBuilder.js
import React, { useState, useMemo, useEffect } from "react";
import PizzaBuilder from "./PizzaBuilder";
import WingsBuilder from "./WingsBuilder";
import SideBuilder from "./SideBuilder";
import { priceLineItem, formatMoney } from "./Pricing";
import { useCart } from "./CartSystem";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";

const comboData = [
  {
    type: "Two Pizzas",
    combos: [
      { id: "2med", name: "2 Medium Pizzas", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2"] },
      { id: "2lrg", name: "2 Large Pizzas",  subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2"] },
      { id: "2xl",  name: "2 X-Large Pizzas", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2"] },
    ],
  },
  {
    type: "Double Combo",
    combos: [
      { id: "medCombo", name: "2 Medium Pizzas + 16 Wings", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "wings"] },
      { id: "lrgCombo", name: "2 Large Pizzas + 20 Wings",  subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "wings"] },
      { id: "xlCombo",  name: "2 X-Large Pizzas + 25 Wings", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "wings"] },
    ],
  },
  {
    type: "Pizza & Wings",
    combos: [
      { id: "smallCombo", name: "1 Small Pizza + 6 Wings",  subtitle: "3 toppings, 1 dip (upgrade to Medium available)", items: ["pizza", "wings"] },
      { id: "lrgCombo2",  name: "1 Large Pizza + 12 Wings", subtitle: "3 toppings, 1 dip (upgrade to XL available)",    items: ["pizza", "wings"] },
    ],
  },
  {
    type: "Take Care Combo",
    combos: [
      { id: "takecare", name: "2 Large Pizzas + Garlic Bread + 4 Pops", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "side"] },
    ],
  },
];

// thumbnails (swap to real paths when ready)
const comboImages = {
  "2med": "/images/combos/2-medium.jpg",
  "2lrg": "/images/combos/2-large.jpg",
  "2xl": "/images/combos/2-xl.jpg",
  medCombo: "/images/combos/2pizzas-wings.jpg",
  lrgCombo: "/images/combos/2pizzas-wings.jpg",
  xlCombo: "/images/combos/2pizzas-wings.jpg",
  smallCombo: "/images/combos/pizza-wings.jpg",
  lrgCombo2: "/images/combos/pizza-wings.jpg",
  takecare: "/images/combos/takecare.jpg",
};
const fallbackImg = "/images/menu_combos.png";

// ✅ export for menu cards
export const comboSections = comboData;
export const comboThumbFor = (id) => comboImages[id] || fallbackImg;

const comboDefaultSize = {
  "2med": "12", "2lrg": "14", "2xl": "16",
  medCombo: "12", lrgCombo: "14", xlCombo: "16",
  smallCombo: "10", lrgCombo2: "14", takecare: "14",
};

const sizeLabelMap = { "10":"Small", "12":"Medium", "14":"Large", "16":"X-Large" };
const comboWingsPieces = { medCombo:16, lrgCombo:20, xlCombo:25, smallCombo:6, lrgCombo2:12 };

function getWingsPieceOptions(comboId) {
  const base = [6, 12, 20, 30];
  if (comboId === "medCombo") return [16, 12, 20, 30];
  if (comboId === "xlCombo")  return [6, 25, 20, 30];
  return base;
}
function comboUpgradeOptions(comboId) {
  if (comboId === "smallCombo") return [{ id: "toMedium", label: "Upgrade to Medium (+$2)" }];
  if (comboId === "lrgCombo2")  return [{ id: "toXL",     label: "Upgrade to XL (+$3)" }];
  return [];
}
function findComboById(id) {
  for (const sec of comboData) {
    const hit = sec.combos.find((c) => c.id === id);
    if (hit) return hit;
  }
  return null;
}

export default function ComboBuilder({
  openComboId = null,          // <- parent controls which combo to open
  onAdd = () => {},
  onClose = () => {},
}) {
  const { addItem } = useCart();

  const [selectedCombo, setSelectedCombo] = useState(null);
  const [customizingItem, setCustomizingItem] = useState(null); // {type:'pizza'|'wings'|'side', id:'pizza1'|...}
  const [savedItems, setSavedItems] = useState({});
  const [comboSize, setComboSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [upgrade, setUpgrade] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingClose, setPendingClose] = useState(null); // fn to run after confirm

  const startCombo = (combo) => {
    setSelectedCombo(combo);
    setComboSize(comboDefaultSize[combo.id] || "12");
    setQty(1);
    setUpgrade(null);
    if (combo.id === "takecare") {
      setSavedItems({ side: { summary: "Garlic Bread + 4 Pops", fixed: true } });
    } else {
      setSavedItems({});
    }
    setIsDirty(false);
  };

  // 🔗 open from parent
  useEffect(() => {
    if (openComboId) {
      const combo = findComboById(openComboId);
      if (combo) startCombo(combo);
    }
  }, [openComboId]);

  const handleSave = (itemId, data) => {
    const size = data.size ?? comboSize ?? "12";
    const crust = data.crust ?? "Original Hand Tossed";
    const toppings =
      Array.isArray(data.toppings) ? data.toppings :
      Array.isArray(data.selectedToppings) ? data.selectedToppings : [];
    const toppingNames = toppings.length ? toppings.join(", ") : "No toppings";
    const sizeLabel = sizeLabelMap[size] || `${size}"`;
    const summary = `${sizeLabel} ${crust} – ${toppingNames}`;
    setSavedItems((prev) => ({ ...prev, [itemId]: { ...data, size, crust, toppings, summary } }));
    setCustomizingItem(null);
    setIsDirty(true);
  };

  const getLockedWingsCount = (comboId) => comboWingsPieces[comboId] || null;

  const modalPrice = useMemo(() => {
    if (!selectedCombo) return formatMoney(0);
    return formatMoney(
      priceLineItem({
        type: "combo",
        comboId: selectedCombo.id,
        upgrade,
        qty,
        meta: { sizeLocked: comboSize, items: savedItems },
      })
    );
  }, [selectedCombo, upgrade, qty, comboSize, savedItems]);

  const buildComboSummary = (combo, size, items, upg) => {
    const bits = [];
    bits.push(`${combo.name} — Size: ${sizeLabelMap[size] || `${size}"`}`);
    if (upg === "toMedium") bits.push("Upgraded to Medium");
    if (upg === "toXL") bits.push("Upgraded to XL");
    const itemLines = combo.items.map((k) => {
      if (combo.id === "takecare" && k === "side") return "Garlic Bread + 4 Pops";
      return items[k]?.summary || `${k} not customized`;
    });
    bits.push(itemLines.join(" | "));
    return bits.join(" • ");
  };

  const resetAll = () => {
    setSelectedCombo(null);
    setSavedItems({});
    setComboSize(null);
    setQty(1);
    setUpgrade(null);
    setCustomizingItem(null);
    setIsDirty(false);
  };

  const addToCart = () => {
    if (!selectedCombo) return;
    const payload = {
      type: "combo",
      comboId: selectedCombo.id,
      upgrade: upgrade || null,
      qty: Math.max(1, Number(qty) || 1),
      summary: buildComboSummary(selectedCombo, comboSize, savedItems, upgrade),
      meta: {
        sizeLocked: comboSize,
        items: selectedCombo.items.reduce((acc, key) => { acc[key] = savedItems[key]; return acc; }, {}),
      },
    };
    addItem(payload);
    onAdd(payload);
    resetAll();
    onClose();
  };

  // helper to request discard
  const askToDiscard = (discardFn) => {
    setPendingClose(() => discardFn);
  };

  return (
    <>
      {/* MAIN COMBO MODAL */}
      {/* freezeChild=false: this modal's Items list and price must reflect live
          savedItems/qty/upgrade changes, unlike the single-builder overlays below
          which benefit from staying frozen (avoids resetting builder scroll/canvas). */}
      <DebugPizzaOverlay
        open={!!selectedCombo}
        onClose={() => {
          if (isDirty) {
            askToDiscard(() => {
              resetAll();
              onClose();
            });
            return;
          }
          resetAll();
          onClose();
        }}
        mode="portal"
        blockRogue
        freezeChild={false}
      >
        {selectedCombo && (
          <div className="modal-body" style={{ padding: 0 }}>
            <div style={{ padding: "1rem 1rem 1.25rem 1rem" }}>
              {/* ===== Section: Combo Details ===== */}
              <div style={{ border: "1px solid #b8b8b8", background: "#fff", marginBottom: "1rem" }}>
                <div
                  style={{
                    background: "#8b1a1a",
                    color: "#fff",
                    padding: "0.5rem 0.75rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontFamily: "var(--font-heading, Oswald, sans-serif)",
                  }}
                >
                  Combo Details
                </div>
                <div style={{ padding: "1rem", background: "#f9f9f9" }}>
                  <h2 style={{ margin: 0 }}>{selectedCombo.name}</h2>
                  <p style={{ margin: "4px 0 8px 0", color: "#444" }}>{selectedCombo.subtitle}</p>
                  <p style={{ margin: 0, color: "#444" }}>
                    <strong>Size:</strong> {sizeLabelMap[comboSize] || `${comboSize}"`} (locked for this combo)
                  </p>
                </div>
              </div>

              {/* ===== Section: Upgrade ===== */}
              {comboUpgradeOptions(selectedCombo.id).length > 0 && (
                <div style={{ border: "1px solid #b8b8b8", background: "#fff", marginBottom: "1rem" }}>
                  <div
                    style={{
                      background: "#8b1a1a",
                      color: "#fff",
                      padding: "0.5rem 0.75rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      fontFamily: "var(--font-heading, Oswald, sans-serif)",
                    }}
                  >
                    Upgrade
                  </div>
                  <div style={{ padding: "1rem", background: "#f9f9f9" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="radio"
                          name="upgrade"
                          value=""
                          checked={!upgrade}
                          onChange={() => setUpgrade(null)}
                        />
                        <span>No upgrade</span>
                      </label>
                      {comboUpgradeOptions(selectedCombo.id).map((u) => (
                        <label key={u.id} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <input
                            type="radio"
                            name="upgrade"
                            value={u.id}
                            checked={upgrade === u.id}
                            onChange={() => setUpgrade(u.id)}
                          />
                          <span>{u.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== Section: Items ===== */}
              <div style={{ border: "1px solid #b8b8b8", background: "#fff", marginBottom: "1rem" }}>
                <div
                  style={{
                    background: "#8b1a1a",
                    color: "#fff",
                    padding: "0.5rem 0.75rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontFamily: "var(--font-heading, Oswald, sans-serif)",
                  }}
                >
                  Items
                </div>
                <div style={{ padding: "1rem", background: "#f9f9f9" }}>
                  {selectedCombo.items.map((item, idx) => {
                    const isTakeCareSide = selectedCombo.id === "takecare" && item === "side";
                    const isLast = idx === selectedCombo.items.length - 1;
                    return (
                      <div
                        key={idx}
                        style={{
                          paddingBottom: isLast ? 0 : "0.85rem",
                          marginBottom: isLast ? 0 : "0.85rem",
                          borderBottom: isLast ? "none" : "1px solid #b8b8b8",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>{item.toUpperCase()}</strong>
                          {isTakeCareSide ? (
                            <span style={{ fontSize: "0.9rem", color: "#555" }}>Included: Garlic Bread + 4 Pops</span>
                          ) : (
                            <button
                              onClick={() =>
                                setCustomizingItem({
                                  type: item.includes("pizza") ? "pizza" : item === "wings" ? "wings" : "side",
                                  id: item,
                                })
                              }
                              style={{
                                backgroundColor: "#E91E28",
                                color: "white",
                                border: "none",
                                padding: "0.5rem 1rem",
                                borderRadius: 0,
                                cursor: "pointer",
                                fontWeight: 900,
                                textTransform: "uppercase",
                                letterSpacing: ".3px",
                                fontFamily: "var(--font-heading, Oswald, sans-serif)",
                              }}
                            >
                              Customize
                            </button>
                          )}
                        </div>

                        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#444" }}>
                          {isTakeCareSide ? (
                            <span className="combo-item-status combo-item-status--ok">
                              <span className="combo-item-status__check">✓</span>
                              Garlic Bread + 4 Pops
                            </span>
                          ) : savedItems[item] ? (
                            <span className="combo-item-status combo-item-status--ok">
                              <span className="combo-item-status__check">✓</span>
                              {savedItems[item].summary}
                            </span>
                          ) : (
                            <span className="combo-item-status combo-item-status--warn">
                              <span className="combo-item-status__dot" aria-hidden="true"></span>
                              Not customized yet
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ===== Quantity & Total ===== */}
              <div style={{ border: "1px solid #b8b8b8", background: "#fff", marginBottom: "1rem" }}>
                <div
                  style={{
                    background: "#8b1a1a",
                    color: "#fff",
                    padding: "0.5rem 0.75rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontFamily: "var(--font-heading, Oswald, sans-serif)",
                  }}
                >
                  Quantity &amp; Total
                </div>
                <div style={{ padding: "1rem", background: "#f9f9f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: qty > 1 ? "#8b1a1a" : "#ddd",
                        color: qty > 1 ? "#fff" : "#999",
                        border: "none",
                        cursor: qty > 1 ? "pointer" : "default",
                        fontWeight: 900,
                        fontSize: 24,
                        lineHeight: 1,
                      }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 28, textAlign: "center", fontWeight: 900 }}>{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      aria-label="Increase quantity"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: "#8b1a1a",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 24,
                        lineHeight: 1,
                      }}
                    >
                      +
                    </button>

                    <div style={{ marginLeft: "auto", fontWeight: 800 }}>{modalPrice}</div>
                  </div>
                </div>
              </div>

              {/* ===== CTA ===== */}
              <button
                onClick={addToCart}
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: "#E91E28",
                  color: "white",
                  fontWeight: 900,
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-heading, Oswald, sans-serif)",
                }}
              >
                Add Combo to Cart — {modalPrice}
              </button>
            </div>
          </div>
        )}
      </DebugPizzaOverlay>

      {/* PIZZA BUILDER INSIDE COMBO */}
      <DebugPizzaOverlay
        open={customizingItem?.type === "pizza"}
        onClose={() => {
          // if user tries to close pizza builder but we have combo progress → warn
          if (isDirty) {
            askToDiscard(() => {
              resetAll();
              onClose();
            });
            return;
          }
          setCustomizingItem(null);
        }}
        mode="portal"
        blockRogue
      >
        {customizingItem?.type === "pizza" && (
          <PizzaBuilder
            initialData={savedItems[customizingItem.id] || {}}
            includedToppings={3}
            lockedSize={comboSize}
            allowSizeChoice={false}
            forceResponsiveStack
            onSave={(data) =>
              handleSave(customizingItem.id, {
                ...data,
                size: comboSize,
                crust: data.crust,
                toppings: Array.isArray(data.toppings) ? data.toppings : data.selectedToppings,
              })
            }
          />
        )}
      </DebugPizzaOverlay>

      {/* WINGS BUILDER INSIDE COMBO */}
      <DebugPizzaOverlay
        open={customizingItem?.type === "wings"}
        onClose={() => {
          if (isDirty) {
            askToDiscard(() => {
              resetAll();
              onClose();
            });
            return;
          }
          setCustomizingItem(null);
        }}
        mode="portal"
        blockRogue
      >
        {customizingItem?.type === "wings" && (
          <div style={{ padding: "1rem" }}>
            <WingsBuilder
              initialData={savedItems[customizingItem.id] || {}}
              lockedCount={getLockedWingsCount(selectedCombo?.id)}
              allowCountChoice={false}
              pieceOptions={getWingsPieceOptions(selectedCombo?.id)}
              allowQtyChange={false}
              autoIncludeBlueCheese={false}
              forceResponsiveStack
              addToCartDirect={false}  // 👈 important: do NOT push to cart when inside combo
              onClose={() => setCustomizingItem(null)}
              onAdd={(data) => handleSave(customizingItem.id, { ...data, summary: data.summary })}
            />
          </div>
        )}
      </DebugPizzaOverlay>

      {/* SIDE BUILDER INSIDE COMBO */}
      <DebugPizzaOverlay
        open={customizingItem?.type === "side" && selectedCombo?.id !== "takecare"}
        onClose={() => {
          if (isDirty) {
            askToDiscard(() => {
              resetAll();
              onClose();
            });
            return;
          }
          setCustomizingItem(null);
        }}
        mode="portal"
        blockRogue
      >
        {customizingItem?.type === "side" && selectedCombo?.id !== "takecare" && (
          <SideBuilder
            side="Garlic Bread"
            onClose={() => setCustomizingItem(null)}
            onAdd={(data) =>
              handleSave(customizingItem.id, {
                summary: data?.summary || "Side customized",
                ...data,
              })
            }
          />
        )}
      </DebugPizzaOverlay>

      {/* RED STONE CONFIRM MODAL */}
      {pendingClose && (
        <div className="rs-confirm">
          <div className="rs-confirm__panel">
            <div className="rs-confirm__title">Discard combo?</div>
            <div className="rs-confirm__body">
              You’ve selected items for this combo. If you close now, you’ll lose them.
            </div>
            <div className="rs-confirm__actions">
              <button
                type="button"
                className="rs-btn rs-btn--ghost"
                onClick={() => setPendingClose(null)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="rs-btn rs-btn--danger"
                onClick={() => {
                  const fn = pendingClose;
                  setPendingClose(null);
                  fn?.();
                }}
              >
                Discard combo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* styles for status + confirm */}
      <style jsx>{`
        .combo-item-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          line-height: 1.2;
          padding: 4px 10px 4px 9px;
          border-radius: 4px;
          border: 1px solid transparent;
          font-family: var(--font-body, Inter, system-ui, sans-serif);
        }
        .combo-item-status--ok {
          background: #e8f5e9;
          border-color: #c8e6c9;
          color: #155724;
          font-weight: 600;
        }
        .combo-item-status--warn {
          background: rgba(233, 30, 40, 0.07);
          border-color: rgba(233, 30, 40, 0.35);
          color: #a71318;
          font-weight: 600;
        }
        .combo-item-status__dot {
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: currentColor;
          flex: 0 0 auto;
        }
        .combo-item-status__check {
          font-size: 0.85rem;
          line-height: 1;
        }
        .rs-confirm {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.38);
          z-index: 4000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
        }
        .rs-confirm__panel {
          background: #fff;
          width: min(420px, 100%);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 14px 40px rgba(0,0,0,0.16);
          border-radius: 10px;
          padding: 1.1rem 1.2rem 1rem;
          font-family: var(--font-body, Inter, system-ui, sans-serif);
        }
        .rs-confirm__title {
          font-family: var(--font-heading, Oswald, sans-serif);
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 0.35rem;
        }
        .rs-confirm__body {
          font-size: 0.9rem;
          color: #333;
          margin-bottom: 0.9rem;
        }
        .rs-confirm__actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.55rem;
        }
        .rs-btn {
          border: none;
          border-radius: 6px;
          font-weight: 700;
          padding: 0.4rem 0.9rem;
          cursor: pointer;
          font-family: var(--font-heading, Oswald, sans-serif);
          text-transform: uppercase;
          letter-spacing: .3px;
        }
        .rs-btn--ghost {
          background: #f5f5f5;
          color: #222;
        }
        .rs-btn--ghost:hover {
          background: #eaeaea;
        }
        .rs-btn--danger {
          background: #E91E28;
          color: #fff;
        }
        .rs-btn--danger:hover {
          filter: brightness(0.97);
        }
      `}</style>
    </>
  );
}
