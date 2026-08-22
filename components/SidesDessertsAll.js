// components/SidesDessertsAll.jsx
import React from "react";

/**
 * Only this view (Sides → View All) should use the alternate images.
 * The front menu tiles keep using /images/menu_wings.png and /images/menu_drinks.png.
 */
const IMG_WINGS_VIEWALL  = "/images/sd_wings.png";   // 👈 alternate wings image
const IMG_DRINKS_VIEWALL = "/images/sd_drinks.png";  // 👈 alternate drinks image

export default function SidesDessertsAll({
  onOpenSide,             // (sideName: string) => void
  onOpenWings,            // () => void
  onOpenDrinksCategory,   // (id: 'twoLiters'|'cans'|'other'|'dips') => void
}) {
  /* ----- Data lists (use names your builders understand) ----- */
  const SIDES = [
    { key: "French Fries",       name: "French Fries",       img: "/images/sides/fries.jpg",               desc: "Crispy golden fries." },
    { key: "Poutine",            name: "Poutine",            img: "/images/sides/poutine.jpg",             desc: "Fries, cheese curds & gravy." },
    { key: "Shawarma Poutine",   name: "Shawarma Poutine",   img: "/images/sides/shawarma-poutine.jpg",    desc: "Loaded shawarma poutine." },
    { key: "Onion Rings",        name: "Onion Rings",        img: "/images/sides/onion-rings.jpg",         desc: "Crispy battered rings." },
    { key: "Cheesy Garlic Bread",name: "Cheesy Garlic Bread",img: "/images/sides/cheesy-garlic-bread.jpg", desc: "Buttery garlic, lots of cheese." },
    { key: "Garlic Bread",       name: "Garlic Bread",       img: "/images/sides/garlic-bread.jpg",        desc: "Toasty classic garlic bread." },
  ];

  const DRINK_BUCKETS = [
    { id: "twoLiters", label: "2L Bottles" },
    { id: "cans",      label: "Cans" },
    { id: "other",     label: "Other Drinks" },
    { id: "dips",      label: "Dips" },
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

                <button type="button" className="btn btn-add" onClick={() => onOpenSide?.(it.key)}>
                  ADD TO ORDER
                </button>

                <button type="button" className="btn btn-outline" onClick={() => onOpenSide?.(it.key)}>
                  CUSTOMIZE
                </button>

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
                ADD TO ORDER
              </button>

              <button type="button" className="btn btn-outline" onClick={handleWings}>
                CUSTOMIZE
              </button>

              <p className="feastCard__desc">Sauced or dry-rubbed. Customize in the wings panel.</p>
            </article>
          </section>
        </div>
      </section>

      {/* ===== Drinks & Dips ===== */}
      <section className="card" style={{ padding: "1rem 1rem 1.25rem" }}>
        <h2 style={{ margin: "0 0 0.75rem 0" }}>Drinks &amp; Dips</h2>

        <div className="feast feast--edge">
          <section className="feast__grid feast__grid--four">
            {DRINK_BUCKETS.map(({ id, label }) => (
              <article key={id} className="feastCard">
                <div className="feastCard__imgWrap">
                  <img className="feastCard__img" src={IMG_DRINKS_VIEWALL} alt={label} loading="lazy" />
                </div>

                <button
                  type="button"
                  className="feastCard__name"
                  onClick={() => onOpenDrinksCategory?.(id)}
                  title={label}
                >
                  {label}
                </button>

                <button type="button" className="btn btn-add" onClick={() => onOpenDrinksCategory?.(id)}>
                  ADD TO ORDER
                </button>

                <button type="button" className="btn btn-outline" onClick={() => onOpenDrinksCategory?.(id)}>
                  CUSTOMIZE
                </button>

                <p className="feastCard__desc">
                  Pick your favourites and add the perfect dip.
                </p>
              </article>
            ))}
          </section>
        </div>
      </section>

      {/* ===== Scoped feast styles (identical to your pizza sections) ===== */}
      <style jsx>{`
        :global(:root) {
          --brand-blue: #006491;
          --red: #e91e28;
          --light-border: #e9e9e9;
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

        .feastCard { display: flex; flex-direction: column; }

        .feastCard__imgWrap {
          width: 100%;
          height: 133px;
          background: #fff;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--light-border);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

        .btn-outline {
          background: #fff;
          border: 3px solid var(--brand-blue);
          color: var(--brand-blue);
        }
        .btn-outline:hover { background: #f4f9ff; }

        .feastCard__desc {
          margin: 10px 0 2px;
          color: #333;
          font-size: 0.9rem;
          line-height: 1.33;
        }
      `}</style>
    </div>
  );
}
