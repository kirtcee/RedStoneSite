import React, { useState, useEffect } from "react";

export default function PizzaBuilder() {
  const [selectedSize, setSelectedSize] = useState("12");
  const [selectedCrust, setSelectedCrust] = useState("Original Hand Tossed");
  const [sauceEnabled, setSauceEnabled] = useState(true);
  const [selectedSauce, setSelectedSauce] = useState("Pizza Sauce");
  const [sauceAmount, setSauceAmount] = useState("Normal");
  const [cheeseIncluded, setCheeseIncluded] = useState(true);
  const [cheeseCoverage, setCheeseCoverage] = useState("full");
  const [cheeseAmount, setCheeseAmount] = useState("Normal");
  const [secondCoverage, setSecondCoverage] = useState(null);
  const [secondAmount, setSecondAmount] = useState("Normal");
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [toppingPlacement, setToppingPlacement] = useState({});
  const [toppingAmount, setToppingAmount] = useState({});
  const [dipQty, setDipQty] = useState(0);
  const [bake, setBake] = useState("normal");
  const [oregano, setOregano] = useState("without");
  const [crushedRedPepper, setCrushedRedPepper] = useState("without");
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);


  const sizes = [
    { size: "10", label: "Small", px: 50 },
    { size: "12", label: "Medium", px: 65 },
    { size: "14", label: "Large", px: 80 },
    { size: "16", label: "X-Large", px: 95 },
  ];

  const crustOptions = ["Thin Crust", "Original Hand Tossed", "Thick Crust"];
  const sauceOptions = ["Pizza Sauce", "Garlic Base", "BBQ Base" , "Butter Chicken Base", "Shahi Paneer Base"];
  const coverageIcons = [
    { value: "left", label: "◐" },
    { value: "full", label: "⬤" },
    { value: "right", label: "◑" },
  ];
  const meats = [
    "Pepperoni", "Real Bacon", "Grilled Chicken", "Shawarma Chicken", "BBQ Chicken",
    "Butter Chicken", "Beef", "Hot Italian Sausage", "Mild Sausage", "Bacon Crumble"
  ];
  const veggies = [
    "Mushroom", "Green Pepper", "Onion", "Pineapple", "Tomato", "Hot Peppers",
    "Green Olives", "Black Olives", "Broccoli", "Jalapeno", "Sun Dried Tomato",
    "Spinach", "Fresh Garlic", "Feta Cheese"
  ];

  const handleToppingToggle = (topping) => {
    const isSelected = selectedToppings.includes(topping);
    if (isSelected) {
      setSelectedToppings(selectedToppings.filter(t => t !== topping));
      const updatedPlacement = { ...toppingPlacement };
      const updatedAmount = { ...toppingAmount };
      delete updatedPlacement[topping];
      delete updatedAmount[topping];
      setToppingPlacement(updatedPlacement);
      setToppingAmount(updatedAmount);
    } else {
      setSelectedToppings([...selectedToppings, topping]);
      setToppingPlacement({ ...toppingPlacement, [topping]: "full" });
      setToppingAmount({ ...toppingAmount, [topping]: "Normal" });
    }
  };

useEffect(() => {
  const canvas = document.getElementById("pizza_preview");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const imageQueue = [];

  // 1. Static base
  imageQueue.push("/pizza_layers/No-Base.png");

  // 2. Sauce (between No-Base and Cheese)
  if (sauceEnabled) {
    const sauceMap = {
      "Pizza Sauce": "Pizza-Sauce.png",
      "Garlic Base": "Garlic-Base.png",
      "BBQ Base": "BBQ-Base.png",
      "Butter Chicken Base": "Butter-Chicken-Base.png",
      "Shahi Paneer Base": "Shahi-Paneer-Base.png"
    };

    const selectedSauceFile = sauceMap[selectedSauce];
    if (selectedSauceFile) {
      imageQueue.push(`/pizza_layers/${selectedSauceFile}`);
    }
  }

  // 3. Cheese base logic
  if (cheeseIncluded) {
    const addBaseCheeseImage = (filename) => {
      imageQueue.push(`/pizza_layers/${filename}`);
    };

    if (cheeseCoverage === "left" || cheeseCoverage === "right") {
      const leftAmount = cheeseCoverage === "left" ? cheeseAmount : secondAmount || cheeseAmount;
      const rightAmount = cheeseCoverage === "right" ? cheeseAmount : secondAmount || cheeseAmount;

      if (leftAmount === "None") {
        addBaseCheeseImage("Base-Cheese-None-Left.png");
      } else if (leftAmount === "Light") {
        addBaseCheeseImage("Base-Cheese-Less-Left.png");
      } else {
        addBaseCheeseImage("Base-Cheese-Left.png");
      }

      if (rightAmount === "None") {
        addBaseCheeseImage("Base-Cheese-None-Right.png");
      } else if (rightAmount === "Light") {
        addBaseCheeseImage("Base-Cheese-Less-Right.png");
      } else {
        addBaseCheeseImage("Base-Cheese-Right.png");
      }

    } else {
      if (cheeseAmount === "None") {
        addBaseCheeseImage("Base-Cheese-None.png");
      } else if (cheeseAmount === "Light") {
        addBaseCheeseImage("Base-Cheese-Less.png");
      } else {
        addBaseCheeseImage("Base-Cheese.png");
      }
    }
  } else {
    // fallback if cheese checkbox is off
    imageQueue.push("/pizza_layers/Base-Cheese-None.png");
  }

  // 4. Crust always after cheese
  imageQueue.push("/pizza_layers/Crust.png");

  // 5. Extra / Double cheese overlays
  if (cheeseIncluded) {
    const addOverlay = (type, side) => {
      const suffix = side ? `-${side}` : "";
      imageQueue.push(`/pizza_layers/${type}${suffix}.png`);
    };

    if (cheeseCoverage === "left" || cheeseCoverage === "right") {
      const leftAmount = cheeseCoverage === "left" ? cheeseAmount : secondAmount || cheeseAmount;
      const rightAmount = cheeseCoverage === "right" ? cheeseAmount : secondAmount || cheeseAmount;

      if (leftAmount === "Extra") addOverlay("Extra-Cheese", "Left");
      if (leftAmount === "Double") addOverlay("Double-Cheese", "Left");

      if (rightAmount === "Extra") addOverlay("Extra-Cheese", "Right");
      if (rightAmount === "Double") addOverlay("Double-Cheese", "Right");
    } else {
      if (cheeseAmount === "Extra") addOverlay("Extra-Cheese");
      if (cheeseAmount === "Double") addOverlay("Double-Cheese");
    }
  }

  // 6. Toppings
  selectedToppings.forEach((topping) => {
    const placement = toppingPlacement[topping];
    const formattedTopping = topping.replace(/\s+/g, "-");
    let filename = `/pizza_layers/${formattedTopping}`;

    if (placement === "left") filename += "-Left.png";
    else if (placement === "right") filename += "-Right.png";
    else filename += ".png";

    imageQueue.push(filename);
  });

  // Load and draw all images in order
  let loadedCount = 0;
  const images = [];

  imageQueue.forEach((src, index) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      images[index] = img;
      loadedCount++;
      if (loadedCount === imageQueue.length) {
        images.forEach((img) => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        });
      }
    };
  });
}, [
  cheeseIncluded,
  cheeseAmount,
  cheeseCoverage,
  secondAmount,
  secondCoverage,
  selectedToppings,
  toppingPlacement,
  sauceEnabled,
  selectedSauce
]);





  return (
    <div style={{ width: "100%", background: "#fff", minHeight: "100vh" }}>
      {/* Title above both sections */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1rem 1rem 0 1rem" }}>
        <h2
          style={{
            margin: "0 0 2rem 0",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#E91E28"
          }}
        >
          Red Stone Pizza Builder
        </h2>
      </div>


      {/* Main grid container */}
      <div
  style={{
    padding: "0 0.5rem", // makes side margins match the column gap
  }}
></div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "1rem",
          maxWidth: "960px",
          margin: "0 auto",
          background: "#fff",
          padding: "0rem 1rem",
          borderRadius: "0px",
        }}
      >

        {/* Section 2 - Cheese */}
<div style={{ marginBottom: "1.5rem" }}>
  <div style={{
    background: "#E91E28",
    color: "white",
    padding: "0.5rem 0.75rem",
    fontWeight: "bold",
    borderRadius: "0px 0px 0 0"
  }}>
    2. Cheese
  </div>
  <div style={{ padding: "1rem", background: "#f9f9f9" }}>
    <label style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
      <input
        type="checkbox"
        checked={cheeseIncluded}
        onChange={() => setCheeseIncluded(!cheeseIncluded)}
        style={{ marginRight: "0.5rem" }}
      />
      Cheese
    </label>

    {cheeseIncluded && (
      <>
        {/* Coverage + Amount (main side) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "1rem"
        }}>
          {coverageIcons.map(({ value, label }) => (
            <span
              key={value}
              onClick={() => {
  setCheeseCoverage(value);
  if (value === "left") setSecondCoverage("right");
  else if (value === "right") setSecondCoverage("left");
  else setSecondCoverage(null);
}}

              style={{
                fontSize: "1.5rem",
                color: cheeseCoverage === value ? "#E91E28" : "#999",
                cursor: "pointer"
              }}
            >
              {label}
            </span>
          ))}

          {["Light", "Normal", "Extra", "Double"].map(option => (
            <button
              key={option}
              onClick={() => setCheeseAmount(option)}
              style={{
                padding: "0.4rem 0.8rem",
                backgroundColor: cheeseAmount === option ? "#E91E28" : "#eee",
                color: cheeseAmount === option ? "white" : "#333",
                fontWeight: "bold",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Second side (left/right split) */}
        {(cheeseCoverage === "left" || cheeseCoverage === "right") && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap"
          }}>
            <span
              onClick={() => setSecondCoverage(cheeseCoverage === "left" ? "right" : "left")}
              style={{
                fontSize: "1.5rem",
                color: "#E91E28",
                cursor: "pointer"
              }}
            >
              {cheeseCoverage === "left" ? "◑" : "◐"}
            </span>

            {["None", "Light", "Normal", "Extra", "Double"].map(option => (
              <button
                key={option}
                onClick={() => setSecondAmount(option)}
                style={{
                  padding: "0.4rem 0.8rem",
                  backgroundColor: secondAmount === option ? "#E91E28" : "#eee",
                  color: secondAmount === option ? "white" : "#333",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </>
    )}
  </div>

{/* Section 1 - Size and Crust */}
<div style={{ marginBottom: "1.5rem" }}>
  <div style={{
    background: "#E91E28",
    color: "white",
    padding: "0.5rem 0.75rem",
    fontWeight: "bold",
    borderRadius: "0px 0px 0 0"
  }}>
    1. Size and Crust
  </div>

  <div style={{ padding: "1rem", background: "#f9f9f9" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
      {sizes.map(({ size, label, px }) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }} onClick={() => setSelectedSize(size)}>
          <div style={{
            width: `${px}px`,
            height: `${px}px`,
            borderRadius: "50%",
            backgroundColor: selectedSize === size ? "#E91E28" : "#FFE5E5",
            border: "2px solid #E91E28",
            color: selectedSize === size ? "white" : "#E91E28",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            marginBottom: "0.5rem",
            transition: "all 0.2s ease-in-out"
          }}>
            {size}"
          </div>
          <span>{label}</span>
        </div>
      ))}
    </div>

    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {crustOptions.map((crust) => (
        <button
          key={crust}
          onClick={() => setSelectedCrust(crust)}
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: selectedCrust === crust ? "#E91E28" : "#eee",
            color: selectedCrust === crust ? "white" : "#333",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          {crust}
        </button>
      ))}
    </div>
  </div>
</div>


          {/* Section 3 - Sauce */}
          <div style={{ marginBottom: "1.5rem" }}>
  <div
    style={{
      background: "#E91E28",
      color: "white",
      padding: "0.5rem 0.75rem",
      fontWeight: "bold",
      borderRadius: "0px 0px 0 0"
    }}
  >
    3. Sauce
  </div>
  <div style={{ padding: "1rem", background: "#f9f9f9" }}>
    <label style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
      <input
        type="checkbox"
        checked={sauceEnabled}
        onChange={() => setSauceEnabled(!sauceEnabled)}
        style={{ marginRight: "0.5rem" }}
      />
      Sauce
    </label>

    {sauceEnabled && (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {sauceOptions.map((sauce) => (
            <label key={sauce} style={{ fontWeight: "500" }}>
              <input
                type="radio"
                name="sauce"
                value={sauce}
                checked={selectedSauce === sauce}
                onChange={() => setSelectedSauce(sauce)}
                style={{ marginRight: "0.5rem" }}
              />
              {sauce}
            </label>
          ))}
        </div>

        {/* Sauce amount dropdown */}
        <div>
          <label style={{ fontWeight: "500", marginRight: "0.5rem" }}>
            Amount:
          </label>
          <select
            value={sauceAmount}
            onChange={(e) => setSauceAmount(e.target.value)}
          >
            <option value="Less">Less</option>
            <option value="Normal">Normal</option>
            <option value="Extra">Extra</option>
          </select>
        </div>
      </div>
    )}
  </div>
</div>


          {/* Section 4 - Toppings */}
          <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ background: "#E91E28", color: "white", padding: "0.5rem 0.75rem", fontWeight: "bold", borderRadius: "0px 0px 0 0" }}>
                4. Toppings
              </div>
              <div style={{ padding: "1rem", background: "#f9f9f9" }}>
                <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Choose Meats</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {meats.map((topping) => (
                    <div key={topping} style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedToppings.includes(topping)}
                          onChange={() => handleToppingToggle(topping)}
                          style={{ marginRight: "0.5rem" }}
                        />
                        {topping}
                      </label>
                      {selectedToppings.includes(topping) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                          {coverageIcons.map(({ value, label }) => (
                            <span
                              key={value}
                              onClick={() =>
                                setToppingPlacement({ ...toppingPlacement, [topping]: value })
                            }
                            style={{
                              fontSize: "1.5rem",
                              color: toppingPlacement[topping] === value ? "#E91E28" : "#999",
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </span>
                        ))}
                        <select
                          value={toppingAmount[topping] || "Normal"}
                          onChange={(e) =>
                            setToppingAmount({ ...toppingAmount, [topping]: e.target.value })
                          }
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

                <p style={{ fontWeight: "bold", marginBottom: "0.5rem", marginTop: "1rem" }}>Choose Veggies</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {veggies.map((topping) => (
                    <div key={topping} style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedToppings.includes(topping)}
                          onChange={() => handleToppingToggle(topping)}
                          style={{ marginRight: "0.5rem" }}
                        />
                        {topping}
                      </label>
                      {selectedToppings.includes(topping) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                          {coverageIcons.map(({ value, label }) => (
                            <span
                              key={value}
                              onClick={() =>
                                setToppingPlacement({ ...toppingPlacement, [topping]: value })
                            }
                            style={{
                              fontSize: "1.5rem",
                              color: toppingPlacement[topping] === value ? "#E91E28" : "#999",
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </span>
                        ))}
                        <select
                          value={toppingAmount[topping] || "Normal"}
                          onChange={(e) =>
                            setToppingAmount({ ...toppingAmount, [topping]: e.target.value })
                          }
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
            </div>
          </div>

          {/* Section 5 - Dipping Sauces */}
          <div style={{ marginBottom: "1.5rem" }}>
  <div style={{ background: "#E91E28", color: "white", padding: "0.5rem 0.75rem", fontWeight: "bold", borderRadius: "0px 0px 0 0" }}>
    5. Dipping Sauces
  </div>
  <div style={{ background: "#f9f9f9" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontWeight: "bold" }}>Signature Garlic Dip</span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          onClick={() => setDipQty(prev => Math.max(prev - 1, 0))}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: dipQty > 0 ? "#E91E28" : "#ddd",
            color: dipQty > 0 ? "white" : "#999",
            border: "none",
            cursor: dipQty > 0 ? "pointer" : "default",
            fontWeight: "bold"
          }}
        >
          −
        </button>
        <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "bold" }}>{dipQty}</span>
        <button
          onClick={() => setDipQty(prev => prev + 1)}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "#E91E28",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          +
        </button>
      </div>
    </div>
  </div>
</div>
          {/* Section 6 - Special Instructions */}
          <div style={{ marginBottom: "1.5rem" }}>
  <div style={{ background: "#E91E28", color: "white", padding: "0.5rem 0.75rem", fontWeight: "bold", borderRadius: "0px 0px 0 0" }}>
    6. Special Instructions
  </div>
  <div style={{ padding: "1rem", background: "#f9f9f9", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    
    {/* Bake Options */}
    <div>
      <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Bake</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label>
          <input type="radio" name="bake" value="light" checked={bake === "light"} onChange={() => setBake("light")} style={{ marginRight: "0.5rem" }} />
          Lightly done
        </label>
        <label>
          <input type="radio" name="bake" value="normal" checked={bake === "normal"} onChange={() => setBake("normal")} style={{ marginRight: "0.5rem" }} />
          Normal bake
        </label>
        <label>
          <input type="radio" name="bake" value="well" checked={bake === "well"} onChange={() => setBake("well")} style={{ marginRight: "0.5rem" }} />
          Well done
        </label>
      </div>
    </div>

    {/* Oregano Options */}
    <div>
      <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Oregano</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label>
          <input type="radio" name="oregano" value="with" checked={oregano === "with"} onChange={() => setOregano("with")} style={{ marginRight: "0.5rem" }} />
          With oregano
        </label>
        <label>
          <input type="radio" name="oregano" value="without" checked={oregano === "without"} onChange={() => setOregano("without")} style={{ marginRight: "0.5rem" }} />
          Without oregano
        </label>
      </div>
    </div>

    {/* Spice It Up Options */}
    <div>
      <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Spice it up</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label>
          <input type="radio" name="spice" value="with" checked={crushedRedPepper === "with"} onChange={() => setCrushedRedPepper("with")} style={{ marginRight: "0.5rem" }} />
          With crushed red peppers
        </label>
        <label>
          <input type="radio" name="spice" value="without" checked={crushedRedPepper === "without"} onChange={() => setCrushedRedPepper("without")} style={{ marginRight: "0.5rem" }} />
          Without crushed red peppers
        </label>
      </div>
    </div>

  </div>
</div>
        </div>

        {/* Right section - Order summary */}
        <div>
          <div style={{ position: "sticky", top: "1rem", background: "#f8f8f8", padding: "0" }}>
            <div style={{ background: "#E91E28", color: "white", padding: "0.6rem 1rem", fontWeight: "bold", borderRadius: "0px 0px 0 0" }}>
              
              My Pizza
            </div>
            <div style={{ padding: "1rem", background: "#f9f9f9" }}>
              <p><strong>Size:</strong> {selectedSize}" ({sizes.find(s => s.size === selectedSize)?.label})</p>
              <p><strong>Crust:</strong> {selectedCrust}</p>
              <p><strong>Cheese:</strong> {cheeseIncluded ? `${cheeseCoverage} - ${cheeseAmount}` + (secondCoverage ? ` / ${secondCoverage} - ${secondAmount}` : "") : "No Cheese"}</p>
               <p><strong>Sauce:</strong>{" "}{sauceEnabled? `${selectedSauce} (${sauceAmount})`: "No Sauce"}</p>

              {selectedToppings.length > 0 && (
                <>
                  <p style={{ fontWeight: "bold", marginTop: "1rem" }}>Toppings:</p>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    {selectedToppings.map(t => (
                      <li key={t}>
                        {t} — {toppingPlacement[t]} / {toppingAmount[t] || "Normal"}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {dipQty > 0 && (
                <p style={{ marginTop: "1rem" }}><strong>Dips:</strong> Signature Garlic Dip × {dipQty}</p>
              )}

              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontWeight: "bold" }}>Special Instructions:</p>
                <div style={{ paddingLeft: "1.2rem", margin: 0 }}>
                  <div><span>Bake:</span> {bake === "normal" ? "Normal Bake" : bake === "light" ? "Lightly Done" : "Well Done"}</div>
                  <div><span>Oregano:</span> {oregano === "with" ? "With Oregano" : "Without Oregano"}</div>
                  <div><span>Crushed Red Peppers:</span> {crushedRedPepper === "with" ? "With" : "Without"}</div>
                </div>
              </div>

              <div style={{ margin: "1rem 0" }}>
                <label>Quantity:</label>
                <input type="number" min={1} defaultValue={1} style={{ width: "60px", marginLeft: "0.5rem" }} />
              </div>
              <button style={{ width: "100%", padding: "1rem", backgroundColor: "#E91E28", color: "white", fontWeight: "bold", border: "none", borderRadius: "0px", fontSize: "1rem", cursor: "pointer" }}>
                Add To Order
              </button>
              <div style={{ position: "relative", width: 300, height: 315, margin: "0 auto 1rem" }}>
<canvas
  id="pizza_preview"
  width="300"
  height="315"
  style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
></canvas>
</div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
