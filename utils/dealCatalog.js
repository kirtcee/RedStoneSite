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
        description: "Carry Out Special — 1 Large 2-Topping Pizza",
        price: 1299,
        serviceRestriction: "carryout",
        mode: "list",
        minQty: 1,
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
        subtitle: "$8.99 each item — 2 minimum, no maximum",
        description:
          "Get Any 2 or More: Medium 1-Topping Pizza, 6 Wings, Cheesy Garlic Bread, Large Fries, Large Poutine, Medium Shawarma Poutine, Medium Onion Rings. Price is per item.",
        price: 899,
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
              { sideName: "Cheesy Garlic Bread", label: "Cheesy Garlic Bread" },
              { sideName: "Garlic Bread", label: "Without Cheese" },
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
      // ---- Placeholders: content TBD, shown "Coming Soon" on the coupons
      // page so the grid doesn't look sparse — not clickable/redeemable yet.
      {
        id: "familyfeast",
        code: null,
        name: "Family Feast Bundle",
        subtitle: "Coming Soon",
        description: "2 Large Pizzas, Wings & a 2L Drink",
        price: null,
        serviceRestriction: null,
        mode: "bundle",
        image: "/images/deals/family-feast.jpg",
        active: false,
        comingSoon: true,
      },
      {
        id: "lunchspecial",
        code: null,
        name: "Lunch Special",
        subtitle: "Coming Soon",
        description: "Personal Pizza + Drink",
        price: null,
        serviceRestriction: null,
        mode: "list",
        image: "/images/deals/lunch-special.jpg",
        active: false,
        comingSoon: true,
      },
      {
        id: "weekendwings",
        code: null,
        name: "Weekend Wing Deal",
        subtitle: "Coming Soon",
        description: "20 Wings",
        price: null,
        serviceRestriction: null,
        mode: "list",
        image: "/images/deals/weekend-wings.jpg",
        active: false,
        comingSoon: true,
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
