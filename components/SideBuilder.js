// components/SideBuilder.js
import ItemNote from "./ItemNote";
import { cleanNote } from "../utils/orderRules";
import React, { useState, useMemo, useEffect } from "react";
import { priceLineItem, formatMoney } from "./Pricing";
import { useCart } from "./CartSystem";
import ItemCheck from "./ItemCheck";

export default function SideBuilder({
  allowNote = true, // the "Note for the kitchen" box (off inside combos)
  side,
  onClose,
  onAdd = () => {},
  addToCartDirect = true,
  initialData = {},
  lockedSize = null,     // e.g. "Large" when embedded in a combo/deal that fixes the size
  allowSizeChoice = true,
}) {
  const { addItem } = useCart();

  /* —— Theme: matches the Pizza Builder's cream-box makeover —— */
  const PANEL_INNER_MAX = 840; // fits nicely inside your modal
  const MAROON = "#8b1a1a";
  const LIGHT_BORDER = "var(--menu-box-border)"; // thin dark-brown-tan border (--menu-box-border)
  const LIGHT_BG = "var(--menu-box-bg)";     // cream box fill (--menu-box-bg)
  const TEXT_BROWN = "var(--text-brown)";   // body text color inside the boxes
  const BOX_RADIUS = ".1875rem";
  const PAD_Y = "1rem"; // vertical padding in sections

  const sectionBar = {
    background: "#000",
    color: "#fff",
    padding: "0.55rem 0.8rem",
    fontFamily: "var(--font-heading, Oswald, sans-serif)",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".3px",
    margin: 0,
    fontSize: "1.3rem",
    lineHeight: 1.1,
};
  const subHeader = {
    margin: "0.9rem 0 0.45rem",
    color: TEXT_BROWN,
    fontFamily: "var(--font-heading, Oswald, sans-serif)",
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: "var(--fs-min)",
  };
  const dividerInset = {
    borderTop: 0, // former divider: no line and no extra space
    width: "calc(100% - 2rem)",
    margin: 0,
  };
  // Wraps a numbered section (black header bar + cream body) in the same
  // bordered/rounded box used by the Pizza Builder's Section component.
  const SectionBox = ({ children }) => (
    <div style={{ border: `1px solid ${LIGHT_BORDER}`, borderRadius: BOX_RADIUS, overflow: "hidden", marginBottom: "1rem" }}>
      {children}
    </div>
  );
  const circleButtonLg = {
    background: MAROON,
    color: "#fff",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "none",
    cursor: "pointer",
    fontSize: "1.4rem",
    lineHeight: 1,
  };
  const circleButtonLgDisabled = {
    ...circleButtonLg,
    background: "#ddd",
    color: "#888",
    cursor: "not-allowed",
  };
  const chip = (active) => ({
    flex: 1,
    padding: ".7rem .9rem",
    borderRadius: 6,
    border: active ? "2px solid transparent" : `2px solid ${LIGHT_BORDER}`,
    background: active ? MAROON : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 800,
    fontFamily: "var(--font-heading, Oswald, sans-serif)",
    fontSize: "1.15rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    cursor: "pointer",
  });

  /* —— Logic —— */
  // Poutine offers a Small tier too; everything else stays Regular/Large.
  const SIZE_OPTIONS = side === "Poutine" ? ["Small", "Regular", "Large"] : ["Regular", "Large"];
  const DIPS = ["Garlic", "Ranch", "Blue Cheese"];
  const isSizeSelectable = ["French Fries", "Poutine", "Shawarma Poutine", "Onion Rings"].includes(side);
  const canPickSize = isSizeSelectable && allowSizeChoice && !lockedSize;
  const hasDips = ["Cheesy Garlic Bread", "Garlic Bread"].includes(side);
  const hasGravy = side === "French Fries";
  const hasHotSauceToggle = side === "Shawarma Poutine";
  const itemSectionIndex = hasDips || hasGravy ? 3 : 2; // "Item" section number shifts when section 2 isn't shown

  const [selectedSize, setSelectedSize] = useState(initialData.size || lockedSize || "Regular");
  useEffect(() => {
    if (lockedSize) setSelectedSize(lockedSize);
  }, [lockedSize]);
  const [quantity, setQuantity] = useState(initialData.qty || 1);
  const [note, setNote] = useState(initialData.note || "");
  const [gravyQty, setGravyQty] = useState(initialData.gravy || 0);
  const [dipQty, setDipQty] = useState({
    Garlic: initialData.dips?.Garlic || 0,
    Ranch: initialData.dips?.Ranch || 0,
    "Blue Cheese": initialData.dips?.["Blue Cheese"] || 0,
  });
  const [hotSauce, setHotSauce] = useState(initialData.hotSauce || "No");

  const updateDipQty = (dip, delta) =>
    setDipQty((prev) => ({ ...prev, [dip]: Math.max(0, prev[dip] + delta) }));

  const selectedDipsList = Object.entries(dipQty)
    .filter(([_, qty]) => qty > 0)
    .map(([label, qty]) => ({ label, qty }));

  // Pricing names use "Medium" for Regular to match your Pricing table
  const sizeToPricingLabel = (size) => (size === "Regular" ? "Medium" : size);

  const pricingName = useMemo(() => {
    if (isSizeSelectable) return `${side} (${sizeToPricingLabel(selectedSize)})`;
    return side;
  }, [isSizeSelectable, side, selectedSize]);

  const currentItem = useMemo(
    () => ({ type: "side", name: pricingName, qty: quantity, gravy: gravyQty, dips: dipQty }),
    [pricingName, quantity, gravyQty, dipQty]
  );

  const lineSubtotal = formatMoney(priceLineItem(currentItem));

  const buildSummary = () => {
    const bits = [];
    bits.push(`${quantity} × ${side}${isSizeSelectable ? ` (${selectedSize})` : ""}`);
    if (hasHotSauceToggle) bits.push(`Hot Sauce Drizzle: ${hotSauce}`);
    if (hasGravy && gravyQty > 0) bits.push(`Gravy × ${gravyQty}`);
    if (selectedDipsList.length) bits.push(`Dips: ${selectedDipsList.map((d) => `${d.label} × ${d.qty}`).join(", ")}`);
    return bits.join("\n"); // one detail per line
  };

  /* —— Render —— */
  return (
    <div
      style={{
        width: "100%",
        maxWidth: `${PANEL_INNER_MAX}px`,
        margin: "0 auto",
        background: "#fff",
        color: TEXT_BROWN,
        padding: "0.9rem 0",            // EXTRA top/bottom padding for the whole popup
      }}
    >
      {/* Section 1 – Serving Options */}
      <SectionBox>
        <h3 style={sectionBar}>Serving Options</h3>

        <div className="rs-bsec" style={{ padding: `${PAD_Y} 1rem`, background: LIGHT_BG }}>
          {isSizeSelectable && canPickSize && (
            <>
              <h4 style={subHeader}>Choose Size</h4>
              <div className="rs-optgrid" style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginBottom: ".9rem" }}>
                {SIZE_OPTIONS.map((size) => {
                  const optionName = `${side} (${sizeToPricingLabel(size)})`;
                  const optionPrice = formatMoney(priceLineItem({ type: "side", name: optionName, qty: 1 }));
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={chip(active)}
                      type="button"
                    >
                      <span>{size}</span>
                      <span style={{ fontWeight: 900 }}>{optionPrice}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {isSizeSelectable && !canPickSize && (
            <div style={{ marginBottom: ".9rem", fontWeight: 800, color: TEXT_BROWN }}>
              Size: {selectedSize}
            </div>
          )}

          {hasHotSauceToggle && (
            <>
              <h4 style={subHeader}>Hot Sauce Drizzle</h4>
              <div className="rs-optgrid" style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHotSauce(opt)}
                    style={chip(hotSauce === opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={dividerInset} />

          {/* Qty row */}
          <div
            style={{
              marginTop: "0.2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p className="rs-qtyname" style={{ margin: 0 }}>{side}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={quantity > 1 ? circleButtonLg : circleButtonLgDisabled}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 900 }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                style={circleButtonLg}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </SectionBox>

      {(hasDips || hasGravy) && (
        <SectionBox>
          <h3 style={sectionBar}>{hasGravy ? "Gravy" : "Dips"}</h3>

          <div className="rs-bsec" style={{ padding: `${PAD_Y} 1rem`, background: LIGHT_BG }}>
            {hasGravy ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p className="rs-qtyname" style={{ margin: 0 }}>Gravy</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setGravyQty((g) => Math.max(0, g - 1))}
                    style={gravyQty > 0 ? circleButtonLg : circleButtonLgDisabled}
                    disabled={gravyQty <= 0}
                  >
                    −
                  </button>
                  <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 800 }}>
                    {gravyQty}
                  </span>
                  <button type="button" onClick={() => setGravyQty((g) => g + 1)} style={circleButtonLg}>
                    +
                  </button>
                </div>
              </div>
            ) : (
              DIPS.map((dip) => (
                <div
                  key={dip}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.9rem",
                    gap: "0.7rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", minWidth: 0 }}>
                    <img
                          src={`/images/dips/${dip.toLowerCase().replace(/\s+/g, "-")}.jpg`}
                          alt=""
                          style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px", flex: "0 0 auto", border: "1px solid var(--menu-box-border)", background: "#fff" }}
                      />
                    <p className="rs-qtyname" style={{ margin: 0 }}>{dip}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => updateDipQty(dip, -1)}
                      style={(dipQty[dip] || 0) > 0 ? circleButtonLg : circleButtonLgDisabled}
                      disabled={(dipQty[dip] || 0) <= 0}
                    >
                      −
                    </button>
                    <span style={{ padding: "0 0.6rem", minWidth: 28, textAlign: "center", fontWeight: 800 }}>
                      {dipQty[dip] || 0}
                    </span>
                    <button type="button" onClick={() => updateDipQty(dip, 1)} style={circleButtonLg}>
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionBox>
      )}

      {/* Summary */}
      <SectionBox>
        <h3 style={sectionBar}>Item</h3>
        <div className="rs-bsec rs-itembox" style={{ padding: `${PAD_Y} 1rem`, background: LIGHT_BG }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <ItemCheck />
            <span style={{ fontWeight: "bold" }}>({quantity})</span>
            <span>
              {side}
              {isSizeSelectable ? ` - ${selectedSize}` : ""}
            </span>
          </div>

          {hasHotSauceToggle && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <ItemCheck />
              <span>{`Hot Sauce Drizzle: ${hotSauce}`}</span>
            </div>
          )}

          {hasGravy && gravyQty > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <ItemCheck />
              <span style={{ fontWeight: "bold" }}>({gravyQty})</span>
              <span>Gravy</span>
            </div>
          )}

          {selectedDipsList.map((item, idx) => (
            <div
              key={idx}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}
            >
              <ItemCheck />
              <span style={{ fontWeight: "bold" }}>({item.qty})</span>
              <span>{item.label}</span>
            </div>
          ))}

          <div className="rs-subtotal" style={{ fontWeight: 900, marginTop: "0.9rem" }}>
            Item Subtotal: <span>{lineSubtotal}</span>
          </div>
        </div>
      </SectionBox>

      {allowNote && <ItemNote value={note} onChange={setNote} />}

      {/* Footer actions */}
      <div className="rs-pill-row rs-pill-row--compact">
        <button
          type="button"
          onClick={onClose}
          className="rs-pill-btn rs-pill-btn--outline"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const payload = {
              type: "side",
              name: pricingName,
              side,
              size: isSizeSelectable ? selectedSize : null,
              qty: quantity,
              gravy: gravyQty,
              dips: dipQty,
              hotSauce,
              summary: buildSummary(),
              ...(allowNote && note.trim() ? { note: cleanNote(note) } : {}),
            };
            if (addToCartDirect) addItem(payload);
            onAdd(payload); // parent closes the modal (and/or handles the payload itself)
          }}
          className="rs-pill-btn"
        >
          Add To Order
        </button>
      </div>
    </div>
  );
}
