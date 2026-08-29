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
      { id: "takecare", name: "2 Large Pizzas + Garlic Bread + 4 Pops", subtitle: "3 toppings each, 2 dips", items: ["pizza1", "pizza2", "bread", "pops"] },
    ],
  },
];

// thumbnails (swap to real paths when ready)
const comboImages = {
  "2med": "/images/combos/2-medium.jpg",
  "2lrg": "/images/combos/2-large.jpg",
  "2xl": "/images/combos/2-xl.jpg",
  medCombo: "/images/combos/2pizzas-wings.jpg",
  lrgCombo: "/images/combos/2pizzas-wings.jpg",
  xlCombo: "/images/combos/2pizzas-wings.jpg",
  smallCombo: "/images/combos/pizza-wings.jpg",
  lrgCombo2: "/images/combos/pizza-wings.jpg",
  takecare: "/images/combos/takecare.jpg",
};
const fallbackImg = "/images/menu_combos.png";

export const comboSections = comboData;
export const comboThumbFor = (id) => comboImages[id] || fallbackImg;

export const comboDefaultSize = {
  "2med": "12", "2lrg": "14", "2xl": "16",
  medCombo: "12", lrgCombo: "14", xlCombo: "16",
  smallCombo: "10", lrgCombo2: "14", takecare: "14",
};

export const sizeLabelMap = { "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" };
export const comboWingsPieces = { medCombo: 16, lrgCombo: 20, xlCombo: 25, smallCombo: 6, lrgCombo2: 12 };

export function getWingsPieceOptions(comboId) {
  const base = [6, 12, 20, 30];
  if (comboId === "medCombo") return [16, 12, 20, 30];
  if (comboId === "xlCombo") return [6, 25, 20, 30];
  return base;
}

export function comboUpgradeOptions(comboId) {
  if (comboId === "smallCombo") return [{ id: "toMedium", label: "Upgrade to Medium (+$2)" }];
  if (comboId === "lrgCombo2") return [{ id: "toXL", label: "Upgrade to XL (+$3)" }];
  return [];
}

export function findComboById(id) {
  for (const sec of comboData) {
    const hit = sec.combos.find((c) => c.id === id);
    if (hit) return hit;
  }
  return null;
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
  pizza: "Pizza",
  wings: "Wings",
  bread: "Garlic Bread",
  pops: "Pops",
  side: "Side",
};

export function comboItemLabel(key) {
  return COMBO_ITEM_LABELS[key] || key;
}
