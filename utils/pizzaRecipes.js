// utils/pizzaRecipes.js
// The named recipe pizzas on the menu. Shared by the menu cards and by
// Pricing.js, which uses each recipe's toppings as a price floor when a
// customer customizes one (removing toppings never makes it cheaper).

export const SIGNATURE_PIZZAS = [
  { name: "Greek",           toppings: ["Onion", "Black Olives", "Tomato", "Spinach", "Feta Cheese"] },
  { name: "Bourbon",         toppings: ["BBQ Chicken", "Onion", "Green Pepper", "BBQ Drizzle"], base: "BBQ Base" },
  { name: "Shawarma",        toppings: ["Shawarma Chicken", "Onion", "Pickle", "Tomato", "Sumac Seasoning"], base: "Garlic Base" },
  { name: "All-Star",        toppings: ["Pepperoni", "Mushroom", "Real Bacon", "Green Pepper", "Onion"] },
  { name: "Butter Chicken",  toppings: ["Butter Chicken", "Green Pepper", "Onion", "Tomato", "Ginger", "Coriander"], base: "Butter Chicken Base" },
  { name: "Shahi Paneer",    toppings: ["Shahi Paneer", "Green Pepper", "Onion", "Tomato", "Ginger", "Coriander"], base: "Shahi Paneer Base" },
  { name: "Mexican",         toppings: ["Onion", "Beef", "Jalapeno", "Tomato"] },
  { name: "Loaded Veggie",   toppings: ["Green Pepper", "Mushroom", "Onion", "Tomato", "Corn", "Black Olives"] },
];

export const SPECIALTY_PIZZAS = [
  { name: "Deluxe",       toppings: ["Pepperoni", "Mushroom", "Green Pepper"] },
  { name: "Hawaiian",     toppings: ["Pineapple", "Bacon Crumble", "Ham"] },
  { name: "Veggie Lover", toppings: ["Mushroom", "Green Pepper", "Onion"] },
  { name: "Meat Lover",   toppings: ["Pepperoni", "Hot Italian Sausage", "Bacon Crumble"] },
  { name: "Canadian",     toppings: ["Pepperoni", "Mushroom", "Real Bacon"] },
];

export function findPizzaRecipe(name) {
  if (!name) return null;
  return (
    SIGNATURE_PIZZAS.find((p) => p.name === name) ||
    SPECIALTY_PIZZAS.find((p) => p.name === name) ||
    null
  );
}
