// components/ItemNote.js
//
// Small optional "Note for the kitchen" in the food builders: a "+ Add a
// note" link that opens the box when tapped. Lives in the food builders (pizzas,
// wings, sides, Special Menu, combos). The text goes on the cart line as
// `note` and shows on the kitchen ticket, receipt, confirmation page and
// email. The server trims it to NOTE_MAX characters (utils/orderBuilder.js).
import { useEffect, useRef, useState } from "react";
import { NOTE_MAX } from "../utils/orderRules";

export default function ItemNote({ value, onChange }) {
  // Closed until they tap "Add a note" (open straight away if there's
  // already a note, e.g. when editing a cart item).
  const [open, setOpen] = useState(!!String(value || "").trim());
  const boxRef = useRef(null);
  // a note that arrives after opening (editing a combo) opens the box too
  useEffect(() => {
    if (String(value || "").trim()) setOpen(true);
  }, [value]);
  useEffect(() => {
    if (open && !value) boxRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="item-note">
      {!open ? (
        <button
          type="button"
          className="item-note__open"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          + Add a note for the kitchen
        </button>
      ) : (
        <>
          <label className="item-note__field">
            <span className="item-note__label">Note for the kitchen (optional)</span>
            <textarea
              ref={boxRef}
              className="item-note__box"
              rows={2}
              maxLength={NOTE_MAX}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </label>
          <NoteRemove
            hasText={!!String(value || "").trim()}
            onRemove={() => {
              onChange("");
              setOpen(false);
            }}
          />
        </>
      )}
      <style jsx>{`
        .item-note {
          margin: 12px 0 8px;
        }
        .item-note__field {
          display: block;
        }
        .item-note__open {
          padding: 0;
          border: 0;
          background: none;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: var(--text-brown);
          cursor: pointer;
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
    </div>
  );
}

// Adds `note` to an item only when there's text (so items without a note
// still merge with matching cart lines).
export function withNote(item, note) {
  const t = String(note || "").trim();
  return t ? { ...item, note: t } : item;
}

// "Remove note" under a note box: small grey link on the right, away from
// the main buttons. If there's text it asks first ("Remove this note?"), so
// a stray tap never wipes a note; an empty box just closes.
export function NoteRemove({ hasText, onRemove }) {
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!hasText) setAsking(false);
  }, [hasText]);
  const stop = (e) => e.stopPropagation();
  return (
    <div className="note-remove" onClick={stop}>
      {!asking ? (
        <button type="button" className="note-remove__link" onClick={() => (hasText ? setAsking(true) : onRemove())}>
          Remove note
        </button>
      ) : (
        <span className="note-remove__ask">
          Remove this note?
          <button type="button" className="note-remove__link" onClick={() => setAsking(false)}>
            Keep
          </button>
          <button
            type="button"
            className="note-remove__link note-remove__link--yes"
            onClick={() => {
              setAsking(false);
              onRemove();
            }}
          >
            Yes, remove
          </button>
        </span>
      )}
      <style jsx>{`
        .note-remove {
          display: flex;
          justify-content: flex-end;
          margin-top: 6px;
        }
        .note-remove__ask {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 4px 16px;
          font-size: var(--fs-min);
          color: var(--text-brown);
        }
        .note-remove__link {
          padding: 4px 0;
          border: 0;
          background: none;
          font-family: var(--font-body);
          font-size: var(--fs-min);
          font-weight: var(--w-medium);
          text-decoration: underline;
          text-underline-offset: 3px;
          color: #777;
          cursor: pointer;
        }
        .note-remove__link--yes {
          color: #b00020;
          font-weight: var(--w-semibold);
        }
      `}</style>
    </div>
  );
}
