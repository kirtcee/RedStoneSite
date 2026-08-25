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
  allowSizeChoice = true
}) {
  const { addItem } = useCart();
  const drawVersionRef = useRef(0);
  const canvasRef = useRef(null);

  // ===== refs for scroll control =====
  const rootRef = useRef(null);

  // ===== Theme =====
  const MAROON = "#8b1a1a";
  const LIGHT_BORDER = "#b8b8b8"; // slightly darker per your last note
  const LIGHT_BG = "#f9f9f9";
  const LIGHT_RED_INACTIVE = "#ffb0b0"; // a tad darker
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
  const [cheeseIncluded, setCheeseIncluded] = useState(initialData.cheeseIncluded ?? true);
  const [cheeseCoverage, setCheeseCoverage] = useState(initialData.cheeseCoverage || "full");
  const [cheeseAmount, setCheeseAmount] = useState(initialData.cheeseAmount || "Normal");
  const [dairyFreeCheese, setDairyFreeCheese] = useState(initialData.dairyFreeCheese ?? false);
  const [secondCoverage, setSecondCoverage] = useState(initialData.secondCoverage || null);
  const [secondAmount, setSecondAmount] = useState(initialData.secondAmount || "Normal");
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [toppingPlacement, setToppingPlacement] = useState({});
  const [toppingAmount, setToppingAmount] = useState({});
  const [bake, setBake] = useState(initialData.bake || "normal");
  const [oregano, setOregano] = useState(initialData.oregano || "without");
  const [crushedRedPepper, setCrushedRedPepper] = useState(initialData.crushedRedPepper || "without");
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
        const leftAmount  = cheeseAmount;
        const rightAmount = secondAmount || cheeseAmount;
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
    selectedToppings, toppingPlacement, sauceEnabled, selectedSauce
  ]);

  const defaultMeats = [
    "Pepperoni","Real Bacon","Ham","Grilled Chicken","Shawarma Chicken","Halal Chicken",
    "BBQ Chicken","Butter Chicken","Beef","Hot Italian Sausage","Mild Sausage",
    "Bacon Crumble","Anchovies","Salami","Halal Pepperoni"
  ].filter(isSpecialToppingAllowed);

  const defaultVeggies = [
    "Mushroom","Green Pepper","Onion","Pineapple","Tomato","Hot Peppers",
    "Green Olives","Black Olives","Broccoli","Jalapeno","Sun Dried Tomato",
    "Spinach","Fresh Garlic","Roasted Red Pepper","Corn","Paneer","Feta Cheese",
    "Ginger","Coriander","Sumac Seasoning"
  ].filter(isSpecialToppingAllowed);

  const defaultDrizzles = ["BBQ Drizzle"].filter(isSpecialToppingAllowed);

  const meats   = allowedToppings ? defaultMeats.filter((t) => allowedToppings.includes(t))   : defaultMeats;
  const veggies = allowedToppings ? defaultVeggies.filter((t) => allowedToppings.includes(t)) : defaultVeggies;
  const drizzles= allowedToppings ? defaultDrizzles.filter((t) => allowedToppings.includes(t)): defaultDrizzles;

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
  <div style={{ marginBottom: "1.25rem", border: `1px solid ${LIGHT_BORDER}`, background: "#fff", overflowAnchor: 'none' }}>
    <div className="pb-h">
      <div className="pb-h__inner">
        {index}. {title}
      </div>
    </div>
    <div style={{ padding: "1rem", background: LIGHT_BG }}>{children}</div>
  </div>
);


  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div
      ref={rootRef}
      style={{ background: "#fff", fontFamily: "var(--font-body), Inter, system-ui, sans-serif" }}
      onPointerDown={(e) => e.stopPropagation()}  // stop bubbling pointerdown
      onMouseDown={(e) => e.stopPropagation()}    // cover legacy mouse listeners
      onClick={(e) => e.stopPropagation()}        // stop bubbling click
      onTouchStart={(e) => e.stopPropagation()}   // (mobile) stop bubbling touchstart              // still block bubbling, too
    >


<div
  style={{
    display: "grid",
    gridTemplateColumns: `${LEFT_COL}px ${RIGHT_COL}px`, // 475px 355px
    columnGap: `${PB_GAP}px`,                            // 16px
    width: `${PB_TOTAL}px`,                              // 846px total
    margin: "0 auto",
    padding: "0 0 16px 0",                               // remove side padding so widths are true
    alignItems: "start"
  }}
>


        {/* ===== Left ===== */}
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
            <label style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
              <input
                type="checkbox"
                checked={cheeseIncluded}
                onChange={(e) => { e.stopPropagation(); setCheeseIncluded(!cheeseIncluded); }}
                style={{ marginRight: "0.5rem" }}
              />
              Cheese
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

            <Divider />

            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={dairyFreeCheese}
                onChange={(e) => { e.stopPropagation(); setDairyFreeCheese(!dairyFreeCheese); }}
                style={{ marginRight: "0.5rem" }}
              />
              Dairy-Free Cheese (+{formatMoney(PRICES.dairyFreeCheese)})
            </label>
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
            <p
              style={{
                fontWeight: 900,
                marginBottom: "0.35rem",
                color: MAROON,
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

            <Divider />

            <p
              style={{
                fontWeight: 900,
                marginBottom: "0.35rem",
                marginTop: "0.35rem",
                color: MAROON,
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

            {pizzaName === "Bourbon" && (
              <>
                <p
                  style={{
                    fontWeight: 900,
                    marginBottom: "0.35rem",
                    marginTop: "0.5rem",
                    color: MAROON,
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

          {/* 6. Special Instructions */}
          <Section index={6} title="Special Instructions">
            {/* Bake */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <p
                style={{
                  fontWeight: 900,
                  marginBottom: "0.2rem",
                  color: MAROON,
                  fontFamily: "var(--font-heading), Oswald, sans-serif",
                  fontSize: "1rem"
                }}
              >
                Bake
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label>
                  <input
                    type="radio"
                    name="bake"
                    value="light"
                    checked={bake === "light"}
                    onChange={(e) => { e.stopPropagation(); setBake("light"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Lightly done
                </label>
                <label>
                  <input
                    type="radio"
                    name="bake"
                    value="normal"
                    checked={bake === "normal"}
                    onChange={(e) => { e.stopPropagation(); setBake("normal"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Normal bake
                </label>
                <label>
                  <input
                    type="radio"
                    name="bake"
                    value="well"
                    checked={bake === "well"}
                    onChange={(e) => { e.stopPropagation(); setBake("well"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Well done
                </label>
              </div>
            </div>

            <Divider />

            {/* Oregano */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <p
                style={{
                  fontWeight: 900,
                  marginBottom: "0.2rem",
                  color: MAROON,
                  fontFamily: "var(--font-heading), Oswald, sans-serif",
                  fontSize: "1rem"
                }}
              >
                Oregano
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label>
                  <input
                    type="radio"
                    name="oregano"
                    value="with"
                    checked={oregano === "with"}
                    onChange={(e) => { e.stopPropagation(); setOregano("with"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  With oregano
                </label>
                <label>
                  <input
                    type="radio"
                    name="oregano"
                    value="without"
                    checked={oregano === "without"}
                    onChange={(e) => { e.stopPropagation(); setOregano("without"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Without oregano
                </label>
              </div>
            </div>

            <Divider />

            {/* Spice */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <p
                style={{
                  fontWeight: 900,
                  marginBottom: "0.2rem",
                  color: MAROON,
                  fontFamily: "var(--font-heading), Oswald, sans-serif",
                  fontSize: "1rem"
                }}
              >
                Spice it up
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label>
                  <input
                    type="radio"
                    name="spice"
                    value="with"
                    checked={crushedRedPepper === "with"}
                    onChange={(e) => { e.stopPropagation(); setCrushedRedPepper("with"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  With crushed red peppers
                </label>
                <label>
                  <input
                    type="radio"
                    name="spice"
                    value="without"
                    checked={crushedRedPepper === "without"}
                    onChange={(e) => { e.stopPropagation(); setCrushedRedPepper("without"); }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Without crushed red peppers
                </label>
              </div>
            </div>
          </Section>
        </div>

        {/* ===== Right (My Pizza) ===== */}
{/* ===== Right (My Pizza) ===== */}
<aside className="pb-right" style={{ position: "sticky", top: -10, overflowAnchor: 'none' }}>


          {/* Bordered box ends under the button */}
          <div style={{ background: "#f8f8f8", padding: 0, border: `1px solid ${LIGHT_BORDER}` }}>
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

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  const payload = {
                    type: "pizza-byo",
                    pizzaName: pizzaName || "Custom Pizza",
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
                      qty
                    })
                  };
                  onSave(payload);
                }}
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: "#E91E28", // keep original bright red here
                  color: "white",
                  fontWeight: 900,
                  border: "none",
                  borderRadius: "0px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-heading), Oswald, sans-serif"
                }}
              >
                Add To Order
              </button>
            </div>
          </div>

          {/* Canvas lives OUTSIDE the border box now */}
          <div style={{ position: "relative", width: 300, height: 315, margin: "1rem auto 0" }}>
            <canvas
              ref={canvasRef}
              width="300"
              height="315"
              style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
            />
          </div>
        </aside>
      </div>

      {/* Close X as a decal (no layout impact, never moves with scroll) */}
      <style jsx global>{`
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
      `}</style>
    </div>
  );
}
