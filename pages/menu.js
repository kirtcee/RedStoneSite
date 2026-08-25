// pages/menu.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Core builder & sections
import PizzaBuilder from "../components/PizzaBuilder";
import SideSelector from "../components/SideSelector";
import SideBuilder from "../components/SideBuilder";
import SpecialtyPizzas from "../components/SpecialtyPizzas";
import SignaturePizzas from "../components/SignaturePizzas";
import ComboBuilder, { comboSections, comboThumbFor } from "../components/ComboBuilder";
import SpecialMenuBuilder from "../components/SpecialMenuBuilder";
import SidesDessertsAll from "../components/SidesDessertsAll";
import { DrinksCategoryPanel } from "../components/DrinksDipsBuilder";
import { CartSidebar, CartToggle, useCart } from "../components/CartSystem";
import { formatMoney } from "../components/Pricing";

// Hardened portal overlay (stable nested scroller)
import DebugPizzaOverlay from "../components/modals/DebugPizzaOverlay";

// Dynamic wings (client-only)
const WingsBuilder = dynamic(() => import("../components/WingsBuilder"), {
  ssr: false,
  loading: () => <div className="card">Loading wings…</div>,
});

/* ---------- Inline tab views (no popups except Pizza Builder) ---------- */
function EntreesView({
  sub,
  setTabSub,
  onOpenBuilder,
  onCustomizePizza,
  selectedSpecialItem,
  setSelectedSpecialItem,
  onAddToCart,
}) {
  useEffect(() => {
    if (sub === "build") {
      onOpenBuilder();
      setTabSub({ tab: "entrees", sub: "all" });
    }
  }, [sub, onOpenBuilder, setTabSub]);

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
          <WingsBuilder
            onClose={() => {}}
            onAdd={(item) => onAddToCart?.(item)}
            addToCartDirect={false}
          />
        </div>

        <style jsx>{`
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
        `}</style>
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

        <style jsx>{`
          :global(:root){ --brand-blue:#006491; --red:#e91e28; --light-border:#e9e9e9; }
          .feast--edge{ margin-left:calc(-1rem - 1px); margin-right:calc(-1rem - 1px); }
          @media (max-width:520px){ .feast--edge{ margin-left:-1rem; margin-right:-1rem; } }
          .feast__grid{ display:grid; column-gap:16px; row-gap:14px; align-items:start; }
          .feast__grid--three{ grid-template-columns:repeat(3,minmax(0,1fr)); }
          @media (max-width:800px){ .feast__grid--three{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
          @media (max-width:520px){ .feast__grid--three{ grid-template-columns:1fr; } }
          .feastCard{ display:flex; flex-direction:column; }
          .feastCard__imgWrap{
            width:100%; height:133px; background:#fff; border-radius:4px; overflow:hidden;
            border:1px solid var(--light-border); box-shadow:0 2px 8px rgba(0,0,0,0.08);
          }
          .feastCard__img{ width:100%; height:100%; object-fit:fill; }
          .feastCard__name{
            margin:8px 0 10px; padding:0; background:none; border:0; color:var(--brand-blue);
            font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; font-size:1.02rem; text-align:left; cursor:pointer;
          }
          .feastCard__name:hover{ text-decoration:underline; }
          .btn{
            display:block; width:100%; padding:0.48rem 1.5rem;
            font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; text-transform:uppercase; letter-spacing:.45px;
            border-radius:4px; cursor:pointer;
          }
          .btn + .btn{ margin-top:8px; }
          .btn-add{ background:var(--red); color:#fff; border:none; }
          .btn-add:hover{ filter:brightness(0.96); }
          .btn-outline{ background:#fff; border:3px solid var(--brand-blue); color:var(--brand-blue); }
          .btn-outline:hover{ background:#f4f9ff; }
          .feastCard__desc{ margin:10px 0 2px; color:#333; font-size:.9rem; line-height:1.33; }
        `}</style>

        {/* mount the modal/logic controller */}
        <ComboBuilder
          openComboId={openComboId}
          onAdd={(payload) => onAddToCart?.(payload)}
          onClose={() => setOpenComboId(null)}
        />
      </div>
    );
  }

  if (sub === "special") {
    const openSpecial = (key) => setSelectedSpecialItem(key);
    const cards = [
      {
        key: "panzerotti",
        name: "Panzerotti",
        desc:
          "Golden-fried turnover stuffed with your choice of pizza toppings. Includes optional dips.",
        img: "/images/special-menu/panzerotti.jpg",
      },
      {
        key: "pizza-sub",
        name: "Pizza Sub",
        desc:
          "Toasted sub roll with sauce & cheese. Customize with the same pizza toppings.",
        img: "/images/special-menu/pizza-sub.jpg",
      },
      {
        key: "meatball-sub",
        name: "Meatball Sub",
        desc:
          "Classic meatballs with sauce & cheese on a toasted roll. No extra toppings.",
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
                  <img
                    className="feastCard__img"
                    src={it.img}
                    alt={it.name}
                    loading="lazy"
                  />
                </div>

                <button
                  type="button"
                  className="feastCard__name"
                  onClick={() => openSpecial(it.key)}
                  title={it.name}
                >
                  {it.name}
                </button>

                <button
                  type="button"
                  className="btn btn-add"
                  onClick={() => openSpecial(it.key)}
                >
                  ADD TO ORDER
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => openSpecial(it.key)}
                >
                  CUSTOMIZE
                </button>

                <p className="feastCard__desc">{it.desc}</p>
              </article>
            ))}
          </section>
        </div>

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
          .feast__grid--three {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          @media (max-width: 800px) {
            .feast__grid--three {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 520px) {
            .feast__grid--three {
              grid-template-columns: 1fr;
            }
          }
          .feastCard { display: flex; flex-direction: column; }
          .feastCard__imgWrap{
            width:100%; height:133px; background:#fff; border-radius:4px; overflow:hidden;
            border:1px solid var(--light-border); box-shadow:0 2px 8px rgba(0,0,0,0.08);
          }
          .feastCard__img{ display:block; width:100%; height:100%; object-fit:fill; }
          .feastCard__name{
            margin:8px 0 10px; padding:0; background:none; border:0; color:var(--brand-blue);
            font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; font-size:1.02rem; text-align:left; cursor:pointer;
          }
          .feastCard__name:hover{ text-decoration:underline; }
          .btn{
            display:block; width:100%; padding:0.48rem 1.5rem;
            font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; text-transform:uppercase; letter-spacing:.45px;
            border-radius:4px; cursor:pointer;
          }
          .btn + .btn{ margin-top:8px; }
          .btn-add{ background:var(--red); color:#fff; border:none; }
          .btn-add:hover{ filter:brightness(0.96); }
          .btn-outline{ background:#fff; border:3px solid var(--brand-blue); color:var(--brand-blue); }
          .btn-outline:hover{ background:#f4f9ff; }
          .feastCard__desc{ margin:10px 0 2px; color:#333; font-size:.9rem; line-height:1.33; }
        `}</style>

        {/* Popup builder for Special Menu */}
        {selectedSpecialItem && (
          <>
            <div className="modal-backdrop" onClick={() => setSelectedSpecialItem(null)} />
            <div
              className="modal-viewport"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedSpecialItem(null);
              }}
              style={{ paddingTop: 24, paddingBottom: 24, overflowAnchor: 'none' }}
            >
              <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close"
                  onClick={() => setSelectedSpecialItem(null)}
                  aria-label="Close"
                  type="button"
                >
                  ✖
                </button>
                <div className="modal-body">
                  <SpecialMenuBuilder
                    itemType={selectedSpecialItem}
                    onClose={() => setSelectedSpecialItem(null)}
                    onAdd={(p) => onAddToCart?.(p)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}

/* ---------------- Sides: feast-style grid + popup builder --------------- */
function SidesView({ selectedSide, setSelectedSide }) {
  const items = [
    { name: "French Fries",        img: "/images/sides/fries.jpg",             desc: "Crispy golden fries." },
    { name: "Poutine",             img: "/images/sides/poutine.jpg",           desc: "Fries, cheese curds & gravy." },
    { name: "Shawarma Poutine",    img: "/images/sides/shawarma-poutine.jpg",  desc: "Loaded shawarma poutine." },
    { name: "Onion Rings",         img: "/images/sides/onion-rings.jpg",       desc: "Crispy battered rings." },
    { name: "Cheesy Garlic Bread", img: "/images/sides/cheesy-garlic-bread.jpg", desc: "Buttery garlic, lots of cheese." },
    { name: "Garlic Bread",        img: "/images/sides/garlic-bread.jpg",      desc: "Toasty classic garlic bread." },
  ];
  const openSide = (name) => setSelectedSide(name);

  return (
    <div className="card" style={{ padding: "1rem 1rem 2rem" }}>
      <div className="feast feast--edge">
        <section className="feast__grid feast__grid--four">
          {items.map((it) => (
            <article key={it.name} className="feastCard">
              <div className="feastCard__imgWrap">
                <img className="feastCard__img" src={it.img} alt={it.name} loading="lazy" />
              </div>

              <button type="button" className="feastCard__name" onClick={() => openSide(it.name)} title={it.name}>
                {it.name}
              </button>

              <button type="button" className="btn btn-add" onClick={() => openSide(it.name)}>ADD TO ORDER</button>
              <button type="button" className="btn btn-outline" onClick={() => openSide(it.name)}>CUSTOMIZE</button>

              {it.desc ? <p className="feastCard__desc">{it.desc}</p> : null}
            </article>
          ))}
        </section>
      </div>

      <style jsx>{`
        :global(:root){ --brand-blue:#006491; --red:#e91e28; --light-border:#e9e9e9; }

        .feast--edge{ margin-left:calc(-1rem - 1px); margin-right:calc(-1rem - 1px); }
        @media (max-width:520px){ .feast--edge{ margin-left:-1rem; margin-right:-1rem; } }

        .feast__grid{ display:grid; column-gap:16px; row-gap:14px; align-items:start; }
        .feast__grid--four{ grid-template-columns:repeat(4,minmax(0,1fr)); }
        @media (max-width:1000px){ .feast__grid--four{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media (max-width:800px){  .feast__grid--four{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:520px){  .feast__grid--four{ grid-template-columns:1fr; } }

        .feastCard{ display:flex; flex-direction:column; }
        .feastCard__imgWrap{
          width:100%; height:133px; background:#fff; border-radius:4px; overflow:hidden;
          border:1px solid var(--light-border); box-shadow:0 2px 8px rgba(0,0,0,0.08);
        }
        .feastCard__img{ width:100%; height:100%; object-fit:fill; }

        .feastCard__name{
          margin:8px 0 10px; padding:0; background:none; border:0; color:var(--brand-blue);
          font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; font-size:1.02rem; text-align:left; cursor:pointer;
        }
        .feastCard__name:hover{ text-decoration:underline; }

        .btn{
          display:block; width:100%; padding:0.48rem 1.5rem;
          font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; text-transform:uppercase; letter-spacing:.45px;
          border-radius:4px; cursor:pointer;
        }
        .btn + .btn{ margin-top:8px; }
        .btn-add{ background:var(--red); color:#fff; border:none; }
        .btn-add:hover{ filter:brightness(0.96); }
        .btn-outline{ background:#fff; border:3px solid var(--brand-blue); color:var(--brand-blue); }
        .btn-outline:hover{ background:#f4f9ff; }

        .feastCard__desc{ margin:10px 0 2px; color:#333; font-size:.9rem; line-height:1.33; }
      `}</style>
    </div>
  );
}

/* Popup: SideBuilder — shared by SidesView (sub=sides) and the sub=all
   "View All" screen, both of which just set `selectedSide` on the parent.
   Uses the same DebugPizzaOverlay every other builder popup in the app
   uses — the old hand-rolled .modal-backdrop/.modal-viewport/.modal-panel
   classes here had no matching CSS anywhere in the codebase, so the popup
   rendered inline in the page flow instead of as an overlay. */
function SideBuilderPopup({ selectedSide, setSelectedSide }) {
  return (
    <DebugPizzaOverlay
      open={!!selectedSide}
      onClose={() => setSelectedSide(null)}
      mode="portal"
      blockRogue
      title={selectedSide || "Customize"}
    >
      {selectedSide && (
        <SideBuilder side={selectedSide} onClose={() => setSelectedSide(null)} onAdd={() => setSelectedSide(null)} />
      )}
    </DebugPizzaOverlay>
  );
}

/* ---------------- Drinks: feast grid + right-panel modal --------------- */
function DrinksView() {
  const [openCat, setOpenCat] = useState(null);
  const launchers = [
    { id: "twoLiters", label: "2L Bottles",  img: "/images/drinks/2l.jpg",    options: ["Coke","Gingerale","Diet Coke","Pepsi"] },
    { id: "cans",      label: "Cans",        img: "/images/drinks/cans.jpg",  options: ["coke","coke zero","diet coke","dr pepper","mug root beer","brisk iced tea","fuze iced tea","pepsi","diet pepsi","gingerale","sprite","orange crush","grape crush","crush cream soda"] },
    { id: "other",     label: "Other Drinks",img: "/images/drinks/other.jpg", options: ["blue gatorade","red gatorade","orange gatorade","yellow gatorade","redbull","apple juice","water"] },
    { id: "dips",      label: "Dips",        img: "/images/drinks/dips.jpg",  options: ["Blue Cheese","Garlic","Ranch"] },
  ];

  return (
    <div className="card" style={{ padding: "1rem 1rem 2rem" }}>
      <div className="feast feast--edge">
        <section className="feast__grid feast__grid--four">
          {launchers.map((it) => (
            <article key={it.id} className="feastCard">
              <div className="feastCard__imgWrap">
                <img className="feastCard__img" src={it.img} alt={it.label} loading="lazy" />
              </div>

              <button type="button" className="feastCard__name" onClick={() => setOpenCat(it.id)} title={it.label}>
                {it.label}
              </button>

              <button type="button" className="btn btn-add" onClick={() => setOpenCat(it.id)}>ADD TO ORDER</button>
              <p className="feastCard__desc">Build your {it.label.toLowerCase()} order.</p>
            </article>
          ))}
        </section>
      </div>

      <style jsx>{`
        :global(:root){ --brand-blue:#006491; --red:#e91e28; --light-border:#e9e9e9; }

        .feast--edge{ margin-left:calc(-1rem - 1px); margin-right:calc(-1rem - 1px); }
        @media (max-width:520px){ .feast--edge{ margin-left:-1rem; margin-right:-1rem; } }

        .feast__grid{ display:grid; column-gap:16px; row-gap:14px; align-items:start; }
        .feast__grid--four{ grid-template-columns:repeat(4,minmax(0,1fr)); }
        @media (max-width:1000px){ .feast__grid--four{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media (max-width:800px){  .feast__grid--four{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:520px){  .feast__grid--four{ grid-template-columns:1fr; } }

        .feastCard{ display:flex; flex-direction:column; }
        .feastCard__imgWrap{
          width:100%; height:133px; background:#fff; border-radius:
4px; overflow:hidden;
          border:1px solid var(--light-border); box-shadow:0 2px 8px rgba(0,0,0,0.08);
        }
        .feastCard__img{ width:100%; height:100%; object-fit:fill; }

        .feastCard__name{
          margin:8px 0 10px; padding:0; background:none; border:0; color:#006491;
          font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; font-size:1.02rem; text-align:left; cursor:pointer;
        }
        .feastCard__name:hover{ text-decoration:underline; }

        .btn{
          display:block; width:100%; padding:0.48rem 1.5rem;
          font-family:var(--font-heading, Oswald, sans-serif); font-weight:900; text-transform:uppercase; letter-spacing:.45px;
          border-radius:4px; cursor:pointer;
        }
        .btn + .btn{ margin-top:8px; }
        .btn-add{ background:#e91e28; color:#fff; border:none; }
        .btn-add:hover{ filter:brightness(0.96); }

        .feastCard__desc{ margin:10px 0 2px; color:#333; font-size:.9rem; line-height:1.33; }
      `}</style>

      {/* Right-panel modal */}
      {openCat && (
        <>
          <div className="modal-backdrop" onClick={() => setOpenCat(null)} />
          <div className="modal-viewport" onClick={() => setOpenCat(null)} style={{ paddingTop:24, paddingBottom:24 }}>
            <div className="modal-panel" onClick={(e)=>e.stopPropagation()}>
              <button className="modal-close" onClick={() => setOpenCat(null)} aria-label="Close">✖</button>
              <div className="modal-body">
                <DrinksCategoryPanel
                  title={launchers.find((x)=>x.id===openCat)?.label || "Options"}
                  categoryId={openCat}
                  categoryLabel={launchers.find((x)=>x.id===openCat)?.label || ""}
                  options={launchers.find((x)=>x.id===openCat)?.options || []}
                  initialItems={[]}
                  onClose={() => setOpenCat(null)}
                  onAdd={() => setOpenCat(null)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Main page ---------- */
function MenuBody() {
  const router = useRouter();

  // Cart/totals
  const { addItem, openCart, subtotalCents: cartSubtotalCents } = useCart();
  const subtotalCents = cartSubtotalCents ?? 0;

  const tab = (router.query.tab || "entrees").toString();
  const sub = (router.query.sub || "all").toString();

  const setTabSub = (next) =>
    router.push({ pathname: "/menu", query: next }, undefined, {
      scroll: false,
      shallow: true,
    });

  // Right sticky & totals
  const [location, setLocation] = useState("Hamilton, ON L8N1G3");
  const [changingLoc, setChangingLoc] = useState(false);
  const [newLoc, setNewLoc] = useState("");
  const [serviceMethod, setServiceMethod] = useState("Carryout");
  const [orderTiming, setOrderTiming] = useState("Now");
  const today = new Date();
  const yyyyMmDd = today.toISOString().slice(0, 10);
  const [scheduleDate, setScheduleDate] = useState(yyyyMmDd);
  const [scheduleTime, setScheduleTime] = useState("18:00");
  const [showHours, setShowHours] = useState(false);
  const hours = { open: "11:00", close: "22:00" };
  const openHoursForDate = () => hours;

  const deliveryCents = serviceMethod === "Delivery" ? 499 : 0;
  const taxCents = Math.round(0.13 * (subtotalCents + deliveryCents));
  const totalCents = subtotalCents + deliveryCents + taxCents;

  // Pizza Builder popup state
  const [showBuilder, setShowBuilder] = useState(false);
  const [pendingToppings, setPendingToppings] = useState(null);
  const [presetToppings, setPresetToppings] = useState([]);
  const [editInitialData, setEditInitialData] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Inline-tab local
  const [selectedSpecialItem, setSelectedSpecialItem] = useState(null);
  const [selectedSide, setSelectedSide] = useState(null);

  useEffect(() => {
    if (showBuilder && pendingToppings) {
      const t = setTimeout(() => {
        setPresetToppings(pendingToppings);
        setPendingToppings(null);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [showBuilder, pendingToppings]);

  const openBuilder = ({ toppings = null, initialData = null } = {}) => {
    if (toppings) setPendingToppings(toppings);
    setEditInitialData(initialData);
    setShowBuilder(true);
  };
  const onCustomizePizza = (toppings) => openBuilder({ toppings });

  const openBYOSize = (sizeInches) => {
    openBuilder({
      initialData: {
        type: "pizza-byo",
        size: String(sizeInches),
        crust: "",
        toppings: [],
      },
    });
    setEditingId(null);
  };

  const catCards = useMemo(
    () => [
      { id: "signature",   label: "Signature Pizzas", img: "/images/menu_signature.png", nav: { tab: "entrees", sub: "signature" } },
      { id: "specialty",   label: "Specialty Pizzas", img: "/images/menu_specialty.png", nav: { tab: "entrees", sub: "specialty" } },
      { id: "wings",       label: "Wings",            img: "/images/menu_wings.png",     nav: { tab: "entrees", sub: "wings" } },
      { id: "sides",       label: "Sides",            img: "/images/menu_sides.png",     nav: { tab: "sides" } },
      { id: "combos",      label: "Combos",           img: "/images/menu_combos.png",    nav: { tab: "entrees", sub: "combos" } },
      { id: "drinks-dips", label: "Drinks & Dips",    img: "/images/menu_drinks.png",    nav: { tab: "drinks" } },
      { id: "special",     label: "Special Menu",     img: "/images/menu_special.png",   nav: { tab: "entrees", sub: "special" } },
    ],
    []
  );

  // Sticky follower
  const followerRef = useRef(null);
  const lagRef = useRef(0);
  const prevScrollRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    prevScrollRef.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - prevScrollRef.current;
      prevScrollRef.current = y;
      lagRef.current = Math.max(-220, Math.min(220, lagRef.current - delta));
      if (!rafRef.current) {
        const tick = () => {
          lagRef.current *= 0.88;
          if (followerRef.current) {
            followerRef.current.style.transform = `translateY(${lagRef.current}px)`;
          }
          if (Math.abs(lagRef.current) > 0.5) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            lagRef.current = 0;
            if (followerRef.current) followerRef.current.style.transform = "translateY(0px)";
            rafRef.current = 0;
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  const handleAddToCart = (item) => {
    addItem(item);
    openCart();
  };

  const pageTitle = useMemo(() => {
    if (tab === "entrees") {
      if (sub === "all") return "Menu";
      if (sub === "signature") return "Signature Pizzas";
      if (sub === "specialty") return "Specialty Pizzas";
      if (sub === "wings") return "Wings";
      if (sub === "combos") return "Combos";
      if (sub === "special") return "Special Menu";
      return "Menu";
    }
    if (tab === "sides") {
      if (sub === "wings") return "Wings";
      return "Sides";
    }
    if (tab === "drinks") return "Drinks & Dips";
    return "Menu";
  }, [tab, sub]);

  return (
    <div className="container" style={{ padding: "1rem 0" }}>
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1100 }}>
        <CartToggle />
      </div>
      <CartSidebar />

      <div className="menu-layout">
        <section className="menu-main" key={`${tab}-${sub}-panel`}>
          <h1 className="menu-title">{pageTitle}</h1>

          {/* Entrées landing */}
          {tab === "entrees" && sub === "all" && (
            <>
              <div className="menu-heroRow">
                <img
                  className="menu-heroRow__hero"
                  src="/images/deal_title.jpg"
                  alt="Deal"
                  loading="eager"
                />
              </div>

              <div className="card eta-card">
                <div className="eta-left">
                  <div className="eta-mins">20 MINS</div>
                  <div className="eta-sub">EST. CARRYOUT TIME</div>
                </div>
                <div className="eta-right">
                  Your Carryout will be ready in about <strong>20 minutes</strong> after you place your order.
                </div>
              </div>

              <button
                className="card cta-byo cta-byo--dom"
                onClick={() => openBuilder()}
                aria-label="Build Your Own Pizza"
              >
                <img className="cta-byo__img" src="/images/byo_thumb.png" alt="" />
                <div>
                  <div className="cta-byo__title">Build Your Own Pizza</div>
                  <div className="cta-byo__sub">Watch the pizza of your wildest dreams come to life.</div>
                </div>
              </button>

              <div className="size-links size-links--anchor">
                {[
                  { label: "Small", size: 10 },
                  { label: "Medium", size: 12 },
                  { label: "Large", size: 14 },
                  { label: "X-Large", size: 16 },
                ].map((s) => (
                  <button
                    key={s.size}
                    className="size-link size-link--anchor"
                    onClick={() => openBYOSize(s.size)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="cat-grid cat-grid--tight">
                {catCards.map((c, i) => (
                  <button
                    key={c.id + i}
                    className="cat-card cat-card--dom"
                    onClick={() => setTabSub(c.nav)}
                  >
                    <div className="cat-card__imgWrap">
                      <img src={c.img} alt="" className="cat-card__img" />
                    </div>
                    <div className="cat-card__label">{c.label}</div>
                  </button>
                ))}
                <div className="cat-card cat-card--empty" aria-hidden="true" />
              </div>

            </>
          )}

          {/* Entrées sub-views */}
          {tab === "entrees" && (
            <div key={`entrees-${sub}`}>
              <EntreesView
                sub={sub}
                setTabSub={setTabSub}
                onOpenBuilder={() => openBuilder()}
                onCustomizePizza={onCustomizePizza}
                selectedSpecialItem={selectedSpecialItem}
                setSelectedSpecialItem={setSelectedSpecialItem}
                onAddToCart={handleAddToCart}
              />
            </div>
          )}

          {/* Sides — VIEW ALL */}
          {tab === "sides" && (!sub || sub === "all") && (
            <div key="sides-viewall">
              <SidesDessertsAll
                onOpenSide={(name) => setSelectedSide(name)}
                onOpenWings={() => setTabSub({ tab: "sides", sub: "wings" })}
              />
              <SideBuilderPopup selectedSide={selectedSide} setSelectedSide={setSelectedSide} />
            </div>
          )}

          {/* Per-sub Sides view (feast cards + popup) */}
          {tab === "sides" && sub === "sides" && (
            <div key="sides-sides">
              <SidesView selectedSide={selectedSide} setSelectedSide={setSelectedSide} />
              <SideBuilderPopup selectedSide={selectedSide} setSelectedSide={setSelectedSide} />
            </div>
          )}

          {/* Sides tab's own Wings subnav — same builder as the Entrées tab's Wings view */}
          {tab === "sides" && sub === "wings" && (
            <div key="sides-wings" className="card" style={{ overflow: "visible", padding: "1rem 1rem 2rem" }}>
              <div className="feast--edge">
                <WingsBuilder
                  onClose={() => {}}
                  onAdd={(item) => handleAddToCart?.(item)}
                  addToCartDirect={false}
                />
              </div>
              <style jsx>{`
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
              `}</style>
            </div>
          )}

          {tab === "drinks" && <div key="drinks-all"><DrinksView /></div>}
        </section>

        {/* RIGHT — sticky follower + order settings */}
        <aside className="menu-aside">
          <div className="menu-aside__follower" ref={followerRef}>
            <button
              type="button"
              className="menu-checkoutBtn"
              onClick={(e) => { e.stopPropagation(); router.push('/checkout'); }}
            >
              CHECKOUT
            </button>

            <div className="aside-card">
              <div className="aside-card__title">ORDER SETTINGS</div>

              <div style={{ padding: 12 }}>
                <div className="aside-row">
                  <div className="aside-label">My Location</div>
                  <button onClick={() => setChangingLoc((v) => !v)} className="aside-link">
                    CHANGE
                  </button>
                </div>

                {!changingLoc ? (
                  <div style={{ marginTop: 4 }}>{location}</div>
                ) : (
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <input
                      value={newLoc}
                      onChange={(e) => setNewLoc(e.target.value)}
                      className="aside-input"
                      placeholder="Enter address or postal code"
                    />
                    <button
                      onClick={() => {
                        setLocation(newLoc || location);
                        setChangingLoc(false);
                      }}
                      className="aside-btn"
                    >
                      Save
                    </button>
                  </div>
                )}

                <div className="aside-sectionLabel">Service Method</div>
                <div className="aside-choices">
                  {["Carryout", "Delivery"].map((opt) => (
                    <label key={opt} className="aside-choice">
                      <input
                        type="radio"
                        name="serviceMethod"
                        checked={serviceMethod === opt}
                        onChange={() => setServiceMethod(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>

                <div className="aside-sectionLabel">Order Timing</div>
                <div className="aside-choices">
                  {["Now", "Later"].map((opt) => (
                    <label key={opt} className="aside-choice">
                      <input
                        type="radio"
                        name="orderTiming"
                        checked={orderTiming === opt}
                        onChange={() => setOrderTiming(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>

                {orderTiming === "Later" && (
                  <div className="aside-schedule">
                    <div className="aside-scheduleRow">
                      <span role="img" aria-label="calendar">📅</span>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="aside-input"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        min={(openHoursForDate(scheduleDate) || hours).open}
                        max={(openHoursForDate(scheduleDate) || hours).close}
                        step={300}
                        className="aside-input"
                      />
                    </div>
                    <div className="aside-small">
                      Available hours for selected day: {(openHoursForDate(scheduleDate) || hours).open}–{(openHoursForDate(scheduleDate) || hours).close}
                    </div>
                  </div>
                )}

                <button onClick={() => setShowHours((v) => !v)} className="aside-link" style={{ marginTop: 8, padding: 0 }}>
                  View Store Hours
                </button>
                {showHours && (
                  <div className="aside-hours">
                    Mon–Sat: 11:00–22:00<br />
                    Sun: 12:00–21:00
                  </div>
                )}

                <div className="aside-totals">
                  <div className="aside-totalRow">
                    <div>Food &amp; Beverage:</div>
                    <div className="aside-totalNum">{formatMoney(subtotalCents)}</div>
                  </div>
                  {serviceMethod === "Delivery" && (
                    <div className="aside-totalRow">
                      <div>Delivery:</div>
                      <div className="aside-totalNum">{formatMoney(499)}</div>
                    </div>
                  )}
                  <div className="aside-totalRow">
                    <div>Taxes:</div>
                    <div className="aside-totalNum">{formatMoney(taxCents)}</div>
                  </div>
                  <div className="aside-grandRow">
                    <div>Order Total:</div>
                    <div>{formatMoney(totalCents)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ===== STABLE Pizza Builder PORTAL (hardened) ===== */}
      {showBuilder && (
        <DebugPizzaOverlay
          open={showBuilder}
          onClose={() => setShowBuilder(false)}
          mode="portal"
          blockRogue
        >
          <PizzaBuilder
            presetToppings={presetToppings}
            initialData={editInitialData || { type: "pizza-byo", size: "12", crust: "", toppings: [] }}
            onSave={(payload) => {
              if (editingId) {
                // optional: replace existing item (if you support edit-in-place)
              }
              addItem(payload);
              setEditInitialData(null);
              setEditingId(null);
              openCart();
              setShowBuilder(false);
            }}
          />
        </DebugPizzaOverlay>
      )}
    </div>
  );
}

export default function MenuPage() {
  return <MenuBody />;
}
