// pricing.js — single source of truth for menu prices + helpers

// 🔢 currency formatter (no tax logic here on purpose)
// pricing.js
export const formatMoney = (
  cents,
  { currency = "USD", locale = "en-US" } = {}
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);

// 🧭 size label mapping (your UI sometimes uses 10/12/14/16; pricing is 8/10/12/14).
// If your PizzaBuilder emits 10/12/14/16, we map them to 8/10/12/14 for pricing.
export const sizeMapUIToPrice = {
  "10": "8",   // Small 8"
  "12": "10",  // Medium 10"
  "14": "12",  // Large 12"
  "16": "14",  // X-Large 14"
  // slab handled separately
};

export const SIZE_LABELS = {
  "8":  "Small 8\"",
  "10": "Medium 10\"",
  "12": "Large 12\"",
  "14": "X-Large 14\"",
  "slab": "Pizza Slab",
};

// all monetary values stored as **cents** to avoid float issues
export const PRICES = {
  byo: {
    // each size has: base1 (1 topping), base3 (3 toppings), extra (per extra topping)
    "8":   { base1:  899, base3: 1099, extra: 150 },
    "10":  { base1:  999, base3: 1299, extra: 175 },
    "12":  { base1: 1299, base3: 1499, extra: 199 },
    "14":  { base1: 1499, base3: 1899, extra: 250 },
    "slab":{ base1: 2399, base3: 2899, extra: 375 },
  },

  // classic Specialty (Deluxe, Meat Lover, Hawaiian, Veggie Lover, Canadian)
  specialtyClassic: {
    small:  1099,
    medium: 1299,
    large:  1499,
    xl:     1899,
  },

  // Signature pizzas (Greek, Loaded Veggie, Bourbon, Shawarma, Mexican, Curry Chicken, Europa,
  // Butter Chicken, Shahi Paneer)
  signature: {
    small:  1399,
    medium: 1699,
    large:  1999,
    xl:     2199,
  },

  wings: {
    "6":   899,
    "12": 1599,
    "20": 2599,
    "30": 3799,
    // Note: 16 & 25 are "irregular" and only appear inside Double Combo (priced there)
  },

  sides: {
    "French Fries (Medium)": 599,
    "French Fries (Large)":  799,
    "Poutine (Medium)":      899,
    "Poutine (Large)":       1099,
    "Shawarma Poutine (Medium)": 1099,
    "Shawarma Poutine (Large)":  1299,
    "Cheesy Garlic Bread":   599,
    "Garlic Bread":          399,
    "Onion Rings (Medium)":  999,
    "Onion Rings (Large)":   1199,
  },

  specials: {
    "Panzerotti": 1499,   // (3 toppings, with Marinara & Garlic Dip)
    "Pizza Sub":   999,   // (Sauce, Cheese, + Any 3 Toppings)
    "Meatball Sub":999,   // (Pizza Sauce, Cheese, Meatballs)
  },

  combos: {
    // Two Pizzas
    "2med": 2599, // 2 Medium Pizzas (3 toppings each, 2 dips)
    "2lrg": 2999, // 2 Large Pizzas ...
    "2xl":  3799, // 2 XL Pizzas ...

    // Double Combo (irregular wing amounts baked in)
    "medCombo": 4499, // 2 Medium + 16 Wings + 2 Dips
    "lrgCombo": 5499, // 2 Large  + 20 Wings + 2 Dips
    "xlCombo":  6499, // 2 XL     + 25 Wings + 2 Dips

    // Pizza & Wings
    "smallCombo": 1799, // 1 Small (3 toppings) + 6 Wings + Dip (upgrade to Medium +$2 handled separately)
    "lrgCombo2":  2999, // 1 Large (3 toppings) + 12 Wings + 1 Dip (upgrade to XL +$3 handled separately)

    // Take Care
    "takecare": 3599, // 2 Large (3 toppings each) + 2 Dips + Garlic Bread + 4 Pops
  },

  // Upgrades mentioned in copy:
  upgrades: {
    "pizzaWingsSmallToMed": 200, // +$2
    "pizzaWingsLargeToXL":  300, // +$3
  },
};

// ===== PIZZA HELPERS =====

// returns total price (in cents) for BYO given size ("8" | "10" | "12" | "14" | "slab") and topping count
export function priceByoPizza(sizeKey, toppingsCount) {
  const cfg = PRICES.byo[sizeKey];
  if (!cfg) return 0;

  if (toppingsCount <= 1) return cfg.base1;
  if (toppingsCount <= 3) return cfg.base3;

  const extras = Math.max(0, toppingsCount - 3);
  return cfg.base3 + extras * cfg.extra;
}

// classic specialty pizzas (Deluxe, Meat Lover, Hawaiian, Veggie Lover, Canadian)
export function priceSpecialtyClassic(sizeKeyUI) {
  // map UI size to pricing ladder
  const map = { "10": "small", "12": "medium", "14": "large", "16": "xl" };
  const bucket = map[sizeKeyUI];
  if (!bucket) return 0;
  return PRICES.specialtyClassic[bucket] || 0;
}

// signature pizzas (Greek, Loaded Veggie, Bourbon, Shawarma, Mexican, Curry Chicken, Europa,
// Butter Chicken, Shahi Paneer)
export function priceSignature(sizeKeyUI) {
  const map = { "10": "small", "12": "medium", "14": "large", "16": "xl" };
  const bucket = map[sizeKeyUI];
  if (!bucket) return 0;
  return PRICES.signature[bucket] || 0;
}

// wings by count (6/12/20/30 only)
export function priceWings(count) {
  return PRICES.wings[String(count)] || 0;
}

// sides by name
export function priceSide(name) {
  return PRICES.sides[name] || 0;
}

// specials by item name
export function priceSpecial(itemName) {
  return PRICES.specials[itemName] || 0;
}

// combos by id (matching your ComboBuilder ids)
export function priceCombo(comboId, { upgrade = null } = {}) {
  let base = PRICES.combos[comboId] || 0;

  if (comboId === "smallCombo" && upgrade === "toMedium") {
    base += PRICES.upgrades.pizzaWingsSmallToMed;
  }
  if (comboId === "lrgCombo2" && upgrade === "toXL") {
    base += PRICES.upgrades.pizzaWingsLargeToXL;
  }
  return base;
}

// ===== ONE API to price any "onAdd" payload =====
//
// Standardize your builders to send an object like:
//
//  PIZZA (BYO):
//    { type:"pizza-byo", size:"12", toppings:["Pepperoni","Mushroom",...], qty:1 }
//
//  PIZZA (specialty classic):
//    { type:"pizza-specialty", style:"classic", name:"Deluxe", size:"12", qty:1 }
//
//  PIZZA (signature):
//    { type:"pizza-specialty", style:"signature", name:"Bourbon", size:"12", qty:1 }
//
//  WINGS:
//    { type:"wings", count:12, qty:1 }
//
//  SIDE:
//    { type:"side", name:"Poutine (Large)", qty:1 }
//
//  SPECIAL MENU:
//    { type:"special", name:"Panzerotti", qty:1 }  // toppings are included in price
//
//  COMBO:
//    { type:"combo", comboId:"medCombo", qty:1, upgrade:null } // or upgrade:"toMedium"/"toXL"
//
export function priceLineItem(item) {
  const qty = Math.max(1, Number(item?.qty) || 1);

  switch (item?.type) {
    case "pizza-byo": {
      let sizeKey = item.size;
      // map UI 10/12/14/16 -> 8/10/12/14 (or let "slab" pass through)
      if (sizeKey !== "slab") {
        sizeKey = sizeMapUIToPrice[String(sizeKey)] || String(sizeKey);
      }
      const tcount = Array.isArray(item.toppings) ? item.toppings.length : 0;
      return priceByoPizza(sizeKey, tcount) * qty;
    }

    case "pizza-specialty": {
      if (item.style === "signature") {
        return priceSignature(String(item.size)) * qty;
      }
      // default classic specialty
      return priceSpecialtyClassic(String(item.size)) * qty;
    }

    case "wings":
      return priceWings(item.count) * qty;

    case "side":
      return priceSide(item.name) * qty;

    case "special":
      return priceSpecial(item.name) * qty;

    case "combo": {
      const base = priceCombo(item.comboId, { upgrade: item.upgrade || null });
      return base * qty;
    }

    default:
      return 0;
  }
}
