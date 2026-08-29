// components/SidesDessertsAll.jsx
import React, { useState } from "react";
import { useCart } from "./CartSystem";
import { priceLineItem } from "./Pricing";

// Sides with a plain size choice (no gravy/dip decisions needed) get a
// direct-add size picker instead of always opening the full builder.
// Pricing keys use "Medium" for what the builder UI calls "Regular".
// Colors follow the same light-to-dark size progression as the pizza cards.
const SEG_S = "#e57373";
const SEG_R = "#e91e28";
const SEG_L = "#b71c1c";
const SIDE_SIZES = {
  "French Fries":     [{ size: "Regular", abbr: "R", color: SEG_R }, { size: "Large", abbr: "L", color: SEG_L }],
  "Poutine":          [{ size: "Small", abbr: "S", color: SEG_S }, { size: "Regular", abbr: "R", color: SEG_R }, { size: "Large", abbr: "L", color: SEG_L }],
  "Shawarma Poutine": [{ size: "Regular", abbr: "R", color: SEG_R }, { size: "Large", abbr: "L", color: SEG_L }],
  "Onion Rings":      [{ size: "Regular", abbr: "R", color: SEG_R }, { size: "Large", abbr: "L", color: SEG_L }],
};
const sizeToPricingLabel = (size) => (size === "Regular" ? "Medium" : size);

/**
 * Only this view (Sides → View All) should use the alternate wings image.
 * The front menu tile keeps using /images/menu_wings.png.
 */
const IMG_WINGS_VIEWALL  = "/images/sd_wings.png";   // 👈 alternate wings image

export default function SidesDessertsAll({
  onOpenSide,             // (sideName: string) => void
  onOpenWings,            // () => void
}) {
  const { addItem } = useCart();
  const [sizePickerFor, setSizePickerFor] = useState(null);

  const addSideAtSize = (side, size) => {
    const name = `${side} (${sizeToPricingLabel(size)})`;
    const payload = {
      type: "side",
      name,
      side,
      size,
      qty: 1,
      summary: `1 × ${side} (${size})`,
    };
    payload.lineSubtotalCents = priceLineItem(payload);
    addItem(payload);
    setSizePickerFor(null);
  };
  /* ----- Data lists (use names your builders understand) ----- */
  const SIDES = [
    { key: "French Fries",       name: "French Fries",       img: "/images/sides/fries.jpg",               desc: "Crispy golden fries." },
    { key: "Poutine",            name: "Poutine",            img: "/images/sides/poutine.jpg",             desc: "Fries, cheese curds & gravy." },
    { key: "Shawarma Poutine",   name: "Shawarma Poutine",   img: "/images/sides/shawarma-poutine.jpg",    desc: "Loaded shawarma poutine." },
    { key: "Onion Rings",        name: "Onion Rings",        img: "/images/sides/onion-rings.jpg",         desc: "Crispy battered rings." },
    { key: "Cheesy Garlic Bread",name: "Cheesy Garlic Bread",img: "/images/sides/cheesy-garlic-bread.jpg", desc: "Buttery garlic, lots of cheese." },
    { key: "Garlic Bread",       name: "Garlic Bread",       img: "/images/sides/garlic-bread.jpg",        desc: "Toasty classic garlic bread." },
  ];

  const handleWings = () => {
    if (onOpenWings) return onOpenWings();
    if (typeof window !== "undefined") {
      window.location.href = "/menu?tab=entrees&sub=wings";
    }
  };

  return (
    <div className="stack" style={{ display: "grid", gap: "16px" }}>
      {/* ===== Sides ===== */}
      <section className="card" style={{ padding: "1rem 1rem 1.25rem" }}>
        <h2 style={{ margin: "0 0 0.75rem 0" }}>Sides</h2>

        <div className="feast feast--edge">
          <section className="feast__grid feast__grid--four">
            {SIDES.map((it) => (
              <article key={it.key} className="feastCard">
                <div className="feastCard__imgWrap">
                  <img className="feastCard__img" src={it.img} alt={it.name} loading="lazy" />
                </div>

                <button
                  type="button"
                  className="feastCard__name"
                  onClick={() => onOpenSide?.(it.key)}
                  title={it.name}
                >
                  {it.name}
                </button>

                {SIDE_SIZES[it.key] ? (
                  sizePickerFor === it.key ? (
                    <div className="btn btn-add btn-add--split" role="group" aria-label={`Choose a size for ${it.name}`}>
                      {SIDE_SIZES[it.key].map((s) => (
                        <button
                          key={s.size}
                          type="button"
                          className="btn-add__seg"
                          style={{ background: s.color }}
                          onClick={() => addSideAtSize(it.key, s.size)}
                          title={s.size}
                        >
                          {s.abbr}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button type="button" className="btn btn-add" onClick={() => setSizePickerFor(it.key)}>
                      ADD TO ORDER
                    </button>
                  )
                ) : (
                  <button type="button" className="btn btn-add" onClick={() => onOpenSide?.(it.key)}>
                    CHOOSE OPTIONS
                  </button>
                )}

                {SIDE_SIZES[it.key] && (
                  <button type="button" className="btn btn-outline" onClick={() => onOpenSide?.(it.key)}>
                    CUSTOMIZE
                  </button>
                )}

                {it.desc ? <p className="feastCard__desc">{it.desc}</p> : null}
              </article>
            ))}
          </section>
        </div>
      </section>

      {/* ===== Wings ===== */}
      <section className="card" style={{ padding: "1rem 1rem 1.25rem" }}>
        <h2 style={{ margin: "0 0 0.75rem 0" }}>Wings</h2>

        <div className="feast feast--edge">
          <section className="feast__grid feast__grid--four">
            <article className="feastCard">
              <div className="feastCard__imgWrap">
                <img className="feastCard__img" src={IMG_WINGS_VIEWALL} alt="Wings" loading="lazy" />
              </div>

              <button type="button" className="feastCard__name" onClick={handleWings} title="Wings">
                Wings
              </button>

              <button type="button" className="btn btn-add" onClick={handleWings}>
                CHOOSE OPTIONS
              </button>

              <p className="feastCard__desc">Sauced or dry-rubbed. Customize in the wings panel.</p>
            </article>
          </section>
        </div>
      </section>

      {/* ===== Scoped feast styles (identical to your pizza sections) ===== */}
      <style jsx>{`
        :global(:root) {
          --brand-blue: #000000;
          --red: #8b1a1a;
          --light-border: #d9c49c;
        }

        .feast--edge {
          margin-left: calc(-1rem - 1px);
          margin-right: calc(-1rem - 1px);
        }
        @media (max-width: 520px) {
          .feast--edge {
            margin-left: -1rem;
            margin-right: -1rem;
          }
        }

        .feast__grid {
          display: grid;
          column-gap: 16px;
          row-gap: 14px;
          align-items: start;
        }
        .feast__grid--four {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        @media (max-width: 1100px) {
          .feast__grid--four { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 800px) {
          .feast__grid--four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 520px) {
          .feast__grid--four { grid-template-columns: 1fr; }
        }

        .feastCard {
          display: flex;
          flex-direction: column;
          background: #fdf7f0;
          border: 1px solid var(--light-border);
          border-radius: .1875rem;
          padding: 12px;
        }

        .feastCard__imgWrap {
          width: 100%;
          height: 133px;
          border-radius: 4px;
          overflow: hidden;
        }
        .feastCard__img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: fill; /* match your reference stretch */
        }

        .feastCard__name {
          margin: 8px 0 10px;
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
        .feastCard__name:hover { text-decoration: underline; }

        .btn {
          display: block;
          width: 100%;
          padding: 0.52rem 1.2rem;
          font-family: var(--font-heading, Oswald, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn + .btn { margin-top: 8px; }

        .btn-add { background: var(--red); color: #fff; border: none; }
        .btn-add:hover { filter: brightness(0.96); }

        .btn-add--split{
          display: flex;
          gap: 6px;
          padding: 0;
          background: transparent;
          overflow: visible;
        }
        .btn-add__seg{
          flex: 1;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 0.52rem 0.2rem;
          font-family: var(--font-heading, Oswald, sans-serif);
          font-weight: 900;
          letter-spacing: .45px;
          cursor: pointer;
          transition: transform 0.08s ease, filter 0.12s ease;
        }
        .btn-add__seg:hover{ filter: brightness(1.1); transform: translateY(-1px); }

        .btn-outline {
          background: #fff;
          border: 3px solid var(--brand-blue);
          color: var(--brand-blue);
        }
        .btn-outline:hover { background: #f4f9ff; }

        .feastCard__desc {
          margin: 10px 0 2px;
          color: #6b3f22;
          font-size: 0.9rem;
          line-height: 1.33;
        }
      `}</style>
    </div>
  );
}
