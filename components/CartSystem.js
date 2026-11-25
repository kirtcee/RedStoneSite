// components/CartSystem.js
import { track } from "../utils/analytics";
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
import { formatMoney, priceCart, priceLineItem } from "./Pricing";
import { loadCart, saveCart, subscribeCart } from "../utils/cartPersistence";
import { auth } from "../utils/firebaseConfig";
import { findDealById, dealUnitToCartItem } from "../utils/dealCatalog";
import { deliveryShortfallCents } from "../utils/orderRules";
import { fetchDeliveryQuote } from "../utils/saveOrder";

const CartContext = createContext(null);

// Identical items merge into one line with a bigger qty; this key decides
// what counts as identical (everything but qty / cached price).
function itemKeyOf(item) {
  const keyObj = { ...item };
  delete keyObj.qty;
  delete keyObj.lineSubtotalCents;
  delete keyObj.id;
  delete keyObj._key;
  return JSON.stringify(keyObj);
}

// Adds one item to a cart list, merging into a matching line if there is one.
function mergeIntoItems(prev, raw) {
  const item = { ...raw };
  if (!item.qty || item.qty < 1) item.qty = 1;
  const itemKey = itemKeyOf(item);
  const idx = prev.findIndex((p) => p._key === itemKey);
  if (idx !== -1) {
    const next = prev.slice();
    next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
    return next;
  }
  return [...prev, { ...item, _key: itemKey, id: cryptoRandomId() }];
}

// Carts saved before coupons became separate items held each coupon as one
// "deal" line. Split those into their real items, tagged with the coupon.
function migrateLegacyDeals(items, appliedDeals) {
  if (!items.some((it) => it?.type === "deal")) return { items, appliedDeals };
  let nextItems = [];
  const nextDeals = [...appliedDeals];
  items.forEach((it) => {
    if (it?.type !== "deal") {
      nextItems.push(it);
      return;
    }
    const deal = findDealById(it.dealId);
    if (!deal) return;
    const ref = cryptoRandomId();
    nextDeals.push({ id: ref, dealId: deal.id });
    const units =
      deal.mode === "bundle"
        ? Object.entries(it.meta?.items || {}).map(([slot, unit]) => ({ slot, unit }))
        : (it.meta?.builds || []).map((unit) => ({ slot: unit.itemKey, unit }));
    units.forEach(({ slot, unit }) => {
      nextItems = mergeIntoItems(nextItems, dealUnitToCartItem(deal, slot, unit, ref));
    });
  });
  return { items: nextItems, appliedDeals: nextDeals };
}

export function CartProvider({ children, onEditItem }) {
  const [items, setItems] = useState([]);
  // Coupons applied to this cart: [{ id, dealId }]. The coupon's items are
  // ordinary lines in `items`, tagged `deal: { ref: <this id>, slot }`.
  const [appliedDeals, setAppliedDeals] = useState([]);
  const handleEditItem = useCallback((item) => onEditItem?.(item), [onEditItem]);

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

  // ---- Delivery fee quote for the confirmed address (drive time based,
  // see utils/orderRules.js). Kept with the address it belongs to; the
  // server works it out again when the order is placed. ----
  const [deliveryQuote, setDeliveryQuote] = useState(null); // { forAddress, ok, minutes, km, feeCents, tooFar }
  const [quoteLoading, setQuoteLoading] = useState(false);
  const saveQuote = (q) => {
    setDeliveryQuote(q);
    try {
      if (q) localStorage.setItem("rs_delivery_quote", JSON.stringify(q));
      else localStorage.removeItem("rs_delivery_quote");
    } catch {}
  };
  const refreshDeliveryQuote = useCallback(async (address) => {
    if (!address) return null;
    setQuoteLoading(true);
    const q = await fetchDeliveryQuote(address);
    setQuoteLoading(false);
    const stamped = { ...q, forAddress: JSON.stringify(address) };
    saveQuote(stamped);
    return stamped;
  }, []);

  const confirmDelivery = useCallback((address, quote = null) => {
    setService("delivery");
    setDeliveryAddress(address);
    try {
      localStorage.setItem("rs_service", "delivery");
      localStorage.setItem("rs_delivery_address", JSON.stringify(address));
    } catch {}
    if (quote?.ok) saveQuote({ ...quote, forAddress: JSON.stringify(address) });
    else refreshDeliveryQuote(address);
  }, [refreshDeliveryQuote]);

  // Returning visitor: use the saved quote if it's for the saved address,
  // otherwise work it out again.
  useEffect(() => {
    if (service !== "delivery" || !deliveryAddress) return;
    const want = JSON.stringify(deliveryAddress);
    if (deliveryQuote?.forAddress === want) return;
    try {
      const saved = JSON.parse(localStorage.getItem("rs_delivery_quote") || "null");
      if (saved?.forAddress === want && saved.ok) {
        setDeliveryQuote(saved);
        return;
      }
    } catch {}
    if (!quoteLoading) refreshDeliveryQuote(deliveryAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, deliveryAddress]);

  // What the cart/checkout show and add: null = not known yet.
  const quoteMatches = deliveryQuote?.forAddress === JSON.stringify(deliveryAddress || null);
  const deliveryFeeCents =
    service !== "delivery"
      ? 0
      : quoteMatches && deliveryQuote?.ok && !deliveryQuote.tooFar
      ? deliveryQuote.feeCents
      : null;
  const deliveryTooFar = service === "delivery" && quoteMatches && !!deliveryQuote?.tooFar;

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
  // Set when the builder was opened to add more items to a coupon that's
  // already in the cart ("Add another item to this coupon").
  const [openDealRef, setOpenDealRef] = useState(null);
  const openDeal = useCallback((id, ref = null) => {
    setOpenDealRef(ref);
    setOpenDealId(id);
  }, []);
  const closeDealBuilder = useCallback(() => {
    setOpenDealId(null);
    setOpenDealRef(null);
  }, []);

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
        setOpenDealRef(null);
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
    setItems((prev) => mergeIntoItems(prev, raw));
    try {
      track("add_to_cart", {
        type: raw?.type,
        name: raw?.pizzaName || raw?.name || raw?.side || raw?.categoryLabel || raw?.comboId || raw?.type,
        qty: Number(raw?.qty) || 1,
        price_cents: priceLineItem(raw),
      });
    } catch {
      // analytics must never stop an item being added
    }
  }, []);

  // Adds a coupon's items to the cart as their own lines, tagged with the
  // coupon. `ref` is an existing coupon in the cart (adding more items to
  // it); leave it out to apply the coupon fresh. `units`: [{ slot, unit }],
  // `unit` being what that item's builder returned.
  const reallyApplyDealItems = useCallback(({ dealId, ref = null, units = [] }) => {
    const deal = findDealById(dealId);
    if (!deal || !units.length) return;
    const dealRef = ref || cryptoRandomId();
    setAppliedDeals((prev) => (prev.some((d) => d.id === dealRef) ? prev : [...prev, { id: dealRef, dealId }]));
    setItems((prev) =>
      units.reduce((acc, { slot, unit }) => mergeIntoItems(acc, dealUnitToCartItem(deal, slot, unit, dealRef)), prev)
    );
  }, []);

  const applyDealItems = useCallback(
    (args) => {
      if (!isServiceConfirmed) {
        openServiceGate(() => reallyApplyDealItems(args));
        return;
      }
      reallyApplyDealItems(args);
    },
    [isServiceConfirmed, openServiceGate, reallyApplyDealItems]
  );

  // Takes a coupon off the order. Its items stay in the cart at their
  // normal price.
  const removeDeal = useCallback((ref) => {
    setAppliedDeals((prev) => prev.filter((d) => d.id !== ref));
    setItems((prev) =>
      prev.map((it) => {
        if (it?.deal?.ref !== ref) return it;
        const { deal, ...rest } = it;
        return { ...rest, _key: itemKeyOf(rest) };
      })
    );
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
        delete next._key;
        if (!next.qty || next.qty < 1) next.qty = 1;
        return { ...next, id, _key: itemKeyOf(next) };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedDeals([]);
  }, []);

  // ---- Prices: every line's real price (coupons applied), the subtotal,
  // and how much the coupons save (see priceCart in Pricing.js) ----
  const pricing = useMemo(() => priceCart(items, appliedDeals, service), [items, appliedDeals, service]);
  const subtotalCents = pricing.subtotalCents;

  // ---- Delivery minimum: every "Checkout" button goes through
  // goToCheckout(), which opens DeliveryMinimumOverlay instead when a
  // delivery order is under the minimum (utils/orderRules.js). ----
  const router = useRouter();
  const [minGateOpen, setMinGateOpen] = useState(false);
  const closeMinGate = useCallback(() => setMinGateOpen(false), []);
  const deliveryShortCents = service === "delivery" ? deliveryShortfallCents(subtotalCents) : 0;
  const goToCheckout = useCallback(() => {
    if (deliveryShortCents > 0) {
      setMinGateOpen(true);
      track("delivery_minimum_shown", { short_cents: deliveryShortCents });
      return;
    }
    router.push("/checkout");
  }, [deliveryShortCents, router]);
  const openMinGate = useCallback(() => setMinGateOpen(true), []);

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
          const migrated = migrateLegacyDeals(
            remote.items,
            Array.isArray(remote.appliedDeals) ? remote.appliedDeals : []
          );
          // Only skip the save when nothing changed; a migrated cart should
          // be written back in its new shape.
          suppressSaveRef.current = migrated.items === remote.items;
          setItems(migrated.items);
          setAppliedDeals(migrated.appliedDeals);
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
      setAppliedDeals(Array.isArray(remote.appliedDeals) ? remote.appliedDeals : []);
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
      saveCart(items, { uid, subtotalCents, appliedDeals }).catch(console.error);
    }, 350);
    return () => clearTimeout(saveTimer.current);
  }, [items, appliedDeals, subtotalCents, isLoaded]);

  // A coupon with none of its items left in the cart goes away by itself.
  useEffect(() => {
    if (!isLoaded) return;
    setAppliedDeals((prev) => {
      const next = prev.filter((d) => items.some((it) => it?.deal?.ref === d.id));
      return next.length === prev.length ? prev : next;
    });
  }, [items, isLoaded]);

  const value = useMemo(
    () => ({
      items,
      isLoaded,
      addItem,
      updateQty,
      updateItem,
      removeItem,
      clearCart,
      subtotalCents,
      pricing,
      appliedDeals,
      applyDealItems,
      removeDeal,
      openDealRef,
      onEditItem: handleEditItem,
      service,
      deliveryAddress,
      isServiceConfirmed,
      confirmCarryout,
      confirmDelivery,
      openServiceGate,
      closeServiceGate,
      serviceGateOpen,
      minGateOpen,
      openMinGate,
      closeMinGate,
      goToCheckout,
      deliveryShortCents,
      deliveryQuote,
      deliveryFeeCents,
      deliveryTooFar,
      quoteLoading,
      refreshDeliveryQuote,
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
      addItem,
      updateQty,
      updateItem,
      removeItem,
      clearCart,
      subtotalCents,
      pricing,
      appliedDeals,
      applyDealItems,
      removeDeal,
      openDealRef,
      handleEditItem,
      service,
      deliveryAddress,
      isServiceConfirmed,
      confirmCarryout,
      confirmDelivery,
      openServiceGate,
      closeServiceGate,
      serviceGateOpen,
      minGateOpen,
      openMinGate,
      closeMinGate,
      goToCheckout,
      deliveryShortCents,
      deliveryQuote,
      deliveryFeeCents,
      deliveryTooFar,
      quoteLoading,
      refreshDeliveryQuote,
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

// Header cart icon + count badge. The header wraps it in a link to /cart.
// The badge (a red circle, shown even at 0) does a double "pop" when the
// site loads, on every page change, and whenever the item count goes up.
// Size/color/pop are CSS variables on .cart-toggle__badge in globals.css.
export function CartToggle() {
  const { items, isLoaded } = useCart();
  const router = useRouter();
  const qty = items.reduce((n, it) => n + (Number(it.qty) || 0), 0);

  // Bumping popKey remounts the badge, which restarts its CSS animation.
  const [popKey, setPopKey] = useState(0);
  const pop = useCallback(() => setPopKey((k) => k + 1), []);

  // Site load / reload: wait for the saved cart so the pop shows the real
  // count (and doesn't fire a second time when it arrives).
  useEffect(() => {
    if (isLoaded) pop();
  }, [isLoaded, pop]);

  // Page changes (the header stays mounted between pages).
  useEffect(() => {
    router.events.on("routeChangeComplete", pop);
    return () => router.events.off("routeChangeComplete", pop);
  }, [router.events, pop]);

  // Something added to the cart.
  const prevQty = useRef(qty);
  useEffect(() => {
    if (isLoaded && qty > prevQty.current) pop();
    prevQty.current = qty;
  }, [qty, isLoaded, pop]);

  return (
    <span className="cart-toggle">
      <svg width="28" height="28" viewBox="2.5 0 24 24" fill="none" aria-hidden="true">
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
      </svg>
      <span key={popKey} className={`cart-toggle__badge${popKey ? " is-popping" : ""}`}>
        {qty}
      </span>
    </span>
  );
}

const REDEEM_ERROR_MESSAGES = {
  not_found: "That code isn't valid.",
  inactive: "That coupon isn't available right now.",
  service_mismatch: "That coupon isn't valid for your current order type.",
  network: "Couldn't check that code. Please try again.",
};

// Reusable "Have a coupon code?" entry — used in the cart dropdown, the full
// /cart page, and checkout. On a valid code it opens the matching deal's
// builder (via CartProvider's openDeal, driven by the server-validated
// result), it never applies a discount silently.
function DealCodeReveal({ code, setCode, status, error, onSubmit }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  if (!open) {
    return (
      <button type="button" className="deal-reveal__link" onClick={() => setOpen(true)}>
        Add Coupon
        <style jsx>{`
          .deal-reveal__link {
            padding: 0;
            background: none;
            border: 0;
            font-family: var(--font-display);
            font-size: 0.95rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            text-decoration: underline;
            text-underline-offset: 3px;
            color: var(--text-brown);
            cursor: pointer;
          }
        `}</style>
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="deal-reveal">
      <label className="deal-reveal__label" htmlFor="deal-reveal-input">
        Have a coupon or promotion code? Please enter the code exactly as shown, including the
        hyphen:
      </label>
      <div className="deal-reveal__row">
        <input
          id="deal-reveal-input"
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="deal-reveal__input"
          autoComplete="off"
          autoCapitalize="characters"
        />
        <button type="submit" className="rs-pill-btn deal-reveal__btn" disabled={status === "checking"}>
          {status === "checking" ? "…" : "Add"}
        </button>
      </div>
      {error && <div className="deal-reveal__error">{error}</div>}
      <style jsx>{`
        .deal-reveal__label {
          display: block;
          margin-bottom: 8px;
          font-family: var(--font-display);
          font-size: 0.95rem;
          line-height: 1.2;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--text-brown);
        }
        .deal-reveal__row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .deal-reveal__input {
          flex: 1 1 auto;
          min-width: 0;
          height: 40px;
          padding: 0 10px;
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          background: #fff;
          color: #000;
        }
        .deal-reveal__btn {
          flex: 0 0 auto;
          padding: 0.45rem 1.2rem;
          font-size: 1.05rem;
        }
        .deal-reveal__error {
          margin-top: 6px;
          font-size: 0.85rem;
          color: #b00020;
        }
      `}</style>
    </form>
  );
}

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

  // Cart page: just a small "ADD COUPON" link until tapped, then the
  // instructions, a plain input and a small red "ADD" pill.
  if (variant === "reveal") {
    return <DealCodeReveal code={code} setCode={setCode} status={status} error={error} onSubmit={handleSubmit} />;
  }

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

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(2);
    crypto.getRandomValues(buf);
    return `id_${buf[0].toString(16)}${buf[1].toString(16)}`;
  }
  return `id_${Math.random().toString(16).slice(2)}`;
}
