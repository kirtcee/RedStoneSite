// pages/cart.js
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart, DealCodeEntry } from "../components/CartSystem";
import { priceLineItem, formatMoney, describePizzaFull, describeByoPizzaTitle } from "../components/Pricing";
import { comboNameFor, comboItemLabel } from "../utils/comboCatalog";
import { dealNameFor, dealSlotLabel, findDealById } from "../utils/dealCatalog";
import OrderSettingsAside from "../components/OrderSettingsAside";

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
  { key: "Coke", label: "Coke 2L", categoryId: "twoLiters", categoryLabel: "2L Bottles", img: "/images/drinks/2l.jpg" },
  { key: "Gingerale", label: "Gingerale 2L", categoryId: "twoLiters", categoryLabel: "2L Bottles", img: "/images/drinks/2l.jpg" },
  { key: "Pepsi", label: "Pepsi 2L", categoryId: "twoLiters", categoryLabel: "2L Bottles", img: "/images/drinks/2l.jpg" },
  { key: "coke", label: "Coke Can", categoryId: "cans", categoryLabel: "Cans", img: "/images/drinks/cans.jpg" },
  { key: "sprite", label: "Sprite Can", categoryId: "cans", categoryLabel: "Cans", img: "/images/drinks/cans.jpg" },
  { key: "water", label: "Water", categoryId: "other", categoryLabel: "Other Drinks", img: "/images/drinks/other.jpg" },
];
const DIP_POOL = [
  { key: "Blue Cheese", label: "Blue Cheese", categoryId: "dips", categoryLabel: "Dips", img: "/images/dips/blue-cheese.png" },
  { key: "Garlic", label: "Garlic", categoryId: "dips", categoryLabel: "Dips", img: "/images/dips/garlic.png" },
  { key: "Ranch", label: "Ranch", categoryId: "dips", categoryLabel: "Dips", img: "/images/dips/ranch.png" },
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
      return ["/images/byo_thumb.png"];
    case "pizza-specialty":
      return [
        `/images/${item.style === "classic" ? "specialty" : "signature"}/${slugify(name)}.jpg`,
        `/images/${item.style === "classic" ? "signature" : "specialty"}/${slugify(name)}.jpg`,
        "/images/menu_signature.png",
      ];
    case "wings":
      return ["/images/menu_wings.png"];
    case "side": {
      const pool = SIDE_POOL.find((s) => s.key === item.side);
      return [pool?.img, "/images/menu_sides.png"];
    }
    case "drinks-dips":
      return item.categoryId === "dips"
        ? [`/images/dips/${slugify(item.items?.[0]?.label)}.png`]
        : ["/images/menu_drinks.png"];
    case "special":
      return [`/images/special-menu/${slugify(name)}.jpg`, "/images/menu_special.png"];
    case "combo":
      return ["/images/menu_combos.png"];
    case "deal":
      return ["/images/promo_coupons.png"];
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
    return [
      `${item.count}-piece`,
      item.sauce,
      item.serveStyle,
      dipBits.length ? `Dips: ${dipBits.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
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
    (item?.type === "pizza-byo" ? describeByoPizzaTitle(item) : null) ||
    (item?.type === "combo" ? comboNameFor(item.comboId) : null) ||
    (item?.type === "deal" ? dealNameFor(item.dealId) : null) ||
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
      : item?.type === "deal" && item?.meta?.items
      ? Object.entries(item.meta.items).map(([key, child]) => [
          dealSlotLabel(findDealById(item.dealId), key),
          child?.summary,
        ])
      : item?.type === "deal" && item?.meta?.builds
      ? item.meta.builds.map((child, idx) => [`Item ${idx + 1}`, child?.summary])
      : null;

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

function ItemRow({ item, onQty, onRemove, onEdit }) {
  const qty = Math.max(1, Number(item?.qty) || 1);
  const title = itemTitle(item);
  return (
    <div className="cart-line">
      <div className="cart-line__item">
        <FallbackImg srcs={itemImages(item)} alt="" className="cart-line__img" />
        <div className="cart-line__text">
          <button type="button" className="cart-line__name" onClick={() => onEdit?.(item)}>
            {title}
          </button>
          <ItemOptions item={item} />
        </div>
      </div>

      <div className="cart-line__qty">
        <div className="cart-qty" role="group" aria-label={`Quantity for ${title}`}>
          <button
            type="button"
            className="cart-qty__btn"
            onClick={() => onQty?.(item?.id, Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="cart-qty__num" aria-live="polite">{qty}</span>
          <button
            type="button"
            className="cart-qty__btn"
            onClick={() => onQty?.(item?.id, Math.min(20, qty + 1))}
            disabled={qty >= 20}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <div className="cart-line__actions">
          <button type="button" onClick={() => onEdit?.(item)}>Edit</button>
          <button type="button" onClick={() => onRemove?.(item?.id)}>Remove</button>
        </div>
      </div>

      <div className="cart-line__price">{formatMoney(priceLineItem(item))}</div>
    </div>
  );
}

// Suggested item: picture + name. Tapping adds it to the cart right here
// (sized sides first show an S/R/L picker), then flashes "Added".
function QuickAddTile({ label, img, fallbackImg, sizes, onAdd }) {
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
        <FallbackImg srcs={[img, fallbackImg]} alt="" className="cart-tile__img" />
        <span className="cart-tile__name">{label}</span>
      </button>
      {added && <span className="cart-tile__added">✓ Added</span>}
      {!added && sizes && pickerOpen && (
        <div className="cart-tile__sizes">
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
    <Step title="Step 2: Choose your sides">
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

export default function CartPage() {
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
                {/* Header icon goes here (SVG to be supplied) */}
                <span>Food &amp; Drink Details</span>
              </div>

              <div className="cart-box__intro">
                <p className="cart-box__lead">Review and modify your items here.</p>
                <Link href="/menu" className="rs-pill-btn cart-box__more">
                  Add More Items
                </Link>
              </div>
              <p className="cart-box__note">
                <strong>Note:</strong> Some crust types, toppings, sauces, and premium items may
                come with an additional charge.
              </p>

              <Step title="Step 1: Confirm your selections" columns={["Quantity", "Price"]}>
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
                    title="Step 3: Choose your drinks"
                    pool={DRINK_POOL}
                    fallbackImg="/images/menu_drinks.png"
                    addItem={cart.addItem}
                  />
                  <DrinksDipsStep
                    title="Step 4: Add some flavour"
                    pool={DIP_POOL}
                    fallbackImg={null /* no photo -> plain cream square */}
                    addItem={cart.addItem}
                  />
                  <div className="cart-box__deal">
                    <DealCodeEntry />
                  </div>
                </>
              )}
            </div>
          </section>

          <OrderSettingsAside />
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
          padding: 0.6rem 0.9rem;
          font-family: var(--font-heading);
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
          font-size: 0.8rem;
          font-style: normal;
        }
        .cart-box__note strong {
          font-family: var(--font-display);
          font-weight: 400;
          color: #000;
          letter-spacing: 0.03em;
        }
        .cart-box__deal {
          padding: 0 14px 14px;
        }

        /* ----- Step sections ----- */
        .cart-box :global(.cart-step) {
          margin: 0 14px 14px;
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
          padding: 0.55rem 0.8rem;
          font-family: var(--font-heading);
          font-size: 0.95rem;
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
          --cart-price-w: 64px;
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
        .cart-box :global(.cart-line__img) {
          flex: 0 0 52px;
          width: 52px;
          height: 52px;
        }
        .cart-box :global(.cart-line__text) {
          min-width: 0;
        }
        .cart-box :global(.cart-line__name) {
          display: block;
          padding: 0;
          margin: 0 0 3px;
          background: none;
          border: 0;
          text-align: left;
          font-family: var(--font-display);
          font-size: 1.05rem;
          line-height: 1.1;
          color: #000;
          text-transform: uppercase;
          cursor: pointer;
        }
        .cart-box :global(.cart-line__opts) {
          font-size: 0.8rem;
          line-height: 1.35;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .cart-box :global(.cart-line__opts strong) {
          color: #000;
        }
        .cart-box :global(.cart-line__qty) {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 6px;
        }
        .cart-box :global(.cart-qty) {
          display: grid;
          grid-template-columns: 30px 1fr 30px;
          align-items: center;
          height: 32px;
          border: 1px solid var(--menu-box-border);
          border-radius: 999px;
          background: #fff;
          overflow: hidden;
        }
        .cart-box :global(.cart-qty__btn) {
          height: 100%;
          padding: 0;
          border: 0;
          background: none;
          font-size: 1.1rem;
          font-weight: 700;
          color: #000;
          cursor: pointer;
        }
        .cart-box :global(.cart-qty__btn:disabled) {
          opacity: 0.3;
          cursor: default;
        }
        .cart-box :global(.cart-qty__num) {
          text-align: center;
          font-weight: 700;
          color: #000;
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
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-brown);
          cursor: pointer;
        }
        .cart-box :global(.cart-line__price) {
          text-align: right;
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
        .cart-box :global(.cart-img--empty) {
          display: block;
        }
        .cart-box :global(.cart-tile__name) {
          font-family: var(--font-display);
          font-size: 0.95rem;
          line-height: 1.1;
          color: #000;
          text-transform: uppercase;
        }
        .cart-box :global(.cart-tile__added) {
          position: absolute;
          left: 6px;
          right: 6px;
          top: 40%;
          padding: 6px 4px;
          border-radius: 999px;
          background: #e8f5e9;
          color: #1b5e20;
          font-weight: 700;
          font-size: 0.8rem;
          text-align: center;
          pointer-events: none;
        }
        .cart-box :global(.cart-tile__sizes) {
          position: absolute;
          left: 6px;
          right: 6px;
          top: 40%;
          display: flex;
          gap: 4px;
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
            --cart-price-w: 56px;
          }
          .cart-box__intro {
            padding: 12px 12px 2px;
          }
          .cart-box__lead {
            font-size: 1.2rem;
          }
          .cart-box :global(.cart-box__more) {
            padding: 0.5rem 1rem;
            font-size: 1.05rem;
          }
          .cart-box__note {
            margin: 6px 12px 12px;
          }
          .cart-box :global(.cart-step) {
            margin: 0 10px 12px;
          }
          .cart-box :global(.cart-step__head) {
            padding: 0.55rem 0.6rem;
            font-size: 0.85rem;
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
