import { useState } from "react";
import PizzaBuilder from "../components/PizzaBuilder";
import { priceLineItem } from "../components/Pricing";
import { useCart } from "../components/CartSystem";
import DebugPizzaOverlay from "../components/modals/DebugPizzaOverlay";

const specialtyPizzas = [
  { name: "Deluxe",       toppings: ["Pepperoni", "Mushroom", "Green Pepper"] },
  { name: "Hawaiian",     toppings: ["Pineapple", "Bacon Crumble", "Ham"] },
  { name: "Veggie Lover", toppings: ["Mushroom", "Green Pepper", "Onion"] },
  { name: "Meat Lover",   toppings: ["Pepperoni", "Hot Italian Sausage", "Bacon Crumble"] },
  { name: "Canadian",     toppings: ["Pepperoni", "Mushroom", "Real Bacon"] }
];

const DEFAULT_SIZE = "12";
const sizeLabel = (s) =>
  ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(s)] || s);

export default function SpecialtyPizzasPage() {
  const { addItem } = useCart();
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderData, setBuilderData] = useState({});

  const openCustomize = (pizza) => {
    const size = DEFAULT_SIZE;
    setBuilderData({
      size,
      crust: "Original Hand Tossed",
      cheeseIncluded: true,
      cheeseCoverage: "full",
      cheeseAmount: "Normal",
      sauceEnabled: true,
      sauce: "Pizza Sauce",
      sauceAmount: "Normal",
      toppings: pizza.toppings,
      pizzaName: pizza.name
    });
    setShowBuilder(true);
  };

  return (
    <div className="feast feast--edge">
      <section className="feast__grid">
        {specialtyPizzas.map((pizza) => {
          const slug = pizza.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <article key={pizza.name} className="feastCard">
              {/* Stretched image: full card width, fixed height; aspect ratio intentionally broken */}
              <div className="feastCard__imgWrap">
                <img
                  className="feastCard__img"
                  src={`/images/specialty/${slug}.jpg`}
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

              {/* wide + short buttons */}
              <button
                type="button"
                className="btn btn-add"
                onClick={() => {
                  const payload = {
                    type: "pizza-specialty",
                    style: "classic",
                    name: pizza.name,
                    size: DEFAULT_SIZE,
                    qty: 1,
                    summary: `${sizeLabel(DEFAULT_SIZE)} • ${pizza.name}`
                  };
                  payload.lineSubtotalCents = priceLineItem({
                    type: "pizza-specialty",
                    style: "classic",
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

        /* Align left/right edges with .menu-title (account for card padding + 1px border) */
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

        /* STRETCHED IMAGE
           - width: 100% of card
           - fixed height (133px)
           - object-fit: fill to break aspect ratio on purpose */
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
          object-fit: fill; /* <-- stretch to fit width, break aspect ratio */
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
          padding: 0.48rem 1.5rem;   /* short height, wide feel */
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
