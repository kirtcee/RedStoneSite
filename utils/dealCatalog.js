// utils/dealCatalog.js
// Pure data + lookups for coupons/deals — no React/component imports, so it
// can be safely imported by Pricing.js, the pages/api validation route, and
// any client component without creating a circular dependency (mirrors
// comboCatalog.js's role for combos).
//
// Two "modes":
//   - "bundle": fixed named slots (pizza1, pizza2, wings, ...), priced once
//     as a whole and multiplied by a quantity stepper — same shape as a combo.
//   - "list": the customer builds a running list of independently-configured
//     units (each drawn from one of `eligibleItems`), no fixed slot count.
//     Used both for a single-item repeatable deal (one eligible item) and a
//     "pick N or more from this menu" deal (several eligible items).
//
// `code` is meant to be customer-facing (shown on the coupon card, typed
// into the cart) — it is NOT a secret. The point of server-side validation
// (pages/api/validateDeal.js) is being the authoritative source for whether
// a code is currently valid and what it's worth, not hiding this list.

export const dealSections = [
  {
    type: "Coupons & Deals",
    deals: [
      {
        id: "large2topping",
        code: "RSP-1299",
        name: "Large 2-Topping Pizza",
        subtitle: "Carryout Special",
        description: "Carry Out Special: Large 2-Topping Pizzas (price is per pizza, 2 pizza minimum)",
        price: 1299,
        perItem: "Price is per pizza, 2 pizza minimum.", // shown in the cart's coupon box
        serviceRestriction: "carryout",
        mode: "list",
        minQty: 2,
        maxQty: null,
        eligibleItems: [
          {
            key: "pizza",
            itemType: "pizza-byo",
            label: "Build Your Own Large Pizza",
            size: "14",
            includedToppings: 2,
          },
        ],
        image: "/images/deals/large-2topping.jpg",
        active: true,
      },
      {
        id: "pick2mix",
        code: "RSP-899",
        name: "Pick 2 or More",
        subtitle: "$8.99 each item, 2 minimum, no maximum",
        description:
          "Get Any 2 or More: Medium 1-Topping Pizza, 6 Wings, 2 Cheesy Garlic Breads, Large Fries, Large Poutine, Medium Shawarma Poutine, Medium Onion Rings. Price is per item.",
        price: 899,
        perItem: true, // the cart's coupon box adds "Price is per item." (or this text, if it's a string)
        serviceRestriction: null,
        mode: "list",
        minQty: 2,
        maxQty: null,
        eligibleItems: [
          {
            key: "pizza",
            itemType: "pizza-byo",
            label: "Build Your Own Medium Pizza",
            categoryLabel: "Pizzas",
            size: "12",
            includedToppings: 1,
          },
          {
            key: "wings",
            itemType: "wings",
            label: "6 Wings",
            categoryLabel: "Wings",
            count: 6,
          },
          {
            key: "garlicbread",
            itemType: "garlic-bread-choice",
            label: "2 Cheesy Garlic Breads",
            categoryLabel: "Bread",
            variants: [
              { sideName: "Cheesy Garlic Bread", label: "2 Cheesy Garlic Breads" },
              { sideName: "Garlic Bread", label: "2 Garlic Breads (No Cheese)" },
            ],
            qtyFixed: 2,
          },
          {
            key: "fries",
            itemType: "side",
            label: "Large Fries",
            categoryLabel: "Fries",
            sideName: "French Fries",
            lockedSize: "Large",
          },
          {
            key: "poutine",
            itemType: "side",
            label: "Large Poutine",
            categoryLabel: "Poutine",
            sideName: "Poutine",
            lockedSize: "Large",
          },
          {
            key: "shawarmapoutine",
            itemType: "side",
            label: "Medium Shawarma Poutine",
            categoryLabel: "Shawarma Poutine",
            sideName: "Shawarma Poutine",
            lockedSize: "Regular",
          },
          {
            key: "onionrings",
            itemType: "side",
            label: "Medium Onion Rings",
            categoryLabel: "Onion Rings",
            sideName: "Onion Rings",
            lockedSize: "Regular",
          },
        ],
        image: "/images/deals/pick2mix.jpg",
        active: true,
      },
      {
        id: "twopizzawings",
        code: "RSP-2999",
        name: "2 Medium Pizzas + 8 Wings",
        subtitle: "2 Medium 1-Topping Pizzas & 8 Wings",
        description: "2 Medium 1-Topping Pizzas, 8 Chicken Wings",
        price: 2999,
        serviceRestriction: null,
        mode: "bundle",
        items: ["pizza1", "pizza2", "wings"],
        build: {
          pizza1: { itemType: "pizza-byo", label: "Pizza 1", size: "12", includedToppings: 1 },
          pizza2: { itemType: "pizza-byo", label: "Pizza 2", size: "12", includedToppings: 1 },
          wings: { itemType: "wings", label: "Wings", count: 8 },
        },
        image: "/images/deals/2medium-8wings.jpg",
        active: true,
      },
      // ---- Combos sold on the Deals page: "Add Coupon" opens the combo
      // builder for `comboId` (utils/comboCatalog.js) instead of a coupon,
      // and they're never applied as coupons (Pricing.js priceCart). Their
      // price lives in Pricing.js PRICES.combos; keep `price` here the same.
      {
        id: "takecare",
        comboId: "takecare",
        code: null,
        name: "Take Care Combo",
        subtitle: "2 Large Pizzas, Garlic Bread, 4 Pops",
        description: "Take Care Combo: 2 Large 3-Topping Pizzas, Garlic Bread, 4 Pops & 2 Dips",
        price: 3599,
        serviceRestriction: null,
        mode: "combo",
        image: "/images/combos/takecare.jpg",
        active: true,
      },
      {
        id: "feed4",
        comboId: "feed4",
        code: null,
        name: "Feed 4",
        subtitle: "2 Large Pizzas, 8 Wings, Garlic Bread, 2L Drink",
        description: "Feed 4: 2 Large 2-Topping Pizzas, 8 Wings, Garlic Bread, a 2L Drink & 2 Dips",
        price: 3999,
        serviceRestriction: null,
        mode: "combo",
        image: "/images/deals/feed-4.jpg",
        active: true,
      },
      {
        id: "party",
        comboId: "party",
        code: null,
        name: "Party Combo",
        subtitle: "3 Large Pizzas, 20 Wings, Garlic Bread, 2L Drink",
        description: "Party Combo: 3 Large 2-Topping Pizzas, 20 Wings, Garlic Bread, a 2L Drink & 3 Dips",
        price: 6499,
        serviceRestriction: null,
        mode: "combo",
        image: "/images/deals/party.jpg",
        active: true,
      },
    ],
  },
];

const fallbackImg = "/images/menu_combos.png";

export function dealThumbFor(id) {
  const deal = findDealById(id);
  return deal?.image || fallbackImg;
}

export function findDealById(id) {
  for (const sec of dealSections) {
    const hit = sec.deals.find((d) => d.id === id);
    if (hit) return hit;
  }
  return null;
}

// Codes are compared case-insensitively and ignore surrounding whitespace so
// "rsp-1299", " RSP-1299 ", etc. all resolve — customers won't type them
// exactly as displayed every time.
export function findDealByCode(code) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return null;
  for (const sec of dealSections) {
    const hit = sec.deals.find((d) => d.code && d.code.toUpperCase() === normalized);
    if (hit) return hit;
  }
  return null;
}

export function dealNameFor(id) {
  return findDealById(id)?.name || id;
}

// Whether `deal` may be redeemed for the customer's currently-selected
// service method. A null/omitted serviceRestriction means either is fine.
// `service` may itself be null (not yet chosen) — treated as not-yet-eligible
// rather than automatically passing, so the coupons page can gate on it.
export function dealAllowsService(deal, service) {
  if (!deal) return false;
  if (!deal.serviceRestriction) return true;
  return deal.serviceRestriction === service;
}

// Human label for a bundle deal's slot key ("pizza1" -> "Pizza 1"), falling
// back to whatever label the deal's own `build` config supplies.
export function dealSlotLabel(deal, key) {
  return deal?.build?.[key]?.label || key;
}

// The coupon's headline value for the cart's coupon box: "$8.99" for a
// set-price deal, "20% OFF" for a percent-off one (`percentOff: 20`).
export function dealDiscountLabel(deal) {
  if (!deal) return "";
  if (deal.percentOff) return `${deal.percentOff}% OFF`;
  if (deal.price != null) return `$${(Number(deal.price) / 100).toFixed(2)}`;
  return "";
}

// The config for one of a deal's item slots: an `eligibleItems` entry for a
// "list" deal, a `build` entry for a "bundle" deal.
export function dealSlotConfig(deal, slot) {
  if (!deal || !slot) return null;
  if (deal.mode === "bundle") return deal.build?.[slot] || null;
  return (deal.eligibleItems || []).find((e) => e.key === slot) || null;
}

const SIDE_PRICING_SIZE = { Regular: "Medium" }; // UI "Regular" = pricing "(Medium)"
function dealSidePricingName(config) {
  if (!config?.lockedSize) return config?.sideName;
  return `${config.sideName} (${SIDE_PRICING_SIZE[config.lockedSize] || config.lockedSize})`;
}

// Whether a cart item really is what a deal slot is for (right type, size,
// piece count...). Pricing only gives the deal price to items that match,
// so editing a coupon item into something else can't keep the discount.
export function itemMatchesDealSlot(config, item) {
  if (!config || !item) return false;
  switch (config.itemType) {
    case "pizza-byo":
      return item.type === "pizza-byo" && String(item.size) === String(config.size);
    case "wings":
      return item.type === "wings" && Number(item.count) === Number(config.count);
    case "side":
      return item.type === "side" && item.name === dealSidePricingName(config);
    case "garlic-bread-choice":
      return (
        item.type === "side" &&
        (config.variants || []).some((v) => v.sideName === item.name) &&
        Number(item.pack || 1) === Number(config.qtyFixed || 1)
      );
    default:
      return false;
  }
}

// Turns what a deal's item builder returned into an ordinary cart item,
// tagged with the coupon it belongs to (`ref`) and the slot it fills.
export function dealUnitToCartItem(deal, slot, unit, ref) {
  const config = dealSlotConfig(deal, slot);
  const { itemKey, itemType, lineSubtotalCents, ...rest } = unit || {};
  let item;
  if (config?.itemType === "garlic-bread-choice") {
    const pack = Number(config.qtyFixed) || 1;
    item = {
      type: "side",
      name: rest.sideName,
      side: rest.sideName,
      pack,
      qty: 1,
      summary: `${pack} × ${rest.sideName}`,
    };
  } else {
    item = { ...rest, qty: Math.max(1, Number(rest.qty) || 1) };
  }
  return { ...item, deal: { ref, slot } };
}
