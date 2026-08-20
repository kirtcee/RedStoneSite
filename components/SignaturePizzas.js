import { useState } from "react";
import PizzaBuilder from "../components/PizzaBuilder";
import { priceLineItem } from "../components/Pricing";
import { useCart } from "../components/CartSystem";
import DebugPizzaOverlay from "../components/modals/DebugPizzaOverlay";

const signaturePizzas = [
  { name: "Greek",           toppings: ["Onion", "Black Olives", "Tomato", "Spinach", "Feta Cheese"] },
  { name: "Bourbon",         toppings: ["BBQ Chicken", "Onion", "Green Pepper", "BBQ Drizzle"], base: "BBQ Base" },
  { name: "Shawarma",        toppings: ["Shawarma Chicken", "Onion", "Pickle", "Tomato", "Sumac Seasoning"], base: "Garlic Base" },
  { name: "All-Star",        toppings: ["Pepperoni", "Mushroom", "Real Bacon", "Green Pepper", "Onion"] },
  { name: "Butter Chicken",  toppings: ["Butter Chicken", "Green Pepper", "Onion", "Tomato", "Ginger", "Coriander"], base: "Butter Chicken Base" },
  { name: "Shahi Paneer",    toppings: ["Shahi Paneer", "Green Pepper", "Onion", "Tomato", "Ginger", "Coriander"], base: "Shahi Paneer Base" },
  { name: "Mexican",         toppings: ["Onion", "Beef", "Jalapeno", "Tomato"] },
  { name: "Sizzler",         toppings: ["Grilled Chicken", "Onion", "Real Bacon", "Chipotle Mayo Drizzle"], base: "BBQ Base" },
  { name: "Loaded Veggie",   toppings: ["Green Pepper", "Mushroom", "Onion", "Tomato", "Corn", "Black Olives"] }
];

const DEFAULT_SIZE = "12";
const sizeLabel = (s) =>
  ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(s)] || s);

export default function SignaturePizzasPage() {
  const { addItem } = useCart();
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderData, setBuilderData] = useState({});
  const [allowed, setAllowed] = useState([]);

  const openCustomize = (pizza) => {
    setBuilderData({
      size: DEFAULT_SIZE,
      crust: "Original Hand Tossed",
      cheeseIncluded: true,
      cheeseCoverage: "full",
      cheeseAmount: "Normal",
      sauceEnabled: true,
      sauce: pizza.base || "Pizza Sauce",
      sauceAmount: "Normal",
      toppings: pizza.toppings,
      pizzaName: pizza.name
    });
    setAllowed(pizza.toppings);
    setShowBuilder(true);
  };

  return (
    <div className="feast feast--edge">
      <section className="feast__grid">
        {signaturePizzas.map((pizza) => {
          const slug = pizza.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <article key={pizza.name} className="feastCard">
              {/* Stretched image to card width (intentionally breaks aspect) */}
              <div className="feastCard__imgWrap">
                <img
                  className="feastCard__img"
                  src={`/images/signature/${slug}.jpg`}
                  alt={pizza.name}
                  loading="lazy"
                />
              </div>

              <button
                type="button"
                className="feastCard__name"
                onClick={() => openCustomize(pizza)}
                title={pizza.name}
              >
                {pizza.name}
              </button>

              <button
                type="button"
                className="btn btn-add"
                onClick={() => {
                  const payload = {
                    type: "pizza-specialty",
                    style: "signature",
                    name: pizza.name,
                    size: DEFAULT_SIZE,
                    qty: 1,
                    summary: `${sizeLabel(DEFAULT_SIZE)} • ${pizza.name}`
                  };
                  payload.lineSubtotalCents = priceLineItem({
                    type: "pizza-specialty",
                    style: "signature",
                    name: pizza.name,
                    size: DEFAULT_SIZE,
                    qty: 1
                  });
                  addItem(payload);
                }}
              >
                ADD TO ORDER
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => openCustomize(pizza)}
              >
                CUSTOMIZE
              </button>

              <p className="feastCard__desc">{pizza.toppings.join(", ")}</p>
            </article>
          );
        })}
      </section>

      <DebugPizzaOverlay
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        mode="portal"
        blockRogue
      >
        <PizzaBuilder
          presetToppings={builderData.toppings}
          initialData={builderData}
          pizzaName={builderData.pizzaName}
          allowedToppings={allowed}
          onSave={(payload) => {
            addItem(payload);
            setShowBuilder(false);
          }}
        />
      </DebugPizzaOverlay>


      <style jsx>{`
        :global(:root){
          --brand-blue: #006491;
          --red: #e91e28;
        }

        /* Align with .menu-title by offsetting the card padding + 1px border */
        .feast--edge { margin-left: calc(-1rem - 1px); margin-right: calc(-1rem - 1px); }
        @media (max-width: 520px){
          .feast--edge { margin-left: -1rem; margin-right: -1rem; }
        }

        .feast__grid{
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          column-gap: 16px;
          row-gap: 14px;
          align-items: start;
          padding: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .feastCard{
          display: flex;
          flex-direction: column;
          align-items: stretch;
          min-width: 0;
        }

        /* Stretched image: full width, 133px tall */
        .feastCard__imgWrap{
          width: 100%;
          height: 133px;
          margin: 0 0 8px 0;
          background: #fff;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #e9e9e9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .feastCard__img{
          display: block;
          width: 100%;
          height: 100%;
          object-fit: fill; /* break aspect ratio to fill */
        }

        .feastCard__name{
          margin: 6px 0 10px;
          padding: 0;
          background: none;
          border: 0;
          color: var(--brand-blue);
          font-family: var(--font-heading, Oswald, sans-serif);
          font-weight: 900;
          font-size: 1.02rem;
          text-align: left;
          cursor: pointer;
        }
        .feastCard__name:hover{ text-decoration: underline; }

        .btn{
          display: block;
          width: 100%;
          padding: 0.48rem 1.5rem;  /* short height, wide look */
          font-family: var(--font-heading, Oswald, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
          cursor: pointer;
          border-radius: 4px;
        }
        .btn + .btn{ margin-top: 8px; }

        .btn-add{
          background: var(--red);
          color: #fff;
          border: none;
        }
        .btn-add:hover{ filter: brightness(0.96); }

        .btn-outline{
          background: #fff;
          border: 3px solid var(--brand-blue);
          color: var(--brand-blue);
        }
        .btn-outline:hover{ background: #f4f9ff; }

        .feastCard__desc{
          margin: 8px 0 2px;
          color: #333;
          font-size: .9rem;
          line-height: 1.33;
          text-align: left;
          word-break: break-word;
        }

        @media (max-width: 1100px){ .feast__grid{ grid-template-columns: repeat(3, minmax(0,1fr)); } }
        @media (max-width: 800px){  .feast__grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 520px){  .feast__grid{ grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
