// pages/checkout.js
import React, { useEffect, useRef, useState } from "react";

// The checkout details (name, phone, email, payment choice) are kept in
// sessionStorage, so going back to the cart or menu and returning doesn't
// erase them. sessionStorage is only for this browser tab and is cleared
// when the tab is closed. Card numbers are never stored (Stripe holds them).
const SAVED_FORM_KEY = "rs_checkout_form";
const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "", payment: "" };
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "../components/CartSystem";
import OrderTotals, { useOrderTotals } from "../components/OrderTotals";
import { priceLineItem, formatMoney, describePizzaFull, describeByoPizzaHeading, describeByoPizzaSections } from "../components/Pricing";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";
import { findDealById } from "../utils/dealCatalog";
import { saveOrder, startCardPayment, finalizeCardPayment, friendlyOrderError } from "../utils/saveOrder";
import StripeCardPayment from "../components/StripeCardPayment";
import { DELIVERY_MINIMUM_CENTS } from "../utils/orderRules";

// Shown under the page title (same numbers as the menu page estimate)
const CARRYOUT_ADDRESS = "576 Concession Street";
const READY_MINUTES = { carryout: 20, delivery: 45 };

// Recomputes from the item's raw fields rather than trusting a possibly
// stale stored `.summary` string, so formatting stays consistent even for
// items added before a summary-format change.
function describeItem(item) {
  if (!item) return "";
  if (item.type === "pizza-byo") return describePizzaFull(item);
  if (item.type === "pizza-specialty") {
    const sizeLabel =
      ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(item.size)] ||
        `${item.size}"`);
    return [sizeLabel, item.crust].filter(Boolean).join(" ");
  }
  if (item.type === "wings") {
    const dipBits = Object.entries(item.dips || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([k, v]) => `${k} × ${v}`);
    // "6-piece, Hot, Sauced & Tossed" then dips on their own line
    return [
      [`${item.count}-piece`, item.sauce, item.serveStyle].filter(Boolean).join(", "),
      dipBits.length ? `Dips: ${dipBits.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (item.type === "side") return item.summary || item.name || "Side";
  if (item.type === "special") return item.summary || item.name || "Special";
  return item.summary || "";
}

function itemTitle(item) {
  return (
    item?.pizzaName ||
    // See pages/cart.js's itemTitle for why: .name doubles as the
    // priceSide() lookup key for sides ("Onion Rings (Medium)"), not the
    // customer-facing size — build the label from .side/.size instead.
    (item?.type === "side" && item?.side ? `${item.side}${item.size ? ` (${item.size})` : ""}` : null) ||
    item?.name ||
    (item?.type === "pizza-byo" ? describeByoPizzaHeading(item) : null) ||
    (item?.type === "combo" ? comboNameFor(item.comboId) : null) ||
    (item?.type === "wings" ? `${item.count || ""} Wings`.trim() : null) ||
    (item?.type === "drinks-dips" ? item.categoryLabel || "Drinks & Dips" : null) ||
    "Menu Item"
  );
}

// Name of the coupon a cart line belongs to (if that coupon is on the order).
function couponNameFor(cart, item) {
  const ref = item?.deal?.ref;
  if (!ref) return null;
  const inst = (cart?.appliedDeals || []).find((d) => d.id === ref);
  return inst ? findDealById(inst.dealId)?.name || null : null;
}

function formatAddress(addr) {
  if (!addr) return "Enter address";
  const { street, suite, city, postal } = addr;
  return [street, suite ? `Unit ${suite}` : "", city, postal]
    .filter(Boolean)
    .join(", ");
}

// Options under an item name (toppings, combo parts, etc.)
function itemOptionRows(item) {
  if (item?.type === "combo" && item?.meta?.items)
    return Object.entries(item.meta.items).map(([k, c]) => `${comboItemLabel(k)}: ${c?.summary || "Not customized yet"}`);
  if (item?.type === "pizza-byo") {
    // Left / Right / Whole, one line each (see describeByoPizzaSections)
    return describeByoPizzaSections(item).map((sec) => ({ label: sec.label, text: sec.text }));
  }
  const d = describeItem(item);
  return d ? [d] : [];
}

function formatSchedule(date, time) {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ---- Form fields ----
const FIELDS = [
  { key: "firstName", label: "First Name", type: "text", autoComplete: "given-name" },
  { key: "lastName", label: "Last Name", type: "text", autoComplete: "family-name" },
  { key: "email", label: "Email Address", type: "email", autoComplete: "email", inputMode: "email" },
  { key: "phone", label: "Callback Phone Number", type: "tel", autoComplete: "tel", inputMode: "numeric" },
];

// Callback phone: digits only, max 10, shown as (905) 555-1234 while typing.
// The closing bracket appears with the 4th digit, so backspacing never gets
// stuck on the ") " formatting. A pasted leading +1 / 1 country code is
// dropped.
function formatPhone(input) {
  let d = String(input || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  d = d.slice(0, 10);
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function validate(form) {
  const errors = {};
  for (const f of FIELDS) {
    if (!String(form[f.key] || "").trim()) errors[f.key] = "This field is required.";
  }
  if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!errors.phone && form.phone.replace(/\D/g, "").length !== 10) {
    errors.phone = "Please enter a 10-digit phone number.";
  }
  if (!form.payment) errors.payment = "This field is required.";
  return errors;
}

function Field({ field, value, error, onChange, inputRef }) {
  const id = `co-${field.key}`;
  return (
    <div className={`co-field${error ? " has-error" : ""}`}>
      <label htmlFor={id} className="co-label">
        <span className="co-req" aria-hidden="true">*</span> {field.label}:
      </label>
      <input
        ref={inputRef}
        id={id}
        className="co-input"
        type={field.type}
        inputMode={field.inputMode}
        autoComplete={field.autoComplete}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        aria-required="true"
      />
      {error && (
        <div id={`${id}-err`} className="co-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const items = cart?.items || [];
  const { service, deliveryAddress, isServiceConfirmed, openServiceGate, orderTiming, scheduleDate, scheduleTime } =
    cart || {};
  const totals = useOrderTotals();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  // Read the saved details once the page has loaded (not during the server
  // render, so the page doesn't flash), then save every change.
  const formLoaded = useRef(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SAVED_FORM_KEY) || "null");
      if (saved && typeof saved === "object") {
        const clean = {};
        for (const k of Object.keys(EMPTY_FORM)) if (typeof saved[k] === "string") clean[k] = saved[k];
        setForm((f) => ({ ...f, ...clean }));
      }
    } catch {
      // private browsing or storage blocked: the form just starts empty
    }
    formLoaded.current = true;
  }, []);
  useEffect(() => {
    if (!formLoaded.current) return;
    try {
      sessionStorage.setItem(SAVED_FORM_KEY, JSON.stringify(form));
    } catch {
      // storage blocked: nothing to do
    }
  }, [form]);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const fieldRefs = useRef({});
  const cardRef = useRef(null); // the Stripe card form (Pay Now)

  const update = (key, rawValue) => {
    const value = key === "phone" ? formatPhone(rawValue) : rawValue;
    setForm((f) => ({ ...f, [key]: value }));
    // clear that field's error as soon as they fix it
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Same "pay when you get it" option either way, worded for the service.
  const isDelivery = service === "delivery";
  const payLaterLabel = isDelivery ? "Pay at Door" : "Pay at Store";

  const scheduleText = orderTiming === "later" ? formatSchedule(scheduleDate, scheduleTime) : null;

  const handlePlaceOrder = async () => {
    if (placing) return;
    setSubmitError(null);
    if (!isServiceConfirmed) {
      openServiceGate?.();
      return;
    }
    // Address too far to price online: the notice above the button explains.
    if (cart?.deliveryTooFar) return;
    // Delivery minimum (utils/orderRules.js): show what's missing instead.
    if (cart?.deliveryShortCents > 0) {
      cart.openMinGate?.();
      return;
    }
    const found = validate(form);
    setErrors(found);
    const firstBad = [...FIELDS.map((f) => f.key), "payment"].find((k) => found[k]);
    if (firstBad) {
      const el = fieldRefs.current[firstBad];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el?.focus) setTimeout(() => el.focus({ preventScroll: true }), 350);
      return;
    }

    setPlacing(true);
    const serviceMethod = service === "delivery" ? "Delivery" : "Carryout";
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const orderData = {
      items,
      appliedDeals: cart?.appliedDeals || [],
      serviceMethod,
      orderTiming,
      schedule: orderTiming === "later" ? { date: scheduleDate, time: scheduleTime } : { date: null, time: null },
      location: CARRYOUT_ADDRESS,
      deliveryAddress: serviceMethod === "Delivery" ? deliveryAddress || null : null,
      contact: {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      paymentMethod: form.payment,
    };

    // ---- Pay Now: card through Stripe ----
    if (form.payment === "card") {
      const result = await cardRef.current?.pay({
        createPayment: () => startCardPayment(orderData),
        billing: {
          name: orderData.contact.name,
          email: orderData.contact.email || undefined,
          phone: orderData.contact.phone,
        },
        // Only used by payment types that send the customer to their bank's
        // site; they come back to the confirmation page, which finishes up.
        returnUrlFor: (orderId) => {
          try {
            sessionStorage.setItem("rs_card_order", orderId);
          } catch {}
          return `${window.location.origin}/order-confirmation?orderId=${orderId}&card=1`;
        },
      });
      if (!result) {
        setPlacing(false);
        setSubmitError("The card form is still loading. Please try again.");
        return;
      }
      if (result.error) {
        setPlacing(false);
        // Card problems show inside the card form too; keep the message here
        // so it's visible next to the button.
        setSubmitError(result.error);
        if (result.field) fieldRefs.current.payment?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const status = await finalizeCardPayment(result.orderId);
      cart?.clearCart?.();
      router.push(`/order-confirmation?orderId=${result.orderId}&card=1${status === "paid" ? "" : "&check=1"}`);
      return;
    }

    // ---- Pay at Store / Pay at Door ----
    const id = await saveOrder(orderData);
    setPlacing(false);
    if (!id) {
      // The short code in brackets tells us which step failed.
      setSubmitError(friendlyOrderError(saveOrder.lastError));
      return;
    }
    cart?.clearCart?.();
    router.push(`/order-confirmation?orderId=${id}`);
  };

  return (
    <main className="page page--checkout">
      <div className="container co-wrap">
        <h1 className="menu-title co-title">Checkout</h1>

        {/* Carryout / delivery line */}
        <p className="co-sub">
          {!isServiceConfirmed ? (
            <>
              No order method selected yet.{" "}
              <button type="button" className="co-sub__link" onClick={() => openServiceGate?.()}>
                Choose carryout or delivery
              </button>
            </>
          ) : service === "delivery" ? (
            <>
              <strong>Delivery</strong> to <strong>{formatAddress(deliveryAddress)}</strong>
              <br />
              {scheduleText ? (
                <>Your order will be delivered <strong>{scheduleText}</strong>.</>
              ) : (
                <>
                  Your order will arrive about <strong>{READY_MINUTES.delivery} minutes</strong> after it
                  is placed.
                </>
              )}
            </>
          ) : (
            <>
              <strong>Carryout</strong> from <strong>{CARRYOUT_ADDRESS}</strong>
              <br />
              {scheduleText ? (
                <>Your order will be ready <strong>{scheduleText}</strong>.</>
              ) : (
                <>
                  Your order will be ready <strong>{READY_MINUTES.carryout} minutes</strong> after it is
                  placed.
                </>
              )}
            </>
          )}
        </p>

        {!cart?.isLoaded ? (
          <div className="co-empty">Loading your cart…</div>
        ) : items.length === 0 ? (
          <div className="co-empty">
            Your cart is empty. <Link href="/menu">Browse the menu</Link>.
          </div>
        ) : (
          <>
            {/* ---- Total + expandable order summary ---- */}
            <div className={`co-summary${summaryOpen ? " is-open" : ""}`}>
              <button
                type="button"
                className="co-summary__bar"
                onClick={() => setSummaryOpen((v) => !v)}
                aria-expanded={summaryOpen}
                aria-controls="co-summary-panel"
              >
                <span className="co-summary__total">Total: {formatMoney(totals.total)}</span>
                <span className="co-summary__toggle">
                  <span>
                    {summaryOpen ? "Hide" : "Show"} Order
                    <br />
                    Summary
                  </span>
                  <span className="co-summary__tri" aria-hidden="true" />
                </span>
              </button>

              {summaryOpen && (
                <div id="co-summary-panel" className="co-summary__panel">
                  <div className="co-items">
                    <div className="co-items__head">
                      <span>Item</span>
                      <span>Qty</span>
                      <span>Price</span>
                    </div>
                    <div className="co-items__body">
                      {items.map((it) => (
                        <div key={it.id} className="co-items__row">
                          <div className="co-items__name">
                            <div className="co-items__title">{itemTitle(it)}</div>
                            {itemOptionRows(it).map((t, i) =>
                              typeof t === "string" ? (
                                <div key={i} className="co-items__opt">{t}</div>
                              ) : (
                                <div key={i} className="co-items__opt co-items__opt--sec">
                                  {t.label && <span className="co-items__optLabel">{t.label}: </span>}
                                  {t.text}
                                </div>
                              )
                            )}
                            {couponNameFor(cart, it) && (
                              <div className="co-items__opt co-items__coupon">Coupon: {couponNameFor(cart, it)}</div>
                            )}
                          </div>
                          <span className="co-items__qty">{Math.max(1, Number(it.qty) || 1)}</span>
                          <span className="co-items__price">
                            {formatMoney(cart.pricing?.lines?.[it.id]?.finalCents ?? priceLineItem(it))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="co-summary__foot">
                    <Link href="/cart" className="rs-pill-btn co-change">
                      Change Your Order
                    </Link>
                    <OrderTotals />
                  </div>
                </div>
              )}
            </div>

            {/* ---- 1 of 2: Your information ---- */}
            <section className="co-section">
              <div className="co-section__head">
                <span>Your Information</span>
                <span>1 of 2</span>
              </div>
              <div className="co-section__body">
                {FIELDS.map((f) => (
                  <React.Fragment key={f.key}>
                    <Field
                      field={f}
                      value={form[f.key]}
                      error={errors[f.key]}
                      onChange={update}
                      inputRef={(el) => (fieldRefs.current[f.key] = el)}
                    />
                    {f.key === "phone" && (
                      <p className="co-hint">
                        We may need to call you for quality control purposes. Please enter a phone
                        number where we can reach you.
                      </p>
                    )}
                  </React.Fragment>
                ))}
                <p className="co-reqnote">
                  <span className="co-req">*</span>Indicates required field.
                </p>
              </div>
            </section>

            {/* ---- 2 of 2: Payment ---- */}
            <section className="co-section">
              <div className="co-section__head">
                <span>Payment Method</span>
                <span>2 of 2</span>
              </div>
              <div className="co-section__body">
                <div className="co-balance">
                  <div className="co-balance__label">Payment Information</div>
                  <div className="co-balance__due">Balance Due: {formatMoney(totals.total)}</div>
                </div>

                <div
                  className={`co-field co-pay${errors.payment ? " has-error" : ""}`}
                  ref={(el) => (fieldRefs.current.payment = el)}
                  tabIndex={-1}
                  role="radiogroup"
                  aria-labelledby="co-pay-label"
                  aria-required="true"
                  aria-describedby={errors.payment ? "co-pay-err" : undefined}
                >
                  <div id="co-pay-label" className="co-label">
                    <span className="co-req" aria-hidden="true">*</span> Payment Type:
                  </div>
                  {[
                    { value: "store", label: payLaterLabel },
                    { value: "card", label: "Pay Now with Debit or Credit Card" },
                  ].map((o) => (
                    <label key={o.value} className="co-radio">
                      <input
                        type="radio"
                        name="payment"
                        value={o.value}
                        checked={form.payment === o.value}
                        onChange={() => update("payment", o.value)}
                      />
                      <span>{o.label}</span>
                    </label>
                  ))}
                  {form.payment === "store" && (
                    <p className="co-hint co-hint--note">
                      <strong>Note:</strong>{" "}
                      {isDelivery
                        ? "When your order arrives you can pay with cash, credit card or debit card."
                        : "At the store you can pay with cash, credit card, debit card or gift card."}
                    </p>
                  )}
                  {form.payment === "card" && <StripeCardPayment ref={cardRef} amountCents={totals.total} />}
                  {errors.payment && (
                    <div id="co-pay-err" className="co-error">
                      {errors.payment}
                    </div>
                  )}
                </div>
                <p className="co-reqnote">
                  <span className="co-req">*</span>Indicates required field.
                </p>
              </div>
            </section>

            {cart?.deliveryTooFar && (
              <div className="co-minNote">
                This address is outside our regular delivery area. Please double-check the address, or call
                us at <a href="tel:+19053859888">905-385-9888</a> and we'll arrange your delivery.{" "}
                <button type="button" className="co-minNote__btn" onClick={() => openServiceGate?.()}>
                  Change address
                </button>
              </div>
            )}
            {cart?.deliveryShortCents > 0 && (
              <div className="co-minNote">
                Delivery orders need at least {formatMoney(DELIVERY_MINIMUM_CENTS)} of food and drinks. Add{" "}
                <strong>{formatMoney(cart.deliveryShortCents)}</strong> more, or switch to carryout.{" "}
                <button type="button" className="co-minNote__btn" onClick={() => cart.openMinGate?.()}>
                  See options
                </button>
              </div>
            )}
            {submitError && <div className="co-submitError">{submitError}</div>}
            <button type="button" className="rs-pill-btn co-place" onClick={handlePlaceOrder} disabled={placing}>
              {placing
                ? form.payment === "card"
                  ? "Processing Payment…"
                  : "Placing Your Order…"
                : "Place Your Order"}
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .co-wrap {
          max-width: 820px;
          padding-top: 16px;
          padding-bottom: 40px;
        }
        .co-title {
          text-align: left;
          margin-bottom: 4px;
        }
        /* Whole line in the Red Stone Display text family: Light for the
           sentence, Medium for the key words (<strong>). */
        .co-sub {
          margin: 0 0 16px;
          color: var(--text-brown);
          /* Red Stone Face (variable font) — tweak the two weights below
             in Inspect: any number from 300 (Light) to 950 (ExtraBlack). */
          --sub-weight: 400;      /* the sentence */
          --sub-bold-weight: 600; /* the bold words */
          font-family: var(--font-face);
          font-weight: var(--sub-weight);
          font-size: 1.1rem;
          line-height: 1.35;
          /* spacing — tweak these two */
          --sub-letter-spacing: 0em; /* space between letters, e.g. 0.02em */
          --sub-word-spacing: 0em;   /* extra space between words, e.g. 0.1em */
          letter-spacing: var(--sub-letter-spacing);
          word-spacing: var(--sub-word-spacing);
        }
        .co-sub strong {
          font-weight: var(--sub-bold-weight);
        }
        .co-sub__link {
          padding: 0;
          border: 0;
          background: none;
          color: var(--text-brown);
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }
        .co-empty {
          padding: 24px;
          text-align: center;
          color: var(--text-brown);
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
        }
        .co-empty :global(a) {
          color: var(--text-brown);
          font-weight: 700;
          text-decoration: underline;
        }

        /* ----- Total bar + expandable summary ----- */
        .co-summary {
          margin-bottom: 18px;
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          background: #f9f9f9; /* same as the page background */
        }
        .co-summary__bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border: 0;
          background: none;
          cursor: pointer;
          text-align: left;
        }
        .co-summary__total {
          font-family: var(--font-display);
          font-size: 1.7rem;
          line-height: 1;
          color: #000;
          text-transform: uppercase;
        }
        .co-summary__toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 0.9rem;
          line-height: 1.05;
          text-align: right;
          text-transform: uppercase;
          color: #000;
        }
        .co-summary__tri {
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 10px solid currentColor;
          transition: transform 0.2s ease;
        }
        .co-summary.is-open .co-summary__tri {
          transform: rotate(180deg);
        }
        .co-summary__panel {
          padding: 0 14px 14px;
        }
        .co-items {
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          overflow: hidden;
        }
        .co-items__head,
        .co-items__row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 44px 72px;
          column-gap: 10px;
        }
        .co-items__head {
          padding: 0.65rem 0.8rem;
          background: #000;
          color: #fff;
          font-family: var(--font-heading);
          font-size: 1.05rem;
          line-height: 1;
          text-transform: uppercase;
        }
        .co-items__head span:nth-child(2) {
          text-align: center;
        }
        .co-items__head span:nth-child(3) {
          text-align: right;
        }
        .co-items__body {
          background: #fefaf6;
          padding: 0 0.8rem;
        }
        .co-items__row {
          padding: 10px 0;
          border-bottom: 1px solid var(--menu-box-border);
          align-items: start;
        }
        .co-items__row:last-child {
          border-bottom: 0;
        }
        /* item name in Red Stone Display (caps-only), like the cart */
        .co-items__title {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: 1.05rem;
          line-height: 1.1;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #000;
          margin-bottom: 2px;
        }
        .co-items__opt {
          white-space: pre-line; /* item details can run over several lines */
          font-family: var(--font-display-text); /* Red Stone Display Medium */
          font-weight: 400;
          font-size: 0.88rem;
          line-height: 1.35;
          color: var(--text-brown);
          overflow-wrap: anywhere;
        }
        .co-items__coupon {
          margin-top: 4px;
          font-family: var(--font-display);
          font-size: 0.8rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #e31837;
        }
        .co-items__opt--sec + .co-items__opt--sec {
          margin-top: 4px; /* a little space between Left / Right / Whole */
        }
        /* Left: / Right: / Whole: labels — Red Stone Display Medium, black */
        .co-items__optLabel {
          font-weight: 400;
          color: #000;
        }
        .co-items__qty {
          text-align: center;
          color: var(--text-brown);
          font-weight: 700;
        }
        .co-items__price {
          text-align: right;
          color: var(--text-brown);
          font-weight: 700;
        }
        .co-summary__foot {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-top: 12px;
        }
        /* totals keep their width; the button takes what's left */
        .co-summary__foot :global(.order-totals) {
          flex: 0 0 auto;
        }
        .co-summary__foot :global(.co-change) {
          flex: 0 1 auto;
          padding: 0.55rem 1.1rem;
          font-size: 1.05rem;
        }

        /* ----- Numbered sections ----- */
        .co-section {
          margin-bottom: 18px;
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          overflow: hidden;
        }
        .co-section__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0.75rem 0.9rem;
          background: #000;
          color: #fff;
          font-family: var(--font-heading);
          font-size: 1.3rem;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .co-section__body {
          padding: 16px 16px 12px;
          background: var(--menu-box-bg); /* cream #faf2e9 */
        }
        .co-wrap :global(.co-field) {
          margin: 0 0 14px;
        }
        .co-wrap :global(.co-label) {
          display: block;
          margin-bottom: 6px;
          padding: 0;
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--text-brown);
        }
        .co-wrap :global(.co-req) {
          color: #d0021b;
        }
        .co-wrap :global(.co-input) {
          display: block;
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          background: #fff;
          color: #000;
        }
        .co-wrap :global(.co-input:focus) {
          outline: 2px solid var(--text-brown);
          outline-offset: 1px;
        }
        /* missing / invalid: red border + thick red bar on the left */
        .co-wrap :global(.co-field.has-error .co-input) {
          border-color: #d0021b;
          box-shadow: inset 5px 0 0 #d0021b;
          padding-left: 16px;
        }
        .co-wrap :global(.co-error) {
          margin-top: 5px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #d0021b;
        }
        .co-wrap :global(.co-hint) {
          margin: -6px 0 14px;
          font-size: 0.75rem;
          line-height: 1.35;
          color: var(--text-brown);
        }
        .co-wrap :global(.co-hint--note) {
          margin: 8px 0 0;
          font-size: 0.85rem;
        }
        .co-wrap :global(.co-hint--note strong) {
          color: #000;
        }
        .co-wrap :global(.co-reqnote) {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: var(--text-brown);
        }

        /* ----- Payment ----- */
        .co-balance {
          margin-bottom: 14px;
          text-align: right;
          font-family: var(--font-display);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .co-balance__label {
          color: var(--text-brown);
          font-size: 1rem;
        }
        .co-balance__due {
          color: #000;
          font-size: 1.35rem;
        }
        /* Stripe card form (Pay Now) */
        .co-wrap :global(.co-card) {
          margin-top: 12px;
        }
        .co-wrap :global(.co-card__loading),
        .co-wrap :global(.co-card--missing) {
          padding: 12px;
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          background: #fff;
          font-size: 0.9rem;
          color: var(--text-brown);
        }
        .co-wrap :global(.co-card__secure) {
          margin: 10px 0 0;
          font-size: 0.8rem;
          line-height: 1.35;
          color: var(--text-brown);
        }
        .co-pay {
          border: 0;
          min-width: 0;
          padding: 0;
          outline: none;
        }
        .co-pay.has-error {
          padding: 8px 10px 10px 14px;
          border: 1px solid #d0021b;
          border-radius: 0.1875rem;
          box-shadow: inset 5px 0 0 #d0021b;
        }
        .co-radio {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0;
          color: var(--text-brown);
          cursor: pointer;
        }
        /* white circle with brown ring; selected = brown with a white dot */
        .co-radio input {
          appearance: none;
          -webkit-appearance: none;
          flex: 0 0 auto;
          width: 20px;
          height: 20px;
          margin: 0;
          border: 2px solid var(--text-brown);
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
        }
        .co-radio input:checked {
          background: radial-gradient(circle, #fff 0 3px, var(--text-brown) 3.5px);
        }
        .co-radio input:focus-visible {
          outline: 2px solid var(--text-brown);
          outline-offset: 2px;
        }

        /* ----- Readable sizes for Red Stone Face (narrower than the old
           Inter, so small text needs to be a step bigger; nothing under 15px) */
        .co-radio {
          font-size: 1.1rem;
        }
        .co-wrap :global(.co-error) {
          font-size: 1rem;
        }
        .co-wrap :global(.co-hint) {
          font-size: 0.95rem;
        }
        .co-wrap :global(.co-hint--note) {
          font-size: 1rem;
        }
        .co-wrap :global(.co-reqnote) {
          font-size: 0.95rem;
        }
        .co-wrap :global(.co-req) {
          font-weight: 700;
          font-size: 1.15em;
        }
        /* the asterisk in "*Indicates required field." */
        .co-wrap :global(.co-reqnote .co-req) {
          font-size: 1.7em;
          line-height: 0;
          vertical-align: -0.2em;
          margin-right: 1px;
        }
        .co-wrap :global(.co-card__secure),
        .co-wrap :global(.co-card__loading) {
          font-size: 0.95rem;
        }
        .co-items__opt {
          font-size: 1rem;
        }
        .co-items__coupon {
          font-size: 0.95rem;
        }
        .co-minNote {
          margin-bottom: 12px;
          padding: 12px 14px;
          border: 1px solid var(--menu-box-border);
          border-left: 5px solid #e31837;
          border-radius: 0.1875rem;
          background: var(--menu-box-bg);
          font-size: var(--fs-base);
          color: var(--text-brown);
        }
        .co-minNote a {
          color: #000;
          font-weight: var(--w-bold);
          text-decoration: underline;
        }
        .co-minNote strong {
          font-weight: var(--w-bold);
          color: #000;
        }
        .co-minNote__btn {
          padding: 0;
          border: 0;
          background: none;
          font-family: var(--font-display);
          font-size: var(--fs-sm);
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: #000;
          cursor: pointer;
        }
        .co-submitError {
          font-size: 1rem;
        }

        .co-submitError {
          margin-bottom: 10px;
          color: #d0021b;
          font-weight: 600;
        }
        .co-wrap :global(.co-place) {
          display: block;
          width: 100%;
        }
        .co-wrap :global(.co-place:disabled) {
          opacity: 0.7;
          cursor: wait;
        }

        @media (max-width: 640px) {
          .co-summary__foot :global(.order-totals) {
            width: 196px;
          }
          .co-summary__foot :global(.order-totals .order-totals__row) {
            font-size: 0.88rem;
            padding: 7px 10px;
          }
          .co-summary__foot :global(.order-totals .order-totals__row--total) {
            font-size: 1.05rem;
          }
          .co-summary__total {
            font-size: 1.4rem;
          }
          .co-section__head {
            font-size: 1.15rem;
          }
          .co-summary__panel {
            padding: 0 10px 10px;
          }
          /* two tidy lines ("Change your / order") so it fits beside the totals */
          .co-summary__foot :global(.co-change) {
            max-width: 132px;
            font-size: 0.9rem;
            line-height: 1.1;
            padding: 0.55rem 0.9rem;
            border-radius: 22px;
          }
        }
        /* very small phones (e.g. iPhone SE): totals first, button below */
        @media (max-width: 360px) {
          .co-summary__foot {
            flex-direction: column;
            align-items: flex-end;
          }
          .co-summary__foot :global(.co-change) {
            align-self: flex-start;
            max-width: none;
          }
        }
      `}</style>
    </main>
  );
}
