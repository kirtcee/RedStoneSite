// utils/quickAddCatalog.js
//
// Items that can go straight into the cart with one tap (no choices to
// make), used by the delivery-minimum popup to suggest things that get an
// order over the minimum. Each `item` is exactly what the matching builder
// would add, so pricing and the kitchen treat it like any other line.
import { priceLineItem } from "../components/Pricing";

const side = (sideName, size, pricingSize, img) => ({
  key: `side-${sideName}-${size || "one"}`,
  label: size ? `${sideName} (${size})` : sideName,
  img,
  item: {
    type: "side",
    name: size ? `${sideName} (${pricingSize})` : sideName,
    side: sideName,
    size: size || null,
    qty: 1,
    summary: `1 × ${sideName}${size ? ` (${size})` : ""}`,
  },
});

const drink = (label, categoryId, categoryLabel, itemLabel, img) => ({
  key: `drink-${categoryId}-${itemLabel}`,
  label,
  img,
  item: {
    type: "drinks-dips",
    categoryId,
    categoryLabel,
    items: [{ label: itemLabel, qty: 1 }],
    summary: `${categoryLabel}: ${itemLabel} × 1`,
    qty: 1,
  },
});

export const QUICK_ADD_ITEMS = [
  side("Garlic Bread", null, null, "/images/sides/garlic-bread.jpg"),
  side("Cheesy Garlic Bread", null, null, "/images/sides/cheesy-garlic-bread.jpg"),
  side("French Fries", "Regular", "Medium", "/images/sides/fries.jpg"),
  side("French Fries", "Large", "Large", "/images/sides/fries.jpg"),
  side("Poutine", "Regular", "Medium", "/images/sides/poutine.jpg"),
  side("Poutine", "Large", "Large", "/images/sides/poutine.jpg"),
  side("Onion Rings", "Regular", "Medium", "/images/sides/onion-rings.jpg"),
  side("Shawarma Poutine", "Regular", "Medium", "/images/sides/shawarma-poutine.jpg"),
  drink("Coke 2L", "twoLiters", "2L Bottles", "Coke", "/images/drinks/2l.jpg"),
  drink("Pepsi 2L", "twoLiters", "2L Bottles", "Pepsi", "/images/drinks/2l.jpg"),
  drink("Coke Can", "cans", "Cans", "Coke", "/images/drinks/cans.jpg"),
  drink("Garlic Dip", "dips", "Dips", "Garlic", "/images/dips/garlic.png"),
].map((q) => ({ ...q, priceCents: priceLineItem(q.item) }));

// Up to `count` suggestions for an order that's `shortCents` away from a
// minimum: first the cheapest items that cover the whole gap on their own
// (marked coversGap), then the biggest of the rest.
export function suggestQuickAdds(shortCents, count = 6) {
  const items = QUICK_ADD_ITEMS.filter((q) => q.priceCents > 0);
  const covering = items
    .filter((q) => q.priceCents >= shortCents)
    .sort((a, b) => a.priceCents - b.priceCents)
    .slice(0, 4)
    .map((q) => ({ ...q, coversGap: true }));
  const rest = items
    .filter((q) => q.priceCents < shortCents)
    .sort((a, b) => b.priceCents - a.priceCents);
  return [...covering, ...rest].slice(0, count);
}
