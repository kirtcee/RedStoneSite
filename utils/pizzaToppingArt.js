// utils/pizzaToppingArt.js
//
// Art settings for the pizza builder's "piece placing" toppings
// (see utils/pizzaPieces.js). Each topping is drawn by scattering small
// single-piece images over the pizza, instead of one full-pizza layer image.
//
//   sprites: piece images in /public/pizza_toppings (2+ variations look more
//            natural; each piece picks one at random, but always the same one)
//   size:    piece width on a 300px-wide pizza (all art is scaled to fit)
//   count:   how many pieces a NORMAL whole pizza gets. Light/Extra and
//            left/right halves are worked out from this automatically.
//   rotate:  false for pieces with a fixed "up" (e.g. baked-in shadows)
//
// To swap in new art for a topping: drop the files into
// /public/pizza_toppings and update its entry. Toppings NOT listed here
// fall back to the old full-pizza layer images in /public/pizza_layers.
//
// The current sprites are placeholders cut out of the old layer images.

export const TOPPING_ART = {
  "Anchovies": { sprites: ["anchovies-1.png", "anchovies-2.png", "anchovies-3.png", "anchovies-4.png"], size: 32.5, count: 35 },
  "BBQ Chicken": { sprites: ["bbq-chicken-1.png", "bbq-chicken-2.png", "bbq-chicken-3.png", "bbq-chicken-4.png"], size: 19.0, count: 61 },
  "Bacon Crumble": { sprites: ["bacon-crumble-1.png", "bacon-crumble-2.png", "bacon-crumble-3.png", "bacon-crumble-4.png"], size: 13.0, count: 54 },
  "Beef": { sprites: ["beef-1.png", "beef-2.png", "beef-3.png", "beef-4.png"], size: 17.5, count: 62 },
  "Black Olives": { sprites: ["black-olives-1.png", "black-olives-2.png", "black-olives-3.png", "black-olives-4.png"], size: 15.0, count: 89 },
  "Broccoli": { sprites: ["broccoli-1.png", "broccoli-2.png", "broccoli-3.png", "broccoli-4.png"], size: 21.0, count: 56 },
  "Butter Chicken": { sprites: ["butter-chicken-1.png", "butter-chicken-2.png", "butter-chicken-3.png", "butter-chicken-4.png"], size: 17.0, count: 61 },
  "Coriander": { sprites: ["coriander-1.png", "coriander-2.png", "coriander-3.png", "coriander-4.png"], size: 10.5, count: 78 },
  "Corn": { sprites: ["corn-1.png", "corn-2.png", "corn-3.png", "corn-4.png"], size: 12.0, count: 164 },
  "Feta Cheese": { sprites: ["feta-cheese-1.png", "feta-cheese-2.png", "feta-cheese-3.png", "feta-cheese-4.png"], size: 22.0, count: 100 },
  "Fresh Garlic": { sprites: ["fresh-garlic-1.png", "fresh-garlic-2.png", "fresh-garlic-3.png", "fresh-garlic-4.png"], size: 11.0, count: 81 },
  "Ginger": { sprites: ["ginger-1.png", "ginger-2.png", "ginger-3.png", "ginger-4.png"], size: 11.0, count: 81 },
  "Green Olives": { sprites: ["green-olives-1.png", "green-olives-2.png", "green-olives-3.png", "green-olives-4.png"], size: 15.0, count: 89 },
  "Green Pepper": { sprites: ["green-pepper-1.png", "green-pepper-2.png", "green-pepper-3.png", "green-pepper-4.png"], size: 45.0, count: 20 },
  "Grilled Chicken": { sprites: ["grilled-chicken-1.png", "grilled-chicken-2.png", "grilled-chicken-3.png", "grilled-chicken-4.png"], size: 19.0, count: 61 },
  "Halal Pepperoni": { sprites: ["halal-pepperoni-1.png", "halal-pepperoni-2.png", "halal-pepperoni-3.png", "halal-pepperoni-4.png"], size: 27.0, count: 46 },
  "Ham": { sprites: ["ham-1.png", "ham-2.png", "ham-3.png", "ham-4.png"], size: 9.0, count: 84 },
  "Hot Italian Sausage": { sprites: ["hot-italian-sausage-1.png", "hot-italian-sausage-2.png", "hot-italian-sausage-3.png", "hot-italian-sausage-4.png"], size: 26.0, count: 23 },
  "Hot Peppers": { sprites: ["hot-peppers-1.png", "hot-peppers-2.png", "hot-peppers-3.png", "hot-peppers-4.png"], size: 24.0, count: 58 },
  "Jalapeno": { sprites: ["jalapeno-1.png", "jalapeno-2.png", "jalapeno-3.png", "jalapeno-4.png"], size: 21.0, count: 49 },
  "Mild Sausage": { sprites: ["mild-sausage-1.png", "mild-sausage-2.png", "mild-sausage-3.png", "mild-sausage-4.png"], size: 13.0, count: 54 },
  "Mushroom": { sprites: ["mushroom-1.png", "mushroom-2.png", "mushroom-3.png", "mushroom-4.png"], size: 32.0, count: 25 },
  "Onion": { sprites: ["onion-1.png", "onion-2.png", "onion-3.png", "onion-4.png"], size: 11.0, count: 178 },
  "Paneer": { sprites: ["paneer-1.png", "paneer-2.png", "paneer-3.png", "paneer-4.png"], size: 18.5, count: 58 },
  "Pepperoni": { sprites: ["pepperoni-1.png", "pepperoni-2.png", "pepperoni-3.png", "pepperoni-4.png"], size: 35.0, count: 35 },
  "Pickle": { sprites: ["pickle-1.png", "pickle-2.png", "pickle-3.png", "pickle-4.png"], size: 26.0, count: 26 },
  "Pineapple": { sprites: ["pineapple-1.png", "pineapple-2.png", "pineapple-3.png", "pineapple-4.png"], size: 21.5, count: 38 },
  "Real Bacon": { sprites: ["real-bacon-1.png", "real-bacon-2.png", "real-bacon-3.png", "real-bacon-4.png"], size: 17.0, count: 98 },
  "Roasted Red Pepper": { sprites: ["roasted-red-pepper-1.png", "roasted-red-pepper-2.png", "roasted-red-pepper-3.png", "roasted-red-pepper-4.png"], size: 19.5, count: 82 },
  "Salami": { sprites: ["salami-1.png", "salami-2.png", "salami-3.png", "salami-4.png"], size: 46.0, count: 16 },
  "Shahi Paneer": { sprites: ["shahi-paneer-1.png", "shahi-paneer-2.png", "shahi-paneer-3.png", "shahi-paneer-4.png"], size: 18.5, count: 58 },
  "Shawarma Chicken": { sprites: ["shawarma-chicken-1.png", "shawarma-chicken-2.png", "shawarma-chicken-3.png", "shawarma-chicken-4.png"], size: 33.5, count: 42 },
  "Spinach": { sprites: ["spinach-1.png", "spinach-2.png", "spinach-3.png", "spinach-4.png"], size: 31.0, count: 46 },
  "Sumac Seasoning": { sprites: ["sumac-seasoning-1.png", "sumac-seasoning-2.png", "sumac-seasoning-3.png", "sumac-seasoning-4.png"], size: 10.5, count: 78 },
  "Sun Dried Tomato": { sprites: ["sun-dried-tomato-1.png", "sun-dried-tomato-2.png", "sun-dried-tomato-3.png", "sun-dried-tomato-4.png"], size: 13.0, count: 114 },
  "Tomato": { sprites: ["tomato-1.png", "tomato-2.png", "tomato-3.png", "tomato-4.png"], size: 16.5, count: 63 },
};

// Toppings that share another topping's art until they get their own
export const TOPPING_ART_ALIASES = {
  "Halal Chicken": "Grilled Chicken", // no graphic of its own yet
};

export function getToppingArt(topping) {
  return TOPPING_ART[topping] || TOPPING_ART[TOPPING_ART_ALIASES[topping]] || null;
}
