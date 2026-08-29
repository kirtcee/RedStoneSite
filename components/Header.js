// components/Header.js
import React, { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CartToggle, useCart } from "./CartSystem";
import CarryoutIcon from "../public/carryoutRSP.svg";
import DeliveryIcon from "../public/deliveryRSP.svg";
import HomeIcon from "../public/homeRSP.svg";
import StoreLogo from "../public/storelogoRSP.svg";
import HeaderOrnaments from "./HeaderOrnaments";
import { dealSections } from "../utils/dealCatalog";

/**
 * Paths that switch the top-nav into "menu mode"
 */
const MENU_MODE_PATHS = ["/order", "/menu"];

const buildMenuUrl = (q) => {
  const usp = new URLSearchParams();
  if (q.tab) usp.set("tab", q.tab);
  if (q.sub) usp.set("sub", q.sub);
  const qs = usp.toString();
  return `/menu${qs ? "?" + qs : ""}`;
};

const formatAddressFull = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;

  const { street, suite, city, province, postal } = addr;
  const parts = [
    street,
    suite ? `Unit ${suite}` : "",
    city && province ? `${city}, ${province}` : city || province,
    postal,
  ];
  return parts.filter(Boolean).join(" • ");
};

export default function Header() {
  const router = useRouter();
  const { service, deliveryAddress, openServiceGate } = useCart();

  const tab = (router.query.tab || "").toString();
  const sub = (router.query.sub || "").toString();

  const inMenuMode = useMemo(() => {
    const p = router.pathname || "";
    return MENU_MODE_PATHS.some((base) => p.startsWith(base));
  }, [router.pathname]);

  const homeNav = [
    { key: "order", label: "ORDER\nONLINE", onClick: () => router.push("/order") },
    { key: "menu", label: "MENU", onClick: () => router.push("/menu") },
    { key: "deals", label: "DEALS", onClick: () => router.push("/coupons") },
    {
      key: "calculator",
      label: "PIZZA\nCALCULATOR",
      onClick: () => router.push("/pizza-calculator"),
    },
    { key: "contact", label: "CONTACT", onClick: () => router.push("/contact") },
  ];

  const menuNav = [
    {
      key: "home",
      label: "HOME",
      onClick: () => router.push("/"),
    },
    {
      key: "entrees",
      label: "ENTRÉES",
      onClick: () =>
        router.push(buildMenuUrl({ tab: "entrees" }), undefined, {
          scroll: false,
        }),
    },
    {
      key: "sides",
      label: "SIDES",
      onClick: () =>
        router.push(buildMenuUrl({ tab: "sides", sub: "all" }), undefined, {
          scroll: false,
        }),
    },
    {
      key: "drinks",
      label: "DRINKS",
      onClick: () =>
        router.push(buildMenuUrl({ tab: "drinks" }), undefined, {
          scroll: false,
        }),
    },
    {
      key: "combos",
      label: "COMBOS",
      onClick: () =>
        router.push(buildMenuUrl({ tab: "entrees", sub: "combos" }), undefined, {
          scroll: false,
        }),
    },
  ];

  const activeTopKey = useMemo(() => {
    const p = router.pathname || "/";
    if (inMenuMode) {
      if (tab === "sides") return "sides";
      if (tab === "drinks") return "drinks";
      if (sub === "combos") return "combos";
      if (p.startsWith("/order")) return "entrees";
      return "entrees";
    } else {
      if (p.startsWith("/order")) return "order";
      if (p.startsWith("/menu")) return "menu";
      if (p.startsWith("/coupons")) return "deals";
      if (p.startsWith("/pizza-calculator")) return "calculator";
      if (p.startsWith("/contact")) return "contact";
      return "";
    }
  }, [inMenuMode, router.pathname, tab, sub]);

  const showSubheader =
    (inMenuMode && ["entrees", "sides", "drinks", "combos"].includes(activeTopKey)) ||
    activeTopKey === "deals";

  const subnav = useMemo(() => {
    if (activeTopKey === "deals") {
      // Same sticky-subheader treatment as /order and /menu, but scoped to
      // /coupons: one tab per dealSections group, scrolling to that
      // section's anchor on the page rather than routing to /menu.
      return dealSections.map((sec, i) => ({
        key: `deal-${i}`,
        label: sec.type.toUpperCase(),
        anchor: `deal-section-${i}`,
      }));
    }
    if (activeTopKey === "entrees") {
      return [
        { key: "all", label: "VIEW ALL", qp: { tab: "entrees" } },
        { key: "build", label: "BUILD YOUR OWN PIZZA", qp: { tab: "entrees", sub: "build" } },
        { key: "signature", label: "SIGNATURE PIZZAS", qp: { tab: "entrees", sub: "signature" } },
        { key: "specialty", label: "SPECIALTY PIZZAS", qp: { tab: "entrees", sub: "specialty" } },
        { key: "wings", label: "WINGS", qp: { tab: "entrees", sub: "wings" } },
        { key: "special", label: "SPECIAL MENU", qp: { tab: "entrees", sub: "special" } },
      ];
    }
    if (activeTopKey === "sides") {
      return [
        { key: "all", label: "VIEW ALL", qp: { tab: "sides", sub: "all" } },
        { key: "sides", label: "SIDES", qp: { tab: "sides", sub: "sides" } },
        { key: "wings", label: "WINGS", qp: { tab: "sides", sub: "wings" } },
        { key: "drinks", label: "DRINKS & DIPS", qp: { tab: "drinks" } },
      ];
    }
    if (activeTopKey === "drinks") {
      return [{ key: "all", label: "VIEW ALL", qp: { tab: "drinks" } }];
    }
    if (activeTopKey === "combos") {
      return [
        {
          key: "all",
          label: "VIEW ALL COMBOS",
          qp: { tab: "entrees", sub: "combos" },
        },
      ];
    }
    return [];
  }, [activeTopKey]);

  const activeSubKey = useMemo(() => {
    if (!showSubheader) return "";
    if (activeTopKey === "deals") return ""; // anchor tabs, not a routed "current" tab
    const current = sub || "all";
    const match = subnav.find((s) => s.key === current);
    return match ? match.key : "all";
  }, [showSubheader, activeTopKey, sub, subnav]);

  const handleSubnavClick = (s) => {
    if (s.anchor) {
      if (router.pathname !== "/coupons") {
        router.push(`/coupons#${s.anchor}`);
        return;
      }
      document.getElementById(s.anchor)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push(buildMenuUrl(s.qp), undefined, { scroll: false });
  };

  const topItems = inMenuMode ? menuNav : homeNav;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("has-subheader", showSubheader);
    }
  }, [showSubheader]);

  const carryoutAddressFull = "576 Concession Street";
  const carryoutAddress = carryoutAddressFull;
  const deliveryAddressDisplay = formatAddressFull(deliveryAddress) || "Enter Address";

  // A fresh random bright color every hover, in the same vivid register as
  // the header rosette icons — fixed saturation/lightness so it's never a
  // dark or washed-out draw, only the hue changes. Set directly on the SVG
  // (not the wrapping Link) because .header-logo-mark declares --logo-light
  // itself — a value set on an ancestor would be overridden by that.
  const logoRef = useRef(null);
  const handleLogoEnter = () => {
    const hue = Math.floor(Math.random() * 360);
    if (logoRef.current) {
      logoRef.current.style.setProperty("--logo-light", `hsl(${hue}, 82%, 58%)`);
    }
  };
  const handleLogoLeave = () => {
    if (logoRef.current) logoRef.current.style.removeProperty("--logo-light");
  };

  return (
    <>
      <header className="site-header site-header--red">
        <div className="container site-header__inner">
          <div className="header-row">
            <div className="header-row__start">
              <Link
                href="/"
                className="header-seg header-seg--logo"
                aria-label="Home"
                onMouseEnter={handleLogoEnter}
                onMouseLeave={handleLogoLeave}
              >
                <StoreLogo ref={logoRef} className="header-logo-mark" aria-hidden focusable="false" />
              </Link>

              {topItems.map((item) => (
                <button
                  key={item.key}
                  className={`header-seg header-seg--nav ${
                    inMenuMode ? "header-seg--nav-wide" : ""
                  } ${activeTopKey === item.key ? "is-active" : ""}`}
                  onClick={item.onClick}
                  aria-current={activeTopKey === item.key ? "page" : undefined}
                  title={item.label.replace(/\n/g, " ")}
                >
                  <span className="header-seg__label">
                    {item.label.split("\n").map((line, i) => (
                      <span key={i} style={{ display: "block" }}>
                        {line}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>

            <HeaderOrnaments />

            <div className="header-row__end">
              <button
                className="header-seg header-seg--mode"
                onClick={() => openServiceGate()}
                aria-label="Choose carryout or delivery"
                title="Choose carryout or delivery"
              >
                {!service ? (
                  <span className="carryout-chip" aria-label="Choose Carryout or Delivery">
                    <span className="carryout-iconbox" aria-hidden="true">
                      <HomeIcon className="carryout-icon" focusable="false" />
                    </span>
                    <span className="carryout-sep" aria-hidden="true" />
                    <span className="carryout-text">
                      <span className="carryout-line carryout-line--sm">SELECT</span>
                      <span className="carryout-line carryout-line--lg">
                        Order Method
                      </span>
                    </span>
                  </span>
                ) : service === "carryout" ? (
                  <span
                    className="carryout-chip"
                    aria-label={`Carryout From ${carryoutAddressFull}`}
                  >
                    <span className="carryout-iconbox" aria-hidden="true">
                      <CarryoutIcon className="carryout-icon" focusable="false" />
                    </span>
                    <span className="carryout-sep" aria-hidden="true" />
                    <span className="carryout-text">
                      <span className="carryout-line carryout-line--sm">CARRYOUT FROM</span>
                      <span className="carryout-line carryout-line--lg">
                        {carryoutAddress}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span
                    className="carryout-chip"
                    aria-label={`Delivery To ${
                      formatAddressFull(deliveryAddress) || "Enter Address"
                    }`}
                  >
                    <span className="carryout-iconbox" aria-hidden="true">
                      <DeliveryIcon className="carryout-icon" focusable="false" />
                    </span>
                    <span className="carryout-sep" aria-hidden="true" />
                    <span className="carryout-text">
                      <span className="carryout-line carryout-line--sm">DELIVERY TO</span>
                      <span className="carryout-line carryout-line--lg">
                        {deliveryAddressDisplay}
                      </span>
                    </span>
                  </span>
                )}
              </button>

              <div className="header-seg header-seg--cart" role="button" aria-label="Cart">
                <CartToggle />
                <div className="header-cart__label">CART</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showSubheader && (
        <div className="subheader">
          <div className="container subheader__inner">
            <nav className="subnav">
              {subnav.map((s) => (
                <button
                  key={s.key}
                  className={`subnav__link ${
                    activeSubKey === s.key ? "is-active" : ""
                  }`}
                  onClick={() => handleSubnavClick(s)}
                  aria-current={activeSubKey === s.key ? "page" : undefined}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
