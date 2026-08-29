// components/DealBuilder.js
//
// Coupon/deal wizard popup. Two shapes, driven by utils/dealCatalog.js:
//   - "bundle" deals (fixed named slots, e.g. 2 pizzas + wings) render like
//     ComboBuilder's existing Items list — every slot visible with its own
//     Customize button.
//   - "list" deals (one or more eligible item types, a running quantity with
//     no fixed slot count) render as a dynamic list the customer keeps
//     adding to — an accordion of eligible categories (skipped entirely when
//     there's only one, e.g. a single-pizza deal) plus an "Items added to
//     this coupon" recap with Edit/Replace per unit.
//
// Per-item customization reuses the existing PizzaBuilder/WingsBuilder/
// SideBuilder popups with addToCartDirect={false}, the same nested-overlay
// pattern ComboBuilder already uses — this file only owns the coupon-level
// wizard shell around them.
import React, { useState, useMemo, useEffect } from "react";
import PizzaBuilder from "./PizzaBuilder";
import WingsBuilder from "./WingsBuilder";
import SideBuilder from "./SideBuilder";
import { formatMoney, priceDealUnit, priceDealBundle, describePizzaFull } from "./Pricing";
import { useCart } from "./CartSystem";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";
import { findDealById } from "../utils/dealCatalog";

const RED = "#E91E28"; // kept only for the destructive "Discard coupon" button
const MAROON = "#8b1a1a";
const BORDER = "#d9c49c";
const BG = "#fdf7f0";
const BROWN = "#6b3f22";
const EDGE_BLEED = 8; // partially cancels DebugPizzaOverlay's fixed 16px side padding, leaving a smaller gap

const sectionBar = {
  background: "#000",
  color: "#fff",
  padding: "0.55rem 0.8rem",
  fontWeight: 900,
  textTransform: "uppercase",
  fontFamily: "var(--font-heading, Oswald, sans-serif)",
};

const ctaSmall = {
  backgroundColor: MAROON,
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: ".3px",
  fontFamily: "var(--font-heading, Oswald, sans-serif)",
};

const linkBtn = {
  background: "none",
  border: "none",
  padding: 0,
  color: BROWN,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};

function ctaPill(enabled) {
  return {
    display: "inline-block",
    padding: "0.9rem 2.5rem",
    borderRadius: 999,
    backgroundColor: enabled ? MAROON : "#ccc",
    color: "#fff",
    fontWeight: 900,
    fontSize: "1.05rem",
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    textTransform: "uppercase",
    fontFamily: "var(--font-heading, Oswald, sans-serif)",
    textAlign: "center",
  };
}

const removeCouponLink = {
  display: "block",
  width: "100%",
  textAlign: "center",
  background: "none",
  border: "none",
  color: BROWN,
  fontWeight: 800,
  textTransform: "uppercase",
  textDecoration: "underline",
  marginTop: 10,
  cursor: "pointer",
  fontSize: 13,
};

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

// Numbered circle matching the reference wizard: bigger, green once done,
// black with a thin surrounding ring while current, grey while pending —
// always shows its own step number (never a checkmark), except the
// dedicated final "review" circle a bundle deal ends on.
function StepCircle({ state, label, isCheck = false }) {
  const bg = state === "done" ? "#2e7d32" : state === "current" ? "#000" : "#ccc";
  const color = state === "pending" ? "#777" : "#fff";
  const circle = (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: bg,
        color,
        fontWeight: 800,
        fontSize: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isCheck ? "✓" : label}
    </div>
  );
  if (state !== "current") return <div style={{ flex: "0 0 auto" }}>{circle}</div>;
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "2px solid #000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
    >
      {circle}
    </div>
  );
}

// Connector bar between two step circles — green once the step before it is
// done, light gray otherwise.
function StepConnector({ done }) {
  return <div style={{ width: 28, height: 2, background: done ? "#2e7d32" : "#ccc", flex: "0 0 auto" }} />;
}

function itemTypeImage(itemType) {
  if (itemType === "pizza-byo") return "/pizza_layers/Crust.png";
  if (itemType === "wings") return "/images/wings.jpg";
  if (itemType === "side" || itemType === "garlic-bread-choice") return "/images/side.jpg";
  return "/images/placeholder.jpg";
}

function ItemThumb({ src, size = 44 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: 4,
        overflow: "hidden",
        border: `1px solid ${BORDER}`,
        background: "#fff",
      }}
    >
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

export default function DealBuilder({ editingItem = null, onClose: onCloseProp }) {
  const { addItem, updateItem, openDealId, closeDealBuilder } = useCart();
  const onClose = onCloseProp || closeDealBuilder;
  const activeDealId = editingItem ? editingItem.dealId : openDealId;
  const deal = activeDealId ? findDealById(activeDealId) : null;
  const isBundle = deal?.mode === "bundle";

  const [bundleItems, setBundleItems] = useState({});
  const [qty, setQty] = useState(1);
  const [builds, setBuilds] = useState([]);
  const [openCategoryKey, setOpenCategoryKey] = useState(null);
  const [customizing, setCustomizing] = useState(null); // { key, itemType, slotKey, unitIndex }
  const [isDirty, setIsDirty] = useState(false);
  const [pendingClose, setPendingClose] = useState(null);

  useEffect(() => {
    if (!deal) return;
    if (editingItem) {
      setBundleItems(editingItem.meta?.items ? { ...editingItem.meta.items } : {});
      setBuilds(Array.isArray(editingItem.meta?.builds) ? [...editingItem.meta.builds] : []);
      setQty(editingItem.qty || 1);
    } else {
      setBundleItems({});
      setBuilds([]);
      setQty(1);
    }
    setOpenCategoryKey(null);
    setCustomizing(null);
    setIsDirty(false);
  }, [deal?.id, editingItem]);

  const resetAll = () => {
    setBundleItems({});
    setBuilds([]);
    setQty(1);
    setOpenCategoryKey(null);
    setCustomizing(null);
    setIsDirty(false);
  };

  const askToDiscard = (fn) => setPendingClose(() => fn);

  const handleCloseWizard = () => {
    if (isDirty) {
      askToDiscard(() => {
        resetAll();
        onClose();
      });
      return;
    }
    resetAll();
    onClose();
  };

  // ---- Bundle mode ----
  const bundleSlotComplete = (key) => !!bundleItems[key];
  const bundleIsComplete = isBundle && (deal.items || []).every(bundleSlotComplete);
  const currentBundleKey = isBundle ? (deal.items || []).find((k) => !bundleSlotComplete(k)) : null;

  const startSlot = (key) => {
    const config = deal.build[key];
    setCustomizing({ key, itemType: config.itemType, slotKey: key, unitIndex: null });
  };

  const commitSlot = (key, payload) => {
    setBundleItems((prev) => ({ ...prev, [key]: payload }));
    setCustomizing(null);
    setIsDirty(true);
  };

  const bundleTotalCents = useMemo(
    () => (isBundle ? priceDealBundle(deal, bundleItems) * Math.max(1, Number(qty) || 1) : 0),
    [isBundle, deal, bundleItems, qty]
  );

  // ---- List mode ----
  const eligibleItems = deal?.eligibleItems || [];
  const singleEligible = eligibleItems.length === 1 ? eligibleItems[0] : null;
  const minQty = deal?.minQty || 1;
  const maxQty = deal?.maxQty || null;
  const listIsComplete = !isBundle && builds.length >= minQty;
  const listAtMax = !isBundle && maxQty != null && builds.length >= maxQty;
  const nextUnitRequired = !isBundle && builds.length < minQty;

  const startNewUnit = (eligibleItem) => {
    setCustomizing({ key: eligibleItem.key, itemType: eligibleItem.itemType, slotKey: null, unitIndex: null });
  };

  const startEditUnit = (index) => {
    const unit = builds[index];
    if (!unit) return;
    setCustomizing({ key: unit.itemKey, itemType: unit.itemType, slotKey: null, unitIndex: index });
  };

  const removeUnit = (index) => {
    setBuilds((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const commitUnit = (eligibleItemKey, itemType, payload) => {
    const unit = { ...payload, itemKey: eligibleItemKey, itemType };
    setBuilds((prev) => {
      if (customizing?.unitIndex != null) {
        const next = prev.slice();
        next[customizing.unitIndex] = unit;
        return next;
      }
      return [...prev, unit];
    });
    setCustomizing(null);
    setIsDirty(true);
  };

  const addGarlicBreadUnit = (eligibleItem, variant) => {
    const qtyFixed = eligibleItem.qtyFixed || 1;
    const unit = {
      itemKey: eligibleItem.key,
      itemType: "garlic-bread-choice",
      sideName: variant.sideName,
      qtyFixed,
      summary: `${qtyFixed} × ${variant.sideName}`,
    };
    setBuilds((prev) => [...prev, unit]);
    setIsDirty(true);
  };

  const addToCart = () => {
    if (isBundle) {
      if (!bundleIsComplete) return;
      const payload = {
        type: "deal",
        dealId: deal.id,
        qty: Math.max(1, Number(qty) || 1),
        meta: { items: bundleItems },
      };
      if (editingItem) updateItem(editingItem.id, payload);
      else addItem(payload);
    } else {
      if (!listIsComplete) return;
      const payload = { type: "deal", dealId: deal.id, qty: 1, meta: { builds } };
      if (editingItem) updateItem(editingItem.id, payload);
      else addItem(payload);
    }
    resetAll();
    onClose();
  };

  const currentConfig = useMemo(() => {
    if (!customizing || !deal) return null;
    if (isBundle) return deal.build[customizing.slotKey];
    return eligibleItems.find((e) => e.key === customizing.key) || null;
  }, [customizing, deal, isBundle, eligibleItems]);

  const currentInitialData = useMemo(() => {
    if (!customizing) return {};
    if (customizing.unitIndex != null) return builds[customizing.unitIndex] || {};
    if (isBundle) return bundleItems[customizing.slotKey] || {};
    return {};
  }, [customizing, builds, isBundle, bundleItems]);

  const handleSubBuilderResult = (payload) => {
    if (isBundle) commitSlot(customizing.slotKey, payload);
    else commitUnit(customizing.key, customizing.itemType, payload);
  };

  if (!deal) return null;

  const bleed = { marginLeft: -EDGE_BLEED, marginRight: -EDGE_BLEED };

  return (
    <>
      <DebugPizzaOverlay
        open={!!deal}
        onClose={handleCloseWizard}
        mode="portal"
        blockRogue
        freezeChild={false}
        title="Add Items to This Coupon"
        noTopbarBorder
      >
        <div style={{ padding: "0 0 1.25rem 0" }}>
          {/* ===== Info box ===== */}
          <div style={{ ...bleed, border: `1.5px solid ${BORDER}`, borderRadius: ".1875rem", background: BG, padding: "0.9rem 1rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, color: BROWN }}>
              {deal.description || deal.subtitle} - {formatMoney(deal.price)}
            </div>

            {!isBundle && builds.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontWeight: 800, marginBottom: 6, color: "#000" }}>Items added to this coupon</div>
                {builds.map((u, i) => (
                  <div key={i} style={{ padding: "4px 0", fontSize: 13 }}>
                    (1) {u.summary || "Item"} (
                    {u.itemType !== "garlic-bread-choice" && (
                      <>
                        <button type="button" onClick={() => startEditUnit(i)} style={linkBtn}>
                          Edit
                        </button>
                        {" | "}
                      </>
                    )}
                    <button type="button" onClick={() => removeUnit(i)} style={linkBtn}>
                      Replace
                    </button>
                    )
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Step indicator ===== */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, margin: "0 0 0.5rem", flexWrap: "wrap" }}>
            {isBundle
              ? (deal.items || []).map((key, idx) => (
                  <React.Fragment key={key}>
                    {idx > 0 && <StepConnector done={bundleSlotComplete(deal.items[idx - 1])} />}
                    <StepCircle state={bundleSlotComplete(key) ? "done" : key === currentBundleKey ? "current" : "pending"} label={idx + 1} />
                  </React.Fragment>
                ))
              : builds.map((_, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <StepConnector done />}
                    <StepCircle state="done" label={idx + 1} />
                  </React.Fragment>
                ))}
            {!isBundle && !listAtMax && (
              <>
                {builds.length > 0 && <StepConnector done={false} />}
                <StepCircle state={nextUnitRequired ? "current" : "pending"} label={builds.length + 1} />
              </>
            )}
            {isBundle && (
              <>
                <StepConnector done={bundleIsComplete} />
                <StepCircle state={bundleIsComplete ? "done" : "pending"} isCheck />
              </>
            )}
          </div>

          {/* ===== Current-step label + down triangle ===== */}
          {!isBundle && !listAtMax && (
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "0.85rem", color: "#000" }}>
                {ordinal(builds.length + 1)} Item
              </div>
              <div style={{ fontSize: 16, color: "#000", marginTop: 2 }}>▼</div>
            </div>
          )}
          {isBundle && currentBundleKey && (
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "0.85rem", color: "#000" }}>
                {deal.build[currentBundleKey].label || currentBundleKey}
              </div>
              <div style={{ fontSize: 16, color: "#000", marginTop: 2 }}>▼</div>
            </div>
          )}

          {/* ===== Bundle mode: fixed slots ===== */}
          {isBundle && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: ".1875rem", overflow: "hidden", background: BG, marginBottom: "1rem" }}>
              <div style={sectionBar}>Items</div>
              <div style={{ padding: "1rem", background: BG }}>
                {(deal.items || []).map((key, idx) => {
                  const config = deal.build[key];
                  const done = bundleSlotComplete(key);
                  const isLast = idx === deal.items.length - 1;
                  return (
                    <div
                      key={key}
                      style={{
                        paddingBottom: isLast ? 0 : "0.85rem",
                        marginBottom: isLast ? 0 : "0.85rem",
                        borderBottom: isLast ? "none" : `1px solid ${BORDER}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <ItemThumb src={itemTypeImage(config.itemType)} />
                          <strong>{config.label || key}</strong>
                        </div>
                        <button type="button" onClick={() => startSlot(key)} style={ctaSmall}>
                          {done ? "Edit" : "Customize"}
                        </button>
                      </div>
                      <div style={{ marginTop: 6, marginLeft: 56, fontSize: "0.9rem", color: BROWN }}>
                        {done ? bundleItems[key].summary || "Customized" : "Not customized yet"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== List mode: eligible items ===== */}
          {!isBundle && (
            <>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: "#000",
                  fontSize: "1.05rem",
                  fontFamily: "var(--font-heading, Oswald, sans-serif)",
                  marginBottom: 6,
                }}
              >
                Items Available for This Coupon
              </div>
              <div style={{ color: BROWN, fontSize: 13, marginBottom: "1rem", textAlign: "center" }}>
                Note: Some crust types, toppings, sauces, and premium items may come with an additional charge.
              </div>

              <div style={{ ...bleed, display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
                {eligibleItems.map((it) => {
                  const expanded = !!singleEligible || openCategoryKey === it.key;
                  return (
                    <div key={it.key}>
                      <button
                        type="button"
                        onClick={() => !singleEligible && setOpenCategoryKey((k) => (k === it.key ? null : it.key))}
                        style={{
                          position: "relative",
                          width: "100%",
                          padding: "0.9rem 2.5rem",
                          background: "#000",
                          color: "#fff",
                          border: `1.5px solid ${BORDER}`,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          fontFamily: "var(--font-heading, Oswald, sans-serif)",
                          cursor: singleEligible ? "default" : "pointer",
                          textAlign: "center",
                        }}
                      >
                        <span>{it.categoryLabel || it.label}</span>
                        {!singleEligible && (
                          <span
                            style={{
                              position: "absolute",
                              right: 16,
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontSize: "1.1em",
                              color: "#fff",
                            }}
                          >
                            ▶
                          </span>
                        )}
                      </button>

                      {expanded && (
                        <div style={{ padding: "1rem", background: BG, border: `1.5px solid ${BORDER}`, borderTop: "none", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                          <ItemThumb src={itemTypeImage(it.itemType)} size={56} />
                          {it.itemType === "garlic-bread-choice" ? (
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {it.variants.map((v) => (
                                <button
                                  key={v.sideName}
                                  type="button"
                                  onClick={() => !listAtMax && addGarlicBreadUnit(it, v)}
                                  disabled={listAtMax}
                                  style={ctaSmall}
                                >
                                  + {v.label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startNewUnit(it)}
                              disabled={listAtMax}
                              style={ctaSmall}
                            >
                              + Add {it.label}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ===== Footer ===== */}
          {isBundle && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: ".1875rem", overflow: "hidden", background: BG, marginBottom: "1rem" }}>
              <div style={sectionBar}>Quantity &amp; Total</div>
              <div style={{ padding: "1rem", background: BG, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    backgroundColor: qty > 1 ? MAROON : "#ddd",
                    color: qty > 1 ? "#fff" : "#999",
                    border: "none", cursor: qty > 1 ? "pointer" : "default",
                    fontWeight: 900, fontSize: 20,
                  }}
                >
                  −
                </button>
                <span style={{ minWidth: 24, textAlign: "center", fontWeight: 900 }}>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: MAROON, color: "#fff", border: "none", cursor: "pointer", fontWeight: 900, fontSize: 20 }}
                >
                  +
                </button>
                <div style={{ marginLeft: "auto", fontWeight: 800 }}>{formatMoney(bundleTotalCents)}</div>
              </div>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <button onClick={addToCart} disabled={isBundle ? !bundleIsComplete : !listIsComplete} style={ctaPill(isBundle ? bundleIsComplete : listIsComplete)}>
              Done with This Coupon
            </button>
            <button type="button" onClick={handleCloseWizard} style={removeCouponLink}>
              REMOVE COUPON
            </button>
          </div>
        </div>
      </DebugPizzaOverlay>

      {/* ===== PIZZA SUB-BUILDER ===== */}
      <DebugPizzaOverlay open={customizing?.itemType === "pizza-byo"} onClose={() => setCustomizing(null)} mode="portal" blockRogue>
        {customizing?.itemType === "pizza-byo" && currentConfig && (
          <PizzaBuilder
            initialData={currentInitialData}
            includedToppings={currentConfig.includedToppings}
            lockedSize={currentConfig.size}
            allowSizeChoice={false}
            forceResponsiveStack
            onSave={(data) => {
              const size = currentConfig.size;
              const crust = data.crust;
              const toppings = Array.isArray(data.toppings)
                ? data.toppings
                : Array.isArray(data.selectedToppings)
                ? data.selectedToppings
                : [];
              const summary = describePizzaFull({ ...data, size, crust, toppings });
              handleSubBuilderResult({ ...data, size, crust, toppings, summary });
            }}
          />
        )}
      </DebugPizzaOverlay>

      {/* ===== WINGS SUB-BUILDER ===== */}
      <DebugPizzaOverlay open={customizing?.itemType === "wings"} onClose={() => setCustomizing(null)} mode="portal" blockRogue>
        {customizing?.itemType === "wings" && currentConfig && (
          <div style={{ padding: "1rem" }}>
            <WingsBuilder
              initialData={currentInitialData}
              lockedCount={currentConfig.count}
              allowCountChoice={false}
              pieceOptions={[currentConfig.count]}
              allowQtyChange={false}
              forceResponsiveStack
              addToCartDirect={false}
              onClose={() => setCustomizing(null)}
              onAdd={(data) => handleSubBuilderResult(data)}
            />
          </div>
        )}
      </DebugPizzaOverlay>

      {/* ===== SIDE SUB-BUILDER ===== */}
      <DebugPizzaOverlay open={customizing?.itemType === "side"} onClose={() => setCustomizing(null)} mode="portal" blockRogue>
        {customizing?.itemType === "side" && currentConfig && (
          <SideBuilder
            side={currentConfig.sideName}
            lockedSize={currentConfig.lockedSize || null}
            allowSizeChoice={!currentConfig.lockedSize}
            initialData={currentInitialData}
            addToCartDirect={false}
            onClose={() => setCustomizing(null)}
            onAdd={(data) => handleSubBuilderResult(data)}
          />
        )}
      </DebugPizzaOverlay>

      {/* ===== Discard confirmation ===== */}
      {pendingClose && (
        <div className="rs-confirm">
          <div className="rs-confirm__panel">
            <div className="rs-confirm__title">Discard coupon?</div>
            <div className="rs-confirm__body">
              You've added items to this coupon. If you close now, you'll lose them.
            </div>
            <div className="rs-confirm__actions">
              <button type="button" className="rs-btn rs-btn--ghost" onClick={() => setPendingClose(null)}>
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
                Discard coupon
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .rs-confirm {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.38);
          z-index: 4000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
        }
        .rs-confirm__panel {
          background: #fff;
          width: min(420px, 100%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.16);
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
          letter-spacing: 0.3px;
        }
        .rs-btn--ghost {
          background: #f5f5f5;
          color: #222;
        }
        .rs-btn--ghost:hover {
          background: #eaeaea;
        }
        .rs-btn--danger {
          background: ${RED};
          color: #fff;
        }
        .rs-btn--danger:hover {
          filter: brightness(0.97);
        }
      `}</style>
    </>
  );
}
