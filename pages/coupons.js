// pages/coupons.js
import React from "react";
import { useCart, DealCodeEntry } from "../components/CartSystem";
import { formatMoney } from "../components/Pricing";
import { dealSections, dealThumbFor, dealAllowsService } from "../utils/dealCatalog";
import OrderSettingsAside from "../components/OrderSettingsAside";

const MAROON = "#8b1a1a";

function ServiceGatePrompt() {
  const { openServiceGate } = useCart();
  return (
    <div className="aside-card" style={{ marginBottom: 20 }}>
      <div
        style={{
          background: MAROON,
          color: "#fff",
          padding: "1.1rem",
          textAlign: "center",
          fontFamily: "var(--heading, Oswald, sans-serif)",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: "1.15rem", textTransform: "uppercase" }}>
          Start Your Order
        </div>
        <div style={{ marginTop: 4, fontSize: 14, fontFamily: "var(--font-body, Inter, system-ui, sans-serif)" }}>
          Choose carryout or delivery to see the coupons available to you.
        </div>
      </div>
      <div style={{ padding: "1.25rem", textAlign: "center" }}>
        <button type="button" className="btn btn-add" style={{ width: "auto", padding: "0.85rem 1.5rem" }} onClick={() => openServiceGate()}>
          See Coupons
        </button>
      </div>
    </div>
  );
}

// Real photo background with the price/CTA laid on top as live HTML/CSS
// (not baked into the image) — placeholder art borrowed from the homepage
// collage until this deal gets its own real photography.
function FeaturedDealBanner({ deal, onOrder }) {
  return (
    <div className="featured-banner">
      <img className="featured-banner__img" src="/images/home/deal-928x250.jpg" alt="" />
      <div className="featured-banner__scrim" />
      <div className="featured-banner__content">
        <span className="featured-banner__tag">
          {deal.serviceRestriction === "carryout" ? "Carryout" : "Featured Deal"}
        </span>
        <div className="featured-banner__title">{deal.name}</div>
        <div className="featured-banner__price">{formatMoney(deal.price)}</div>
        {deal.code && <div className="featured-banner__code">Code: {deal.code}</div>}
      </div>
      <button type="button" className="featured-banner__cta" onClick={onOrder}>
        Order Now
      </button>

      <style jsx>{`
        .featured-banner {
          position: relative;
          width: 100%;
          aspect-ratio: 928 / 250;
          overflow: hidden;
          border-radius: .1875rem;
          margin-bottom: 28px;
        }
        .featured-banner__img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .featured-banner__scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.55) 40%, rgba(0, 0, 0, 0.05) 75%);
        }
        .featured-banner__content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          padding: 1.5rem 2rem;
          color: #fff;
        }
        .featured-banner__tag {
          align-self: flex-start;
          background: ${MAROON};
          color: #fff;
          font-family: var(--heading, Oswald, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.4px;
          padding: 4px 10px;
          margin-bottom: 4px;
        }
        .featured-banner__title {
          font-family: var(--heading, Oswald, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          font-size: 1.4rem;
          line-height: 1.1;
          max-width: 60%;
        }
        .featured-banner__price {
          font-family: var(--heading, Oswald, sans-serif);
          font-weight: 900;
          font-size: 3rem;
          line-height: 1;
          margin-top: 4px;
        }
        .featured-banner__code {
          font-size: 0.75rem;
          opacity: 0.85;
          margin-top: 6px;
        }
        .featured-banner__cta {
          position: absolute;
          right: 24px;
          bottom: 24px;
          background: ${MAROON};
          color: #fff;
          border: none;
          padding: 0.8rem 1.6rem;
          font-weight: 900;
          text-transform: uppercase;
          font-family: var(--heading, Oswald, sans-serif);
          cursor: pointer;
        }
        @media (max-width: 640px) {
          .featured-banner__title { max-width: 100%; font-size: 1.1rem; }
          .featured-banner__price { font-size: 2rem; }
          .featured-banner__cta { position: static; margin-top: 12px; }
          .featured-banner__content { padding: 1rem 1.2rem; }
        }
      `}</style>
    </div>
  );
}

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
          {comingSoon ? "Coming Soon" : "Add Coupon"}
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
          font-size: 10px;
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
          font-size: 12px;
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
          font-weight: 900;
          font-size: 1.4rem;
          color: #111;
          margin-bottom: 8px;
        }
        .deal-card__desc {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.4;
          color: #6b3f22;
        }
      `}</style>
    </article>
  );
}

export default function CouponsPage() {
  const { isServiceConfirmed, service, openDeal } = useCart();

  const allDeals = dealSections.flatMap((sec) => sec.deals);
  const featured = allDeals.find((d) => !d.comingSoon && dealAllowsService(d, service));

  return (
    <main className="page page--coupons">
      <div className="container" style={{ padding: "1rem 0" }}>
        <div className="menu-layout">
          <section className="menu-main">
            <h1 className="menu-title" style={{ margin: "0 0 4px" }}>
              Coupons
            </h1>
            <div style={{ marginBottom: 16, color: "#666", fontStyle: "italic", fontSize: 12 }}>
              Note: Some crust types, toppings, sauces, and premium items may come with an additional charge.
            </div>

            {!isServiceConfirmed ? (
              <ServiceGatePrompt />
            ) : (
              <>
                <DealCodeEntry variant="card" />

                {featured && <FeaturedDealBanner deal={featured} onOrder={() => openDeal(featured.id)} />}

                {dealSections.map((sec, i) => {
                  const visible = sec.deals.filter((d) => d.comingSoon || dealAllowsService(d, service));
                  if (!visible.length) return null;
                  return (
                    <div key={sec.type} id={`deal-section-${i}`} style={{ marginBottom: "1.5rem", scrollMarginTop: "var(--header-offset, 74.75px)" }}>
                      <section className="feast__grid feast__grid--three" style={{ alignItems: "stretch" }}>
                        {visible.map((deal) => (
                          <DealCard key={deal.id} deal={deal} onAdd={openDeal} />
                        ))}
                      </section>
                    </div>
                  );
                })}
              </>
            )}
          </section>

          <OrderSettingsAside />
        </div>
      </div>
    </main>
  );
}
