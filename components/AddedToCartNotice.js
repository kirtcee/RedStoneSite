// components/AddedToCartNotice.js
//
// Small "Added to your order" card at the bottom of the screen after
// something goes into the cart, with Checkout and Keep Shopping. It stays
// until the customer does something: Keep Shopping, a tap or click anywhere
// else, scrolling, or Escape all close it. Not shown on the cart, checkout
// or confirmation pages.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useCart } from "./CartSystem";
import { formatMoney } from "./Pricing";
import { getNameAndSubtitle } from "../utils/orderText";

const LEAVE_MS = 200;
const HIDDEN_ON = ["/cart", "/checkout", "/order-confirmation", "/kitchen", "/kitchen-login", "/stats"];

export default function AddedToCartNotice() {
  const cart = useCart();
  const router = useRouter();
  const boxRef = useRef(null);
  const added = cart?.lastAdded || null;
  const clear = cart?.clearLastAdded;
  const hidden = HIDDEN_ON.some((p) => router.pathname.startsWith(p));

  // Closing plays a short fade-and-slide-down first (LEAVE_MS), then the
  // card is removed. Skipped for people with "Reduce Motion" turned on.
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef(null);
  useEffect(() => {
    setLeaving(false); // a new item was added: show the card fresh
    clearTimeout(leaveTimer.current);
  }, [added?.at]);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  const close = useCallback(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return clear?.();
    setLeaving(true);
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => clear?.(), LEAVE_MS);
  }, [clear]);

  // close on any tap/click outside, scrolling, or Escape. Starts a moment
  // after it appears so the tap that added the item doesn't close it.
  useEffect(() => {
    if (!added || hidden || leaving) return;
    const outside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) close?.();
    };
    const onKey = (e) => e.key === "Escape" && close?.();
    const onScroll = () => close?.();
    const t = setTimeout(() => {
      document.addEventListener("pointerdown", outside, true);
      window.addEventListener("wheel", onScroll, { passive: true });
      window.addEventListener("touchmove", onScroll, { passive: true });
      window.addEventListener("keydown", onKey);
    }, 400);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [added, hidden, leaving, close]);

  // a new page: remove it straight away
  useEffect(() => {
    const done = () => clear?.();
    router.events.on("routeChangeStart", done);
    return () => router.events.off("routeChangeStart", done);
  }, [router.events, clear]);

  if (!added || hidden) return null;

  const name = added.name || getNameAndSubtitle(added.item || {}).name || "Your item";
  const items = cart?.items || [];
  const count = items.reduce((n, it) => n + (Number(it.qty) || 1), 0);

  const checkout = () => {
    close();
    cart?.goToCheckout?.();
  };

  return (
    <div className={`atc${leaving ? " is-leaving" : ""}`} ref={boxRef} role="status" aria-live="polite" key={added.at}>
      <div className="atc-top">
        <span className="atc-check" aria-hidden="true">✓</span>
        <div className="atc-text">
          <div className="atc-title">Added to your order</div>
          <div className="atc-name">{name}</div>
          <div className="atc-sum">
            {count} item{count === 1 ? "" : "s"} in your cart, {formatMoney(cart?.subtotalCents || 0)}
          </div>
        </div>
      </div>
      <div className="atc-btns">
        <button type="button" className="atc-keep" onClick={close}>
          Keep Shopping
        </button>
        <button type="button" className="rs-pill-btn atc-go" onClick={checkout}>
          Checkout
        </button>
      </div>
      <style jsx>{`
        .atc {
          position: fixed;
          left: 50%;
          bottom: max(14px, env(safe-area-inset-bottom));
          z-index: 2600;
          width: min(400px, calc(100vw - 24px));
          padding: 12px 14px;
          transform: translateX(-50%);
          border: 1px solid var(--menu-box-border);
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          color: var(--text-brown);
          animation: atc-in 0.18s ease-out;
        }
        @keyframes atc-in {
          from {
            opacity: 0;
            transform: translate(-50%, 12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        /* closing: the reverse of opening */
        .atc.is-leaving {
          pointer-events: none;
          animation: atc-out ${LEAVE_MS}ms ease-in forwards;
        }
        @keyframes atc-out {
          from {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          to {
            opacity: 0;
            transform: translate(-50%, 12px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .atc,
          .atc.is-leaving {
            animation: none;
          }
        }
        .atc-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .atc-check {
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1b7a3a;
          color: #fff;
          font-weight: 800;
          font-size: var(--fs-min);
        }
        .atc-text {
          min-width: 0;
        }
        .atc-title {
          font-family: var(--font-display);
          font-size: var(--fs-md);
          line-height: 1.1;
          text-transform: uppercase;
          color: #000;
        }
        .atc-name {
          margin-top: 2px;
          font-size: var(--fs-min);
          font-weight: var(--w-semibold);
          color: #000;
          overflow-wrap: anywhere;
        }
        .atc-sum {
          font-size: var(--fs-min);
        }
        .atc-btns {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        .atc-keep {
          flex: 1 1 0;
          padding: 10px 8px;
          border: 2px solid var(--menu-box-border);
          border-radius: 999px;
          background: #fff;
          color: #000;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          text-transform: uppercase;
          cursor: pointer;
        }
        .atc-btns :global(.atc-go) {
          flex: 1 1 0;
          width: auto;
          margin: 0;
          padding-top: 10px;
          padding-bottom: 10px;
          font-size: var(--fs-min);
        }
      `}</style>
    </div>
  );
}
