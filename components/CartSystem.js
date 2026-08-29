// components/CartSystem.js
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { formatMoney, priceLineItem, describePizzaCompact, describeByoPizzaTitle } from "./Pricing";
import { loadCart, saveCart, subscribeCart } from "../utils/cartPersistence";
import { auth } from "../utils/firebaseConfig";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";
import { dealNameFor, dealSlotLabel, findDealById } from "../utils/dealCatalog";

const CartContext = createContext(null);

export function CartProvider({ children, onEditItem }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // ---- Open/Close helpers ----
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  // Close the dropdown before handing off to the edit overlay, so the two
  // never sit open on top of each other.
  const handleEditItem = useCallback(
    (item) => {
      setIsOpen(false);
      onEditItem?.(item);
    },
    [onEditItem]
  );

  // ---- Service method (carryout/delivery) — single source of truth ----
  // Starts unset for a first-time visitor (never defaults to carryout) and
  // only ever changes through confirmCarryout/confirmDelivery below, which
  // are the only two places that write these two localStorage keys.
  const [service, setService] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("rs_service");
      if (s === "carryout" || s === "delivery") setService(s);
      const raw = localStorage.getItem("rs_delivery_address");
      if (raw) setDeliveryAddress(JSON.parse(raw));
    } catch {}
  }, []);

  const confirmCarryout = useCallback(() => {
    setService("carryout");
    try {
      localStorage.setItem("rs_service", "carryout");
    } catch {}
  }, []);

  const confirmDelivery = useCallback((address) => {
    setService("delivery");
    setDeliveryAddress(address);
    try {
      localStorage.setItem("rs_service", "delivery");
      localStorage.setItem("rs_delivery_address", JSON.stringify(address));
    } catch {}
  }, []);

  const isServiceConfirmed =
    service === "carryout" || (service === "delivery" && !!deliveryAddress);

  // ---- Order timing (Now/Later) — single source of truth ----
  // Shared by the menu page's order-settings sidebar and checkout so a
  // customer's "have it ready at 6pm" choice actually survives to the order
  // that gets saved and shown in the kitchen, instead of each screen
  // tracking its own disconnected copy.
  const [orderTiming, setOrderTiming] = useState("now"); // 'now' | 'later'
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    try {
      const t = localStorage.getItem("rs_order_timing");
      if (t === "now" || t === "later") setOrderTiming(t);
      const d = localStorage.getItem("rs_schedule_date");
      if (d) setScheduleDate(d);
      const tm = localStorage.getItem("rs_schedule_time");
      if (tm) setScheduleTime(tm);
    } catch {}
  }, []);

  const updateOrderTiming = useCallback((val) => {
    setOrderTiming(val);
    try {
      localStorage.setItem("rs_order_timing", val);
    } catch {}
  }, []);

  const updateScheduleDate = useCallback((val) => {
    setScheduleDate(val);
    try {
      localStorage.setItem("rs_schedule_date", val);
    } catch {}
  }, []);

  const updateScheduleTime = useCallback((val) => {
    setScheduleTime(val);
    try {
      localStorage.setItem("rs_schedule_time", val);
    } catch {}
  }, []);

  // ---- Service gate overlay ----
  // Opened by addItem (below) when a service method isn't confirmed yet, or
  // directly by Header's mode chip. onConfirmed (if any) runs once the user
  // finishes the picker, so a blocked add-to-cart completes automatically
  // instead of losing whatever the customer was doing.
  const [serviceGateOpen, setServiceGateOpen] = useState(false);
  const pendingOnConfirmedRef = useRef(null);

  const openServiceGate = useCallback((onConfirmedCb) => {
    pendingOnConfirmedRef.current = onConfirmedCb || null;
    setServiceGateOpen(true);
  }, []);

  const closeServiceGate = useCallback(() => {
    setServiceGateOpen(false);
    pendingOnConfirmedRef.current = null;
  }, []);

  const handleGateConfirmed = useCallback(() => {
    const fn = pendingOnConfirmedRef.current;
    pendingOnConfirmedRef.current = null;
    setServiceGateOpen(false);
    fn?.();
  }, []);

  // ---- Deal/coupon builder — single source of truth for which deal is
  // currently open (if any), so a code redeemed from anywhere (cart
  // dropdown, /cart page, checkout) can open the same globally-mounted
  // DealBuilder instance (see pages/_app.js) that the /coupons page's cards
  // also drive. Editing an existing "deal" cart item instead goes through
  // CartEditOverlay's own DealBuilder instance, same pattern as combos. ----
  const [openDealId, setOpenDealId] = useState(null);
  const openDeal = useCallback((id) => setOpenDealId(id), []);
  const closeDealBuilder = useCallback(() => setOpenDealId(null), []);

  // Validates a coupon code against the server (the authoritative check —
  // see pages/api/validateDeal.js) and, if valid for the current service
  // method, opens that deal's builder. Returns a result object the caller
  // can use to show an inline error instead of throwing.
  const redeemDealCode = useCallback(
    async (code) => {
      try {
        const res = await fetch("/api/validateDeal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, service }),
        });
        const data = await res.json();
        if (!data?.ok) {
          return { ok: false, reason: data?.reason || "not_found" };
        }
        setOpenDealId(data.deal.id);
        return { ok: true, deal: data.deal };
      } catch (e) {
        console.error("redeemDealCode error:", e);
        return { ok: false, reason: "network" };
      }
    },
    [service]
  );

  // ---- Add/Update/Remove/clear ----
  const reallyAddItem = useCallback((raw) => {
    const item = { ...raw };
    if (!item.qty || item.qty < 1) item.qty = 1;

    // unique key for merging quantities of identical items
    const keyObj = { ...item };
    delete keyObj.qty;
    delete keyObj.lineSubtotalCents;
    const itemKey = JSON.stringify(keyObj);

    setItems((prev) => {
      const idx = prev.findIndex((p) => p._key === itemKey);
      if (idx !== -1) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, { ...item, _key: itemKey, id: cryptoRandomId() }];
    });
    setIsOpen(true);
  }, []);

  const addItem = useCallback(
    (raw) => {
      // gate: block until a service method (+ address, for delivery) is
      // confirmed — the overlay completes this same add once they do.
      if (!isServiceConfirmed) {
        openServiceGate(() => reallyAddItem(raw));
        return;
      }
      reallyAddItem(raw);
    },
    [isServiceConfirmed, openServiceGate, reallyAddItem]
  );

  const updateQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, Number(qty) || 1) } : it
      )
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  // Replaces one existing line (used by "Edit") rather than merging/adding —
  // unlike addItem, this never combines with another matching line even if
  // the edited item now happens to match one.
  const updateItem = useCallback((id, raw) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = { ...raw };
        if (!next.qty || next.qty < 1) next.qty = 1;
        const keyObj = { ...next };
        delete keyObj.qty;
        delete keyObj.lineSubtotalCents;
        return { ...next, id, _key: JSON.stringify(keyObj) };
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // ---- Derived subtotal ----
  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + priceLineItem(it), 0),
    [items]
  );

  // ---- Persistence: Firestore load + realtime subscribe ----
  const suppressSaveRef = useRef(false);
  // Guards against saving an empty initial cart before the real one has
  // finished loading (loadCart/subscribeCart are async and can take longer
  // than the save debounce, which would otherwise overwrite stored items).
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const remote = await loadCart();
        if (!mounted) return;
        if (Array.isArray(remote.items)) {
          suppressSaveRef.current = true; // avoid saving the load immediately
          setItems(remote.items);
        }
      } catch (e) {
        console.error("Cart load error:", e);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();

    const unsub = subscribeCart((remote) => {
      if (!Array.isArray(remote.items)) return;
      suppressSaveRef.current = true;
      setItems(remote.items);
      setIsLoaded(true);
    });

    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  // ---- Persistence: Debounced save ----
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!isLoaded) return; // never persist until the initial cart has loaded
    if (suppressSaveRef.current) {
      suppressSaveRef.current = false;
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const uid = auth?.currentUser?.uid || null;
      saveCart(items, { uid, subtotalCents }).catch(console.error);
    }, 350);
    return () => clearTimeout(saveTimer.current);
  }, [items, subtotalCents, isLoaded]);

  const value = useMemo(
    () => ({
      items,
      isLoaded,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQty,
      updateItem,
      removeItem,
      clearCart,
      subtotalCents,
      onEditItem: handleEditItem,
      service,
      deliveryAddress,
      isServiceConfirmed,
      confirmCarryout,
      confirmDelivery,
      openServiceGate,
      closeServiceGate,
      serviceGateOpen,
      handleGateConfirmed,
      orderTiming,
      setOrderTiming: updateOrderTiming,
      scheduleDate,
      setScheduleDate: updateScheduleDate,
      scheduleTime,
      setScheduleTime: updateScheduleTime,
      openDealId,
      openDeal,
      closeDealBuilder,
      redeemDealCode,
    }),
    [
      items,
      isLoaded,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQty,
      updateItem,
      removeItem,
      clearCart,
      subtotalCents,
      handleEditItem,
      service,
      deliveryAddress,
      isServiceConfirmed,
      confirmCarryout,
      confirmDelivery,
      openServiceGate,
      closeServiceGate,
      serviceGateOpen,
      handleGateConfirmed,
      orderTiming,
      updateOrderTiming,
      scheduleDate,
      updateScheduleDate,
      scheduleTime,
      updateScheduleTime,
      openDealId,
      openDeal,
      closeDealBuilder,
      redeemDealCode,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartToggle() {
  const { toggleCart, items } = useCart();
  const qty = items.reduce((n, it) => n + (Number(it.qty) || 0), 0);

  return (
    <button onClick={toggleCart} aria-label="Cart" className="cart-toggle">
      <svg width="28" height="28" viewBox="2.5 0 24 24" fill="none" aria-hidden="true">
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
      </svg>
      {qty > 0 && <span className="cart-toggle__badge">{qty}</span>}
    </button>
  );
}

/* Dropdown cart (anchored under the header cart icon) */
export function CartSidebar() {
  const {
    isOpen,
    closeCart,
    items,
    updateQty,
    removeItem,
    subtotalCents,
    onEditItem,
    isServiceConfirmed,
    openServiceGate,
  } = useCart();

  // dynamic positioning so the panel's right edge aligns to the container
  // and the pointer aims at the cart icon
  const [pos, setPos] = useState({ top: 0, right: 0, arrowRight: 28 });

  const measure = useCallback(() => {
    if (typeof window === "undefined") return;

    const headerContainer =
      document.querySelector(".site-header .container") ||
      document.querySelector(".container");

    const anchorSeg = document.querySelector(".header-seg--cart");

    if (!headerContainer) {
      // fallback: pin to viewport right, just under header
      setPos({ top: 90, right: 12, arrowRight: 28 });
      return;
    }

    const hc = headerContainer.getBoundingClientRect();
    const right = Math.max(0, window.innerWidth - hc.right);

    let top = 90; // fallback
    let arrowRight = 28;

    if (anchorSeg) {
      const an = anchorSeg.getBoundingClientRect();
      top = Math.round(an.bottom + 6);

      // pointer position measured FROM the panel’s right edge
      const anchorCenterX = an.left + an.width / 2;
      arrowRight = Math.round(hc.right - anchorCenterX - 6); // -6 centers the 12–14px diamond
      arrowRight = Math.max(12, Math.min(400, arrowRight));   // clamp
    }

    setPos({ top, right, arrowRight });
  }, []);

  useEffect(() => {
    // measure when mounted and whenever we open/resize/scroll
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [measure, isOpen]);

  // Close on an outside click — anywhere except the panel itself and the
  // header cart icon (which has its own toggle behavior).
  const panelRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (e.target.closest?.(".header-seg--cart")) return;
      closeCart();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen, closeCart]);

  return (
    <div
      ref={panelRef}
      className="cart-sidebar"
      data-open={isOpen ? "true" : "false"}
      style={{ top: pos.top, right: pos.right }}
    >
      <div className="cart-sidebar__pointer" style={{ right: pos.arrowRight }} />

      <div className="cart-sidebar__header">
        <div className="cart-sidebar__title">Your Cart</div>
        <button onClick={closeCart} aria-label="Close cart" className="cart-sidebar__close">
          ×
        </button>
      </div>

      <div className="cart-sidebar__items">
        {items.length === 0 ? (
          <div className="cart-empty">Your cart is empty.</div>
        ) : (
          items.map((it) => {
            const lineCents = priceLineItem(it);
            const { name, subtitle } = getNameAndSubtitle(it);
            const img = getImage(it);
            return (
              <div key={it.id} className="cart-item">
                <div>
                  <img src={img} alt="" className="cart-item__thumb" />
                </div>

                <div style={{ minWidth: 0 }}>
                  <button
                    onClick={() => onEditItem && onEditItem(it)}
                    className="cart-item__name"
                  >
                    {name}
                  </button>
                  <div className="cart-item__subtitle">{subtitle}</div>
                  {it.type === "combo" && it.meta?.items && (
                    <div className="cart-item__combo-children">
                      {Object.entries(it.meta.items).map(([key, child]) => (
                        <div key={key} className="cart-item__combo-child">
                          <span className="cart-item__combo-child-label">
                            {comboItemLabel(key)}:
                          </span>
                          <span className="cart-item__combo-child-text">
                            {comboChildCompactSummary(key, child)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {it.type === "deal" && it.meta?.items && (
                    <div className="cart-item__combo-children">
                      {Object.entries(it.meta.items).map(([key, child]) => (
                        <div key={key} className="cart-item__combo-child">
                          <span className="cart-item__combo-child-label">
                            {dealSlotLabel(findDealById(it.dealId), key)}:
                          </span>
                          <span className="cart-item__combo-child-text">
                            {comboChildCompactSummary(key, child)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {it.type === "deal" && it.meta?.builds && (
                    <div className="cart-item__combo-children">
                      {it.meta.builds.map((child, idx) => (
                        <div key={idx} className="cart-item__combo-child">
                          <span className="cart-item__combo-child-label">
                            Item {idx + 1}:
                          </span>
                          <span className="cart-item__combo-child-text">
                            {child?.summary || "Not customized yet"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cart-item__price">{formatMoney(lineCents)}</div>

                <div className="cart-item__controls">
                  <div className="cart-item__label">Quantity</div>
                  <select
                    value={it.qty}
                    onChange={(e) => updateQty(it.id, e.target.value)}
                    className="cart-item__qty"
                  >
                    {Array.from({ length: 20 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onEditItem && onEditItem(it)}
                    className="cart-item__btn cart-item__btn--edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="cart-item__btn cart-item__btn--remove"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="cart-sidebar__footer">
        <DealCodeEntry compact />
        <div className="cart-sidebar__footer-row">
          <div className="cart-sidebar__subtotal">
            Subtotal: {formatMoney(subtotalCents)}
          </div>
          <button
            className="cart-sidebar__checkout"
            onClick={() => {
              if (isServiceConfirmed) {
                window.location.href = "/cart";
              } else {
                openServiceGate(() => {
                  window.location.href = "/cart";
                });
              }
            }}
          >
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const REDEEM_ERROR_MESSAGES = {
  not_found: "That code isn't valid.",
  inactive: "That coupon isn't available right now.",
  service_mismatch: "That coupon isn't valid for your current order type.",
  network: "Couldn't check that code — please try again.",
};

// Reusable "Have a coupon code?" entry — used in the cart dropdown, the full
// /cart page, and checkout. On a valid code it opens the matching deal's
// builder (via CartProvider's openDeal, driven by the server-validated
// result), it never applies a discount silently.
export function DealCodeEntry({ compact = false, variant = null }) {
  const { redeemDealCode } = useCart();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(null); // null | "checking" | { error }
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || status === "checking") return;
    setStatus("checking");
    setError(null);
    const result = await redeemDealCode(code.trim());
    setStatus(null);
    if (result.ok) {
      setCode("");
    } else {
      setError(REDEEM_ERROR_MESSAGES[result.reason] || REDEEM_ERROR_MESSAGES.not_found);
    }
  };

  // Full standalone card — black header bar, cream body, thin bottom rule —
  // used on the /coupons page. The compact/default renders below stay
  // unchanged for the cart dropdown, full cart page, and checkout.
  if (variant === "card") {
    return (
      <form onSubmit={handleSubmit} className="deal-code-card">
        <div className="deal-code-card__bar">I Already Have a Coupon.</div>
        <div className="deal-code-card__body">
          <div className="deal-code-card__row">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="deal-code-card__input"
              aria-label="Coupon code"
            />
            <button type="submit" className="deal-code-card__btn" disabled={status === "checking"}>
              {status === "checking" ? "…" : "ADD"}
            </button>
          </div>
          {error && <div className="deal-code-card__error">{error}</div>}
        </div>
        <style jsx>{`
          .deal-code-card {
            border-radius: .1875rem;
            overflow: hidden;
            margin-bottom: 20px;
          }
          .deal-code-card__bar {
            background: #000;
            color: #fff;
            font-family: var(--font-heading, Oswald, sans-serif);
            font-weight: 900;
            text-transform: uppercase;
            font-size: 1.1rem;
            padding: 0.85rem 1rem;
          }
          .deal-code-card__body {
            background: #faf2e9;
            padding: 0.55rem 1rem 1.1rem;
            border-bottom: 3px solid #000;
          }
          .deal-code-card__row {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .deal-code-card__input {
            width: 170px;
            max-width: 55%;
            height: 42px;
            padding: 0 10px;
            border: 1.5px solid #a4855c;
            border-radius: 0;
            background: #fff;
            font-size: 14px;
          }
          .deal-code-card__btn {
            height: 42px;
            padding: 0 26px;
            flex: 0 0 auto;
            border-radius: 21px;
            background: #8b1a1a;
            color: #fff;
            border: none;
            font-weight: 900;
            font-size: 13px;
            text-transform: uppercase;
            cursor: pointer;
            font-family: var(--font-heading, Oswald, sans-serif);
          }
          .deal-code-card__btn:disabled {
            opacity: 0.6;
            cursor: default;
          }
          .deal-code-card__error {
            margin-top: 10px;
            font-size: 12px;
            color: #a71318;
            font-weight: 700;
          }
        `}</style>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`deal-code-entry${compact ? " deal-code-entry--compact" : ""}`}>
      <div className="deal-code-entry__row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Have a coupon code?"
          className="deal-code-entry__input"
          aria-label="Coupon code"
        />
        <button type="submit" className="deal-code-entry__btn" disabled={status === "checking"}>
          {status === "checking" ? "Checking…" : "Apply"}
        </button>
      </div>
      {error && <div className="deal-code-entry__error">{error}</div>}
      <style jsx>{`
        .deal-code-entry {
          margin-bottom: 10px;
        }
        .deal-code-entry__row {
          display: flex;
          gap: 6px;
        }
        .deal-code-entry__input {
          flex: 1;
          min-width: 0;
          padding: 8px 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 13px;
        }
        .deal-code-entry__btn {
          background: #8b1a1a;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0 14px;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 12px;
          cursor: pointer;
          font-family: var(--font-heading, Oswald, sans-serif);
        }
        .deal-code-entry__btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .deal-code-entry__error {
          margin-top: 6px;
          font-size: 12px;
          color: #a71318;
          font-weight: 600;
        }
      `}</style>
    </form>
  );
}

// ---- helpers ----
// Cart dropdown shows only the identity + real deviations from the default
// build — full customization detail (cheese/sauce/instructions) belongs on
// the full cart page, not here.
function getNameAndSubtitle(item) {
  if (item.type === "pizza-byo") {
    const name = item.pizzaName || describeByoPizzaTitle(item);
    const subtitle = describePizzaCompact(item);
    return { name, subtitle };
  }
  if (item.type === "pizza-specialty") {
    const sizeLabel =
      ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[
        String(item.size)
      ] || `${item.size}"`);
    const name = item.name || "Specialty Pizza";
    const subtitle = `${sizeLabel}${item.crust ? ` • ${item.crust}` : ""}`;
    return { name, subtitle };
  }
  if (item.type === "wings") {
    return {
      name: `${item.count} Wings`,
      subtitle: [item.sauce, item.serveStyle].filter(Boolean).join(" • "),
    };
  }
  if (item.type === "side") {
    const bits = [];
    if (Number(item.gravy) > 0) bits.push(`Gravy × ${item.gravy}`);
    const dipBits = Object.entries(item.dips || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([k, q]) => `${k} × ${q}`);
    if (dipBits.length) bits.push(`Dips: ${dipBits.join(", ")}`);
    if (item.hotSauce === "Yes") bits.push("Hot Sauce Drizzle");
    return { name: item.name || "Side", subtitle: bits.join(" • ") };
  }
  if (item.type === "special") {
    const bits = [];
    const t = item.toppings || {};
    if (t.meats?.length) bits.push(`Meats: ${t.meats.join(", ")}`);
    if (t.veggies?.length) bits.push(`Veggies: ${t.veggies.join(", ")}`);
    if (t.cheeses?.length) bits.push(`Cheeses: ${t.cheeses.join(", ")}`);
    const dipBits = Object.entries(item.dips || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([k, q]) => `${k} × ${q}`);
    if (dipBits.length) bits.push(`Dips: ${dipBits.join(", ")}`);
    return { name: item.name || "Special", subtitle: bits.join(" • ") };
  }
  if (item.type === "drinks-dips") {
    const subtitle = (item.items || []).map((i) => `${i.label} × ${i.qty}`).join(", ");
    return { name: item.categoryLabel || "Drinks", subtitle };
  }
  if (item.type === "combo") {
    const subtitle =
      item.upgrade === "toMedium"
        ? "Upgraded to Medium"
        : item.upgrade === "toXL"
        ? "Upgraded to XL"
        : "";
    return { name: comboNameFor(item.comboId), subtitle };
  }
  if (item.type === "deal") {
    const units = Array.isArray(item.meta?.builds) ? item.meta.builds.length : null;
    const subtitle = units ? `${units} item${units === 1 ? "" : "s"}` : "";
    return { name: dealNameFor(item.dealId), subtitle };
  }
  return { name: "Item", subtitle: "" };
}

// Short per-slot line for a combo's sub-item in the dropdown — pizzas get
// just their size/crust (no cheese/sauce/topping detail), everything else
// already carries a short summary from its own builder.
function comboChildCompactSummary(key, child) {
  if (!child) return "Not customized yet";
  if (key.startsWith("pizza")) return describePizzaCompact(child);
  return child.summary || "Not customized yet";
}

function getImage(item) {
  if (item.image) return item.image;
  if (item.type?.startsWith("pizza")) return "/pizza_layers/Crust.png";
  if (item.type === "wings") return "/images/wings.jpg";
  if (item.type === "side") return "/images/side.jpg";
  if (item.type === "combo") return "/images/combo.jpg";
  if (item.type === "special") return "/images/special.jpg";
  if (item.type === "deal") return "/images/combo.jpg";
  return "/images/placeholder.jpg";
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(2);
    crypto.getRandomValues(buf);
    return `id_${buf[0].toString(16)}${buf[1].toString(16)}`;
  }
  return `id_${Math.random().toString(16).slice(2)}`;
}
