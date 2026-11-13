import React, { useState, useEffect, useRef } from "react";
import { priceLineItem, formatMoney, weightedToppingCount, PRICES, sizeMapUIToPrice, PREMIUM_TOPPINGS, describePizzaFull } from "./Pricing";
import { useCart } from "./CartSystem";

export default function PizzaBuilder({
  presetToppings = [],
  allowedToppings = null,
  initialData = {},
  pizzaName = "",
  onSave = () => {},
  includedToppings = null, // informational only — e.g. 3 for combo pizzas ("3 included, extra cost more")
  lockedSize = null,
  allowSizeChoice = true,
  forceResponsiveStack = false
}) {
  const { addItem } = useCart();
  const drawVersionRef = useRef(0);
  const canvasRef = useRef(null);

  // ===== refs for scroll control =====
  const rootRef = useRef(null);

  // Mobile "pizza peek": tapping the strip opens the full pizza
  const [pizzaZoomSrc, setPizzaZoomSrc] = useState(null);
  const openPizzaZoom = () => {
    try {
      const c = canvasRef.current;
      if (c) setPizzaZoomSrc(c.toDataURL("image/png"));
    } catch {}
  };

  // ===== Responsive: stack the two columns below the builder's natural
  // 846px width instead of overflowing/forcing horizontal scroll. Mirrors
  // the same isNarrow pattern already used in WingsBuilder.js. =====
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isNarrow = forceResponsiveStack || vw < 900;

  // ===== Theme (matches the menu/deals page cream-box makeover) =====
  const MAROON = "#8b1a1a";
  const LIGHT_BORDER = "var(--menu-box-border)"; // thin dark-brown-tan border (--menu-box-border)
  const LIGHT_BG = "var(--menu-box-bg)";     // cream box fill (--menu-box-bg)
  const LIGHT_RED_INACTIVE = "#ffb0b0"; // a tad darker
  const TEXT_BROWN = "var(--text-brown)";   // body text color inside the boxes
  const BOX_RADIUS = ".1875rem";
  // ===== Layout constants to match your screenshots =====
const PB_TOTAL = 846;           // total builder width
const PB_GAP = 16;              // gap between columns

// header paddings (your devtools showed ~7.6 / ~9.4)
const HDR_PAD_Y = 7.6;          // top/bottom
const HDR_PAD_X = 9.4;          // left/right

// inner blue text areas you wanted
const LEFT_INNER  = 453;        // left header text width
const RIGHT_INNER = 334;        // right header text width

// add ~2px for the Section container border (1px each side) + paddings
const RIGHT_COL = Math.round(RIGHT_INNER + 2 * HDR_PAD_X + 2); // ≈ 355
const LEFT_COL  = PB_TOTAL - PB_GAP - RIGHT_COL;               // ≈ 475


  // ===== State =====
  const [selectedSize, setSelectedSize] = useState(initialData.size || "12");
  const [selectedCrust, setSelectedCrust] = useState(initialData.crust || "Original Hand Tossed");
  const [sauceEnabled, setSauceEnabled] = useState(initialData.sauceEnabled ?? true);
  const [selectedSauce, setSelectedSauce] = useState(initialData.sauce || "Pizza Sauce");
  const [sauceAmount, setSauceAmount] = useState(initialData.sauceAmount || "Normal");
  // Cheese type is a single choice — regular, dairy-free, or none — rather
  // than two independently-toggleable booleans, so the two can't both be on
  // at once. Coverage/amount selectors below are shared by regular and
  // dairy-free cheese alike (there's no separate dairy-free pizza artwork).
  const [cheeseType, setCheeseType] = useState(
    initialData.dairyFreeCheese
      ? "dairyFree"
      : initialData.cheeseIncluded === false
      ? "none"
      : "regular"
  );
  const cheeseIncluded = cheeseType !== "none";
  const dairyFreeCheese = cheeseType === "dairyFree";
  const [cheeseCoverage, setCheeseCoverage] = useState(initialData.cheeseCoverage || "full");
  const [cheeseAmount, setCheeseAmount] = useState(initialData.cheeseAmount || "Normal");
  const [secondCoverage, setSecondCoverage] = useState(initialData.secondCoverage || null);
  const [secondAmount, setSecondAmount] = useState(initialData.secondAmount || "Normal");
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [toppingPlacement, setToppingPlacement] = useState({});
  const [toppingAmount, setToppingAmount] = useState({});

  // Named recipe pizzas (Signature/Specialty) start with just their own
  // toppings shown — the full catalog is one click away via "Add More
  // Toppings" instead of always being dumped on screen. Captured once at
  // mount (not live off selectedToppings) so unchecking a recipe topping
  // doesn't make its own checkbox disappear.
  const [toppingsExpanded, setToppingsExpanded] = useState(false);
  const [recipeToppings] = useState(() => {
    const t =
      Array.isArray(initialData.toppings) && initialData.toppings.length > 0
        ? initialData.toppings
        : Array.isArray(presetToppings) && presetToppings.length > 0
        ? presetToppings
        : [];
    return new Set(t);
  });
  const isRecipePizza = !!pizzaName;
  const [bake, setBake] = useState(initialData.bake || "normal");
  const [oregano, setOregano] = useState(initialData.oregano || "without");
  const [crushedRedPepper, setCrushedRedPepper] = useState(initialData.crushedRedPepper || "without");
  const [coriander, setCoriander] = useState(initialData.coriander || "without");
  const [ginger, setGinger] = useState(initialData.ginger || "without");
  const [garlicCrust, setGarlicCrust] = useState(initialData.garlicCrust || "without");
  const [qty, setQty] = useState(initialData.qty || 1);

  // Dips (with images)
  const DIP_DEFS = [
    { key: "garlic",     name: "Signature Garlic Dip", img: "/images/dips/garlic.png" },
    { key: "ranch",      name: "Ranch",                img: "/images/dips/ranch.png" },
    { key: "marinara",   name: "Marinara",             img: "/images/dips/marinara.png" },
    { key: "blueCheese", name: "Blue Cheese",          img: "/images/dips/blue-cheese.png" },
  ];
  const initialDips = DIP_DEFS.reduce((acc, d) => { acc[d.key] = initialData.dips?.[d.key] || 0; return acc; }, {});
  const [dipsQty, setDipsQty] = useState(initialDips);

  // ===== Data =====
  const sizes = [
    { size: "10", label: "Small",  px: 50 },
    { size: "12", label: "Medium", px: 65 },
    { size: "14", label: "Large",  px: 80 },
    { size: "16", label: "X-Large",px: 95 }
  ];

  // Gluten Free only makes sense for true freeform BYO — not inside a combo (locked
  // size) and not while customizing a named Signature/Specialty recipe.
  const glutenFreeAvailable = !lockedSize && !pizzaName;
  const crustOptions = glutenFreeAvailable
    ? ["Thin Crust", "Original Hand Tossed", "Thick Crust", "Gluten Free"]
    : ["Thin Crust", "Original Hand Tossed", "Thick Crust"];
  const isGlutenFree = selectedCrust === "Gluten Free";
  const sauceOptions = ["Pizza Sauce", "Garlic Base", "BBQ Base", "Butter Chicken Base", "Shahi Paneer Base"];

  const coverageIcons = [
    { value: "left",  label: "◐" },
    { value: "full",  label: "⬤" },
    { value: "right", label: "◑" }
  ];

  const isSpecialToppingAllowed = (topping) => {
    const rules = {
      "BBQ Chicken": ["Bourbon"],
      "BBQ Drizzle": ["Bourbon"],
      "Sumac Seasoning": ["Shawarma"],
      "Ginger": ["Butter Chicken", "Shahi Paneer"],
      "Coriander": ["Butter Chicken", "Shahi Paneer"],
      "Butter Chicken": ["Butter Chicken"],
      "Shahi Paneer": ["Shahi Paneer"]
    };
    return !rules[topping] || rules[topping].includes(pizzaName);
  };

  useEffect(() => { if (lockedSize) setSelectedSize(lockedSize); }, [lockedSize]);

  // Gluten Free comes in one fixed 13" size — lock to it while selected, and drop
  // back to a normal default size when the customer switches to a different crust.
  useEffect(() => {
    if (isGlutenFree) {
      setSelectedSize("gf");
    } else {
      setSelectedSize((prev) => (prev === "gf" ? "12" : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlutenFree]);

  const handleToppingToggle = (topping) => {
    const isSelected = selectedToppings.includes(topping);
    if (isSelected) {
      setSelectedToppings(selectedToppings.filter((t) => t !== topping));
      const newPlacement = { ...toppingPlacement };
      const newAmount = { ...toppingAmount };
      delete newPlacement[topping];
      delete newAmount[topping];
      setToppingPlacement(newPlacement);
      setToppingAmount(newAmount);
    } else {
      setSelectedToppings([...selectedToppings, topping]);
      setToppingPlacement({ ...toppingPlacement, [topping]: "full" });
      setToppingAmount({ ...toppingAmount, [topping]: "Normal" });
    }
  };

  // Seed toppings/preset
  useEffect(() => {
    const toppingsToApply =
      Array.isArray(initialData.toppings) && initialData.toppings.length > 0
        ? initialData.toppings
        : Array.isArray(presetToppings) && presetToppings.length > 0
        ? presetToppings
        : null;

    if (toppingsToApply) {
      setSelectedToppings(toppingsToApply);
      const newPlacement = {};
      const newAmount = {};
      toppingsToApply.forEach((t) => {
        newPlacement[t] = initialData.toppingPlacement?.[t] || "full";
        newAmount[t] = initialData.toppingAmount?.[t] || "Normal";
      });
      setToppingPlacement(newPlacement);
      setToppingAmount(newAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas draw
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const currentVersion = ++drawVersionRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imageQueue = [];

    imageQueue.push("/pizza_layers/No-Base.png");

    if (sauceEnabled) {
      const sauceMap = {
        "Pizza Sauce": "Pizza-Sauce.png",
        "Garlic Base": "Garlic-Base.png",
        "BBQ Base": "BBQ-Base.png",
        "Butter Chicken Base": "Butter-Chicken-Base.png",
        "Shahi Paneer Base": "Shahi-Paneer-Base.png"
      };
      const selectedSauceFile = sauceMap[selectedSauce];
      if (selectedSauceFile) imageQueue.push(`/pizza_layers/${selectedSauceFile}`);
    }

    if (cheeseIncluded) {
      const addBaseCheeseImage = (filename) => imageQueue.push(`/pizza_layers/${filename}`);
      if (cheeseCoverage === "left" || cheeseCoverage === "right") {
        const leftAmount  = cheeseCoverage === "left"  ? cheeseAmount : secondAmount || cheeseAmount;
        const rightAmount = cheeseCoverage === "right" ? cheeseAmount : secondAmount || cheeseAmount;

        if (leftAmount  === "None")  addBaseCheeseImage("Base-Cheese-None-Left.png");
        else if (leftAmount === "Light") addBaseCheeseImage("Base-Cheese-Less-Left.png");
        else addBaseCheeseImage("Base-Cheese-Left.png");

        if (rightAmount === "None") addBaseCheeseImage("Base-Cheese-None-Right.png");
        else if (rightAmount === "Light") addBaseCheeseImage("Base-Cheese-Less-Right.png");
        else addBaseCheeseImage("Base-Cheese-Right.png");
      } else {
        if (cheeseAmount === "None") addBaseCheeseImage("Base-Cheese-None.png");
        else if (cheeseAmount === "Light") addBaseCheeseImage("Base-Cheese-Less.png");
        else addBaseCheeseImage("Base-Cheese.png");
      }
    } else {
      imageQueue.push("/pizza_layers/Base-Cheese-None.png");
    }

    imageQueue.push("/pizza_layers/Crust.png");

    if (cheeseIncluded) {
      const addOverlay = (type, side) => { const suffix = side ? `-${side}` : ""; imageQueue.push(`/pizza_layers/${type}${suffix}.png`); };
      if (cheeseCoverage === "left" || cheeseCoverage === "right") {
        const leftAmount  = cheeseCoverage === "left"  ? cheeseAmount : secondAmount || cheeseAmount;
        const rightAmount = cheeseCoverage === "right" ? cheeseAmount : secondAmount || cheeseAmount;
        if (leftAmount  === "Extra")  addOverlay("Extra-Cheese",  "Left");
        if (leftAmount  === "Double") addOverlay("Double-Cheese", "Left");
        if (rightAmount === "Extra")  addOverlay("Extra-Cheese",  "Right");
        if (rightAmount === "Double") addOverlay("Double-Cheese", "Right");
      } else {
        if (cheeseAmount === "Extra")  addOverlay("Extra-Cheese");
        if (cheeseAmount === "Double") addOverlay("Double-Cheese");
      }
    }

    selectedToppings.forEach((topping) => {
      const placement = toppingPlacement[topping];
      const formatted = topping.replace(/\s+/g, "-");
      let filename = `/pizza_layers/${formatted}`;
      if (placement === "left") filename += "-Left.png";
      else if (placement === "right") filename += "-Right.png";
      else filename += ".png";
      imageQueue.push(filename);
    });

    let loaded = 0; const images = [];
    imageQueue.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (drawVersionRef.current !== currentVersion) return;
        images[i] = img; loaded++;
        if (loaded === imageQueue.length) images.forEach((im) => ctx.drawImage(im, 0, 0, canvas.width, canvas.height));
      };
    });
  }, [
    cheeseIncluded, cheeseAmount, cheeseCoverage, secondAmount, secondCoverage,
    selectedToppings, toppingPlacement, sauceEnabled, selectedSauce,
    isNarrow // canvas element moves between mobile peek and desktop column
  ]);

  const defaultMeats = [
    "Pepperoni","Real Bacon","Ham","Grilled Chicken","Shawarma Chicken","Halal Chicken",
    "BBQ Chicken","Butter Chicken","Shahi Paneer","Beef","Hot Italian Sausage","Mild Sausage",
    "Bacon Crumble","Anchovies","Salami","Halal Pepperoni"
  ].filter(isSpecialToppingAllowed);

  const defaultVeggies = [
    "Mushroom","Green Pepper","Onion","Pickle","Pineapple","Tomato","Hot Peppers",
    "Green Olives","Black Olives","Broccoli","Jalapeno","Sun Dried Tomato",
    "Spinach","Fresh Garlic","Roasted Red Pepper","Corn","Paneer","Feta Cheese",
    "Ginger","Coriander","Sumac Seasoning"
  ].filter(isSpecialToppingAllowed);

  const defaultDrizzles = ["BBQ Drizzle"].filter(isSpecialToppingAllowed);

  const meatsCatalog    = allowedToppings ? defaultMeats.filter((t) => allowedToppings.includes(t))    : defaultMeats;
  const veggiesCatalog  = allowedToppings ? defaultVeggies.filter((t) => allowedToppings.includes(t))  : defaultVeggies;
  const drizzlesCatalog = allowedToppings ? defaultDrizzles.filter((t) => allowedToppings.includes(t)) : defaultDrizzles;

  const collapseToRecipe = isRecipePizza && !toppingsExpanded;
  const meats    = collapseToRecipe ? meatsCatalog.filter((t) => recipeToppings.has(t))    : meatsCatalog;
  const veggies  = collapseToRecipe ? veggiesCatalog.filter((t) => recipeToppings.has(t))  : veggiesCatalog;
  const drizzles = collapseToRecipe ? drizzlesCatalog.filter((t) => recipeToppings.has(t)) : drizzlesCatalog;

  const currentWeightedCount = weightedToppingCount({
    toppings: selectedToppings,
    toppingPlacement,
    toppingAmount,
    cheeseIncluded,
    cheeseAmount,
    cheeseCoverage,
    secondAmount,
  });
  const showIncludedNotice = !!includedToppings;
  const isOverIncluded = showIncludedNotice && currentWeightedCount > includedToppings;
  const extraRateForNotice = (() => {
    const sizeKey = lockedSize === "slab" ? "slab" : sizeMapUIToPrice[String(selectedSize)] || String(selectedSize);
    return PRICES.byo[sizeKey]?.extra ?? 0;
  })();

  const currentItem = {
    type: "pizza-byo",
    size: String(selectedSize),
    crust: selectedCrust,
    toppings: selectedToppings,
    toppingPlacement,
    toppingAmount,
    cheeseIncluded,
    cheeseAmount,
    cheeseCoverage,
    secondAmount,
    dairyFreeCheese,
    dips: dipsQty,
    garlicCrust,
    qty,
  };
  const lineSubtotalCents = priceLineItem(currentItem);

  // ===== UI helpers =====
  const Divider = ({ style = {} }) => (
    <div
      style={{
        borderTop: `1px solid ${LIGHT_BORDER}`,
        width: "calc(100% - 2rem)",
        margin: "12px auto",
        ...style
      }}
    />
  );

const Section = ({ index, title, children }) => (
  <div style={{ marginBottom: "1.25rem", border: `1px solid ${LIGHT_BORDER}`, borderRadius: BOX_RADIUS, overflow: "hidden", background: LIGHT_BG, overflowAnchor: 'none' }}>
    <div className="pb-h">
      <div className="pb-h__inner">
        {index}. {title}
      </div>
    </div>
    <div style={{ padding: "1rem", background: LIGHT_BG }}>{children}</div>
  </div>
);

// Compact grouped column used by the Special Instructions section — a bold
// brown label over its radio options, laid out several-to-a-row with a
// vertical rule between (mirrors the reference's Bake/Cut/Oregano rows)
// instead of the old one-category-per-full-width-row stack.
const InstrGroup = ({ title, children }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <p
      style={{
        fontWeight: 900,
        marginBottom: "0.4rem",
        color: TEXT_BROWN,
        fontFamily: "var(--font-heading), Oswald, sans-serif",
        fontSize: ".85rem",
        textTransform: "uppercase",
        letterSpacing: ".3px",
      }}
    >
      {title}
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>{children}</div>
  </div>
);

const VRule = () => <div style={{ width: 1, alignSelf: "stretch", background: LIGHT_BORDER, margin: "0 1.25rem" }} />;


  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  // Shared by the desktop "Add To Order" button and the mobile sticky
  // bottom bar's button — both must build the exact same payload.
  const handleAddToOrder = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const payload = {
      type: "pizza-byo",
      // Left empty for a true build-your-own — display layers
      // compute a "Large 3 Topping Pizza"-style title from the
      // build itself. Named recipe pizzas keep their own name.
      pizzaName: pizzaName || "",
      size: String(selectedSize),
      crust: selectedCrust,
      toppings: selectedToppings.slice(),
      sauceEnabled,
      sauce: selectedSauce,
      sauceAmount,
      cheeseIncluded,
      cheeseCoverage,
      cheeseAmount,
      secondCoverage,
      secondAmount,
      dairyFreeCheese,
      toppingPlacement,
      toppingAmount,
      dipQty: dipsQty.garlic || 0, // legacy
      dips: dipsQty,
      bake,
      oregano,
      crushedRedPepper,
      coriander,
      ginger,
      garlicCrust,
      qty,
      summary: describePizzaFull({
        size: selectedSize,
        crust: selectedCrust,
        cheeseIncluded,
        cheeseCoverage,
        cheeseAmount,
        secondCoverage,
        secondAmount,
        dairyFreeCheese,
        sauceEnabled,
        sauce: selectedSauce,
        sauceAmount,
        toppings: selectedToppings,
        toppingPlacement,
        toppingAmount,
        dips: dipsQty,
        bake,
        oregano,
        crushedRedPepper,
        coriander,
        ginger,
        garlicCrust,
      }),
      lineSubtotalCents: priceLineItem({
        type: "pizza-byo",
        size: String(selectedSize),
        toppings: selectedToppings,
        toppingPlacement,
        toppingAmount,
        cheeseIncluded,
        cheeseAmount,
        cheeseCoverage,
        secondAmount,
        dairyFreeCheese,
        dips: dipsQty,
        garlicCrust,
        qty
      })
    };
    onSave(payload);
  };

  return (
    <div
      ref={rootRef}
      className="pb-scope"
      style={{ background: "#fff", color: TEXT_BROWN, fontFamily: "var(--font-body), Inter, system-ui, sans-serif" }}
      onPointerDown={(e) => e.stopPropagation()}  // stop bubbling pointerdown
      onMouseDown={(e) => e.stopPropagation()}    // cover legacy mouse listeners
      onClick={(e) => e.stopPropagation()}        // stop bubbling click
      onTouchStart={(e) => e.stopPropagation()}   // (mobile) stop bubbling touchstart              // still block bubbling, too
    >


<div
  style={
    isNarrow
      ? {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: `${LEFT_COL}px`,
          margin: "0 auto",
          padding: "0 0 16px 0",
          paddingBottom: 84, // clears the fixed mobile Add-to-Order bar
        }
      : {
          display: "grid",
          gridTemplateColumns: `${LEFT_COL}px ${RIGHT_COL}px`, // 475px 355px
          columnGap: `${PB_GAP}px`,                            // 16px
          width: `${PB_TOTAL}px`,                              // 846px total
          margin: "0 auto",
          padding: "0 0 16px 0",                               // remove side padding so widths are true
          alignItems: "start"
        }
  }
>


        {/* ===== Mobile pizza peek =====
            Shows only the bottom slice of the pizza, hanging down under the
            title. It's position:sticky with a NEGATIVE top: it scrolls up
            with the page (cropping from the top) until only the collapsed
            slice is left, then pins there; scrolling back up grows it back.
            Pure CSS, so it tracks the finger exactly with no layout jumps.
            Sizes live in the .pb-peek CSS vars below. Tap = full pizza. */}
        {isNarrow && (
          <button
            type="button"
            className="pb-peek"
            onClick={openPizzaZoom}
            aria-label="View your whole pizza"
          >
            <span className="pb-peek__pizza">
              <canvas ref={canvasRef} width="300" height="315" />
              {/* The only tappable part: an oval exactly over the pizza
                  (border-radius:50% also shapes the tap area), so taps
                  beside/around the pizza reach the options underneath. */}
              <span className="pb-peek__hit" />
            </span>
          </button>
        )}
        {/* Cream box behind the opening pizza (same look as the numbered
            sections, without the black header). It's in normal flow, pulled
            up underneath the sticky pizza strip, so it — and the "Tap to
            view" label inside it — scrolls away while the pizza stays
            pinned. The whole box opens the full pizza while it's visible. */}
        {isNarrow && (
          <button
            type="button"
            className="pb-peekBox"
            onClick={openPizzaZoom}
            aria-label="View your whole pizza"
          >
            <span className="pb-peekHint">Tap to view</span>
          </button>
        )}
        {/* Retro wavy bands along the top of the cream box, drawn ABOVE the
            pizza so its cut-off edge tucks under them. Lives in normal flow
            with the box (not in the sticky strip), so it scrolls away and the
            pinned pizza never shows it. */}
        {isNarrow && (
          <div className="pb-peekWaves" aria-hidden="true">
            <div className="pb-peekWaves__band" />
          </div>
        )}

        {/* ===== Left ===== */}
<div className="pb-left" style={{ overflowAnchor: 'none' }}>

          {/* 1. Size & Crust */}
          <Section index={1} title="Size and Crust">
            {/* Sizes */}
            {isGlutenFree ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                <div
                  style={{
                    width: 65,
                    height: 65,
                    borderRadius: "50%",
                    backgroundColor: MAROON,
                    border: `2px solid ${MAROON}`,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontFamily: "var(--font-heading), Oswald, sans-serif",
                    fontSize: 17,
                    lineHeight: 1,
                  }}
                >
                  13"
                </div>
                <span style={{ fontSize: ".9rem", color: "#555" }}>
                  Gluten Free comes in one size: 13" 
                </span>
              </div>
            ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.6rem",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: "0.75rem"
              }}
            >
              {sizes.map(({ size, label, px }) => {
                const isLocked = !!lockedSize;
                const isDisabled = isLocked || !allowSizeChoice;
                const isActive = selectedSize === size;
                const fontPx = Math.round(px * 0.26); // smaller inside-circle text

                if (isLocked && size !== lockedSize) {
                  return (
                    <div
                      key={size}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.35 }}
                    >
                      <div
                        style={{
                          width: `${px}px`,
                          height: `${px}px`,
                          borderRadius: "50%",
                          backgroundColor: "#eee",
                          border: `2px solid ${LIGHT_BORDER}`,
                          color: "#777",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontFamily: "var(--font-heading), Oswald, sans-serif",
                          fontSize: `${fontPx}px`,
                          lineHeight: 1,
                          marginBottom: "0.4rem"
                        }}
                      >
                        {size}"
                      </div>
                      <span style={{ fontSize: ".9rem" }}>{label}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={size}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled && !isActive ? 0.65 : 1
                    }}
                    onClick={(e) => { stop(e); if (!isDisabled) setSelectedSize(size); }}
                  >
                    <div
                      style={{
                        width: `${px}px`,
                        height: `${px}px`,
                        borderRadius: "50%",
                        backgroundColor: isActive ? MAROON : LIGHT_RED_INACTIVE,
                        border: `2px solid ${MAROON}`,
                        color: isActive ? "white" : MAROON,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontFamily: "var(--font-heading), Oswald, sans-serif",
                        fontSize: `${fontPx}px`,
                        lineHeight: 1,
                        marginBottom: "0.4rem",
                        transition: "all 0.18s ease-in-out"
                      }}
                    >
                      {size}"
                    </div>
                    <span style={{ fontSize: ".9rem" }}>{label}</span>
                  </div>
                );
              })}
            </div>
            )}

            <Divider />

            {/* Crust */}
            <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
              {crustOptions.map((crust) => (
                <button
                  type="button"
                  key={crust}
                  onClick={(e) => { stop(e); setSelectedCrust(crust); }}
                  style={{
                    padding: "0.45rem 0.7rem",
                    backgroundColor: selectedCrust === crust ? MAROON : "#eee",
                    color: selectedCrust === crust ? "white" : "#333",
                    fontWeight: 800,
                    fontFamily: "var(--font-heading), Oswald, sans-serif",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: ".9rem"
                  }}
                >
                  {crust}
                </button>
              ))}
            </div>
          </Section>

          {/* 2. Cheese */}
          <Section index={2} title="Cheese">
            <label style={{ display: "flex", alignItems: "center", marginBottom: "0.35rem" }}>
              <input
                type="checkbox"
                checked={cheeseType === "regular"}
                onChange={(e) => {
                  e.stopPropagation();
                  setCheeseType(cheeseType === "regular" ? "none" : "regular");
                }}
                style={{ marginRight: "0.5rem" }}
              />
              Cheese
            </label>

            <label style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
              <input
                type="checkbox"
                checked={cheeseType === "dairyFree"}
                onChange={(e) => {
                  e.stopPropagation();
                  setCheeseType(cheeseType === "dairyFree" ? "none" : "dairyFree");
                }}
                style={{ marginRight: "0.5rem" }}
              />
              Dairy-Free Cheese (+{formatMoney(PRICES.dairyFreeCheese)})
            </label>

            {cheeseIncluded && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    flexWrap: "wrap",
                    marginBottom: "0.6rem"
                  }}
                >
                  {coverageIcons.map(({ value, label }) => (
                    <span
                      key={value}
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setCheeseCoverage(value);
                        if (value === "left") setSecondCoverage("right");
                        else if (value === "right") setSecondCoverage("left");
                        else setSecondCoverage(null);
                      }}
                      style={{
                        fontSize: "1.25rem",
                        color: cheeseCoverage === value ? MAROON : "#999",
                        cursor: "pointer"
                      }}
                    >
                      {label}
                    </span>
                  ))}

                  {["Light", "Normal", "Extra", "Double"].map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={(e) => { stop(e); setCheeseAmount(option); }}
                      style={{
                        padding: "0.35rem 0.7rem",
                        backgroundColor: cheeseAmount === option ? MAROON : "#eee",
                        color: cheeseAmount === option ? "white" : "#333",
                        fontWeight: 800,
                        fontFamily: "var(--font-heading), Oswald, sans-serif",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: ".9rem"
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {(cheeseCoverage === "left" || cheeseCoverage === "right") && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      flexWrap: "wrap"
                    }}
                  >
                    <span
                      onClick={(e) => { stop(e); setSecondCoverage(cheeseCoverage === "left" ? "right" : "left"); }}
                      style={{ fontSize: "1.25rem", color: MAROON, cursor: "pointer" }}
                    >
                      {cheeseCoverage === "left" ? "◑" : "◐"}
                    </span>

                    {["None", "Light", "Normal", "Extra", "Double"].map((option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={(e) => { stop(e); setSecondAmount(option); }}
                        style={{
                          padding: "0.35rem 0.7rem",
                          backgroundColor: secondAmount === option ? MAROON : "#eee",
                          color: secondAmount === option ? "white" : "#333",
                          fontWeight: 800,
                          fontFamily: "var(--font-heading), Oswald, sans-serif",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: ".9rem"
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Section>

          {/* 3. Sauce */}
          <Section index={3} title="Sauce">
            <label style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
              <input
                type="checkbox"
                checked={sauceEnabled}
                onChange={(e) => { e.stopPropagation(); setSauceEnabled(!sauceEnabled); }}
                style={{ marginRight: "0.5rem" }}
              />
              Sauce
            </label>

            {sauceEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {sauceOptions.map((sauce) => (
                    <label key={sauce} style={{ fontWeight: 400 }}>
                      <input
                        type="radio"
                        name="sauce"
                        value={sauce}
                        checked={selectedSauce === sauce}
                        onChange={(e) => { e.stopPropagation(); setSelectedSauce(sauce); }}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {sauce}
                    </label>
                  ))}
                </div>

                <div>
                  <label style={{ fontWeight: 400, marginRight: "0.5rem" }}>Amount:</label>
                  <select value={sauceAmount} onChange={(e) => setSauceAmount(e.target.value)}>
                    <option value="Less">Less</option>
                    <option value="Normal">Normal</option>
                    <option value="Extra">Extra</option>
                  </select>
                </div>
              </div>
            )}
          </Section>

          {/* 4. Toppings */}
          <Section index={4} title="Toppings">
            {showIncludedNotice && (
              <p
                style={{
                  margin: "0 0 0.75rem",
                  padding: "0.5rem 0.65rem",
                  background: isOverIncluded ? "#fff4e5" : "#f2f2f2",
                  border: `1px solid ${isOverIncluded ? "#e0a951" : LIGHT_BORDER}`,
                  borderRadius: 4,
                  fontSize: ".85rem",
                  color: "#333"
                }}
              >
                {includedToppings} topping{includedToppings === 1 ? "" : "s"} included.
                {` Additional toppings cost ${formatMoney(extraRateForNotice)} each. Toppings marked ★ count as 2.`}
              </p>
            )}
            {meats.length > 0 && (
            <>
            <p
              style={{
                fontWeight: 900,
                marginBottom: "0.35rem",
                color: TEXT_BROWN,
                fontFamily: "var(--font-heading), Oswald, sans-serif",
                fontSize: "1rem" // smaller subheader
              }}
            >
              Choose Meats
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {meats.map((topping) => (
                <div key={topping} style={{ marginBottom: "0.45rem" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedToppings.includes(topping)}
                      onChange={(e) => { e.stopPropagation(); handleToppingToggle(topping); }}
                      style={{ marginRight: "0.5rem" }}
                    />
                    {topping}{PREMIUM_TOPPINGS.has(topping) ? " ★" : ""}
                  </label>
                  {selectedToppings.includes(topping) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem" }}>
                      {!["Coriander", "Ginger", "Sumac Seasoning"].includes(topping) &&
                        coverageIcons.map(({ value, label }) => (
                          <span
                            key={value}
                            onClick={(e) => { stop(e); setToppingPlacement({ ...toppingPlacement, [topping]: value }); }}
                            style={{
                              fontSize: "1.2rem",
                              color: toppingPlacement[topping] === value ? MAROON : "#999",
                              cursor: "pointer"
                            }}
                          >
                            {label}
                          </span>
                        ))}
                      <select
                        value={toppingAmount[topping] || "Normal"}
                        onChange={(e) => setToppingAmount({ ...toppingAmount, [topping]: e.target.value })}
                      >
                        <option>Light</option>
                        <option>Normal</option>
                        <option>Extra</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
            )}

            {meats.length > 0 && veggies.length > 0 && <Divider />}

            {veggies.length > 0 && (
            <>
            <p
              style={{
                fontWeight: 900,
                marginBottom: "0.35rem",
                marginTop: "0.35rem",
                color: TEXT_BROWN,
                fontFamily: "var(--font-heading), Oswald, sans-serif",
                fontSize: "1rem"
              }}
            >
              Choose Veggies
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {veggies.map((topping) => (
                <div key={topping} style={{ marginBottom: "0.45rem" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedToppings.includes(topping)}
                      onChange={(e) => { e.stopPropagation(); handleToppingToggle(topping); }}
                      style={{ marginRight: "0.5rem" }}
                    />
                    {topping}{PREMIUM_TOPPINGS.has(topping) ? " ★" : ""}
                  </label>
                  {selectedToppings.includes(topping) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem" }}>
                      {!["Coriander", "Ginger", "Sumac Seasoning"].includes(topping) &&
                        coverageIcons.map(({ value, label }) => (
                          <span
                            key={value}
                            onClick={(e) => { stop(e); setToppingPlacement({ ...toppingPlacement, [topping]: value }); }}
                            style={{
                              fontSize: "1.2rem",
                              color: toppingPlacement[topping] === value ? MAROON : "#999",
                              cursor: "pointer"
                            }}
                          >
                            {label}
                          </span>
                        ))}
                      <select
                        value={toppingAmount[topping] || "Normal"}
                        onChange={(e) => setToppingAmount({ ...toppingAmount, [topping]: e.target.value })}
                      >
                        <option>Light</option>
                        <option>Normal</option>
                        <option>Extra</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
            )}

            {pizzaName === "Bourbon" && drizzles.length > 0 && (
              <>
                <p
                  style={{
                    fontWeight: 900,
                    marginBottom: "0.35rem",
                    marginTop: "0.5rem",
                    color: TEXT_BROWN,
                    fontFamily: "var(--font-heading), Oswald, sans-serif",
                    fontSize: "1rem"
                  }}
                >
                  Choose Drizzles
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {drizzles.map((topping) => (
                    <div key={topping} style={{ marginBottom: "0.45rem" }}>
                      <label style={{ display: "flex", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedToppings.includes(topping)}
                          onChange={(e) => { e.stopPropagation(); handleToppingToggle(topping); }}
                          style={{ marginRight: "0.5rem" }}
                        />
                        {topping}
                      </label>
                      {selectedToppings.includes(topping) && (
                        <div style={{ display: "flex", alignItems: "center", marginTop: "0.3rem" }}>
                          <select
                            value={toppingAmount[topping] || "Normal"}
                            onChange={(e) => setToppingAmount({ ...toppingAmount, [topping]: e.target.value })}
                          >
                            <option>Light</option>
                            <option>Normal</option>
                            <option>Extra</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {isRecipePizza && !toppingsExpanded && (
              <button
                type="button"
                onClick={(e) => { stop(e); setToppingsExpanded(true); }}
                style={{
                  marginTop: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 1rem",
                  background: "#fff",
                  border: `2px dashed ${MAROON}`,
                  borderRadius: 6,
                  color: MAROON,
                  fontWeight: 900,
                  fontFamily: "var(--font-heading), Oswald, sans-serif",
                  fontSize: ".85rem",
                  letterSpacing: ".3px",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                + Add More Toppings
              </button>
            )}
          </Section>

          {/* 5. Dips */}
          <Section index={5} title="Dipping Sauces">
            {DIP_DEFS.map((d, i) => (
              <React.Fragment key={d.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                      src={d.img}
                      alt={d.name}
                      style={{ width: 36, height: 36, objectFit: "cover", border: `1px solid ${LIGHT_BORDER}` }}
                    />
                    <span style={{ fontWeight: 800 }}>{d.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setDipsQty((prev) => ({ ...prev, [d.key]: Math.max(prev[d.key] - 1, 0) }));
                      }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: dipsQty[d.key] > 0 ? MAROON : "#ddd",
                        color: dipsQty[d.key] > 0 ? "white" : "#999",
                        border: "none",
                        cursor: dipsQty[d.key] > 0 ? "pointer" : "default",
                        fontWeight: 900,
                        fontSize: 24,
                        lineHeight: 1
                      }}
                      aria-label={`Decrease ${d.name}`}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 24, textAlign: "center", fontWeight: 900 }}>{dipsQty[d.key]}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setDipsQty((prev) => ({ ...prev, [d.key]: prev[d.key] + 1 }));
                      }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        backgroundColor: MAROON,
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 24,
                        lineHeight: 1
                      }}
                      aria-label={`Increase ${d.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                {i < DIP_DEFS.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Section>

          {/* 6. Special Instructions — grouped into two compact rows of
              columns (mirrors the Bake/Cut/Oregano reference layout) instead
              of one full-width block per category, to save vertical space. */}
          <Section index={6} title="Special Instructions">
            <div style={{ display: "flex" }}>
              <InstrGroup title="Bake">
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="bake"
                    value="light"
                    checked={bake === "light"}
                    onChange={(e) => { e.stopPropagation(); setBake("light"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Lightly Done
                </label>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="bake"
                    value="normal"
                    checked={bake === "normal"}
                    onChange={(e) => { e.stopPropagation(); setBake("normal"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Normal Bake
                </label>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="bake"
                    value="well"
                    checked={bake === "well"}
                    onChange={(e) => { e.stopPropagation(); setBake("well"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Well Done
                </label>
              </InstrGroup>

              <VRule />

              <InstrGroup title="Oregano">
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="oregano"
                    value="with"
                    checked={oregano === "with"}
                    onChange={(e) => { e.stopPropagation(); setOregano("with"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  With Oregano
                </label>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="oregano"
                    value="without"
                    checked={oregano === "without"}
                    onChange={(e) => { e.stopPropagation(); setOregano("without"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Without Oregano
                </label>
              </InstrGroup>

              <VRule />

              <InstrGroup title="Spice It Up">
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="spice"
                    value="with"
                    checked={crushedRedPepper === "with"}
                    onChange={(e) => { e.stopPropagation(); setCrushedRedPepper("with"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  With Crushed Red Peppers
                </label>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="spice"
                    value="without"
                    checked={crushedRedPepper === "without"}
                    onChange={(e) => { e.stopPropagation(); setCrushedRedPepper("without"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Without Crushed Red Peppers
                </label>
              </InstrGroup>
            </div>

            <Divider style={{ margin: "1rem auto" }} />

            <div style={{ display: "flex" }}>
              <InstrGroup title="Coriander">
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="coriander"
                    value="with"
                    checked={coriander === "with"}
                    onChange={(e) => { e.stopPropagation(); setCoriander("with"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  With Coriander
                </label>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="coriander"
                    value="without"
                    checked={coriander === "without"}
                    onChange={(e) => { e.stopPropagation(); setCoriander("without"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Without Coriander
                </label>
              </InstrGroup>

              <VRule />

              <InstrGroup title="Ginger">
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="ginger"
                    value="with"
                    checked={ginger === "with"}
                    onChange={(e) => { e.stopPropagation(); setGinger("with"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  With Ginger
                </label>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="ginger"
                    value="without"
                    checked={ginger === "without"}
                    onChange={(e) => { e.stopPropagation(); setGinger("without"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Without Ginger
                </label>
              </InstrGroup>

              <VRule />

              <InstrGroup title="Garlic Crust">
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="garlicCrust"
                    value="with"
                    checked={garlicCrust === "with"}
                    onChange={(e) => { e.stopPropagation(); setGarlicCrust("with"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  With Garlic Crust (+{formatMoney(PRICES.garlicCrust)})
                </label>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="garlicCrust"
                    value="without"
                    checked={garlicCrust === "without"}
                    onChange={(e) => { e.stopPropagation(); setGarlicCrust("without"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Without Garlic Crust
                </label>
              </InstrGroup>
            </div>
          </Section>
        </div>

        {/* ===== Right (My Pizza) ===== */}
{/* ===== Right (My Pizza) ===== */}
<aside
  className="pb-right"
  style={
    isNarrow
      ? { position: "static", width: "100%", marginTop: "1.25rem", overflowAnchor: 'none' }
      : { position: "sticky", top: -10, overflowAnchor: 'none' }
  }
>


          {/* Bordered box ends under the button */}
          <div style={{ background: LIGHT_BG, padding: 0, border: `1px solid ${LIGHT_BORDER}`, borderRadius: BOX_RADIUS, overflow: "hidden" }}>
<div className="pb-h">
  <div className="pb-h__inner">My Pizza</div>
</div>


            <div style={{ padding: "1rem", background: LIGHT_BG }}>
              <p>
                <strong>Size:</strong>{" "}
                {isGlutenFree ? '13" (Gluten Free)' : `${selectedSize}" (${sizes.find((s) => s.size === selectedSize)?.label})`}
              </p>
              <p><strong>Crust:</strong> {selectedCrust}</p>
              <p>
                <strong>Cheese:</strong>{" "}
                {cheeseIncluded
                  ? `${cheeseCoverage} - ${cheeseAmount}${secondCoverage ? ` / ${secondCoverage} - ${secondAmount}` : ""}`
                  : "No Cheese"}
                {dairyFreeCheese ? " (Dairy-Free)" : ""}
              </p>
              <p><strong>Sauce:</strong> {sauceEnabled ? `${selectedSauce} (${sauceAmount})` : "No Sauce"}</p>

              {selectedToppings.length > 0 && (
                <>
                  <p style={{ fontWeight: "bold", marginTop: "0.6rem" }}>Toppings:</p>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    {selectedToppings.map((t) => {
                      const placement = toppingPlacement[t] || "full";
                      const amount = toppingAmount[t] || "Normal";
                      const isDefault = placement === "full" && amount === "Normal";
                      return (
                        <li key={t}>{t}{isDefault ? "" : ` — ${placement} / ${amount}`}</li>
                      );
                    })}
                  </ul>
                </>
              )}

              {Object.values(dipsQty).some((q) => q > 0) && (
                <p style={{ marginTop: "0.6rem" }}>
                  <strong>Dips:</strong>{" "}
                  {DIP_DEFS.filter((d) => dipsQty[d.key] > 0)
                    .map((d) => `${d.name} × ${dipsQty[d.key]}`)
                    .join(", ")}
                </p>
              )}

              <p style={{ fontWeight: "bold", marginTop: "0.6rem" }}>Special Instructions:</p>
              <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                <li>Bake: {{ light: "Lightly done", normal: "Normal bake", well: "Well done" }[bake]}</li>
                {oregano === "with" && <li>With oregano</li>}
                {crushedRedPepper === "with" && <li>With crushed red peppers</li>}
                {coriander === "with" && <li>With coriander</li>}
                {ginger === "with" && <li>With ginger</li>}
                {garlicCrust === "with" && (
                  <li>Garlic crust (+{formatMoney(PRICES.garlicCrust)})</li>
                )}
              </ul>

              <Divider />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  margin: "0.6rem 0"
                }}
              >
                <div style={{ fontWeight: 900 }}>
                  Item Subtotal: <span>{formatMoney(lineSubtotalCents)}</span>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  Quantity:
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width: "72px" }}
                  />
                </label>
              </div>

              {!isNarrow && (
                <button
                  type="button"
                  onClick={handleAddToOrder}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    backgroundColor: MAROON,
                    color: "white",
                    fontWeight: 900,
                    border: "none",
                    borderRadius: BOX_RADIUS,
                    fontSize: "1rem",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-heading), Oswald, sans-serif"
                  }}
                >
                  Add To Order
                </button>
              )}
            </div>
          </div>

          {/* Canvas lives OUTSIDE the border box now. width:100%/maxWidth:300
              + aspectRatio (instead of a fixed height) lets it shrink to fit
              narrow screens while keeping its proportions; the canvas element
              itself stretches to fill via width/height:100% (its internal
              300x315 drawing buffer is unaffected, so the art doesn't blur
              at this scale). */}
          {!isNarrow && (
          <div style={{ position: "relative", width: "100%", maxWidth: 300, aspectRatio: "300 / 315", margin: "1rem auto 0" }}>
            <canvas
              ref={canvasRef}
              width="300"
              height="315"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
            />
          </div>
          )}
        </aside>
      </div>

      {/* Full-pizza view, opened by tapping the mobile peek */}
      {pizzaZoomSrc && (
        <div
          className="pb-zoom"
          role="dialog"
          aria-label="Your pizza"
          onClick={() => setPizzaZoomSrc(null)}
        >
          <img src={pizzaZoomSrc} alt="Your pizza" className="pb-zoom__img" />
          <div className="pb-zoom__hint">Tap anywhere to close</div>
        </div>
      )}

      {/* Mobile-only sticky CTA — on desktop the "Add To Order" button inside
          the My Pizza card (above) is used instead. Fixed to the real
          viewport (not the scrollable modal), so it's reachable at any
          scroll position through the options list. */}
      {isNarrow && (
        <div className="pb-mobile-bar">
          <div className="pb-mobile-bar__subtotal">
            <span className="pb-mobile-bar__subtotal-label">Item Subtotal</span>
            <span className="pb-mobile-bar__subtotal-value">{formatMoney(lineSubtotalCents)}</span>
          </div>
          <button type="button" className="pb-mobile-bar__btn" onClick={handleAddToOrder}>
            Add To Order
          </button>
        </div>
      )}

      {/* Close X as a decal (no layout impact, never moves with scroll) */}
      <style jsx global>{`
        .pb-scope input[type="radio"],
        .pb-scope input[type="checkbox"] {
          accent-color: #8b1a1a;
        }
        .modal-panel { position: relative; display: flex; flex-direction: column; }
        .modal-close {
          position: absolute !important;
          top: 12px;
          right: 12px;
          z-index: 10000;
          background: transparent !important;
          border: none !important;
          padding: 6px !important;
          line-height: 1 !important;
          box-shadow: none !important;
          pointer-events: auto !important;
        }
        /* ----- Mobile pizza peek ----- */
        .pb-scope {
          /* pizza is drawn min(screen - 40px, 320px) wide; the canvas is
             300x315, so its height is 1.05x that */
          --pz-h: calc(min(100vw - 40px, 320px) * 1.05);
          --peek-open: calc(var(--pz-h) * 0.40);   /* visible when opened */
          --peek-min: calc(var(--pz-h) * 0.35);    /* visible when scrolled */
        }
        .pb-peek {
          position: sticky;
          /* minus the popup's top padding (set on .rs-modal-viewport in
             DebugPizzaOverlay.js) so the pinned slice sits at screen top */
          top: calc(var(--peek-min) - var(--peek-open) - var(--modal-pad-y, 14px));
          z-index: 5;
          display: block;
          width: calc(100% + 24px);
          margin: -4px -12px 0;
          height: var(--peek-open);
          padding: 0;
          border: 0;
          /* transparent: only the pizza itself floats over the options as
             they scroll underneath; taps outside the pizza fall through */
          background: transparent;
          overflow: hidden;
          pointer-events: none;
          -webkit-tap-highlight-color: transparent;
        }
        .pb-peek__pizza {
          position: absolute;
          left: 50%;
          bottom: 8px; /* small gap above the cream box's bottom border */
          width: min(100vw - 40px, 320px);
          aspect-ratio: 300 / 315;
          transform: translateX(-50%);
          pointer-events: none;
          /* soft shadow so the pizza stays readable over the options */
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }
        .pb-peek__pizza canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
        /* Pizza art spans ~95% of the 300x300 layer images, which are
           drawn stretched to the 300x315 canvas, so it's a near-circle oval */
        .pb-peek__hit {
          position: absolute;
          left: 2.5%;
          top: 2.5%;
          width: 95%;
          height: 95%;
          border-radius: 50%;
          pointer-events: auto;
          cursor: zoom-in;
        }
        .pb-peekBox {
          position: relative;
          z-index: 1; /* under the sticky pizza strip (z-index 5) */
          display: block;
          width: 100%;
          height: var(--peek-open);
          margin: calc(-1 * var(--peek-open)) 0 10px;
          padding: 0;
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: .1875rem;
          cursor: zoom-in;
          -webkit-tap-highlight-color: transparent;
        }
        /* zero-height row right after the box; the bands are positioned
           back up onto the box's top edge, inside its 1px border */
        .pb-peekWaves {
          position: relative;
          height: 0;
          z-index: 6; /* above the sticky pizza strip (5) */
          pointer-events: none;
        }
        /* The bands are one 40x24 wave tile repeated sideways. Tweak:
             --wave-h  height of the bands (the waves scale with it)
             --wave-y  nudge up/down: negative = higher, positive = lower.
                       -1px makes the maroon cover the box's top border so
                       there's no hairline gap between border and bands. */
        .pb-peekWaves__band {
          --wave-h: 24px;
          --wave-y: -1px;
          position: absolute;
          left: 1px;
          right: 1px;
          top: calc(-10px - var(--peek-open) + 1px + var(--wave-y));
          height: var(--wave-h);
          border-top-left-radius: .1875rem;
          border-top-right-radius: .1875rem;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='24' viewBox='0 0 40 24'%3E%3Cpath d='M0 0H40V9Q30 15 20 9Q10 3 0 9Z' fill='%238B1A1A'/%3E%3Cpath d='M0 9Q10 3 20 9Q30 15 40 9V16Q30 22 20 16Q10 10 0 16Z' fill='%23FFB0B0'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          background-position: left top;
          background-size: calc(var(--wave-h) * 40 / 24) var(--wave-h);
        }
        .pb-peekHint {
          position: absolute;
          right: 8px;
          bottom: 8px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-brown);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 999px;
          padding: 3px 9px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        }
        .pb-zoom {
          position: fixed;
          inset: 0;
          z-index: 10050;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: rgba(0, 0, 0, 0.72);
          animation: pbZoomIn 0.18s ease-out;
          cursor: zoom-out;
        }
        .pb-zoom__img {
          width: min(90vw, 420px);
          height: auto;
          filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.45));
        }
        .pb-zoom__hint {
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          opacity: 0.85;
        }
        @keyframes pbZoomIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .pb-mobile-bar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 3100;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
          background: #fff;
          border-top: 1px solid var(--menu-box-border);
          box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.12);
        }
        .pb-mobile-bar__subtotal {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          flex: 0 0 auto;
        }
        .pb-mobile-bar__subtotal-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: var(--text-brown);
          font-weight: 700;
        }
        .pb-mobile-bar__subtotal-value {
          font-weight: 900;
          font-size: 1.05rem;
          color: #000;
        }
        .pb-mobile-bar__btn {
          flex: 1 1 auto;
          padding: 0.85rem 1rem;
          background-color: #8b1a1a;
          color: #fff;
          font-weight: 900;
          border: none;
          border-radius: .1875rem;
          font-size: 1rem;
          cursor: pointer;
          text-transform: uppercase;
          font-family: var(--font-heading, Oswald, sans-serif);
        }
      `}</style>
    </div>
  );
}
