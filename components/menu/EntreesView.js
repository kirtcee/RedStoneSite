// components/menu/EntreesView.js
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import SignaturePizzas from "../SignaturePizzas";
import SpecialtyPizzas from "../SpecialtyPizzas";
import SpecialMenuPortal from "../modals/SpecialMenuPortal";
import ComboBuilderPortal from "../modals/ComboBuilderPortal";
import { comboSections, comboThumbFor } from "../ComboBuilder";

// Use Next dynamic for client-only Wings (avoids SSR element-type errors)
const WingsBuilder = dynamic(() => import("../WingsBuilder"), {
  ssr: false,
  loading: () => <div className="card">Loading wings…</div>,
});

export default function EntreesView({ sub, setTabSub, onOpenBuilder, onCustomizePizza, onAddToCart }) {
  const handledBuildRef = useRef(false);

  useEffect(() => {
    if (sub === "build" && !handledBuildRef.current) {
      handledBuildRef.current = true;
      // Push back to 'all' first, then open the modal
      setTabSub({ tab: "entrees", sub: "all" });
      onOpenBuilder();
    }
    if (sub !== "build") {
      // reset the guard when user navigates away
      handledBuildRef.current = false;
    }
  }, [sub, setTabSub, onOpenBuilder]);

  if (sub === "all") return null;

  if (sub === "signature") {
    return (
      <div className="card">
        <SignaturePizzas onCustomize={onCustomizePizza} />
      </div>
    );
  }

  if (sub === "specialty") {
    return (
      <div className="card">
        <SpecialtyPizzas onCustomize={onCustomizePizza} />
      </div>
    );
  }

  if (sub === "wings") {
    return (
      <div className="card" style={{ overflow: "visible", padding: "1rem 1rem 2rem" }}>
        <div className="feast--edge">
          <WingsBuilder onClose={() => {}} onAdd={(item) => onAddToCart?.(item)} />
        </div>
      </div>
    );
  }

  if (sub === "combos") {
    const [openComboId, setOpenComboId] = useState(null);
    return (
      <div className="card" style={{ padding: "1rem 1rem 2rem" }}>
        <div className="feast feast--edge">
          {comboSections.map((section) => (
            <div key={section.type} style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>{section.type}</h2>
              <section className="feast__grid feast__grid--three">
                {section.combos.map((combo) => (
                  <article key={combo.id} className="feastCard">
                    <div className="feastCard__imgWrap">
                      <img
                        className="feastCard__img"
                        src={comboThumbFor(combo.id)}
                        alt={combo.name}
                        loading="lazy"
                      />
                    </div>
                    <button
                      type="button"
                      className="feastCard__name"
                      onClick={() => setOpenComboId(combo.id)}
                      title={combo.name}
                    >
                      {combo.name}
                    </button>
                    <button
                      type="button"
                      className="btn btn-add"
                      onClick={() => setOpenComboId(combo.id)}
                    >
                      ADD TO ORDER
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setOpenComboId(combo.id)}
                    >
                      CUSTOMIZE
                    </button>
                    <p className="feastCard__desc">{combo.subtitle}</p>
                  </article>
                ))}
              </section>
            </div>
          ))}
        </div>

        <ComboBuilderPortal
          openComboId={openComboId}
          onAdd={(p) => onAddToCart?.(p)}
          onClose={() => setOpenComboId(null)}
        />
      </div>
    );
  }

  if (sub === "special") {
    const [selectedSpecialItem, setSelectedSpecialItem] = useState(null);
    const cards = [
      {
        key: "panzerotti",
        name: "Panzerotti",
        desc: "Golden-fried turnover stuffed with your choice of toppings.",
        img: "/images/special-menu/panzerotti.jpg",
      },
      {
        key: "pizza-sub",
        name: "Pizza Sub",
        desc: "Toasted roll with sauce & cheese. Customize with pizza toppings.",
        img: "/images/special-menu/pizza-sub.jpg",
      },
      {
        key: "meatball-sub",
        name: "Meatball Sub",
        desc: "Classic meatballs with sauce & cheese on a toasted roll.",
        img: "/images/special-menu/meatball-sub.jpg",
      },
    ];

    return (
      <div className="card" style={{ padding: "1rem 1rem 2rem" }}>
        <div className="feast feast--edge">
          <section className="feast__grid feast__grid--three">
            {cards.map((it) => (
              <article key={it.key} className="feastCard">
                <div className="feastCard__imgWrap">
                  <img className="feastCard__img" src={it.img} alt={it.name} loading="lazy" />
                </div>

                <button
                  type="button"
                  className="feastCard__name"
                  onClick={() => setSelectedSpecialItem(it.key)}
                  title={it.name}
                >
                  {it.name}
                </button>

                <button
                  type="button"
                  className="btn btn-add"
                  onClick={() => setSelectedSpecialItem(it.key)}
                >
                  ADD TO ORDER
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedSpecialItem(it.key)}
                >
                  CUSTOMIZE
                </button>

                <p className="feastCard__desc">{it.desc}</p>
              </article>
            ))}
          </section>
        </div>

        <SpecialMenuPortal
          open={!!selectedSpecialItem}
          itemType={selectedSpecialItem}
          onAdd={(p) => onAddToCart?.(p)}
          onClose={() => setSelectedSpecialItem(null)}
        />
      </div>
    );
  }

  return null;
}
