// components/TwoLiterPicker.js
//
// Picks the one 2L drink included in a combo (Feed 4, Party Combo). Shows
// every 2L from utils/drinkCatalog.js as a photo tile; tap one, then Save.
// Not priced here: the drink is already in the combo's price.
import React, { useState } from "react";
import { DRINK_CATEGORIES, findDrink } from "../utils/drinkCatalog";

export default function TwoLiterPicker({ initialData = {}, onClose = () => {}, onSave = () => {} }) {
  const options = DRINK_CATEGORIES.twoLiters.options;
  const [picked, setPicked] = useState(findDrink("twoLiters", initialData.label)?.label || null);

  const save = () => {
    if (!picked) return;
    onSave({ type: "drink", categoryId: "twoLiters", label: picked, summary: `2L ${picked}` });
  };

  return (
    <div className="tl">
      <div className="tl-box">
        <div className="tl-grid" role="radiogroup" aria-label="2L drink">
          {options.map((o) => {
            const on = picked === o.label;
            return (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={on}
                className={`tl-tile${on ? " is-on" : ""}`}
                onClick={() => setPicked(o.label)}
              >
                <span className="tl-pic">
                  <img src={o.img} alt="" />
                </span>
                <span className="tl-name">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rs-pill-row rs-pill-row--compact">
        <button type="button" className="rs-pill-btn rs-pill-btn--outline" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="rs-pill-btn" onClick={save} disabled={!picked}>
          Save
        </button>
      </div>

      <style jsx>{`
        .tl {
          padding: 16px 0;
          color: var(--text-brown);
        }
        .tl-box {
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          overflow: hidden;
          background: var(--menu-box-bg);
          margin-bottom: 16px;
        }
        .tl-bar {
          margin: 0;
          padding: 0.6rem 0.85rem;
          background: #000;
          color: #fff;
          font-family: var(--font-display);
          font-size: var(--fs-lg);
          line-height: 1.1;
          text-transform: uppercase;
        }
        .tl-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding: 10px;
        }
        .tl-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 8px 4px;
          background: #fff;
          border: 2px solid transparent;
          border-radius: 6px;
          box-shadow: 0 0 0 1px var(--menu-box-border);
          cursor: pointer;
        }
        .tl-tile.is-on {
          border-color: #8b1a1a;
          box-shadow: none;
        }
        .tl-pic {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 120px;
        }
        .tl-pic img {
          height: 100%;
          width: auto;
          object-fit: contain;
        }
        .tl-name {
          font-family: var(--font-display);
          font-size: var(--fs-sm);
          line-height: 1.1;
          text-transform: uppercase;
          color: #000;
        }
        .tl :global(.rs-pill-btn[disabled]) {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
