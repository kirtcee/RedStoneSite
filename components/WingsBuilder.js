// components/WingsBuilder.js
import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from "react";
import { priceLineItem, formatMoney } from "./Pricing";
import { useCart } from "./CartSystem";

/* ---- STABLE DEFAULTS (no new refs every render) ---- */
const DEFAULT_SAUCE_OPTIONS = [
  "Mild (BBQ)", "Medium", "Hot", "Honey Garlic", "Sweet Chilli", "Hot Honey",
];
const DEFAULT_SERVE_STYLE_OPTIONS = ["Sauced & Tossed", "Sauce on Side"];
const DEFAULT_PIECE_OPTIONS = [6, 12, 20, 30];
const DEFAULT_DIPS_OPTIONS  = ["Blue Cheese", "Garlic", "Ranch"];
const DEFAULT_INCLUDED_DIPS_MAP = { 6: 1, 12: 2, 20: 3, 30: 4 };

export default function WingsBuilder({
  onClose = () => {},
  onAdd = () => {},
  initialData = {},
  lockedCount = null,
  allowCountChoice = true,
  forceResponsiveStack = false,
  allowQtyChange = true,
  autoIncludeBlueCheese = true,
  sauceOptions   = DEFAULT_SAUCE_OPTIONS,
  pieceOptions   = DEFAULT_PIECE_OPTIONS,
  dipsOptions    = DEFAULT_DIPS_OPTIONS,
  includedDipsMap = DEFAULT_INCLUDED_DIPS_MAP, // ← stable reference
  // 👇 NEW: when false, don't push to cart (for ComboBuilder)
  addToCartDirect = true,
}) {
  const { addItem } = useCart();

  // ===== Theme (match Pizza Builder) =====
  const MAROON = "#8b1a1a";
  const LIGHT_BORDER = "#b8b8b8";
  const LIGHT_BG = "#f9f9f9";

  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // ===== Scroll preservation =====
  const rootRef = useRef(null);
  const scrollRef = useRef({ mode: "window", node: null, top: 0 });

  useEffect(() => {
    // Prefer the modal scroller if this builder is inside a popup
    let el = rootRef.current?.parentElement;
    let modalBody = null;
    while (el) {
      if (el.classList && el.classList.contains("modal-body")) { modalBody = el; break; }
      el = el.parentElement;
    }

    if (modalBody) {
      scrollRef.current.mode = "element";
      scrollRef.current.node = modalBody;
      scrollRef.current.top = modalBody.scrollTop;
      const onScroll = () => { scrollRef.current.top = modalBody.scrollTop; };
      modalBody.addEventListener("scroll", onScroll, { passive: true });
      return () => modalBody.removeEventListener("scroll", onScroll);
    }

    // Fallback to window/page scroll
    scrollRef.current.mode = "window";
    scrollRef.current.node = null;
    scrollRef.current.top = typeof window === "undefined" ? 0 : window.scrollY;
    const onScroll = () => { scrollRef.current.top = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const restoreScroll = () => {
    if (scrollRef.current.mode === "element" && scrollRef.current.node) {
      if (scrollRef.current.node.scrollTop !== scrollRef.current.top) {
        scrollRef.current.node.scrollTop = scrollRef.current.top;
      }
    } else if (typeof window !== "undefined") {
      if (window.scrollY !== scrollRef.current.top) {
        window.scrollTo(0, scrollRef.current.top);
      }
    }
  };

  // safe resize listener
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isNarrow = forceResponsiveStack || vw < 800;

  const [selectedSauce, setSelectedSauce] = useState(
    initialData.sauce && sauceOptions.includes(initialData.sauce)
      ? initialData.sauce
      : sauceOptions[0]
  );
  const [serveStyle, setServeStyle] = useState(
    initialData.serveStyle && DEFAULT_SERVE_STYLE_OPTIONS.includes(initialData.serveStyle)
      ? initialData.serveStyle
      : DEFAULT_SERVE_STYLE_OPTIONS[0]
  );

  const defaultCount = useMemo(() => {
    if (lockedCount && pieceOptions.includes(Number(lockedCount))) return Number(lockedCount);
    if (initialData.count && pieceOptions.includes(Number(initialData.count))) return Number(initialData.count);
    return pieceOptions[0];
  }, [initialData.count, lockedCount, pieceOptions]);

  const [selectedCount, setSelectedCount] = useState(defaultCount);
  const [wingsQty, setWingsQty] = useState(
    Number(initialData.qty) > 0 ? Number(initialData.qty) : 1
  );

  const seededDips = useMemo(() => {
    const out = {};
    dipsOptions.forEach((d) => {
      out[d] = Math.max(0, Number(initialData?.dips?.[d] ?? 0));
    });
    return out;
  }, [initialData?.dips, dipsOptions]);
  const [dipQty, setDipQty] = useState(seededDips);

  const includedPerOrder = includedDipsMap[selectedCount] || 0;
  useEffect(() => {
    if (!autoIncludeBlueCheese) return;
    const included = includedPerOrder * wingsQty;
    setDipQty((prev) => ({ ...prev, "Blue Cheese": included }));
  }, [autoIncludeBlueCheese, includedPerOrder, wingsQty]);

  const increaseWingsQty = () =>
    setWingsQty((prev) => (allowQtyChange ? prev + 1 : 1));
  const decreaseWingsQty = () =>
    setWingsQty((prev) => (allowQtyChange ? Math.max(1, prev - 1) : 1));

  const updateDipQty = (dip, delta) => {
    setDipQty((prev) => ({
      ...prev,
      [dip]: Math.max(0, (prev[dip] || 0) + delta),
    }));
  };

  const selectedDipsList = Object.entries(dipQty)
    .filter(([_, qty]) => qty > 0)
    .map(([label, qty]) => ({ label, qty }));

  const isCountLocked = !!lockedCount || !allowCountChoice;

  const buildSummary = () => {
    const dipsSummary = selectedDipsList.length
      ? " | Dips: " +
        selectedDipsList.map((d) => `${d.label} × ${d.qty}`).join(", ")
      : "";
    return `${wingsQty} × ${selectedCount}-piece Wings — ${selectedSauce} (${serveStyle})${dipsSummary}`;
  };

  const currentItem = useMemo(
    () => ({ type: "wings", count: selectedCount, qty: wingsQty }),
    [selectedCount, wingsQty]
  );
  const lineSubtotalCents = priceLineItem(currentItem);
  const lineSubtotal = formatMoney(lineSubtotalCents);

  const Divider = ({ style = {} }) => (
    <div
      style={{
        borderTop: `1px solid ${LIGHT_BORDER}`,
        width: "calc(100% - 2rem)",
        margin: "12px auto",
        ...style
      }}
    />
  );

  const Section = ({ index, title, children }) => (
    <div style={{ marginBottom: "1.0rem", border: `1px solid ${LIGHT_BORDER}`, background: "#fff" }}>
      <div
        style={{
          background: MAROON,
          color: "white",
          padding: "0.5rem 0.75rem",
          fontWeight: 900,
          textTransform: "uppercase",
          fontFamily: "var(--font-heading), Oswald, sans-serif"
        }}
      >
        {index}. {title}
      </div>
      <div style={{ padding: "1rem", background: LIGHT_BG }}>{children}</div>
    </div>
  );

  const circleButtonStyle = {
    background: MAROON,
    color: "white",
    borderRadius: "50%",
    width: 48,
    height: 48,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "none",
    cursor: "pointer",
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1
  };
  const disabledCircleButtonStyle = {
    ...circleButtonStyle,
    background: "#ddd",
    color: "#888",
    cursor: "not-allowed",
  };

  useLayoutEffect(() => {
    restoreScroll();
  }, [selectedSauce, selectedCount, wingsQty, JSON.stringify(dipQty)]);

  return (
    <div
      ref={rootRef}
      style={{
        maxWidth: isNarrow ? "100%" : "880px",
        margin: "0 auto",
        background: "white",
        borderRadius: "0px",
        overflow: "visible",
        position: "relative",
        fontFamily: "var(--font-body), Inter, system-ui, sans-serif"
      }}
      onMouseDownCapture={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Serving Options */}
      <Section index={1} title="Serving Options">
        {/* Sauces */}
        <p
          style={{
            fontWeight: 900,
            marginBottom: "0.35rem",
            color: MAROON,
            fontFamily: "var(--font-heading), Oswald, sans-serif",
            fontSize: "1rem"
          }}
        >
          Choose Sauce
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(3, 1fr)",
            gap: "0.55rem",
            margin: "0.6rem 0 0.8rem 0",
          }}
        >
          {sauceOptions.map((sauce) => (
            <button
              key={sauce}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSauce(sauce); }}
              style={{
                padding: "0.55rem 0.7rem",
                backgroundColor: selectedSauce === sauce ? MAROON : "#eee",
                color: selectedSauce === sauce ? "white" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: 800,
                fontFamily: "var(--font-heading), Oswald, sans-serif",
                fontSize: ".9rem"
              }}
              title={sauce}
            >
              {sauce}
            </button>
          ))}
        </div>

        <Divider />

        {/* Serve style */}
        <p
          style={{
            fontWeight: 900,
            marginBottom: "0.35rem",
            color: MAROON,
            fontFamily: "var(--font-heading), Oswald, sans-serif",
            fontSize: "1rem"
          }}
        >
          Sauced &amp; Tossed or Sauce on Side?
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.55rem",
            marginBottom: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          {DEFAULT_SERVE_STYLE_OPTIONS.map((style) => (
            <button
              key={style}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setServeStyle(style); }}
              style={{
                padding: "0.55rem 0.7rem",
                backgroundColor: serveStyle === style ? MAROON : "#eee",
                color: serveStyle === style ? "white" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 800,
                fontFamily: "var(--font-heading), Oswald, sans-serif",
                fontSize: ".9rem"
              }}
            >
              {style}
            </button>
          ))}
        </div>

        <Divider />

        {/* Piece count */}
        <p
          style={{
            fontWeight: 900,
            marginBottom: "0.35rem",
            color: MAROON,
            fontFamily: "var(--font-heading), Oswald, sans-serif",
            fontSize: "1rem"
          }}
        >
          Choose Size
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.55rem",
            marginBottom: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          {pieceOptions.map((count) => {
            const active = selectedCount === count;
            const disabled = isCountLocked && count !== selectedCount;
            const optionPrice = formatMoney(
              priceLineItem({ type: "wings", count, qty: 1 })
            );

            return (
              <button
                key={count}
                type="button"
                onClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  if (!isCountLocked) setSelectedCount(count);
                }}
                style={{
                  flex: isNarrow ? "1 1 calc(50% - 0.55rem)" : "1 1 auto",
                  minWidth: "160px",
                  padding: "0.6rem 0.8rem",
                  backgroundColor: active ? MAROON : "#eee",
                  color: active ? "white" : "#333",
                  border: "none",
                  borderRadius: "6px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontFamily: "var(--font-heading), Oswald, sans-serif",
                }}
                disabled={disabled}
              >
                <span>{count} Pieces</span>
                <span>{optionPrice}</span>
              </button>
            );
          })}
        </div>

        {/* Qty controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem" }}>
          <p style={{ fontWeight: 900, margin: 0, color: "#333" }}>Orders</p>
          {allowQtyChange ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); decreaseWingsQty(); }}
                style={wingsQty > 1 ? circleButtonStyle : disabledCircleButtonStyle}
                disabled={wingsQty <= 1}
                aria-label="Decrease orders"
              >
                −
              </button>
              <span style={{ padding: "0 1rem", minWidth: 28, textAlign: "center", fontWeight: 900 }}>{wingsQty}</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); increaseWingsQty(); }}
                style={circleButtonStyle}
                aria-label="Increase orders"
              >
                +
              </button>
            </div>
          ) : (
            <div style={{ fontWeight: 900 }}>Qty: 1 (locked)</div>
          )}
        </div>
      </Section>

      {/* 2. Dips */}
      <Section index={2} title="Dips">
        <p style={{ fontSize: ".95rem", margin: "0 0 .8rem 0", color: "#555" }}>
          {autoIncludeBlueCheese
            ? `Each ${selectedCount}-piece order includes ${includedPerOrder} Blue Cheese dip(s) per order.`
            : "Choose any dip quantities you like."}
        </p>

        {dipsOptions.map((dip, i) => (
          <React.Fragment key={dip}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    border: `1px solid ${LIGHT_BORDER}`,
                    background: "#eee",
                  }}
                />
                <span style={{ fontWeight: 800, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {dip}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateDipQty(dip, -1); }}
                  style={(dipQty[dip] || 0) > 0 ? circleButtonStyle : disabledCircleButtonStyle}
                  disabled={(dipQty[dip] || 0) <= 0}
                  aria-label={`Decrease ${dip}`}
                >
                  −
                </button>
                <span style={{ padding: "0 1rem", minWidth: 28, textAlign: "center", fontWeight: 900 }}>
                  {dipQty[dip] || 0}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateDipQty(dip, 1); }}
                  style={circleButtonStyle}
                  aria-label={`Increase ${dip}`}
                >
                  +
                </button>
              </div>
            </div>
            {i < dipsOptions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Section>

      {/* 3. Item */}
      <Section index={3} title="Item">
        <div style={{ marginTop: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span style={{ color: "green", fontWeight: 900 }}>✔</span>
            <span style={{ fontWeight: 900 }}>({wingsQty})</span>
            <span>{selectedCount} piece wings — {selectedSauce}</span>
          </div>
          {selectedDipsList.map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span style={{ color: "green", fontWeight: 900 }}>✔</span>
              <span style={{ fontWeight: 900 }}>({item.qty})</span>
              <span>{item.label}</span>
            </div>
          ))}

          <Divider />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>Item Subtotal: <span>{lineSubtotal}</span></div>
            <div style={{ color: "#666" }}>
              {wingsQty} × {selectedCount}-pc
            </div>
          </div>
        </div>
      </Section>

      {/* Footer actions */}
      <div style={{ display: "flex", gap: 0 }}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          style={{
            flex: 1,
            padding: "1rem",
            background: "white",
            border: `1px solid ${LIGHT_BORDER}`,
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); e.stopPropagation();
            const payload = {
              type: "wings",
              summary: buildSummary(),
              sauce: selectedSauce,
              serveStyle,
              count: selectedCount,
              qty: wingsQty,
              dips: dipQty,
            };

            // 👇 ONLY add to cart if we want standalone behavior
            if (addToCartDirect) {
              addItem(payload);
            }

            onAdd(payload);
          }}
          style={{
            flex: 1,
            padding: "1rem",
            background: "#E91E28",
            color: "white",
            border: "none",
            fontWeight: 900,
            cursor: "pointer",
            textTransform: "uppercase",
            fontFamily: "var(--font-heading), Oswald, sans-serif"
          }}
        >
          Add To Order
        </button>
      </div>
    </div>
  );
}
