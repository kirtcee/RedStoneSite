// components/ItemNote.js
//
// Small optional "Note for the kitchen" box in the food builders (pizzas,
// wings, sides, Special Menu, combos). The text goes on the cart line as
// `note` and shows on the kitchen ticket, receipt, confirmation page and
// email. The server trims it to NOTE_MAX characters (utils/orderBuilder.js).
import { NOTE_MAX } from "../utils/orderRules";

export default function ItemNote({ value, onChange, placeholder = "Anything we should know?" }) {
  return (
    <label className="item-note">
      <span className="item-note__label">Note for the kitchen (optional)</span>
      <textarea
        className="item-note__box"
        rows={2}
        maxLength={NOTE_MAX}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
      <style jsx>{`
        .item-note {
          display: block;
          margin: 12px 0 8px;
        }
        .item-note__label {
          display: block;
          margin-bottom: 6px;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          text-transform: uppercase;
          color: #000;
        }
        .item-note__box {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 8px 10px;
          border: 1px solid var(--menu-box-border);
          border-radius: 0.375rem;
          background: #fff;
          color: #000;
          font-family: var(--font-body);
          line-height: 1.3;
          resize: vertical;
        }
        .item-note__box:focus {
          outline: 2px solid var(--text-brown);
          outline-offset: 1px;
        }
      `}</style>
    </label>
  );
}

// Adds `note` to an item only when there's text (so items without a note
// still merge with matching cart lines).
export function withNote(item, note) {
  const t = String(note || "").trim();
  return t ? { ...item, note: t } : item;
}
