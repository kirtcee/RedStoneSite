// utils/availability.js
//
// Sold-out items. The kitchen switches items off on the kitchen screen
// (components/KitchenSoldOut.js); the list is stored in Firestore at
// settings/menu as { soldOut: ["wings", "side:Poutine", ...] }.
// The website reads it live (hooks/useSoldOut.js): sold-out items show
// "Sold Out" and can't be added. The server refuses orders containing them
// (utils/orderBuilder.js).
import { DRINK_CATEGORIES } from "./drinkCatalog";

const SIDES = ["French Fries", "Poutine", "Shawarma Poutine", "Onion Rings", "Cheesy Garlic Bread", "Garlic Bread"];
const SPECIALS = ["Panzerotti", "Pizza Sub", "Meatball Sub"];
const EXTRA_DIPS = []; // dips sold with pizzas that aren't in the drinks list (none now)

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const sideKey = (name) => `side:${name}`;
export const specialKey = (name) => `special:${name}`;
export const drinkKey = (categoryId, label) => `drink:${categoryId}:${norm(label)}`;
export const dipKey = (name) => `dip:${norm(name)}`;
export const WINGS_KEY = "wings";

// What the kitchen screen lists, grouped.
export const AVAILABILITY_GROUPS = [
  { title: "Wings", items: [{ key: WINGS_KEY, label: "Wings" }] },
  { title: "Sides", items: SIDES.map((s) => ({ key: sideKey(s), label: s })) },
  { title: "Special Menu", items: SPECIALS.map((s) => ({ key: specialKey(s), label: s })) },
  {
    title: "Dips",
    items: [...DRINK_CATEGORIES.dips.options.map((o) => o.label), ...EXTRA_DIPS].map((d) => ({ key: dipKey(d), label: d })),
  },
  ...["twoLiters", "cans", "other"].map((cat) => ({
    title: DRINK_CATEGORIES[cat].label,
    items: DRINK_CATEGORIES[cat].options.map((o) => ({ key: drinkKey(cat, o.label), label: o.label })),
  })),
];

const LABELS = Object.fromEntries(AVAILABILITY_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label])));
const ALL_KEYS = new Set(Object.keys(LABELS));
export const availabilityLabel = (key) => LABELS[key] || key;

export function readSoldOut(data) {
  const list = Array.isArray(data?.soldOut) ? data.soldOut : [];
  return list.filter((k) => typeof k === "string" && ALL_KEYS.has(k));
}

// Every availability key a cart line uses (combos: their parts too).
export function itemKeys(item, out = new Set()) {
  if (!item || typeof item !== "object") return out;
  switch (item.type) {
    case "wings":
      out.add(WINGS_KEY);
      break;
    case "side":
      if (item.side) out.add(sideKey(item.side));
      break;
    case "special":
      if (item.name) out.add(specialKey(item.name));
      break;
    case "drinks-dips":
      for (const d of Array.isArray(item.items) ? item.items : []) {
        if (!(Number(d?.qty) > 0)) continue;
        out.add(item.categoryId === "dips" ? dipKey(d.label) : drinkKey(item.categoryId, d.label));
      }
      break;
    case "drink":
      if (item.categoryId && item.label) out.add(drinkKey(item.categoryId, item.label));
      break;
    default:
      break;
  }
  // dips chosen inside wings, specials and pizzas: { "Blue Cheese": 2 } or [{ label, qty }]
  const dips = item.dips;
  if (Array.isArray(dips)) dips.forEach((d) => Number(d?.qty) > 0 && out.add(dipKey(d.label)));
  else if (dips && typeof dips === "object") Object.entries(dips).forEach(([k, v]) => Number(v) > 0 && out.add(dipKey(k)));
  // combos and coupons keep their parts in meta.items
  const parts = item.meta?.items;
  if (parts && typeof parts === "object") Object.values(parts).forEach((p) => itemKeys(p, out));
  return out;
}

// Names of the sold-out things in a cart line ([] if none).
export function soldOutIn(item, soldOut) {
  const set = soldOut instanceof Set ? soldOut : new Set(soldOut || []);
  if (!set.size) return [];
  return [...itemKeys(item)].filter((k) => set.has(k)).map(availabilityLabel);
}
