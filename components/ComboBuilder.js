// components/ComboBuilder.js
import React, { useState, useMemo, useEffect } from "react";
import PizzaBuilder from "./PizzaBuilder";
import WingsBuilder from "./WingsBuilder";
import SideBuilder from "./SideBuilder";
import PopsPicker from "./PopsPicker";
import { priceLineItem, formatMoney, describePizzaFull } from "./Pricing";
import { useCart } from "./CartSystem";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";
import {
  comboSections,
  comboThumbFor,
  comboDefaultSize,
  sizeLabelMap,
  comboWingsPieces,
  getWingsPieceOptions,
  comboUpgradeOptions,
  findComboById,
  comboItemLabel,
} from "../utils/comboCatalog";

// re-exported for existing consumers (e.g. pages/menu.js)
export { comboSections, comboThumbFor };

export default function ComboBuilder({
  openComboId = null,          // <- parent controls which combo to open
  editingItem = null,          // <- when set (a saved cart item, type "combo"), reopen it pre-filled instead of starting fresh
  onAdd = () => {},
  onClose = () => {},
}) {
  const { addItem, updateItem } = useCart();

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
      setSavedItems({ bread: { summary: "Garlic Bread", fixed: true } });
    } else {
      setSavedItems({});
    }
    setIsDirty(false);
  };

  const startComboFromEdit = (combo, item) => {
    setSelectedCombo(combo);
    setComboSize(item.meta?.sizeLocked || comboDefaultSize[combo.id] || "12");
    setQty(item.qty || 1);
    setUpgrade(item.upgrade || null);
    const items = { ...(item.meta?.items || {}) };
    // Self-heal older takecare cart entries saved before bread/pops were
    // split out of the combined "side" slot.
    if (combo.id === "takecare" && !items.bread) {
      items.bread = { summary: "Garlic Bread", fixed: true };
    }
    setSavedItems(items);
    setIsDirty(false);
  };

  // 🔗 open from parent — editing an existing cart item takes precedence
  // over starting a brand-new combo.
  useEffect(() => {
    if (editingItem) {
      const combo = findComboById(editingItem.comboId);
      if (combo) startComboFromEdit(combo, editingItem);
      return;
    }
    if (openComboId) {
      const combo = findComboById(openComboId);
      if (combo) startCombo(combo);
    }
  }, [openComboId, editingItem]);

  const handleSave = (itemId, data) => {
    // Only pizza slots ("pizza", "pizza1", "pizza2") get the pizza-shaped
    // summary — wings/side slots already carry their own correct summary
    // from their builder's onAdd payload, which must not be overwritten.
    if (itemId.startsWith("pizza")) {
      const size = data.size ?? comboSize ?? "12";
      const crust = data.crust ?? "Original Hand Tossed";
      const toppings =
        Array.isArray(data.toppings) ? data.toppings :
        Array.isArray(data.selectedToppings) ? data.selectedToppings : [];
      const summary = describePizzaFull({ ...data, size, crust, toppings });
      setSavedItems((prev) => ({ ...prev, [itemId]: { ...data, size, crust, toppings, summary } }));
    } else {
      setSavedItems((prev) => ({ ...prev, [itemId]: { ...data } }));
    }
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

  // The item-by-item breakdown lives in meta.items and is rendered
  // structurally wherever a combo appears (cart dropdown, full cart, etc.),
  // so this stays a short header line rather than cramming every sub-item
  // description into one string.
  const buildComboSummary = (combo, size, items, upg) => {
    const sizeLabel = sizeLabelMap[size] || `${size}"`;
    const bits = [`${combo.name} (${sizeLabel})`];
    if (upg === "toMedium") bits.push("Upgraded to Medium");
    if (upg === "toXL") bits.push("Upgraded to XL");
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

  const comboIsComplete =
    !!selectedCombo && selectedCombo.items.every((k) => !!savedItems[k]);

  const addToCart = () => {
    if (!selectedCombo || !comboIsComplete) return;
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
    if (editingItem) {
      updateItem(editingItem.id, payload);
    } else {
      addItem(payload);
    }
    onAdd(payload);
    resetAll();
    onClose();
  };

  // helper to request discard
  const askToDiscard = (discardFn) => {
    setPendingClose(() => discardFn);
  };

  // ===== Theme (matches the Pizza Builder's cream-box makeover) =====
  const MAROON = "#8b1a1a";
  const LIGHT_BORDER = "#d9c49c"; // thin dark-brown-tan border (--menu-box-border)
  const LIGHT_BG = "#fdf7f0";     // cream box fill (--menu-box-bg)
  const TEXT_BROWN = "#6b3f22";   // body text color inside the boxes
  const BOX_RADIUS = ".1875rem";

  // Wraps a section (black header bar + cream body) in the same
  // bordered/rounded box used by the Pizza Builder's Section component.
  const Section = ({ title, children }) => (
    <div style={{ border: `1px solid ${LIGHT_BORDER}`, borderRadius: BOX_RADIUS, overflow: "hidden", marginBottom: "1rem" }}>
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "0.5rem 0.75rem",
          fontWeight: 900,
          textTransform: "uppercase",
          fontFamily: "var(--font-heading, Oswald, sans-serif)",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "1rem", background: LIGHT_BG }}>{children}</div>
    </div>
  );

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
            <div style={{ padding: "1rem 1rem 1.25rem 1rem", color: TEXT_BROWN }}>
              {/* ===== Section: Combo Details ===== */}
              <Section title="Combo Details">
                <h2 style={{ margin: 0 }}>{selectedCombo.name}</h2>
                <p style={{ margin: "4px 0 8px 0", color: TEXT_BROWN }}>{selectedCombo.subtitle}</p>
                <p style={{ margin: 0, color: TEXT_BROWN }}>
                  <strong>Size:</strong> {sizeLabelMap[comboSize] || `${comboSize}"`} (locked for this combo)
                </p>
              </Section>

              {/* ===== Section: Upgrade ===== */}
              {comboUpgradeOptions(selectedCombo.id).length > 0 && (
                <Section title="Upgrade">
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="radio"
                        name="upgrade"
                        value=""
                        checked={!upgrade}
                        onChange={() => setUpgrade(null)}
                        style={{ accentColor: MAROON }}
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
                          style={{ accentColor: MAROON }}
                        />
                        <span>{u.label}</span>
                      </label>
                    ))}
                  </div>
                </Section>
              )}

              {/* ===== Section: Items ===== */}
              <Section title="Items">
                {selectedCombo.items.map((item, idx) => {
                  const isFixedItem = selectedCombo.id === "takecare" && item === "bread";
                  const isLast = idx === selectedCombo.items.length - 1;
                  return (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: isLast ? 0 : "0.85rem",
                        marginBottom: isLast ? 0 : "0.85rem",
                        borderBottom: isLast ? "none" : `1px solid ${LIGHT_BORDER}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{comboItemLabel(item)}</strong>
                        {isFixedItem ? (
                          <span style={{ fontSize: "0.9rem", color: TEXT_BROWN }}>Included: Garlic Bread</span>
                        ) : (
                          <button
                            onClick={() =>
                              setCustomizingItem({
                                type: item.includes("pizza")
                                  ? "pizza"
                                  : item === "wings"
                                  ? "wings"
                                  : item === "pops"
                                  ? "pops"
                                  : "side",
                                id: item,
                              })
                            }
                            style={{
                              backgroundColor: MAROON,
                              color: "white",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: BOX_RADIUS,
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

                      <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: TEXT_BROWN }}>
                        {isFixedItem ? (
                          <span className="combo-item-status combo-item-status--ok">
                            <span className="combo-item-status__check">✓</span>
                            Garlic Bread
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
              </Section>

              {/* ===== Quantity & Total ===== */}
              <Section title="Quantity & Total">
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
                      backgroundColor: qty > 1 ? MAROON : "#ddd",
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
                      backgroundColor: MAROON,
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
              </Section>

              {/* ===== CTA ===== */}
              {!comboIsComplete && (
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: MAROON, fontWeight: 700 }}>
                  Customize every item above before adding this combo to your cart.
                </p>
              )}
              <button
                onClick={addToCart}
                disabled={!comboIsComplete}
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: comboIsComplete ? MAROON : "#ccc",
                  color: "white",
                  fontWeight: 900,
                  border: "none",
                  borderRadius: BOX_RADIUS,
                  cursor: comboIsComplete ? "pointer" : "not-allowed",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-heading, Oswald, sans-serif)",
                }}
              >
                {editingItem ? "Save Changes" : "Add Combo to Cart"} — {modalPrice}
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
              autoIncludeDips={false}
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
            initialData={savedItems[customizingItem.id] || {}}
            onClose={() => setCustomizingItem(null)}
            addToCartDirect={false}
            onAdd={(data) =>
              handleSave(customizingItem.id, {
                summary: data?.summary || "Side customized",
                ...data,
              })
            }
          />
        )}
      </DebugPizzaOverlay>

      {/* POPS PICKER INSIDE COMBO (Take Care Combo's 4 included pops) */}
      <DebugPizzaOverlay
        open={customizingItem?.type === "pops"}
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
        title="Choose Your Pops"
      >
        {customizingItem?.type === "pops" && (
          <PopsPicker
            count={4}
            initialData={savedItems[customizingItem.id] || {}}
            onClose={() => setCustomizingItem(null)}
            onSave={(data) => handleSave(customizingItem.id, data)}
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
