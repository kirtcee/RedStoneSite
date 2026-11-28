// pages/coupons.js
import MenuDealBanner from "../components/promos/MenuDealBanner";
import React, { useEffect, useState } from "react";
import ComboBuilder from "../components/ComboBuilder";
import { useRouter } from "next/router";
import { useCart, DealCodeEntry } from "../components/CartSystem";
import { formatMoney } from "../components/Pricing";
import { dealSections, dealThumbFor, dealAllowsService } from "../utils/dealCatalog";
import OrderSettingsAside from "../components/OrderSettingsAside";



// Real photo background with the price/CTA laid on top as live HTML/CSS
// (not baked into the image) — placeholder art borrowed from the homepage
// collage until this deal gets its own real photography.
function DealCard({ deal, onAdd }) {
  const comingSoon = !!deal.comingSoon;
  return (
    <article className="deal-card">
      <div className="deal-card__imgWrap">
        <img className="deal-card__img" src={dealThumbFor(deal.id)} alt={deal.name} loading="lazy" />
        {comingSoon && <div className="deal-card__soon">Coming Soon</div>}
        <button
          type="button"
          className="deal-card__btn"
          disabled={comingSoon}
          onClick={() => onAdd(deal.id)}
        >
          {comingSoon ? "Coming Soon" : deal.comboId ? "Order Now" : "Add Coupon"}
        </button>
      </div>

      {!comingSoon && <div className="deal-card__price">{formatMoney(deal.price)}</div>}

      <p className="deal-card__desc">
        {deal.description || deal.subtitle}
        {deal.code ? ` (Code: ${deal.code})` : ""}
      </p>

      <style jsx>{`
        .deal-card {
          background: #faf2e9;
          border-radius: .1875rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 18px 16px 22px;
        }
        .deal-card__imgWrap {
          position: relative;
          width: 100%;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }
        .deal-card__img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .deal-card__soon {
          position: absolute;
          top: 0;
          left: 0;
          background: #333;
          color: #fff;
          font-size: var(--fs-min);
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .deal-card__btn {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translate(-50%, 50%);
          height: 42px;
          padding: 0 22px;
          border-radius: 21px;
          background: #8b1a1a;
          color: #fff;
          border: none;
          font-weight: 900;
          font-size: var(--fs-min);
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
          font-family: var(--heading, Oswald, sans-serif);
        }
        .deal-card__btn:disabled {
          background: #999;
          cursor: not-allowed;
        }
        .deal-card__price {
          font-family: var(--heading, Oswald, sans-serif);
          text-transform: uppercase; /* Red Stone Face has lowercase; headings stay caps */
          font-weight: 900;
          font-size: 1.4rem;
          color: #111;
          margin-bottom: 8px;
        }
        .deal-card__desc {
          margin: 0;
          font-size: var(--fs-sm); /* same as the menu item descriptions */
          font-weight: var(--w-medium);
          line-height: 1.4;
          color: var(--text-brown);
        }
      `}</style>
    </article>
  );
}

export default function CouponsPage() {
  const { isServiceConfirmed, service, openDeal } = useCart();
  const router = useRouter();

  // Most deals open the coupon builder; a combo deal (deal.comboId: Take
  // Care, Feed 4, Party) opens the combo builder instead.
  const [comboToOpen, setComboToOpen] = useState(null);
  const startDeal = (id) => {
    const deal = dealSections.flatMap((sec) => sec.deals).find((d) => d.id === id);
    if (deal?.comboId) setComboToOpen(deal.comboId);
    else openDeal(id);
  };

  // /coupons?deal=<id> (e.g. a home page promo card's "Order Now"): open
  // that deal's builder straight away, then tidy the address. Carryout or
  // Delivery is only asked for when they add it to the cart.
  useEffect(() => {
    const id = String(router.query.deal || "");
    if (!id) return;
    const deal = dealSections.flatMap((sec) => sec.deals).find((d) => d.id === id);
    if (deal && !deal.comingSoon && (!isServiceConfirmed || dealAllowsService(deal, service))) {
      if (deal.comboId) setComboToOpen(deal.comboId);
      else openDeal(id);
    }
    router.replace("/coupons", undefined, { shallow: true });
  }, [router.query.deal, isServiceConfirmed, service, openDeal, router]);


  return (
    <main className="page page--coupons">
      <div className="container" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
        <div className="menu-layout">
          <section className="menu-main">
            <h1 className="menu-title" style={{ margin: "0 0 4px" }}>
              Deals
            </h1>
            <div style={{ marginBottom: 16, color: "#666", fontStyle: "italic", fontSize: "var(--fs-min)" }}>
              Note: Some crust types, toppings, sauces, and premium items may come with an additional charge.
            </div>

            {/* Everyone can see and open the deals; Carryout or Delivery is
                asked for when a deal is added to the cart. */}
            <>
                <DealCodeEntry variant="card" />

                {/* same deal banner as the Menu page (components/promos/MenuDealBanner.js) */}
                <div className="menu-heroRow">
                  <div className="menu-heroRow__hero menu-heroRow__hero--card">
                    <MenuDealBanner />
                  </div>
                </div>

                {dealSections.map((sec, i) => {
                  // before Carryout/Delivery is chosen, show every deal
                  const visible = sec.deals.filter(
                    (d) => d.comingSoon || !isServiceConfirmed || dealAllowsService(d, service)
                  );
                  if (!visible.length) return null;
                  return (
                    <div key={sec.type} id={`deal-section-${i}`} style={{ marginBottom: "1.5rem", scrollMarginTop: "var(--header-offset, 74.75px)" }}>
                      <section className="feast__grid feast__grid--three deals-grid" style={{ alignItems: "stretch" }}>
                        {visible.map((deal) => (
                          <DealCard key={deal.id} deal={deal} onAdd={startDeal} />
                        ))}
                      </section>
                    </div>
                  );
                })}
            </>
          </section>

          <OrderSettingsAside />
        </div>
      </div>

      {/* combo deals: ComboBuilder adds the combo to the cart itself */}
      <ComboBuilder openComboId={comboToOpen} onClose={() => setComboToOpen(null)} />
    </main>
  );
}
