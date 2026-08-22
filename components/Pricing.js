// pricing.js — single source of truth for menu prices + helpers

// 🔢 currency formatter (no tax logic here on purpose)
// pricing.js
export const formatMoney = (
  cents,
  { currency = "CAD", locale = "en-CA" } = {}
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

// Toppings that count as TWO toppings toward the pricing tier (menu's "*Additional
// Charge" items). Cheese amount (Extra/Double) is weighted separately below.
export const PREMIUM_TOPPINGS = new Set([
  "Grilled Chicken",
  "Shawarma Chicken",
  "Halal Chicken",
  "Paneer",
]);

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

  // Signature pizzas (Bourbon, Shawarma, Butter Chicken, Shahi Paneer, All-Star,
  // Mexican, Loaded Veggie, Greek)
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

  // Wings order includes this many free Blue Cheese dips per order (per menu's
  // "*Includes side of Blue Cheese"). Any other dip flavor, or Blue Cheese beyond
  // this count, is charged via PRICES.dips.each.
  wingsIncludedBlueCheese: { "6": 1, "12": 2, "20": 3, "30": 4 },

  sides: {
    "French Fries (Medium)": 599,
    "French Fries (Large)":  799,
    "Poutine (Small)":       599,
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

  // Per-extra-topping rate once a Special Menu item's weighted topping count exceeds 3.
  specialsExtraTopping: {
    "Panzerotti": 200,
    "Pizza Sub":  150,
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

  // How many total dip units are bundled free into each combo before $1/each kicks in.
  comboIncludedDips: {
    "2med": 2, "2lrg": 2, "2xl": 2,
    medCombo: 2, lrgCombo: 2, xlCombo: 2,
    smallCombo: 1, lrgCombo2: 1,
    takecare: 2,
  },

  // Upgrades mentioned in copy:
  upgrades: {
    "pizzaWingsSmallToMed": 200, // +$2
    "pizzaWingsLargeToXL":  300, // +$3
  },

  // Any extra dip/gravy unit, anywhere it's offered, costs this.
  dips: { each: 100 },

  drinks: {
    twoLiters: 350,
    cans: 150,
    // "other" bucket varies by item — see priceDrinkItem below.
  },

  // Gluten Free crust: single 13" size, its own 1/4-topping tier (not the byo 1/3 tier).
  glutenFree: { base1: 1399, base4: 1599, extra: 199 },

  dairyFreeCheese: 300,
};

// ===== TOPPING WEIGHTING =====
//
// Each topping's weight = premiumMultiplier x placementWeight x amountMultiplier:
//   - premiumMultiplier: 2 for chicken proteins/Paneer/"Double Cheese", else 1
//   - placementWeight: 1 for "full" pizza, 0.5 for "left"/"right" half
//   - amountMultiplier: 2 for "Extra" amount, else 1
// The RAW (fractional) weights of every topping plus the cheese-level weight are
// summed, then rounded UP to the next whole number ONCE at the very end — so e.g.
// two different half-toppings (0.5 + 0.5) round up to 1, matching a single full
// topping, and a lone half-topping (0.5, even at Extra amount = 0.5x2=1.0... wait
// a lone half topping at Normal amount is 0.5, which still rounds up to 1 same as
// at Extra amount (1.0 also rounds to 1) — a half topping alone never prices below
// or above "1 topping" regardless of its amount.

function premiumMultiplier(name) {
  if (PREMIUM_TOPPINGS.has(name)) return 2;
  if (name === "Double Cheese") return 2; // Special Menu checkbox item
  return 1; // includes "Extra Cheese" (Special Menu) and every regular topping
}

function placementWeight(placement) {
  return placement === "left" || placement === "right" ? 0.5 : 1; // default: full
}

function amountMultiplier(amount) {
  return amount === "Extra" ? 2 : 1;
}

function rawToppingWeight(item) {
  const toppings = Array.isArray(item?.toppings) ? item.toppings : [];
  const placementMap = item?.toppingPlacement || {};
  const amountMap = item?.toppingAmount || {};
  return toppings.reduce((sum, t) => {
    return (
      sum +
      premiumMultiplier(t) * placementWeight(placementMap[t]) * amountMultiplier(amountMap[t])
    );
  }, 0);
}

function cheeseSideWeight(amt) {
  return amt === "Double" ? 2 : amt === "Extra" ? 1 : 0;
}

function rawCheeseWeight(item) {
  if (!item || item.cheeseIncluded === false) return 0;
  if (item.cheeseCoverage === "left" || item.cheeseCoverage === "right") {
    return (
      0.5 * cheeseSideWeight(item.cheeseAmount) +
      0.5 * cheeseSideWeight(item.secondAmount || item.cheeseAmount)
    );
  }
  return cheeseSideWeight(item.cheeseAmount);
}

// Used for BYO pizzas, combo pizzas, and Special Menu items alike. Special Menu
// items have no placement/amount selectors, so their toppings naturally default to
// full-placement/Normal-amount (weight 1, or 2 for premium items).
export function weightedToppingCount(item) {
  return Math.ceil(rawToppingWeight(item) + rawCheeseWeight(item));
}

function sumDipUnits(dipsObj) {
  if (!dipsObj || typeof dipsObj !== "object") return 0;
  return Object.values(dipsObj).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

// ===== PIZZA HELPERS =====

// returns total price (in cents) for BYO given size ("8" | "10" | "12" | "14" | "slab")
// and a WEIGHTED topping count (see weightedToppingCount above).
export function priceByoPizza(sizeKey, weightedCount) {
  const cfg = PRICES.byo[sizeKey];
  if (!cfg) return 0;

  if (weightedCount <= 1) return cfg.base1;
  if (weightedCount === 2) return cfg.base1 + cfg.extra;
  if (weightedCount === 3) return cfg.base3;

  const extras = weightedCount - 3;
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

// signature pizzas (Bourbon, Shawarma, Butter Chicken, Shahi Paneer, All-Star, Mexican,
// Loaded Veggie, Greek)
export function priceSignature(sizeKeyUI) {
  const map = { "10": "small", "12": "medium", "14": "large", "16": "xl" };
  const bucket = map[sizeKeyUI];
  if (!bucket) return 0;
  return PRICES.signature[bucket] || 0;
}

// Gluten Free crust: single size, 1/4-topping tiers (mirrors the byo tier shape, but
// the bundle checkpoint is 4 toppings instead of 3).
export function priceGlutenFree(weightedCount) {
  const cfg = PRICES.glutenFree;
  if (weightedCount <= 1) return cfg.base1;
  if (weightedCount < 4) return cfg.base1 + (weightedCount - 1) * cfg.extra;
  if (weightedCount === 4) return cfg.base4;
  return cfg.base4 + (weightedCount - 4) * cfg.extra;
}

// wings by count (6/12/20/30 only)
export function priceWings(count) {
  return PRICES.wings[String(count)] || 0;
}

// sides by name
export function priceSide(name) {
  return PRICES.sides[name] || 0;
}

// specials by item name (flat, no toppings factored in — see priceLineItem for the
// weighted-topping overage add-on)
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

// Bonus cost (in cents) for combo pizzas whose weighted topping count exceeds 3,
// using the SAME per-size "extra" rate as a standalone BYO pizza of that size.
export function priceComboToppingBonus(comboItem) {
  const sizeLockedUI = comboItem?.meta?.sizeLocked;
  const pricingSizeKey = sizeLockedUI
    ? sizeMapUIToPrice[String(sizeLockedUI)] || String(sizeLockedUI)
    : null;
  const extraRate =
    pricingSizeKey && PRICES.byo[pricingSizeKey] ? PRICES.byo[pricingSizeKey].extra : 0;

  const items = comboItem?.meta?.items || {};
  let bonus = 0;
  Object.values(items).forEach((sub) => {
    if (!sub || !Array.isArray(sub.toppings)) return; // only pizza sub-items have toppings
    const w = weightedToppingCount(sub);
    if (w > 3) bonus += (w - 3) * extraRate;
  });
  return bonus;
}

// Extra-dip cost (in cents) across every sub-item of a combo, beyond the combo's
// bundled free-dip count.
export function priceComboDipOverage(comboItem) {
  const items = comboItem?.meta?.items || {};
  const totalDips = Object.values(items).reduce(
    (sum, sub) => sum + sumDipUnits(sub?.dips),
    0
  );
  const included = PRICES.comboIncludedDips[comboItem?.comboId] ?? 0;
  return Math.max(0, totalDips - included) * PRICES.dips.each;
}

// Per-unit price for a drinks/dips category item.
export function priceDrinkItem(categoryId, label) {
  if (categoryId === "twoLiters") return PRICES.drinks.twoLiters;
  if (categoryId === "cans") return PRICES.drinks.cans;
  if (categoryId === "dips") return PRICES.dips.each;
  if (categoryId === "other") {
    const l = String(label || "").toLowerCase();
    if (l.includes("gatorade")) return 250;
    if (l.includes("redbull") || l.includes("red bull")) return 350;
    if (l.includes("juice")) return 175;
    if (l.includes("water")) return 150;
    return 0;
  }
  return 0;
}

export function priceDrinksDips(categoryId, items = []) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, it) => sum + priceDrinkItem(categoryId, it?.label) * (Number(it?.qty) || 0),
    0
  );
}

// ===== ONE API to price any "onAdd" payload =====
//
// Standardize your builders to send an object like:
//
//  PIZZA (BYO):
//    { type:"pizza-byo", size:"12", toppings:["Pepperoni","Mushroom",...],
//      cheeseIncluded:true, cheeseAmount:"Normal", dips:{...}, qty:1 }
//
//  PIZZA (specialty classic):
//    { type:"pizza-specialty", style:"classic", name:"Deluxe", size:"12", qty:1 }
//
//  PIZZA (signature):
//    { type:"pizza-specialty", style:"signature", name:"Bourbon", size:"12", qty:1 }
//
//  WINGS:
//    { type:"wings", count:12, qty:1, dips:{"Blue Cheese":2, Garlic:1, Ranch:0} }
//
//  SIDE:
//    { type:"side", name:"Poutine (Large)", qty:1, gravy:0, dips:{...} }
//
//  SPECIAL MENU:
//    { type:"special", name:"Panzerotti", qty:1, toppings:{meats:[],veggies:[],cheeses:[]},
//      dips:{...} }
//
//  COMBO:
//    { type:"combo", comboId:"medCombo", qty:1, upgrade:null,
//      meta:{ sizeLocked:"12", items:{ pizza1:{...}, pizza2:{...}, wings:{...} } } }
//
//  DRINKS/DIPS:
//    { type:"drinks-dips", categoryId:"cans", items:[{label:"Sprite", qty:2}], qty:1 }
//
export function priceLineItem(item) {
  const qty = Math.max(1, Number(item?.qty) || 1);

  switch (item?.type) {
    case "pizza-byo": {
      const w = weightedToppingCount(item);
      let pizzaCents;
      if (item.size === "gf") {
        pizzaCents = priceGlutenFree(w);
      } else {
        let sizeKey = item.size;
        // map UI 10/12/14/16 -> 8/10/12/14 (or let "slab" pass through)
        if (sizeKey !== "slab") {
          sizeKey = sizeMapUIToPrice[String(sizeKey)] || String(sizeKey);
        }
        pizzaCents = priceByoPizza(sizeKey, w);
      }
      const dipCents = sumDipUnits(item.dips) * PRICES.dips.each;
      const dairyFreeCents = item.dairyFreeCheese ? PRICES.dairyFreeCheese : 0;
      return (pizzaCents + dipCents + dairyFreeCents) * qty;
    }

    case "pizza-specialty": {
      if (item.style === "signature") {
        return priceSignature(String(item.size)) * qty;
      }
      // default classic specialty
      return priceSpecialtyClassic(String(item.size)) * qty;
    }

    case "wings": {
      const base = priceWings(item.count);
      const includedBlueCheese = PRICES.wingsIncludedBlueCheese[String(item.count)] || 0;
      const dips = item.dips || {};
      let paidDipUnits = 0;
      Object.entries(dips).forEach(([label, n]) => {
        const units = Number(n) || 0;
        if (label === "Blue Cheese") {
          paidDipUnits += Math.max(0, units - includedBlueCheese);
        } else {
          paidDipUnits += units;
        }
      });
      return (base + paidDipUnits * PRICES.dips.each) * qty;
    }

    case "side": {
      const base = priceSide(item.name);
      const gravyUnits = Number(item.gravy) || 0;
      const dipUnits = sumDipUnits(item.dips);
      return (base + (gravyUnits + dipUnits) * PRICES.dips.each) * qty;
    }

    case "special": {
      const base = priceSpecial(item.name);
      const w = weightedToppingCount({ toppings: flattenSpecialToppings(item.toppings) });
      const extraRate = PRICES.specialsExtraTopping[item.name] || 0;
      const toppingBonus = w > 3 ? (w - 3) * extraRate : 0;
      const dipUnits = sumDipUnits(item.dips);
      return (base + toppingBonus + dipUnits * PRICES.dips.each) * qty;
    }

    case "combo": {
      const base = priceCombo(item.comboId, { upgrade: item.upgrade || null });
      const toppingBonus = priceComboToppingBonus(item);
      const dipBonus = priceComboDipOverage(item);
      return (base + toppingBonus + dipBonus) * qty;
    }

    case "drinks-dips":
      return priceDrinksDips(item.categoryId, item.items) * qty;

    default:
      return 0;
  }
}

// Special Menu toppings are stored as {meats:[], veggies:[], cheeses:[]} rather than a
// flat array — flatten them for weightedToppingCount (which just wants a flat list).
function flattenSpecialToppings(toppings) {
  if (!toppings) return [];
  if (Array.isArray(toppings)) return toppings;
  return [
    ...(toppings.meats || []),
    ...(toppings.veggies || []),
    ...(toppings.cheeses || []),
  ];
}
