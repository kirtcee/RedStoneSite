// components/DrinksDipsBuilder.js
//
// Drinks / dips picker shown in the menu's popup. Every drink is a tile with
// its photo and its own − / + count, so there's one way to pick things and
// one button to add them all. The Add to Order button stays disabled until
// something is picked, so an empty $0 line can't reach the cart.
//
// Photos and prices come from utils/drinkCatalog.js. Drinks are drawn at
// their real heights relative to each other (a Red Bull is taller than a
// can, a 2L bottle fills the box).
import React, { useMemo, useState } from "react";
import { priceDrinkItem, priceDrinksDips, formatMoney } from "./Pricing";
import { useCart } from "./CartSystem";
import { DRINK_CATEGORIES, findDrink } from "../utils/drinkCatalog";

export function DrinksCategoryPanel({
  title,
  categoryId, // 'twoLiters' | 'cans' | 'other' | 'dips'
  categoryLabel,
  initialItems = [],
  onClose = () => {},
  onAdd = () => {},
  onSave = null, // editing a cart line: called with the new line instead of adding one
}) {
  const { addItem } = useCart();
  const cat = DRINK_CATEGORIES[categoryId] || { options: [] };
  const options = cat.options;
  const tallest = Math.max(1, ...options.map((o) => o.mm || 1));

  // label -> count
  const [counts, setCounts] = useState(() => {
    const out = {};
    for (const it of Array.isArray(initialItems) ? initialItems : []) {
      const d = findDrink(categoryId, it?.label);
      if (d) out[d.label] = (out[d.label] || 0) + (Number(it.qty) || 0);
    }
    return out;
  });
  // the order drinks were first picked in (the cart picture shows the
  // first few, so it matches what the customer tapped first)
  const [order, setOrder] = useState(() => Object.keys(counts));
  const change = (label, delta) => {
    const next = Math.max(0, Math.min(50, (counts[label] || 0) + delta));
    setCounts((prev) => ({ ...prev, [label]: next }));
    setOrder((prev) => (next > 0 ? (prev.includes(label) ? prev : [...prev, label]) : prev.filter((l) => l !== label)));
  };

  const items = useMemo(
    () => order.filter((l) => counts[l] > 0).map((l) => ({ label: l, qty: counts[l] })),
    [order, counts]
  );
  const count = items.reduce((n, it) => n + it.qty, 0);
  const totalCents = priceDrinksDips(categoryId, items);

  const finishAndAdd = () => {
    if (!items.length) return;
    const payload = {
      type: "drinks-dips",
      categoryId,
      categoryLabel,
      items,
      summary: `${categoryLabel}: ` + items.map((i) => `${i.label} × ${i.qty}`).join(", "),
      qty: 1,
    };
    if (onSave) {
      onSave(payload);
      return;
    }
    addItem(payload);
    onAdd(payload);
    onClose();
  };

  return (
    <div className="dd">
      <div className="dd-box">
        <h3 className="dd-bar">{title}</h3>
        <p className="dd-hint">Pick as many as you like.</p>
        <div className={`dd-grid${cat.photos ? " dd-grid--photos" : ""}`}>
          {options.map((o) => {
            const n = counts[o.label] || 0;
            return (
              <div key={o.label} className={`dd-tile${n ? " is-on" : ""}`}>
                <button type="button" className="dd-pic" onClick={() => change(o.label, +1)} aria-label={`Add one ${o.label}`}>
                  <img
                    src={o.img}
                    alt=""
                    loading="lazy"
                    style={cat.photos ? undefined : { height: `${Math.round(((o.mm || tallest) / tallest) * 100)}%` }}
                  />
                  {n > 0 && <span className="dd-badge">{n}</span>}
                </button>
                <div className="dd-name">{o.label}</div>
                <div className="dd-price">{formatMoney(priceDrinkItem(categoryId, o.label))}</div>
                {n === 0 ? (
                  <button type="button" className="dd-add" onClick={() => change(o.label, +1)}>
                    Add
                  </button>
                ) : (
                  <div className="dd-step">
                    <button type="button" onClick={() => change(o.label, -1)} aria-label={`One less ${o.label}`}>
                      −
                    </button>
                    <span aria-live="polite">{n}</span>
                    <button type="button" onClick={() => change(o.label, +1)} aria-label={`One more ${o.label}`}>
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dd-foot">
        <div className="dd-sum">
          {count === 0
            ? "Nothing picked yet"
            : `${count} ${count === 1 ? "item" : "items"}: ${items.map((i) => `${i.label} × ${i.qty}`).join(", ")}`}
        </div>
        <div className="dd-btns">
          <button type="button" onClick={onClose} className="rs-pill-btn rs-pill-btn--outline dd-cancel">
            Cancel
          </button>
          <button type="button" onClick={finishAndAdd} className="rs-pill-btn dd-go" disabled={count === 0}>
            {count === 0
              ? "Pick a Drink"
              : `${onSave ? "Save Changes" : "Add to Order"} (${formatMoney(totalCents)})`}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dd {
          width: 100%;
          max-width: 840px;
          margin: 0 auto;
          padding-top: 16px;
          color: var(--text-brown);
        }
        .dd-box {
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          overflow: hidden;
          background: var(--menu-box-bg);
        }
        .dd-bar {
          margin: 0;
          padding: 0.6rem 0.85rem;
          background: #000;
          color: #fff;
          font-family: var(--font-display);
          font-size: var(--fs-lg);
          line-height: 1.1;
          text-transform: uppercase;
        }
        .dd-hint {
          margin: 8px 10px 0;
          font-size: var(--fs-sm);
          font-weight: var(--w-medium);
        }
        .dd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
          gap: 6px;
          padding: 8px 8px 10px;
        }
        .dd-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 6px 4px 6px;
          background: #fff;
          border: 2px solid transparent;
          border-radius: 6px;
          box-shadow: 0 0 0 1px var(--menu-box-border);
        }
        .dd-tile.is-on {
          border-color: #8b1a1a;
          box-shadow: none;
        }
        .dd-pic {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 100%;
          height: 84px;
          padding: 0;
          border: 0;
          background: none;
          cursor: pointer;
        }
        .dd-pic img {
          max-width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom;
        }
        .dd-grid--photos .dd-pic img {
          width: 100%;
          object-fit: cover;
          border-radius: 4px;
        }
        .dd-badge {
          position: absolute;
          top: 0;
          right: 0;
          min-width: 24px;
          height: 24px;
          padding: 0 6px;
          border-radius: 12px;
          background: #8b1a1a;
          color: #fff;
          font-family: var(--font-display);
          font-size: var(--fs-sm);
          line-height: 24px;
        }
        .dd-name {
          margin-top: 6px;
          font-family: var(--font-display);
          font-size: var(--fs-xs);
          line-height: 1.1;
          text-transform: uppercase;
          color: #000;
        }
        .dd-price {
          margin: 2px 0 6px;
          font-size: var(--fs-xs);
          font-weight: var(--w-semibold);
        }
        .dd-add,
        .dd-step {
          margin-top: auto;
          width: 100%;
          height: 32px;
        }
        .dd-add {
          border: 2px solid #8b1a1a;
          border-radius: 999px;
          background: #fff;
          color: #8b1a1a;
          font-family: var(--font-display);
          font-size: var(--fs-sm);
          text-transform: uppercase;
          cursor: pointer;
        }
        .dd-step {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 999px;
          background: #8b1a1a;
          color: #fff;
        }
        .dd-step button {
          width: 32px;
          height: 32px;
          border: 0;
          background: none;
          color: #fff;
          font-size: 1.3rem;
          line-height: 1;
          cursor: pointer;
        }
        .dd-step span {
          font-family: var(--font-display);
          font-size: var(--fs-base);
        }
        .dd-foot {
          position: sticky;
          /* the popup's scroll area has padding at the bottom (63px on
             phones, 24px wider): reach past it to the screen's edge */
          bottom: calc(-1 * var(--modal-pad-y, 24px));
          z-index: 2;
          margin: 12px -12px 0;
          padding: 10px 12px calc(14px + env(safe-area-inset-bottom));
          background: #fff;
          box-shadow: 0 -10px 12px -10px rgba(0, 0, 0, 0.25);
        }
        .dd-sum {
          margin: 0 2px 10px;
          font-size: var(--fs-sm);
          font-weight: var(--w-medium);
          line-height: 1.3;
        }
        .dd-btns {
          display: flex;
          gap: 10px;
        }
        .dd-btns :global(.rs-pill-btn) {
          margin: 0;
          font-size: var(--fs-md);
          white-space: nowrap;
        }
        .dd-btns :global(.dd-cancel) {
          flex: 0 0 auto;
          width: auto;
          padding-left: 18px;
          padding-right: 18px;
        }
        .dd-btns :global(.dd-go) {
          flex: 1 1 auto;
          min-width: 0;
        }
        .dd-foot :global(.rs-pill-btn[disabled]) {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
