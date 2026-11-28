// pages/cart.js
import { NoteRemove } from "../components/ItemNote";
import { ORDER_NOTE_MAX } from "../utils/orderRules";
import { soldOutIn } from "../utils/availability";
import { DRINK_CATEGORIES, THUMB_MAX, drinkImage, findDrink } from "../utils/drinkCatalog";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart, DealCodeEntry } from "../components/CartSystem";
import { priceLineItem, formatMoney, describePizzaFull, describeByoPizzaHeading, describeByoPizzaSections } from "../components/Pricing";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";
import { findDealById, dealDiscountLabel } from "../utils/dealCatalog";
import OrderSettingsAside from "../components/OrderSettingsAside";
import OrderTotals from "../components/OrderTotals";
import { DELIVERY_MINIMUM_CENTS } from "../utils/orderRules";
import { useRouter } from "next/router";

/*
  Cart page layout
  ----------------
  CART (page title)
  ┌ Food & Drink Details ─────────────────────────────── (black header) ┐
  │ Review and modify…  (custom font)          [ ADD MORE ITEMS ] (pill) │
  │ Note: …                                                              │
  │ ┌ STEP 1: CONFIRM YOUR SELECTIONS │ QUANTITY │ PRICE ┐  (black)      │
  │ │ [img] Item name / options        [- 1 +]    $0.00  │  (off-white)  │
  │ │                                  EDIT  REMOVE      │               │
  │ └────────────────────────────────────────────────────┘               │
  │ ┌ STEP 2: CHOOSE YOUR SIDES ┐  3 quick-add tiles                     │
  │ ┌ STEP 3: CHOOSE YOUR DRINKS ┐                                       │
  │ ┌ STEP 4: ADD SOME FLAVOUR ┐                                         │
  │ [ COUPON APPLIED! ]  + one box per coupon (when applied)             │
  │ deal code                                                            │
  └──────────────────────────────────────────────────────────────────────┘
  Outer box: cream (--menu-box-bg, #faf2e9). Step bodies: off-white #fefaf6.
*/

const OFF_WHITE = "#fefaf6";

// Sides with a real size choice show an S/R/L picker when tapped (same
// pattern as the Sides menu); others add straight away. Pricing keys use
// "Medium" for what the UI calls "Regular".
const SIDE_SIZE_OPTIONS = {
  "French Fries": [{ size: "Regular", abbr: "R" }, { size: "Large", abbr: "L" }],
  "Poutine": [{ size: "Small", abbr: "S" }, { size: "Regular", abbr: "R" }, { size: "Large", abbr: "L" }],
  "Onion Rings": [{ size: "Regular", abbr: "R" }, { size: "Large", abbr: "L" }],
};
const sideSizeToPricingLabel = (size) => (size === "Regular" ? "Medium" : size);
const SEG_COLORS = { Small: "#e57373", Regular: "#e91e28", Large: "#b71c1c" };

// Pools the Step 2–4 tiles pick 3 random items from. Images use the same
// paths as the menu, so real photos show up here once they're added; until
// then each tile falls back to its category picture.
const SIDE_POOL = [
  { key: "French Fries", img: "/images/sides/fries.jpg" },
  { key: "Poutine", img: "/images/sides/poutine.jpg" },
  { key: "Onion Rings", img: "/images/sides/onion-rings.jpg" },
  { key: "Cheesy Garlic Bread", img: "/images/sides/cheesy-garlic-bread.jpg" },
];
const DRINK_POOL = [
  ["twoLiters", "Coke", "Coke 2L"],
  ["twoLiters", "Gingerale", "Gingerale 2L"],
  ["twoLiters", "Pepsi", "Pepsi 2L"],
  ["cans", "Coke", "Coke Can"],
  ["cans", "Sprite", "Sprite Can"],
  ["other", "Water", "Water"],
].map(([categoryId, key, label]) => ({
  key,
  label,
  categoryId,
  categoryLabel: DRINK_CATEGORIES[categoryId].label,
  img: drinkImage(categoryId, key),
}));
const DIP_POOL = [
  { key: "Blue Cheese", label: "Blue Cheese", categoryId: "dips", categoryLabel: "Dips", img: drinkImage("dips", "Blue Cheese") },
  { key: "Garlic", label: "Garlic", categoryId: "dips", categoryLabel: "Dips", img: drinkImage("dips", "Garlic") },
  { key: "Ranch", label: "Ranch", categoryId: "dips", categoryLabel: "Dips", img: drinkImage("dips", "Ranch") },
];

// 3 random picks, chosen after the page loads (so the server-rendered page
// and the browser agree, then it shuffles once on the customer's screen).
function useRandomPicks(pool, n = 3) {
  const [picks, setPicks] = useState(() => pool.slice(0, n));
  useEffect(() => {
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setPicks(copy.slice(0, n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return picks;
}

// <img> that tries a list of sources in order (e.g. item photo, then its
// category picture), and shows an empty cream square if none load.
function FallbackImg({ srcs, alt, className }) {
  const list = srcs.filter(Boolean);
  const [i, setI] = useState(0);
  if (i >= list.length) return <span className={`${className} cart-img--empty`} aria-hidden="true" />;
  return (
    <img
      src={list[i]}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setI((v) => v + 1)}
    />
  );
}

// Cart picture for a drinks/dips line: the first few drinks picked (up to
// 4 cans, or 3 of anything else), standing side by side on white at their
// real sizes, like the category covers.
function DrinksThumb({ item }) {
  const max = THUMB_MAX[item?.categoryId] || 3;
  const picked = (item?.items || [])
    .map((it) => findDrink(item.categoryId, it?.label))
    .filter(Boolean)
    .slice(0, max);
  if (!picked.length) return <span className="cart-line__img cart-img--empty" aria-hidden="true" />;
  const tallest = Math.max(...picked.map((d) => d.mm || 1));
  return (
    <span className="cart-line__img cart-drinks" aria-hidden="true">
      {picked.map((d) => (
        <img key={d.label} src={d.img} alt="" style={{ height: `${Math.round(((d.mm || tallest) / tallest) * 86)}%` }} />
      ))}
    </span>
  );
}

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Best picture for a cart line, plus a category fallback.
function itemImages(item) {
  const name = item?.pizzaName || item?.name || "";
  switch (item?.type) {
    case "pizza-byo":
      // a customized Signature/Specialty pizza keeps its own photo
      return item.pizzaName
        ? [`/images/pizzas/overhead/${slugify(item.pizzaName)}.webp`, "/images/pizzas/overhead/pepperoni.webp"]
        : ["/images/pizzas/overhead/pepperoni.webp"];
    case "pizza-specialty":
      return [
        `/images/pizzas/overhead/${slugify(name)}.webp`,
        `/images/${item.style === "classic" ? "specialty" : "signature"}/${slugify(name)}.jpg`,
        `/images/${item.style === "classic" ? "signature" : "specialty"}/${slugify(name)}.jpg`,
        "/images/menu_signature.png",
      ];
    case "wings":
      return ["/images/wings.jpg", "/images/menu_wings.png"];
    case "side": {
      const pool = SIDE_POOL.find((s) => s.key === item.side);
      return [pool?.img, "/images/menu_sides.png"];
    }
    case "drinks-dips":
      return item.categoryId === "dips"
        ? [`/images/dips/${slugify(item.items?.[0]?.label)}.jpg`, `/images/dips/${slugify(item.items?.[0]?.label)}.png`]
        : [drinkImage(item.categoryId, item.items?.[0]?.label), "/images/menu_drinks.png"];
    case "special":
      return [`/images/special-menu/${slugify(name)}.jpg`, "/images/menu_special.png"];
    case "combo":
      return ["/images/menu_combos.png"];
    default:
      return [];
  }
}

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
    // Sides' .name is also the priceSide() lookup key (e.g. "Onion Rings
    // (Medium)", an internal pricing label, not what the customer picked —
    // see sideSizeToPricingLabel above) — build the customer-facing label
    // from the raw .side/.size fields instead, before falling back to .name.
    (item?.type === "side" && item?.side ? `${item.side}${item.size ? ` (${item.size})` : ""}` : null) ||
    item?.name ||
    (item?.type === "pizza-byo" ? describeByoPizzaHeading(item) : null) ||
    (item?.type === "combo" ? comboNameFor(item.comboId) : null) ||
    (item?.type === "wings" ? `${item.count || ""} Wings`.trim() : null) ||
    (item?.type === "drinks-dips" ? item.categoryLabel || "Drinks & Dips" : null) ||
    "Menu Item"
  );
}

// Options shown under the item name (toppings, combo parts, etc.)
function ItemOptions({ item }) {
  const rows =
    item?.type === "combo" && item?.meta?.items
      ? Object.entries(item.meta.items).map(([key, child]) => [comboItemLabel(key), child?.summary])
      : null;

  if (!rows && item?.type === "pizza-byo") {
    // Left / Right / Whole, one line each (see describeByoPizzaSections)
    return (
      <div className="cart-line__opts cart-line__opts--byo">
        {describeByoPizzaSections(item).map((sec, i) => (
          <div key={i}>
            {sec.label && <strong>{sec.label}: </strong>}
            {sec.text}
          </div>
        ))}
      </div>
    );
  }
  if (!rows) return <div className="cart-line__opts">{describeItem(item)}</div>;
  return (
    <div className="cart-line__opts">
      {rows.map(([label, text], i) => (
        <div key={i}>
          <strong>{label}:</strong> {text || "Not customized yet"}
        </div>
      ))}
    </div>
  );
}

// "+ Add a note to your order" link that opens a box for a note about the
// whole order (sent with the order, shown to the kitchen).
function OrderNote({ cart }) {
  const value = cart?.orderNote || "";
  const [open, setOpen] = useState(!!value.trim());
  const boxRef = useRef(null);
  useEffect(() => {
    if (value.trim()) setOpen(true); // a saved note loads after the page opens
  }, [value]);
  if (!open) {
    return (
      <div className="cart-orderNote">
        <button
          type="button"
          className="cart-orderNote__open"
          onClick={() => {
            setOpen(true);
            setTimeout(() => boxRef.current?.focus({ preventScroll: true }), 0);
          }}
        >
          + Add a note to your order
        </button>
      </div>
    );
  }
  return (
    <div className="cart-orderNote">
      <label>
        <span className="cart-orderNote__label">Note for your whole order (optional)</span>
        <textarea
          ref={boxRef}
          className="cart-orderNote__box"
          rows={2}
          maxLength={ORDER_NOTE_MAX}
          value={value}
          onChange={(e) => cart.setOrderNote?.(e.target.value)}
        />
      </label>
      <NoteRemove
        hasText={!!value.trim()}
        onRemove={() => {
          cart.setOrderNote?.("");
          setOpen(false);
        }}
      />
    </div>
  );
}

function ItemRow({ item, priceCents, couponName, onQty, onRemove, onEdit }) {
  const qty = Math.max(1, Number(item?.qty) || 1);
  const soldOutNames = soldOutIn(item, useCart()?.soldOut);
  const title = itemTitle(item);
  return (
    <div className="cart-line">
      <div className="cart-line__item">
        {item?.type === "drinks-dips" ? (
          <DrinksThumb item={item} />
        ) : (
          <FallbackImg srcs={itemImages(item)} alt="" className="cart-line__img" />
        )}
        <div className="cart-line__text">
          <button type="button" className="cart-line__name" onClick={() => onEdit?.(item)}>
            {title}
          </button>
          <ItemOptions item={item} />
          {item?.note && <div className="cart-line__note">Note: {item.note}</div>}
          {couponName && <div className="cart-line__coupon">Coupon: {couponName}</div>}
          {soldOutNames.length > 0 && (
            <div className="cart-line__soldout">Sold out: {soldOutNames.join(", ")}. Please remove it to continue.</div>
          )}
        </div>
      </div>

      <div className="cart-line__qty">
        {/* quantity dropdown (1 to 20; more than 20 isn't allowed per line) */}
        <label className="cart-qty">
          <span className="cart-qty__label">Qty</span>
          <select
            className="cart-qty__select"
            value={qty}
            onChange={(e) => onQty?.(item?.id, Number(e.target.value))}
            aria-label={`Quantity for ${title}`}
          >
            {Array.from({ length: Math.max(20, qty) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="cart-qty__arrow" aria-hidden="true">▾</span>
        </label>
        <div className="cart-line__actions">
          <button type="button" onClick={() => onEdit?.(item)}>Edit</button>
          <button type="button" onClick={() => onRemove?.(item?.id)}>Remove</button>
        </div>
      </div>

      <div className="cart-line__price">{formatMoney(priceCents ?? priceLineItem(item))}</div>
    </div>
  );
}

// Suggested item: picture + name. Tapping adds it to the cart right here
// (sized sides first show an S/R/L picker), then flashes "Added".
function QuickAddTile({ label, img, fallbackImg, sizes, onAdd, contain = false }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const timerRef = React.useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleAdd = (size) => {
    onAdd(size);
    setPickerOpen(false);
    setAdded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="cart-tile">
      <button
        type="button"
        className="cart-tile__main"
        onClick={() => (sizes ? setPickerOpen((v) => !v) : handleAdd(null))}
        aria-label={`Add ${label}`}
      >
        <FallbackImg
          srcs={[img, fallbackImg]}
          alt=""
          className={`cart-tile__img${contain ? " cart-tile__img--contain" : ""}`}
        />
        <span className="cart-tile__name">{label}</span>
      </button>
      {added && (
        <div className="cart-tile__over">
          <span className="cart-tile__added">✓ Added</span>
        </div>
      )}
      {!added && sizes && pickerOpen && (
        <div className="cart-tile__over cart-tile__sizes">
          {sizes.map((s) => (
            <button
              key={s.size}
              type="button"
              onClick={() => handleAdd(s.size)}
              title={s.size}
              style={{ background: SEG_COLORS[s.size] }}
            >
              {s.abbr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Document icon in the "Food & Drink Details" header (white)
function DetailsIcon() {
  return (
    <svg className="cart-box__icon" viewBox="371 298 512 658" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M371 298H883V956H416L371 913Z M407 339V900L425 918H847V339Z M486 477H768V524H486Z M486 601H768V649H486Z M486 731H768V779H486Z"
      />
    </svg>
  );
}

function Step({ title, children, columns }) {
  return (
    <section className="cart-step">
      <div className={`cart-step__head${columns ? " cart-step__head--cols" : ""}`}>
        <span>{title}</span>
        {columns?.map((c) => (
          <span key={c} className="cart-step__col">{c}</span>
        ))}
      </div>
      <div className="cart-step__body">{children}</div>
    </section>
  );
}

function SidesStep({ addItem }) {
  const picks = useRandomPicks(SIDE_POOL);
  return (
    <Step title="Add a side? (optional)">
      <div className="cart-tiles">
        {picks.map((side) => (
          <QuickAddTile
            key={side.key}
            label={side.key}
            img={side.img}
            fallbackImg="/images/menu_sides.png"
            sizes={SIDE_SIZE_OPTIONS[side.key] || null}
            onAdd={(size) => {
              // .name doubles as the priceSide() lookup key (PRICES.sides
              // uses "(Medium)"/"(Large)" keys, not "(Regular)") — must NOT
              // change it to the display size or pricing breaks. The
              // customer-facing label is built in itemTitle() instead.
              const name = size ? `${side.key} (${sideSizeToPricingLabel(size)})` : side.key;
              const payload = {
                type: "side",
                name,
                side: side.key,
                size: size || null,
                qty: 1,
                summary: size ? `1 × ${side.key} (${size})` : `1 × ${side.key}`,
              };
              payload.lineSubtotalCents = priceLineItem(payload);
              addItem(payload);
            }}
          />
        ))}
      </div>
    </Step>
  );
}

function DrinksDipsStep({ title, pool, fallbackImg, addItem }) {
  const picks = useRandomPicks(pool);
  return (
    <Step title={title}>
      <div className="cart-tiles">
        {picks.map((it) => (
          <QuickAddTile
            key={`${it.categoryId}-${it.key}`}
            label={it.label}
            img={it.img}
            fallbackImg={fallbackImg}
            contain
            sizes={null}
            onAdd={() =>
              addItem({
                type: "drinks-dips",
                categoryId: it.categoryId,
                categoryLabel: it.categoryLabel,
                items: [{ label: it.key, qty: 1 }],
                summary: `${it.categoryLabel}: ${it.label} × 1`,
                qty: 1,
              })
            }
          />
        ))}
      </div>
    </Step>
  );
}

// Shown under the note once a coupon is on the order: a full-width
// "COUPON APPLIED!" badge, then one box per coupon.
function AppliedCoupons({ cart }) {
  const deals = cart?.pricing?.deals || [];
  if (!deals.length) return null;
  return (
    <div className="cart-coupons">
      <div className="cart-coupons__badges">
        <div className="cart-coupons__badge cart-coupons__badge--applied">Coupon Applied!</div>
      </div>
      {deals.map((d) => {
        const deal = d.deal || findDealById(d.dealId);
        if (!deal) return null;
        const canAddMore =
          deal.mode === "bundle" ? d.reason === "incomplete" : deal.maxQty == null || d.units < deal.maxQty;
        const message =
          d.reason === "need_more"
            ? `Add ${d.needed} more item${d.needed === 1 ? "" : "s"} to get the coupon price.`
            : d.reason === "incomplete"
            ? `Add the missing item${d.needed === 1 ? "" : "s"} to get the coupon price.`
            : d.reason === "service"
            ? `Only valid for ${deal.serviceRestriction} orders.`
            : null;
        return (
          <div key={d.id} className="cart-coupon">
            <div className="cart-coupon__top">
              <span>Coupons</span>
              <span>{dealDiscountLabel(deal)}</span>
            </div>
            <div className="cart-coupon__name">
              {deal.name}
              {deal.perItem ? `. ${typeof deal.perItem === "string" ? deal.perItem : "Price is per item."}` : ""}
            </div>
            {message && <div className="cart-coupon__msg">{message}</div>}
            <div className="cart-coupon__actions">
              {canAddMore ? (
                <button type="button" onClick={() => cart.openDeal(deal.id, d.id)}>
                  Add Another Item to This Coupon
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => cart.removeDeal(d.id)}>
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Name of the coupon a cart line belongs to (if that coupon is on the order).
function couponNameFor(cart, item) {
  const ref = item?.deal?.ref;
  if (!ref) return null;
  const inst = (cart?.appliedDeals || []).find((d) => d.id === ref);
  return inst ? findDealById(inst.dealId)?.name || null : null;
}

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const items = cart?.items || [];

  const handleQty = (id, qty) => cart?.updateQty?.(id, qty);
  const handleRemove = (id) => cart?.removeItem?.(id);
  const handleEdit = (it) => cart?.onEditItem && cart.onEditItem(it);

  return (
    <main className="page page--cart">
      <div className="container" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
        <div className="menu-layout">
          <section className="menu-main">
            <h1 className="menu-title">Cart</h1>

            <div className="cart-box">
              <div className="cart-box__head">
                <DetailsIcon />
                <span>Food &amp; Drink Details</span>
              </div>

              <div className="cart-box__intro">
                <p className="cart-box__lead">Check your order, then tap Checkout.</p>
                <Link href="/menu" className="rs-pill-btn cart-box__more">
                  Add More Items
                </Link>
              </div>
              {cart?.isLoaded && items.length > 0 && (
                <div className="cart-box__checkout cart-box__checkout--top">
                  <button type="button" className="rs-pill-btn cart-box__checkoutBtn" onClick={() => cart.goToCheckout()}>
                    Checkout
                  </button>
                </div>
              )}
              <p className="cart-box__note">
                <strong>Note:</strong> Some crust types, toppings, sauces, and premium items may
                come with an additional charge.
              </p>

              <AppliedCoupons cart={cart} />

              <Step title="Your order" columns={["Quantity", "Price"]}>
                {!cart?.isLoaded ? (
                  <div className="cart-empty">Loading your cart…</div>
                ) : items.length === 0 ? (
                  <div className="cart-empty">
                    Your cart is empty.{" "}
                    <Link href="/menu">Add items</Link>.
                  </div>
                ) : (
                  items.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      priceCents={cart.pricing?.lines?.[it.id]?.finalCents}
                      couponName={couponNameFor(cart, it)}
                      onQty={handleQty}
                      onRemove={handleRemove}
                      onEdit={handleEdit}
                    />
                  ))
                )}
              </Step>

              {items.length > 0 && (
                <>
                  <SidesStep addItem={cart.addItem} />
                  <DrinksDipsStep
                    title="Add a drink? (optional)"
                    pool={DRINK_POOL}
                    fallbackImg="/images/menu_drinks.png"
                    addItem={cart.addItem}
                  />
                  <DrinksDipsStep
                    title="Add a dip? (optional)"
                    pool={DIP_POOL}
                    fallbackImg={null /* no photo -> plain cream square */}
                    addItem={cart.addItem}
                  />
                  <OrderNote cart={cart} />
                  <OrderTotals className="cart-totals" />
                  <div className="cart-box__deal">
                    <DealCodeEntry variant="reveal" />
                  </div>
                  {cart.deliveryShortCents > 0 && (
                    <div className="cart-box__minNote">
                      <p>
                        Delivery minimum is {formatMoney(DELIVERY_MINIMUM_CENTS)}. Add{" "}
                        <strong>{formatMoney(cart.deliveryShortCents)}</strong> more for delivery.
                      </p>
                      {/* so the minimum doesn't put people off: carryout has none */}
                      <p className="cart-box__pickup">
                        Picking it up instead? Carryout is free with no minimum.{" "}
                        <button type="button" className="cart-box__pickupBtn" onClick={() => cart.confirmCarryout?.()}>
                          Switch to Carryout
                        </button>
                      </p>
                    </div>
                  )}
                  <div className="cart-box__checkout">
                    <button
                      type="button"
                      className="rs-pill-btn cart-box__checkoutBtn"
                      onClick={() => cart.goToCheckout()}
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Phones/tablets: the Order Settings card from the desktop
                sidebar (which is hidden at these sizes), as its own box. */}
            <div className="cart-settings">
              <OrderSettingsAside variant="drawer" />
            </div>
          </section>

          <OrderSettingsAside hideMobileBar />
        </div>
      </div>

      <style jsx>{`
        .cart-box {
          margin-bottom: 16px;
          background: var(--menu-box-bg); /* #faf2e9 */
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          color: var(--text-brown);
          overflow: hidden;
        }
        .cart-box__head {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #000;
          color: #fff;
          padding: 0.75rem 0.9rem;
          font-family: var(--font-heading);
          font-size: 1.3rem;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .cart-box__intro {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 14px 4px;
        }
        .cart-box__lead {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.45rem;
          line-height: 1.1;
          color: #000;
          text-transform: uppercase;
          text-align: left;
          max-width: 15ch; /* wraps onto two lines */
        }
        .cart-box :global(.cart-box__more) {
          flex: 0 0 auto;
          width: auto;
          max-width: none;
          margin: 0;
          padding: 0.6rem 1.4rem;
          font-size: 1.3rem;
        }
        .cart-box__note {
          margin: 6px 14px 14px;
          font-size: var(--fs-sm);
          font-style: normal;
        }
        .cart-box__note strong {
          font-size: var(--fs-min); /* "Note:" label stays this size */
          font-family: var(--font-display);
          text-transform: uppercase; /* Red Stone Face has lowercase; headings stay caps */
          font-weight: 400;
          color: #000;
          letter-spacing: 0.03em;
        }
        .cart-box__deal {
          padding: 4px 14px 16px;
        }

        /* ----- Applied coupons (under the note) ----- */
        .cart-box :global(.cart-coupons) {
          margin: 0 var(--cart-gutter) 14px;
        }
        .cart-box :global(.cart-coupons__badges) {
          margin-bottom: 10px;
        }
        .cart-box :global(.cart-coupons__badge) {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0.5rem 0.6rem;
          border: 2px solid #000;
          border-radius: 0.1875rem; /* same as the coupon box below */
          font-family: var(--font-display);
          font-size: var(--fs-min);
          line-height: 1.05;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          text-align: center;
        }
        .cart-box :global(.cart-coupons__badge--applied) {
          background: #000;
          color: #fff;
        }
        .cart-box :global(.cart-coupon) {
          background: #fff;
          border: 1px solid #000;
          border-radius: 0.1875rem;
          padding: 12px 14px;
          color: #000;
        }
        .cart-box :global(.cart-coupon + .cart-coupon) {
          margin-top: 10px;
        }
        .cart-box :global(.cart-coupon__top) {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #000;
          font-family: var(--font-display);
          font-size: 1.15rem;
          line-height: 1;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .cart-box :global(.cart-coupon__name) {
          margin-top: 10px;
          font-family: var(--font-display-text);
          font-weight: 400;
          font-size: var(--fs-min);
          line-height: 1.3;
        }
        .cart-box :global(.cart-coupon__msg) {
          margin-top: 6px;
          font-size: var(--fs-min);
          color: #b00020;
        }
        .cart-box :global(.cart-coupon__actions) {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-top: 14px;
        }
        .cart-box :global(.cart-coupon__actions button) {
          padding: 0;
          background: none;
          border: 0;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          line-height: 1.15;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-align: left;
          color: #000;
          cursor: pointer;
        }
        .cart-box :global(.cart-coupon__actions button:last-child) {
          flex: 0 0 auto;
        }
        .cart-box :global(.cart-line__coupon) {
          margin-top: 4px;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #e31837;
        }
        .cart-box__minNote {
          margin: 0 14px 10px;
          font-size: var(--fs-base);
          color: var(--text-brown);
        }
        .cart-box__minNote p {
          margin: 0 0 6px;
        }
        .cart-box__pickup {
          font-size: var(--fs-min);
        }
        .cart-box__pickupBtn {
          padding: 0;
          border: 0;
          background: none;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: #000;
          cursor: pointer;
        }
        .cart-box__minNote strong {
          font-weight: var(--w-bold);
          color: #e31837;
        }
        .cart-box__checkout {
          padding: 0 14px 18px;
        }
        .cart-box__checkout--top {
          padding: 12px 14px 4px;
        }
        .cart-box :global(.cart-box__checkoutBtn) {
          display: block;
          width: 100%;
        }
        /* same height as the capital letters beside it (the display
           font's caps are 0.7em tall); width keeps the icon's shape */
        .cart-box :global(.cart-box__icon) {
          height: 0.78em;
          width: calc(0.78em * 512 / 658);
          flex: 0 0 auto;
        }

        /* ----- Totals (components/OrderTotals.js), right edge lined up
           with the step boxes above ----- */
        .cart-box :global(.cart-totals) {
          margin: 0 var(--cart-gutter) 16px auto;
        }

        /* Order Settings box below the cart (phones/tablets only) */
        .cart-settings {
          display: none;
        }
        @media (max-width: 860px) {
          .cart-settings {
            display: block;
            margin-bottom: 16px;
          }
        }

        /* ----- Step sections ----- */
        .cart-box :global(.cart-step) {
          margin: 0 var(--cart-gutter) 14px;
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
          overflow: hidden;
        }
        .cart-box :global(.cart-step__head) {
          display: grid;
          grid-template-columns: 1fr;
          align-items: center;
          background: #000;
          color: #fff;
          padding: 0.65rem 0.8rem;
          font-family: var(--font-heading);
          font-size: var(--fs-md);
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .cart-box :global(.cart-step__head--cols),
        .cart-box :global(.cart-line) {
          grid-template-columns: minmax(0, 1fr) var(--cart-qty-w) var(--cart-price-w);
          column-gap: 10px;
        }
        .cart-box {
          --cart-qty-w: 104px;
          --cart-price-w: 76px;
          --cart-gutter: 14px; /* side space around the step boxes + totals */
        }
        .cart-box :global(.cart-step__col) {
          text-align: center;
        }
        .cart-box :global(.cart-step__col:last-child) {
          text-align: right;
        }
        .cart-box :global(.cart-step__body) {
          background: ${OFF_WHITE};
          padding: 4px 12px;
        }
        .cart-box :global(.cart-empty) {
          padding: 14px 0;
        }
        .cart-box :global(.cart-empty a) {
          color: var(--text-brown);
          font-weight: 700;
          text-decoration: underline;
        }

        /* ----- Item line ----- */
        .cart-box :global(.cart-line) {
          display: grid;
          align-items: start;
          padding: 12px 0;
          border-bottom: 1px solid var(--menu-box-border);
        }
        .cart-box :global(.cart-line:last-child) {
          border-bottom: 0;
        }
        .cart-box :global(.cart-line__item) {
          display: flex;
          gap: 10px;
          min-width: 0;
        }
        .cart-box :global(.cart-line__img),
        .cart-box :global(.cart-tile__img) {
          display: block;
          object-fit: cover;
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: 0.1875rem;
        }
        .cart-box :global(.cart-drinks) {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 1px;
          padding: 0 2px 4px;
          overflow: hidden;
          background: #fff;
        }
        .cart-box :global(.cart-drinks img) {
          flex: 0 1 auto;
          min-width: 0;
          max-width: 100%;
          object-fit: contain;
          object-position: bottom;
        }
        .cart-box :global(.cart-line__img) {
          flex: 0 0 52px;
          width: 52px;
          height: 52px;
        }
        .cart-box :global(.cart-line__text) {
          min-width: 0;
        }
        .cart-box :global(.cart-line__note) {
          margin-top: 4px;
          font-size: var(--fs-min);
          font-style: italic;
          color: var(--text-brown);
          overflow-wrap: anywhere;
        }
        .cart-box :global(.cart-orderNote) {
          display: block;
          margin: 4px 14px 14px;
        }
        .cart-box :global(.cart-orderNote__open) {
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
        .cart-box :global(.cart-orderNote__label) {
          display: block;
          margin-bottom: 6px;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          text-transform: uppercase;
          color: #000;
        }
        .cart-box :global(.cart-orderNote__box) {
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
        .cart-box :global(.cart-line__soldout) {
          margin-top: 4px;
          color: #d0021b;
          font-weight: var(--w-bold);
          font-size: var(--fs-min);
        }
        .cart-box :global(.cart-line__name) {
          display: block;
          padding: 0;
          margin: 0 0 3px;
          background: none;
          border: 0;
          text-align: left;
          font-family: var(--font-display);
          font-size: var(--fs-min);
          line-height: 1.1;
          color: #000;
          text-transform: uppercase;
          cursor: pointer;
        }
        .cart-box :global(.cart-line__opts) {
          font-family: var(--font-display-text); /* Red Stone Display Medium */
          font-weight: 400;
          font-size: var(--fs-min);
          line-height: 1.35;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        /* Left: / Right: / Whole: labels — Red Stone Display Medium, black */
        .cart-box :global(.cart-line__opts strong) {
          color: #000;
          font-weight: 400;
        }
        .cart-box :global(.cart-line__opts--byo > div + div) {
          margin-top: 4px; /* a little space between Left / Right / Whole */
        }
        .cart-box :global(.cart-line__qty) {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 6px;
        }
        .cart-box :global(.cart-qty) {
          position: relative;
          display: flex;
          align-items: center;
          height: 34px;
          border: 1px solid var(--menu-box-border);
          border-radius: 999px;
          background: #fff;
          overflow: hidden;
          cursor: pointer;
        }
        .cart-box :global(.cart-qty__label) {
          padding-left: 10px;
          font-family: var(--font-display);
          font-size: var(--fs-xs);
          text-transform: uppercase;
          color: var(--text-brown);
          pointer-events: none;
        }
        /* the real dropdown fills the pill; the phone shows its own picker */
        .cart-box :global(.cart-qty__select) {
          flex: 1 1 auto;
          min-width: 0;
          height: 100%;
          padding: 0 22px 0 6px;
          border: 0;
          background: transparent;
          -webkit-appearance: none;
          appearance: none;
          font-family: var(--font-body);
          font-size: var(--fs-base);
          font-weight: var(--w-bold);
          color: #000;
          text-align: center;
          text-align-last: center;
          cursor: pointer;
        }
        .cart-box :global(.cart-qty__arrow) {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-52%);
          font-size: var(--fs-min);
          color: #000;
          pointer-events: none;
        }
        .cart-box :global(.cart-line__actions) {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .cart-box :global(.cart-line__actions button) {
          padding: 0;
          background: none;
          border: 0;
          font-family: var(--font-display);
          font-size: var(--fs-sm);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-brown);
          cursor: pointer;
        }
        .cart-box :global(.cart-line__price) {
          text-align: right;
          font-size: var(--fs-md);
          font-weight: 700;
          color: #000;
          padding-top: 6px;
        }

        /* ----- Suggestion tiles (Steps 2–4) ----- */
        .cart-box :global(.cart-tiles) {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 8px 0;
        }
        .cart-box :global(.cart-tile) {
          position: relative;
        }
        .cart-box :global(.cart-tile__main) {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 6px;
          width: 100%;
          padding: 0;
          background: none;
          border: 0;
          cursor: pointer;
          text-align: center;
        }
        .cart-box :global(.cart-tile__img) {
          width: 100%;
          aspect-ratio: 1 / 1;
        }
        .cart-box :global(.cart-tile__img--contain) {
          object-fit: contain;
          padding: 8px 6px;
          background: #fff;
        }
        .cart-box :global(.cart-img--empty) {
          display: block;
        }
        .cart-box :global(.cart-tile__name) {
          font-family: var(--font-display);
          font-size: var(--fs-min);
          line-height: 1.1;
          color: #000;
          text-transform: uppercase;
        }
        /* a square over the tile's picture: the size buttons and "Added"
           sit along its bottom edge so the food stays visible */
        .cart-box :global(.cart-tile__over) {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          padding: 6px;
          pointer-events: none;
        }
        .cart-box :global(.cart-tile__over > *) {
          pointer-events: auto;
        }
        .cart-box :global(.cart-tile__added) {
          flex: 1;
          padding: 6px 4px;
          border-radius: 999px;
          background: #e8f5e9;
          color: #1b5e20;
          font-weight: 700;
          font-size: var(--fs-min);
          text-align: center;
          pointer-events: none;
        }
        .cart-box :global(.cart-tile__sizes button) {
          flex: 1;
          padding: 7px 0;
          border: 0;
          border-radius: 6px;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .cart-box {
            --cart-qty-w: 92px;
            --cart-price-w: 66px;
            --cart-gutter: 10px;
          }
          .cart-box__head {
            font-size: 1.25rem;
          }
          .cart-box__intro {
            padding: 12px 12px 2px;
          }
          .cart-box__lead {
            font-size: 1.3rem;
            max-width: 19ch; /* two lines */
          }
          .cart-box :global(.cart-box__more) {
            padding: 0.7rem 1.1rem;
            font-size: 1.2rem;
          }
          .cart-box :global(.cart-line__name) {
            font-size: 1.25rem;
          }
          .cart-box :global(.cart-line__opts) {
            font-size: var(--fs-min);
            font-weight: 650;
          }
          /* REMOVE above EDIT, in the spot REMOVE used to be in */
          .cart-box :global(.cart-line__actions) {
            flex-direction: column-reverse; /* REMOVE on top, EDIT under it */
            align-items: flex-end; /* right edges line up with the QTY pill */
            gap: 2px;
            margin-right: 0;
          }
          .cart-box :global(.cart-line__actions button) {
            font-size: 1.25rem;
            /* the display font only comes in 950; the same Red Stone Face in
               its adjustable version, at 900 */
            font-family: var(--font-body);
            font-weight: 900;
            line-height: 1.1;
          }
          .cart-box__note {
            margin: 6px 12px 12px;
          }
          .cart-box :global(.cart-step) {
            margin-bottom: 12px;
          }
          .cart-box :global(.cart-step__head) {
            padding: 0.6rem 0.6rem;
            font-size: var(--fs-md);
          }
          .cart-box :global(.cart-step__body) {
            padding: 4px 8px;
          }
          .cart-box :global(.cart-line__img) {
            flex-basis: 44px;
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </main>
  );
}
