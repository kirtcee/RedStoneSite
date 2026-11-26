// utils/drinkCatalog.js
//
// Every drink and dip sold, per menu category. Shared by the menu builder,
// the cart, quick-add suggestions and the server's pricing (components/
// Pricing.js only prices labels listed here, so a drink that's removed from
// this list can't be ordered any more, even from an old cart).
//
// `img` is a transparent cut-out made by scripts/drink-images.py. `mm` is the
// drink's real height, so the builder can show them at their true sizes
// next to each other (a Red Bull a bit taller than a can, and so on).
const CAN_MM = 122;

export const DRINK_CATEGORIES = {
  twoLiters: {
    label: "2L Bottles",
    tile: "/images/drinks/tile-2l.jpg",
    options: [
      { label: "Coke", img: "/images/drinks/2l-coke.webp", mm: 330 },
      { label: "Pepsi", img: "/images/drinks/2l-pepsi.webp", mm: 330 },
      { label: "Gingerale", img: "/images/drinks/2l-canada-dry.webp", mm: 330 },
    ],
  },
  cans: {
    label: "Cans",
    tile: "/images/drinks/tile-cans.jpg",
    options: [
      { label: "Coke", img: "/images/drinks/can-coke.webp", mm: CAN_MM },
      { label: "Coke Zero", img: "/images/drinks/can-coke-zero.webp", mm: CAN_MM },
      { label: "Diet Coke", img: "/images/drinks/can-diet-coke.webp", mm: CAN_MM },
      { label: "Pepsi", img: "/images/drinks/can-pepsi.webp", mm: CAN_MM },
      { label: "Diet Pepsi", img: "/images/drinks/can-diet-pepsi.webp", mm: CAN_MM },
      { label: "Sprite", img: "/images/drinks/can-sprite.webp", mm: CAN_MM },
      { label: "Gingerale", img: "/images/drinks/can-canada-dry.webp", mm: CAN_MM },
      { label: "Dr Pepper", img: "/images/drinks/can-dr-pepper.webp", mm: CAN_MM },
      { label: "Mug Root Beer", img: "/images/drinks/can-mug-root-beer.webp", mm: CAN_MM },
      { label: "Brisk Iced Tea", img: "/images/drinks/can-brisk.webp", mm: CAN_MM },
      { label: "Orange Crush", img: "/images/drinks/can-crush-orange.webp", mm: CAN_MM },
      { label: "Grape Crush", img: "/images/drinks/can-crush-grape.webp", mm: CAN_MM },
      { label: "Crush Cream Soda", img: "/images/drinks/can-crush-cream-soda.webp", mm: CAN_MM },
    ],
  },
  other: {
    label: "Other Drinks",
    tile: "/images/drinks/tile-other.jpg",
    options: [
      { label: "Fruit Punch Gatorade", img: "/images/drinks/gatorade-red.webp", mm: 215, cents: 250 },
      { label: "Lemon Lime Gatorade", img: "/images/drinks/gatorade-yellow.webp", mm: 215, cents: 250 },
      { label: "Orange Gatorade", img: "/images/drinks/gatorade-orange.webp", mm: 215, cents: 250 },
      { label: "Cool Blue Gatorade", img: "/images/drinks/gatorade-blue.webp", mm: 215, cents: 250 },
      // Gatorade Zero (scripts/gatorade-zero-images.py), same price as Gatorade
      { label: "Grape Gatorade Zero", img: "/images/drinks/gatorade-zero-grape.webp", mm: 215, cents: 250 },
      { label: "Berry Gatorade Zero", img: "/images/drinks/gatorade-zero-berry.webp", mm: 215, cents: 250 },
      { label: "Glacier Cherry Gatorade Zero", img: "/images/drinks/gatorade-zero-glacier-cherry.webp", mm: 215, cents: 250 },
      { label: "Lemon Lime Gatorade Zero", img: "/images/drinks/gatorade-zero-lemon-lime.webp", mm: 215, cents: 250 },
      { label: "Red Bull", img: "/images/drinks/red-bull.webp", mm: 134, cents: 350 },
      { label: "Apple Juice", img: "/images/drinks/apple-juice.webp", mm: 170, cents: 175 },
      { label: "Water", img: "/images/drinks/water.webp", mm: 205, cents: 150 },
    ],
  },
  dips: {
    label: "Dips",
    tile: "/images/dips/dips-tile.jpg",
    options: [
      { label: "Blue Cheese", img: "/images/dips/blue-cheese-cut.webp", mm: 60 },
      { label: "Garlic", img: "/images/dips/garlic-cut.webp", mm: 60 },
      { label: "Ranch", img: "/images/dips/ranch-cut.webp", mm: 60 },
      { label: "Marinara", img: "/images/dips/marinara-cut.webp", mm: 60 },
    ],
  },
};

// "coke zero", "Coke Zero" and "redbull" all match (older carts saved
// lowercase labels).
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function findDrink(categoryId, label) {
  const cat = DRINK_CATEGORIES[categoryId];
  if (!cat) return null;
  const key = norm(label);
  return cat.options.find((o) => norm(o.label) === key) || null;
}

// Cart thumbnails show up to this many of the picked drinks side by side.
export const THUMB_MAX = { cans: 4, twoLiters: 3, other: 3, dips: 3 };

export function drinkImage(categoryId, label) {
  return findDrink(categoryId, label)?.img || DRINK_CATEGORIES[categoryId]?.tile || "/images/menu_drinks.png";
}
