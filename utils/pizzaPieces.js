// utils/pizzaPieces.js
//
// "Piece placing" for the pizza builder: works out where each piece of a
// topping goes on the pizza. Pure math, no drawing — PizzaBuilder.js draws
// the result on its canvas.
//
// How it stays consistent:
// - Every topping gets its own fixed random sequence (seeded from its name),
//   so pepperoni always lands in the same spots, and adding mushrooms never
//   moves the pepperoni.
// - Positions are generated in order, each new one picked to be as far from
//   the earlier ones as possible. So the first 60% of the list is already
//   evenly spread: Light = first 60%, Normal = first 100%, Extra = all 160%.
//   Going Light -> Normal -> Extra only ADDS pieces; none jump around.
// - Halves use the same positions, just the ones on that side, so switching
//   whole <-> half keeps the remaining pieces where they were.
//
// All coordinates are on a 300 x 300 pizza (the size of the layer images).

export const PIZZA_CENTER = { x: 151, y: 152 }; // centre of the sauce circle
export const SAUCE_RADIUS = 125; // pieces' centres stay inside this, minus a margin

export const AMOUNT_FACTOR = { Light: 0.6, Normal: 1, Extra: 1.6 };
const MAX_FACTOR = 1.6;

// Small, fast seeded random number generator (mulberry32)
function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Full ordered list of pieces for a topping (enough for Extra), cached.
const layoutCache = new Map();
function getLayout(topping, art) {
  const key = `${topping}|${art.size}|${art.count}|${art.sprites.length}`;
  if (layoutCache.has(key)) return layoutCache.get(key);

  const rand = makeRandom(hashString(topping));
  const total = Math.ceil(art.count * MAX_FACTOR);
  const radius = SAUCE_RADIUS - art.size * 0.45;
  const pieces = [];

  for (let i = 0; i < total; i++) {
    // "Best candidate": try a few random spots, keep the one farthest from
    // the pieces already placed. Gives an even, natural-looking spread.
    let best = null;
    let bestDist = -1;
    const tries = 30;
    for (let k = 0; k < tries; k++) {
      const ang = rand() * Math.PI * 2;
      const r = radius * Math.sqrt(rand());
      const x = PIZZA_CENTER.x + Math.cos(ang) * r;
      const y = PIZZA_CENTER.y + Math.sin(ang) * r;
      let nearest = Infinity;
      for (const p of pieces) {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < nearest) nearest = d;
      }
      if (nearest > bestDist) {
        bestDist = nearest;
        best = { x, y };
      }
    }
    pieces.push({
      x: best.x,
      y: best.y,
      sprite: Math.floor(rand() * art.sprites.length),
      rotation: art.rotate === false ? 0 : rand() * Math.PI * 2,
      scale: 0.9 + rand() * 0.2,
      flip: rand() < 0.5,
    });
  }

  layoutCache.set(key, pieces);
  return pieces;
}

/**
 * Pieces to draw for one topping.
 * @param {string} topping   e.g. "Pepperoni"
 * @param {object} art       entry from utils/pizzaToppingArt.js
 * @param {"full"|"left"|"right"} placement
 * @param {"Light"|"Normal"|"Extra"} amount
 * @returns {Array<{id,x,y,sprite,rotation,scale,flip}>}  id is stable per piece
 */
export function getPieces(topping, art, placement = "full", amount = "Normal") {
  const layout = getLayout(topping, art);
  const n = Math.round(art.count * (AMOUNT_FACTOR[amount] || 1));
  const out = [];
  // keep pieces fully on their side of the middle line for halves
  const gap = art.size * 0.35;
  for (let i = 0; i < n && i < layout.length; i++) {
    const p = layout[i];
    if (placement === "left" && p.x > PIZZA_CENTER.x - gap) continue;
    if (placement === "right" && p.x < PIZZA_CENTER.x + gap) continue;
    out.push({ id: `${topping}#${i}`, ...p });
  }
  return out;
}
