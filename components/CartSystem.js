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
import { useRouter } from "next/router";
import { formatMoney, priceLineItem } from "./Pricing";
import { loadCart, saveCart, subscribeCart } from "../utils/cartPersistence";
import { auth } from "../utils/firebaseConfig";

const CartContext = createContext(null);

export function CartProvider({ children, onEditItem }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // ---- Open/Close helpers ----
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  // ---- Require service (carryout / delivery) before adding items ----
  const ensureServiceSelected = useCallback(() => {
    if (typeof window === "undefined") return true;

    try {
      const s = localStorage.getItem("rs_service");
      if (!s) {
        const next =
          window.location.pathname + (window.location.search || "");

        router.push({
          pathname: "/order",
          query: { next },
        });

        return false; // block the action for now
      }
      return true;
    } catch {
      // if localStorage fails, just allow it rather than break ordering
      return true;
    }
  }, [router]);

  // ---- Add/Update/Remove/clear ----
  const addItem = useCallback(
    (raw) => {
      // gate: if service not chosen yet, send them to /order
      if (!ensureServiceSelected()) return;

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
    },
    [ensureServiceSelected]
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

  const clearCart = useCallback(() => setItems([]), []);

  // ---- Derived subtotal ----
  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + priceLineItem(it), 0),
    [items]
  );

  // ---- Persistence: Firestore load + realtime subscribe ----
  const suppressSaveRef = useRef(false);

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
      }
    })();

    const unsub = subscribeCart((remote) => {
      if (!Array.isArray(remote.items)) return;
      suppressSaveRef.current = true;
      setItems(remote.items);
    });

    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  // ---- Persistence: Debounced save ----
  const saveTimer = useRef(null);
  useEffect(() => {
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
  }, [items, subtotalCents]);

  const value = useMemo(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      subtotalCents,
      onEditItem,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      subtotalCents,
      onEditItem,
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
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 4h-2l-1 2v2h2l3.6 7.59-1.35 2.44A1.99 1.99 0 0 0 9 21h10v-2H9.42l1.1-2h6.93a2 2 0 0 0 1.8-1.1l3.24-6.49A1 1 0 0 0 21.6 6H7.42L6.21 4H7Z"
          fill="#E91E28"
        />
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

  return (
    <div
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
                    <ul className="cart-item__children">
                      {Object.entries(it.meta.items).map(([key, child]) => (
                        <li key={key}>
                          <strong>{key}:</strong>{" "}
                          {child?.summary || "(not customized)"}
                        </li>
                      ))}
                    </ul>
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
        <div className="cart-sidebar__subtotal">
          Subtotal: {formatMoney(subtotalCents)}
        </div>
        <button
          className="cart-sidebar__checkout"
          onClick={() => {
            if (typeof window === "undefined") return;
            try {
              const s = localStorage.getItem("rs_service");
              if (!s) {
                const next = "/cart";
                window.location.href =
                  `/order?next=${encodeURIComponent(next)}`;
              } else {
                window.location.href = "/cart";
              }
            } catch {
              window.location.href = "/cart";
            }
          }}
        >
          View Cart
        </button>
      </div>
    </div>
  );
}

// ---- helpers ----
function getNameAndSubtitle(item) {
  if (item.type === "pizza-byo") {
    const name = item.pizzaName || "Custom Pizza";
    const toppings =
      Array.isArray(item.toppings) && item.toppings.length
        ? item.toppings.join(", ")
        : "No toppings";
    const sizeLabel =
      (
        { "10": 'Small 8"', "12": 'Medium 10"', "14": 'Large 12"', "16": 'X-Large 14"' }[
          String(item.size)
        ] || `${item.size}"`
      );
    const subtitle = item.summary || `${sizeLabel} ${item.crust || ""} – ${toppings}`;
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
  if (item.type === "wings") return { name: `${item.count} Wings`, subtitle: "Crispy wings" };
  if (item.type === "side") return { name: item.name || "Side", subtitle: "Side item" };
  if (item.type === "special") return { name: item.name || "Special", subtitle: "Special menu item" };
  if (item.type === "combo") return { name: "Combo", subtitle: item.comboId || "Deal" };
  return { name: "Item", subtitle: "" };
}

function getImage(item) {
  if (item.image) return item.image;
  if (item.type?.startsWith("pizza")) return "/pizza_layers/Crust.png";
  if (item.type === "wings") return "/images/wings.jpg";
  if (item.type === "side") return "/images/side.jpg";
  if (item.type === "combo") return "/images/combo.jpg";
  if (item.type === "special") return "/images/special.jpg";
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
