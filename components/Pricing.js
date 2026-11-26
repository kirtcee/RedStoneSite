// pricing.js — single source of truth for menu prices + helpers
import { findDealById, dealAllowsService, dealSlotConfig, itemMatchesDealSlot } from "../utils/dealCatalog";
import { findPizzaRecipe } from "../utils/pizzaRecipes";
import { findDrink } from "../utils/drinkCatalog";
import { COMBO_WING_UPGRADES, comboIncludedToppings } from "../utils/comboCatalog";

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
    "8":  1199,
    "12": 1599,
    "16": 2099,
    "20": 2599,
    "25": 3199,
    "30": 3799,
    // 8/16/25 only appear locked inside a combo/deal (priced flat there via
    // PRICES.combos/deal price, not via this table) — these entries just
    // keep that nested WingsBuilder popup's own subtotal display accurate
    // instead of showing $0.00 while the customer picks sauce/style.
  },

  // Wings order includes this many free dips per order, in any mix of the
  // available flavors (per menu's "*Includes side of dip"). Anything beyond
  // this total count is charged via PRICES.dips.each.
  wingsIncludedDips: { "6": 1, "8": 1, "12": 2, "16": 2, "20": 3, "25": 3, "30": 4 },

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

    // Deals page combos (keep utils/dealCatalog.js's prices the same)
    "feed4": 3999, // 2 Large (2 toppings each) + 8 Wings + Garlic Bread + 2L + 2 Dips
    "party": 6499, // 3 Large (2 toppings each) + 20 Wings + Garlic Bread + 2L + 3 Dips
  },

  // How many total dip units are bundled free into each combo before $1/each kicks in.
  comboIncludedDips: {
    "2med": 2, "2lrg": 2, "2xl": 2,
    medCombo: 2, lrgCombo: 2, xlCombo: 2,
    smallCombo: 1, lrgCombo2: 1,
    takecare: 2,
    feed4: 2, party: 3,
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

  // Gluten Free crust: single 13" size. $1.00/topping flat from 1-4 toppings
  // (12.99/13.99/14.99/15.99), then $1.75/topping beyond 4.
  glutenFree: { base1: 1299, perToppingUpTo4: 100, base4: 1599, extra: 175 },

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

// Topping count for customer-facing display (e.g. "3 Topping Pizza") — same
// premium/placement/amount weighting as pricing, but cheese amount doesn't
// count as a "topping" here the way it does for the pricing tier.
export function toppingCountForDisplay(item) {
  return Math.ceil(rawToppingWeight(item));
}

const BYO_SIZE_WORDS = { "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" };

// Cart title for an un-named build-your-own pizza — e.g. "Large 3 Topping
// Pizza" or "Gluten Free 2 Topping Pizza". Named recipe pizzas (Signature/
// Specialty, customized or not) already carry their own pizzaName and never
// call this.
export function describeByoPizzaTitle(data = {}) {
  const isGlutenFree = data.size === "gf" || data.crust === "Gluten Free";
  const sizeWord = isGlutenFree ? "Gluten Free" : BYO_SIZE_WORDS[String(data.size)] || "";
  const count = toppingCountForDisplay(data);

  if (count > 0) {
    return [sizeWord, `${count} Topping Pizza`].filter(Boolean).join(" ");
  }
  if (data.cheeseIncluded === false) {
    return [sizeWord, "Pizza"].filter(Boolean).join(" ");
  }
  return [sizeWord, "Cheese Pizza"].filter(Boolean).join(" ");
}

// Every pizza comes with one dip free; dips after the first are charged.
// (Combos have their own included dips: see priceComboDipOverage.)
export const FREE_DIPS_PER_PIZZA = 1;
function pizzaDipCents(dipsObj) {
  return Math.max(0, sumDipUnits(dipsObj) - FREE_DIPS_PER_PIZZA) * PRICES.dips.each;
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

// Gluten Free crust: single size, flat $1.00/topping from 1-4 toppings
// (12.99/13.99/14.99/15.99), then $1.75/topping beyond 4.
export function priceGlutenFree(weightedCount) {
  const cfg = PRICES.glutenFree;
  if (weightedCount <= 1) return cfg.base1;
  if (weightedCount <= 4) return cfg.base1 + (weightedCount - 1) * cfg.perToppingUpTo4;
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
  if (comboId === "feed4" && COMBO_WING_UPGRADES[upgrade]) {
    base += COMBO_WING_UPGRADES[upgrade].cents;
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
  const included = comboIncludedToppings(comboItem?.comboId); // 3, or 2 for Feed 4 / Party
  let bonus = 0;
  Object.values(items).forEach((sub) => {
    if (!sub || !Array.isArray(sub.toppings)) return; // only pizza sub-items have toppings
    const w = weightedToppingCount(sub);
    if (w > included) bonus += (w - included) * extraRate;
  });
  return bonus;
}

// Extra-topping cost (in cents) for one deal unit's pizza build, beyond
// whatever topping count that deal's slot/eligible-item entry includes for
// free — same per-size "extra" rate as a standalone BYO pizza uses. `config`
// is the deal's own itemType entry (has `size` + `includedToppings`); `build`
// is the actual PizzaBuilder payload the customer produced for this unit.
function priceDealPizzaOverage(config, build) {
  if (!config || !build || !Array.isArray(build.toppings)) return 0;
  const included = Number(config.includedToppings) || 0;
  const w = weightedToppingCount(build);
  if (w <= included) return 0;
  const pricingSizeKey = sizeMapUIToPrice[String(config.size)] || String(config.size);
  const extraRate = PRICES.byo[pricingSizeKey]?.extra || 0;
  return (w - included) * extraRate;
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

// Per-unit price for a drinks/dips category item. Only drinks listed in
// utils/drinkCatalog.js have a price; anything else (e.g. one we stopped
// selling) is 0.
export function priceDrinkItem(categoryId, label) {
  const drink = findDrink(categoryId, label);
  if (!drink) return 0;
  if (categoryId === "twoLiters") return PRICES.drinks.twoLiters;
  if (categoryId === "cans") return PRICES.drinks.cans;
  if (categoryId === "dips") return PRICES.dips.each;
  return drink.cents || 0;
}

// The whole line is 0 (so the server refuses it) if it's empty or any
// drink in it isn't sold.
export function priceDrinksDips(categoryId, items = []) {
  const list = (Array.isArray(items) ? items : []).filter((it) => (Number(it?.qty) || 0) > 0);
  if (!list.length) return 0;
  let sum = 0;
  for (const it of list) {
    const each = priceDrinkItem(categoryId, it?.label);
    if (!each) return 0;
    sum += each * Number(it.qty);
  }
  return sum;
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
      let w = weightedToppingCount(item);
      // A customized Signature/Specialty pizza never gets cheaper than its
      // original recipe: removing toppings keeps the recipe's topping tier.
      const recipe = findPizzaRecipe(item.pizzaName);
      if (recipe) {
        w = Math.max(
          w,
          weightedToppingCount({ ...item, toppings: recipe.toppings, toppingPlacement: {}, toppingAmount: {} })
        );
      }
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
      const dipCents = pizzaDipCents(item.dips); // first dip free
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
      // dips is a single running total across every order in this line (not
      // per-order), so the included allotment scales with qty but the dip
      // overage charge must NOT be multiplied by qty again below.
      const base = priceWings(item.count) * qty;
      const includedDips = (PRICES.wingsIncludedDips[String(item.count)] || 0) * qty;
      const totalDipUnits = sumDipUnits(item.dips);
      const paidDipUnits = Math.max(0, totalDipUnits - includedDips);
      return base + paidDipUnits * PRICES.dips.each;
    }

    case "side": {
      // `pack` = how many of this side one line unit holds (e.g. a deal's
      // "2 Cheesy Garlic Breads" is one unit of pack 2).
      const pack = Math.max(1, Number(item.pack) || 1);
      const base = priceSide(item.name) * pack;
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

const PIZZA_SIZE_LABELS_UI = {
  "10": 'Small 10"',
  "12": 'Medium 12"',
  "14": 'Large 14"',
  "16": 'X-Large 16"',
  "gf": '13" (Gluten Free)',
};

const PIZZA_DIP_LABELS = {
  garlic: "Signature Garlic Dip",
  ranch: "Ranch",
  marinara: "Marinara",
  blueCheese: "Blue Cheese",
};

// Full build description for a BYO pizza — mirrors what PizzaBuilder's "My
// Pizza" summary panel shows visually (size, crust, cheese, sauce, toppings
// with placement/amount, dips), so cart lines and combo item descriptions
// never fall back to a bare "No toppings" when there's still a real build
// (cheese, sauce, etc.) behind it. Accepts the same shape PizzaBuilder's
// onSave payload uses.
// Short identity line only — size and crust, nothing else. Used wherever a
// pizza needs to be named at a glance (e.g. the cart dropdown), leaving
// cheese/sauce/topping/instruction detail for the fuller views.
export function describePizzaCompact(data = {}) {
  const sizeKey = data.size != null ? String(data.size) : "";
  const sizeLabel = PIZZA_SIZE_LABELS_UI[sizeKey] || (sizeKey ? `${sizeKey}"` : "");
  // The gluten-free size label already says "Gluten Free" — don't repeat it
  // via the crust too.
  const crust = sizeKey === "gf" ? null : data.crust;
  return [sizeLabel, crust].filter(Boolean).join(" ");
}

const CHEESE_DEFAULT_COVERAGE = "full";
const CHEESE_DEFAULT_AMOUNT = "Normal";
const SAUCE_DEFAULT = "Pizza Sauce";
const SAUCE_DEFAULT_AMOUNT = "Normal";

// Full build description for a BYO pizza — only calls out what the customer
// actually changed from the standard build (whole pizza, normal cheese,
// plain pizza sauce, normal bake), so an unmodified pizza reads as just its
// size/crust/toppings instead of restating every default setting.
export function describePizzaFull(data = {}) {
  const bits = [describePizzaCompact(data)];

  if (data.cheeseIncluded === false) {
    bits.push("No cheese");
  } else {
    const coverage = data.cheeseCoverage || CHEESE_DEFAULT_COVERAGE;
    const amount = data.cheeseAmount || CHEESE_DEFAULT_AMOUNT;
    const isDefaultCheese =
      coverage === CHEESE_DEFAULT_COVERAGE &&
      amount === CHEESE_DEFAULT_AMOUNT &&
      !data.secondCoverage &&
      !data.dairyFreeCheese;
    if (!isDefaultCheese) {
      let cheeseBit = `Cheese: ${coverage} ${amount}`;
      if (data.secondCoverage) {
        cheeseBit += `, ${data.secondCoverage} ${data.secondAmount || CHEESE_DEFAULT_AMOUNT}`;
      }
      if (data.dairyFreeCheese) cheeseBit += " (dairy-free)";
      bits.push(cheeseBit);
    }
  }

  if (data.sauceEnabled === false) {
    bits.push("No sauce");
  } else if (data.sauce) {
    const amount = data.sauceAmount || SAUCE_DEFAULT_AMOUNT;
    const isDefaultSauce = data.sauce === SAUCE_DEFAULT && amount === SAUCE_DEFAULT_AMOUNT;
    if (!isDefaultSauce) {
      bits.push(`Sauce: ${data.sauce}${amount ? ` (${amount})` : ""}`);
    }
  }

  const toppings = Array.isArray(data.toppings)
    ? data.toppings
    : Array.isArray(data.selectedToppings)
    ? data.selectedToppings
    : [];
  if (toppings.length) {
    const placement = data.toppingPlacement || {};
    const amount = data.toppingAmount || {};
    const toppingBits = toppings.map((t) => {
      const p = placement[t] || "full";
      const a = amount[t] || "Normal";
      return p === "full" && a === "Normal" ? t : `${t} (${p}, ${a})`;
    });
    bits.push(toppingBits.join(", "));
  }

  const dips = data.dips || {};
  const dipBits = Object.entries(dips)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([key, qty]) => `${PIZZA_DIP_LABELS[key] || key} × ${qty}`);
  if (dipBits.length) bits.push(`Dips: ${dipBits.join(", ")}`);

  const instructionBits = [];
  if (data.bake && data.bake !== "normal") {
    instructionBits.push(data.bake === "light" ? "Lightly done" : "Well done");
  }
  if (data.oregano === "with") instructionBits.push("With oregano");
  if (data.crushedRedPepper === "with") instructionBits.push("With chili flakes");
  if (data.coriander === "with") instructionBits.push("With coriander");
  if (data.ginger === "with") instructionBits.push("With ginger");
  if (instructionBits.length) bits.push(instructionBits.join(", "));

  // One line per group (size/crust, cheese, sauce, toppings, dips, ...).
  return bits.filter(Boolean).join("\n");
}

// ===== BYO pizza: cart / checkout display format =====
//
// Title: size in inches + dough, e.g. `14" Original Hand Tossed`
// (Gluten Free is one fixed size: `13" Gluten Free`).
export function describeByoPizzaHeading(data = {}) {
  const isGlutenFree = data.size === "gf" || data.crust === "Gluten Free";
  if (isGlutenFree) return '13" Gluten Free';
  const size = BYO_SIZE_WORDS[String(data.size)] ? `${data.size}"` : "";
  return [size, data.crust || "Original Hand Tossed"].filter(Boolean).join(" ");
}

const AMOUNT_WORD = { None: "No", Light: "Light", Less: "Light", Normal: "", Extra: "Extra", Double: "Double" };
const withAmount = (amount, name) => [AMOUNT_WORD[amount] ?? amount, name].filter(Boolean).join(" ");

// Lines under the title, grouped by where on the pizza they go:
//   Left: …  /  Right: …  /  Whole: …   (only the ones that apply; the
//   "Whole" label is dropped (label: null) when there are no halves)
// followed by Dips and Instructions if any. Each item reads like
// "Extra Mushroom", "Light Garlic Base", "No Cheese". Plain defaults
// (normal cheese and normal pizza sauce on the whole pizza) are left out;
// when the cheese differs by half, both halves list their cheese.
export function describeByoPizzaSections(data = {}) {
  const left = [];
  const right = [];
  const whole = [];
  const cheeseName = data.dairyFreeCheese ? "Dairy-Free Cheese" : "Cheese";

  // Cheese
  if (data.cheeseIncluded === false) {
    whole.push("No Cheese");
  } else {
    const coverage = data.cheeseCoverage || CHEESE_DEFAULT_COVERAGE;
    const amount = data.cheeseAmount || CHEESE_DEFAULT_AMOUNT;
    if (coverage === "left" || coverage === "right") {
      const other = data.secondAmount || CHEESE_DEFAULT_AMOUNT;
      const leftAmt = coverage === "left" ? amount : other;
      const rightAmt = coverage === "right" ? amount : other;
      left.push(withAmount(leftAmt, cheeseName));
      right.push(withAmount(rightAmt, cheeseName));
    } else if (amount !== CHEESE_DEFAULT_AMOUNT || data.dairyFreeCheese) {
      whole.push(withAmount(amount, cheeseName));
    }
  }

  // Sauce (always the whole pizza)
  if (data.sauceEnabled === false) {
    whole.push("No Sauce");
  } else {
    const sauce = data.sauce || SAUCE_DEFAULT;
    const amount = data.sauceAmount || SAUCE_DEFAULT_AMOUNT;
    if (sauce !== SAUCE_DEFAULT || amount !== SAUCE_DEFAULT_AMOUNT) whole.push(withAmount(amount, sauce));
  }

  // Toppings, in the order they were picked
  const toppings = Array.isArray(data.toppings)
    ? data.toppings
    : Array.isArray(data.selectedToppings)
    ? data.selectedToppings
    : [];
  const placement = data.toppingPlacement || {};
  const toppingAmount = data.toppingAmount || {};
  for (const t of toppings) {
    const label = withAmount(toppingAmount[t] || "Normal", t);
    const p = placement[t] || "full";
    (p === "left" ? left : p === "right" ? right : whole).push(label);
  }

  const sections = [];
  if (left.length) sections.push({ label: "Left", text: left.join(", ") });
  if (right.length) sections.push({ label: "Right", text: right.join(", ") });
  // "Whole:" is only needed to tell it apart from Left/Right halves
  if (whole.length) {
    sections.push({ label: left.length || right.length ? "Whole" : null, text: whole.join(", ") });
  }

  const dipBits = Object.entries(data.dips || {})
    .filter(([, qty]) => Number(qty) > 0)
    .map(([key, qty]) => `${PIZZA_DIP_LABELS[key] || key} × ${qty}`);
  if (dipBits.length) sections.push({ label: "Dips", text: dipBits.join(", ") });

  const instructions = [];
  if (data.bake && data.bake !== "normal") instructions.push(data.bake === "light" ? "Lightly Done" : "Well Done");
  if (data.oregano === "with") instructions.push("Oregano");
  if (data.crushedRedPepper === "with") instructions.push("Chili Flakes");
  if (data.coriander === "with") instructions.push("Coriander");
  if (data.ginger === "with") instructions.push("Ginger");
  if (instructions.length) sections.push({ label: "Instructions", text: instructions.join(", ") });

  return sections;
}


// ===== Deals / coupons applied to the cart =====
//
// A coupon isn't a cart item. The customer's items are ordinary cart lines;
// the ones they added through a coupon carry `deal: { ref, slot }`, where
// `ref` points at an entry in the cart's `appliedDeals` list
// ({ id, dealId }) and `slot` is which of the deal's eligible items it fills.
//
// priceCart() works out what every line really costs:
//   - regularCents: the item's normal menu price (priceLineItem)
//   - finalCents:   what the customer pays once any coupon is applied
// and how much each coupon saves. The same function runs in the browser
// (cart, checkout) and on the server (pages/api/placeOrder.js), so the
// numbers always agree and can't be faked from the browser.
//
// Rules:
//   - Only lines that genuinely match the deal's item (right type, size,
//     piece count...) get the deal price. Anything else stays regular.
//   - "list" deals (e.g. Pick 2 or More, $8.99 each): every unit (a line with
//     qty 2 is 2 units) costs the deal price plus its own paid extras, once
//     the coupon has at least `minQty` units (and at most `maxQty` count).
//   - "bundle" deals (e.g. 2 Medium Pizzas + 8 Wings, $29.99): once every slot
//     is filled, the bundle costs the deal price plus each slot's extras,
//     spread across its lines. Extra quantity on a slot is regular price.
//   - A coupon never makes anything MORE expensive than ordering it normally.

// Paid extras on one line (all units) that a deal still charges for: extra
// toppings beyond what the deal includes, dips, gravy, dairy-free cheese.
function dealLineExtras(config, item) {
  const qty = Math.max(1, Number(item?.qty) || 1);
  switch (item?.type) {
    case "pizza-byo": {
      const dips = pizzaDipCents(item.dips); // first dip free, same as a regular pizza
      const dairyFree = item.dairyFreeCheese ? PRICES.dairyFreeCheese : 0;
      return (priceDealPizzaOverage(config, item) + dips + dairyFree) * qty;
    }
    case "wings":
    case "side": {
      const plain = { ...item, dips: {}, gravy: 0 };
      return Math.max(0, priceLineItem(item) - priceLineItem(plain));
    }
    default:
      return 0;
  }
}

function unitsOf(item) {
  return Math.max(1, Number(item?.qty) || 1);
}

export function priceCart(items = [], appliedDeals = [], service = null) {
  const list = Array.isArray(items) ? items : [];
  const instances = Array.isArray(appliedDeals) ? appliedDeals : [];

  const lines = {};
  list.forEach((it) => {
    const regular = priceLineItem(it);
    lines[it.id] = { regularCents: regular, finalCents: regular, dealRef: null };
  });

  const deals = instances.map((inst) => {
    const deal = findDealById(inst?.dealId);
    const status = {
      id: inst?.id,
      dealId: inst?.dealId,
      deal,
      lineIds: [],
      units: 0,
      active: false,
      reason: null, // why it isn't active yet: "service" | "need_more" | "incomplete" | "unknown"
      needed: 0,
      savingsCents: 0,
    };
    // a deal that just opens a combo (deal.comboId) is never a coupon
    if (!deal || !deal.active || deal.comboId) {
      status.reason = "unknown";
      return status;
    }

    // Lines tagged with this coupon that really match one of its items.
    const linked = list.filter((it) => {
      if (it?.deal?.ref !== inst.id) return false;
      return itemMatchesDealSlot(dealSlotConfig(deal, it.deal.slot), it);
    });
    status.lineIds = linked.map((it) => it.id);
    status.units = linked.reduce((n, it) => n + unitsOf(it), 0);

    if (!dealAllowsService(deal, service)) {
      status.reason = "service";
      return status;
    }

    if (deal.mode === "bundle") {
      const slots = deal.items || [];
      const bySlot = {};
      linked.forEach((it) => {
        if (!bySlot[it.deal.slot]) bySlot[it.deal.slot] = it;
      });
      const missing = slots.filter((k) => !bySlot[k]);
      if (missing.length) {
        status.reason = "incomplete";
        status.needed = missing.length;
        return status;
      }
      // One unit of each slot belongs to the bundle; any extra quantity on a
      // slot's line is charged at its normal per-unit price.
      const parts = slots.map((k) => {
        const it = bySlot[k];
        const qty = unitsOf(it);
        const regularLine = lines[it.id].regularCents;
        const regularUnit = Math.round(regularLine / qty);
        const extrasUnit = Math.round(dealLineExtras(deal.build[k], { ...it, qty: 1 }));
        return { it, qty, regularLine, regularUnit, extrasUnit };
      });
      const regularBundle = parts.reduce((s, p) => s + p.regularUnit, 0);
      const dealBundle = (Number(deal.price) || 0) + parts.reduce((s, p) => s + p.extrasUnit, 0);
      if (dealBundle >= regularBundle) {
        status.active = true; // valid, it just doesn't save anything
        return status;
      }
      // Spread the deal's base price evenly over the slots, rounded up, with
      // the last slot taking whatever's left ($29.99 -> 10.00/10.00/9.99),
      // then add each slot's own extras.
      const base = Number(deal.price) || 0;
      const share = Math.ceil(base / parts.length);
      parts.forEach((p, i) => {
        const isLast = i === parts.length - 1;
        const unitDeal = (isLast ? base - share * (parts.length - 1) : share) + p.extrasUnit;
        const final = unitDeal + (p.regularLine - p.regularUnit);
        lines[p.it.id].finalCents = final;
        lines[p.it.id].dealRef = inst.id;
        status.savingsCents += p.regularLine - final;
      });
      status.active = true;
      return status;
    }

    // "list" deals: priced per unit.
    const minQty = deal.minQty || 1;
    if (status.units < minQty) {
      status.reason = "need_more";
      status.needed = minQty - status.units;
      return status;
    }
    let budget = deal.maxQty != null ? deal.maxQty : Infinity; // units still allowed the deal price
    linked.forEach((it) => {
      if (budget <= 0) return;
      const qty = unitsOf(it);
      const dealUnits = Math.min(qty, budget);
      budget -= dealUnits;
      const regularLine = lines[it.id].regularCents;
      const regularUnit = regularLine / qty;
      const extrasPerUnit = dealLineExtras(dealSlotConfig(deal, it.deal.slot), it) / qty;
      const dealLine = Math.round(
        dealUnits * Math.min(regularUnit, (Number(deal.price) || 0) + extrasPerUnit) +
          (qty - dealUnits) * regularUnit
      );
      const final = Math.min(regularLine, dealLine);
      lines[it.id].finalCents = final;
      lines[it.id].dealRef = inst.id;
      status.savingsCents += regularLine - final;
    });
    status.active = true;
    return status;
  });

  const regularSubtotalCents = list.reduce((s, it) => s + lines[it.id].regularCents, 0);
  const subtotalCents = list.reduce((s, it) => s + lines[it.id].finalCents, 0);
  return {
    lines,
    deals,
    regularSubtotalCents,
    subtotalCents,
    savingsCents: regularSubtotalCents - subtotalCents,
  };
}
