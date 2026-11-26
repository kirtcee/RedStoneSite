// components/SoldOutNotice.js
//
// Popup shown when someone tries to add something the kitchen has marked
// sold out (components/CartSystem.js blocks the add and sets the names).
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";
import { useCart } from "./CartSystem";

const listText = (names) =>
  names.length <= 1 ? names[0] || "" : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export default function SoldOutNotice() {
  const cart = useCart();
  const notice = cart?.soldOutNotice || null;
  const names = notice?.names || null;
  return (
    <DebugPizzaOverlay open={!!names} onClose={cart?.closeSoldOutNotice} mode="portal" blockRogue freezeChild={false} allergenNote={false} title="Sold Out">
      {names && (
        <div className="so">
          <p className="so-lead">
            Sorry, <strong>{listText(names)}</strong> {names.length > 1 ? "are" : "is"} sold out right now
            {notice.inCart
              ? ". Please remove it from your cart (it's marked in red) to continue."
              : ", so we couldn't add it to your order. Please choose something else."}
          </p>
          <button type="button" className="rs-pill-btn so-ok" onClick={cart.closeSoldOutNotice}>
            OK
          </button>
        </div>
      )}
      <style jsx>{`
        .so {
          padding: 4px 0 18px;
          color: var(--text-brown);
        }
        .so-lead {
          margin: 0 0 18px;
          font-size: var(--fs-base);
          line-height: 1.45;
        }
        .so-lead strong {
          color: #000;
        }
        .so :global(.so-ok) {
          width: 100%;
        }
      `}</style>
    </DebugPizzaOverlay>
  );
}
