// utils/comboCatalog.js
// Pure combo data + lookups — no React/component imports, so both
// ComboBuilder.js and any cart-display surface (CartSystem, checkout, cart
// page, order-confirmation, kitchen) can import from here without a
// circular dependency (ComboBuilder imports useCart from CartSystem).

export const comboData = [
  {
    type: "Two Pizzas",
    combos: [
      { id: "2med", name: "2 Medium Pizzas", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2"] },
      { id: "2lrg", name: "2 Large Pizzas",  subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2"] },
      { id: "2xl",  name: "2 X-Large Pizzas", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2"] },
    ],
  },
  {
    type: "Double Combo",
    combos: [
      { id: "medCombo", name: "2 Medium Pizzas + 16 Wings", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "wings"] },
      { id: "lrgCombo", name: "2 Large Pizzas + 20 Wings",  subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "wings"] },
      { id: "xlCombo",  name: "2 X-Large Pizzas + 25 Wings", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "wings"] },
    ],
  },
  {
    type: "Pizza & Wings",
    combos: [
      { id: "smallCombo", name: "1 Small Pizza + 6 Wings",  subtitle: "3 toppings, 1 dip (upgrade to Medium available)", items: ["pizza", "wings"] },
      { id: "lrgCombo2",  name: "1 Large Pizza + 12 Wings", subtitle: "3 toppings, 1 dip (upgrade to XL available)",    items: ["pizza", "wings"] },
    ],
  },
  {
    type: "Take Care Combo",
    combos: [
      { id: "takecare", name: "2 Large Pizzas + Garlic Bread + 4 Pops", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "bread", "pops"], fixed: ["bread"] },
    ],
  },
];

// Combos sold only through the Deals page (they open this same combo
// builder, but aren't listed on the menu's Combos page).
//   includedToppings: toppings per pizza before extra-topping charges (3 if not set)
//   fixed: slots that are just included, with nothing to pick (Garlic Bread)
export const dealCombos = [
  {
    id: "feed4",
    name: "Feed 4",
    subtitle: "2 Large 2-Topping Pizzas, 8 Wings, Garlic Bread, a 2L Drink, 2 dips",
    items: ["pizza1", "pizza2", "wings", "bread", "drink"],
    includedToppings: 2,
    fixed: ["bread"],
  },
  {
    id: "party",
    name: "Party Combo",
    subtitle: "3 Large 2-Topping Pizzas, 20 Wings, Garlic Bread, a 2L Drink, 3 dips",
    items: ["pizza1", "pizza2", "pizza3", "wings", "bread", "drink"],
    includedToppings: 2,
    fixed: ["bread"],
  },
];

// thumbnails (swap to real paths when ready)
const comboImages = {
  "2med": "/images/combos/2-medium.jpg",
  "2lrg": "/images/combos/2-large.jpg",
  "2xl": "/images/combos/2-xl.jpg",
  medCombo: "/images/combos/2-medium-16-wings.jpg",
  lrgCombo: "/images/combos/2-large-20-wings.jpg",
  xlCombo: "/images/combos/2-xl-25-wings.jpg",
  smallCombo: "/images/combos/small-6-wings.jpg",
  lrgCombo2: "/images/combos/large-12-wings.jpg",
  takecare: "/images/combos/takecare.jpg",
  feed4: "/images/deals/feed-4.jpg",
  party: "/images/deals/party.jpg",
};
const fallbackImg = "/images/menu_combos.png";

export const comboSections = comboData;
export const comboThumbFor = (id) => comboImages[id] || fallbackImg;

export const comboDefaultSize = {
  "2med": "12", "2lrg": "14", "2xl": "16",
  medCombo: "12", lrgCombo: "14", xlCombo: "16",
  smallCombo: "10", lrgCombo2: "14", takecare: "14",
  feed4: "14", party: "14",
};

export const sizeLabelMap = { "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" };
export const comboWingsPieces = { medCombo: 16, lrgCombo: 20, xlCombo: 25, smallCombo: 6, lrgCombo2: 12, feed4: 8, party: 20 };

// Feed 4's "more wings" upsell: picking one swaps the 8 included wings for
// this many, for this much more (Pricing.js priceCombo adds the cents).
export const COMBO_WING_UPGRADES = {
  wings12: { count: 12, cents: 400 },
  wings20: { count: 20, cents: 1200 },
};

// How many wings a combo comes with, after any wings upgrade.
export function comboWingsCount(comboId, upgrade = null) {
  return COMBO_WING_UPGRADES[upgrade]?.count || comboWingsPieces[comboId] || null;
}

export function getWingsPieceOptions(comboId) {
  const base = [6, 12, 20, 30];
  if (comboId === "medCombo") return [16, 12, 20, 30];
  if (comboId === "xlCombo") return [6, 25, 20, 30];
  if (comboId === "feed4") return [8, 12, 20, 30];
  return base;
}

export function comboUpgradeOptions(comboId) {
  if (comboId === "smallCombo") return [{ id: "toMedium", label: "Upgrade to Medium (+$2)" }];
  if (comboId === "lrgCombo2") return [{ id: "toXL", label: "Upgrade to XL (+$3)" }];
  if (comboId === "feed4") {
    return [
      { id: "wings12", label: "12 Wings instead of 8 (+$4)" },
      { id: "wings20", label: "20 Wings instead of 8 (+$12)" },
    ];
  }
  return [];
}

// Title of a combo's upgrade section in the builder.
export function comboUpgradeTitle(comboId) {
  return comboId === "feed4" ? "Add More Wings" : "Upgrade";
}

// Toppings per pizza included in a combo's price.
export function comboIncludedToppings(comboId) {
  return findComboById(comboId)?.includedToppings ?? 3;
}

export function findComboById(id) {
  for (const sec of comboData) {
    const hit = sec.combos.find((c) => c.id === id);
    if (hit) return hit;
  }
  return dealCombos.find((c) => c.id === id) || null;
}

// Display name for a combo id — falls back to the raw id if unknown so a
// stale/unrecognized comboId never renders as blank.
export function comboNameFor(id) {
  return findComboById(id)?.name || id;
}

// Human labels for a combo's sub-item slot keys ("pizza1" -> "Pizza 1").
const COMBO_ITEM_LABELS = {
  pizza1: "Pizza 1",
  pizza2: "Pizza 2",
  pizza3: "Pizza 3",
  pizza: "Pizza",
  wings: "Wings",
  drink: "2L Drink",
  bread: "Garlic Bread",
  pops: "Pops",
  side: "Side",
};

export function comboItemLabel(key) {
  return COMBO_ITEM_LABELS[key] || key;
}
