// components/Header.js
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CartToggle } from "./CartSystem";
import CarryoutIcon from "../public/carryoutRSP.svg";
import DeliveryIcon from "../public/deliveryRSP.svg";
import HomeIcon from "../public/homeRSP.svg";
import StoreLogo from "../public/storelogoRSP.svg";

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

const truncateAddr = (s) => {
  const str = (s || "").toString();
  return str.length > 13 ? str.slice(0, 10) + "..." : str;
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
  const [service, setService] = useState("carryout");
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [pendingService, setPendingService] = useState("carryout");

  const tab = (router.query.tab || "").toString();
  const sub = (router.query.sub || "").toString();

  // load saved service
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rs_service");
      if (saved) {
        setService(saved);
        setPendingService(saved);
      }
    } catch {}
  }, []);

  // save service
  useEffect(() => {
    try {
      localStorage.setItem("rs_service", service);
    } catch {}
  }, [service]);

  // load delivery address (JSON or plain string)
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("rs_delivery_address") ||
        localStorage.getItem("delivery_address") ||
        "";
      if (!raw) return;

      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
      setDeliveryAddress(parsed);
    } catch {}
  }, []);

  const inMenuMode = useMemo(() => {
    const p = router.pathname || "";
    return MENU_MODE_PATHS.some((base) => p.startsWith(base));
  }, [router.pathname]);

  const homeNav = [
    { key: "order", label: "ORDER\nONLINE", onClick: () => router.push("/order") },
    { key: "menu", label: "MENU", onClick: () => router.push("/menu") },
    { key: "deals", label: "DEALS", onClick: () => router.push("/deals") },
    {
      key: "calculator",
      label: "PIZZA\nCALCULATOR",
      onClick: () => router.push("/pizza-calculator"),
    },
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
      if (p.startsWith("/deals")) return "deals";
      if (p.startsWith("/pizza-calculator")) return "calculator";
      return "";
    }
  }, [inMenuMode, router.pathname, tab, sub]);

  const showSubheader =
    inMenuMode && ["entrees", "sides", "drinks", "combos"].includes(activeTopKey);

  const subnav = useMemo(() => {
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
    const current = sub || "all";
    const match = subnav.find((s) => s.key === current);
    return match ? match.key : "all";
  }, [showSubheader, sub, subnav]);

  const topItems = inMenuMode ? menuNav : homeNav;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("has-subheader", showSubheader);
    }
  }, [showSubheader]);

  const carryoutAddressFull = "576 Concession Street";
  const carryoutAddress = truncateAddr(carryoutAddressFull);
  const deliveryAddressDisplay =
    truncateAddr(formatAddressFull(deliveryAddress)) || "Enter Address";

  const openOrderModal = () => {
    setPendingService(service);
    setModalPage(1);
    setIsModalOpen(true);
  };
  const closeOrderModal = () => setIsModalOpen(false);

  const continueFromPicker = () => {
    setService(pendingService);
    setIsModalOpen(false);
  };

  const brandBlue = "#0b61d6";
  const isDeliveryFirst = service !== "carryout";

  const ModeButton = ({ value, label, sub, Icon }) => {
    const selected = pendingService === value;
    return (
      <button
        type="button"
        onClick={() => setPendingService(value)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "14px 12px",
          marginBottom: "10px",
          border: `1px solid ${brandBlue}`,
          borderRadius: 6,
          background: selected ? brandBlue : "#fff",
          color: selected ? "#fff" : "#0d0d0d",
          transition: "background .15s ease",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 13, opacity: selected ? 0.95 : 0.8 }}>{sub}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Icon className="carryout-icon" aria-hidden focusable="false" />
        </div>
      </button>
    );
  };

  return (
    <>
      <header className="site-header site-header--red">
        <div className="container site-header__inner">
          <div className="header-row">
            <div className="header-row__start">
              <Link href="/" className="header-seg header-seg--logo" aria-label="Home">
                <StoreLogo className="header-logo-mark" aria-hidden focusable="false" />
              </Link>

              {topItems.map((item) => (
                <button
                  key={item.key}
                  className={`header-seg header-seg--nav ${
                    activeTopKey === item.key ? "is-active" : ""
                  }`}
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

            <div className="header-row__end">
              <button
                className="header-seg header-seg--mode"
                onClick={openOrderModal}
                aria-label="Order details"
                title="Order details"
              >
                {service === "carryout" ? (
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
                  onClick={() =>
                    router.push(buildMenuUrl(s.qp), undefined, { scroll: false })
                  }
                  aria-current={activeSubKey === s.key ? "page" : undefined}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL (custom, not DebugPizzaOverlay) */}
      {isModalOpen && (
        <>
          <div className="header-order-backdrop" onClick={closeOrderModal} />
          <div className="header-order-viewport" onClick={closeOrderModal}>
            <div
              className="header-order-panel"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-details-title"
            >
              <div className="modal-body">
                <div className="order-details-inner">
                  <h2 id="order-details-title" style={{ marginBottom: 4 }}>
                    Order Details
                  </h2>
                  <div style={{ color: "#333", marginBottom: 12 }}>
                    How would you like your pizza today?
                  </div>

                  {modalPage === 1 ? (
                    <>
                      {/* SERVICE ROW */}
                      <div className="order-details-row">
                        <span aria-hidden="true">
                          {service === "carryout" ? (
                            <CarryoutIcon className="carryout-icon" />
                          ) : (
                            <DeliveryIcon className="carryout-icon" />
                          )}
                        </span>
                        <div className="order-details-main">
                          <div className="order-details-title">
                            {service === "carryout" ? "Carryout" : "Delivery"}
                          </div>
                          <div className="order-details-sub">
                            {service === "carryout"
                              ? "Store Pickup"
                              : "Order delivery"}
                          </div>
                          {service === "carryout" && (
                            <div className="order-details-note">
                              Order will be waiting for you in the store
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingService(service);
                            setModalPage(2);
                          }}
                          className="order-details-link"
                        >
                          Change
                        </button>
                      </div>

                      <div className="order-details-divider" />

                      {/* ADDRESS ROW */}
                      <div className="order-details-row">
                        <span aria-hidden="true">
                          <HomeIcon className="carryout-icon" />
                        </span>
                        <div className="order-details-main">
                          <div className="order-details-title">
                            {service === "carryout"
                              ? "Store"
                              : "Delivery Address"}
                          </div>
                          <div className="order-details-sub">
                            {service === "carryout"
                              ? carryoutAddressFull
                              : formatAddressFull(deliveryAddress) ||
                                "Enter Address"}
                          </div>
                        </div>

                        {service === "delivery" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsModalOpen(false);
                              router.push("/order");
                            }}
                            className="order-details-link"
                          >
                            Change address
                          </button>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => setModalPage(1)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0b61d6",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          &lt; Back
                        </button>
                      </div>

                      {(isDeliveryFirst
                        ? ["delivery", "carryout"]
                        : ["carryout", "delivery"]
                      ).map((k) =>
                        k === "delivery" ? (
                          <ModeButton
                            key="delivery"
                            value="delivery"
                            label="Delivery"
                            sub="Order delivery"
                            Icon={DeliveryIcon}
                          />
                        ) : (
                          <ModeButton
                            key="carryout"
                            value="carryout"
                            label="Carryout"
                            sub="Store Pickup"
                            Icon={CarryoutIcon}
                          />
                        )
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={continueFromPicker}
                          style={{
                            background: "#e53935",
                            color: "#fff",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: 4,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            .header-order-backdrop {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.35);
              z-index: 9998;
            }
            .header-order-viewport {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              overflow-y: auto;
              padding: 32px 12px;
            }
            .header-order-panel {
              background: #ffffff;
              border-radius: 0;
              border: none;
              max-width: 640px;
              width: 100%;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
            }
            .header-order-panel .modal-body {
              padding: 16px 18px 18px;
            }
            .order-details-inner {
              max-width: 520px;
              margin: 0 auto;
            }
            .order-details-row {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 10px 0;
              width: 100%;
            }
            .order-details-main {
              flex: 1;
              min-width: 0;
            }
            .order-details-title {
              font-family: "Oswald", sans-serif;
              font-weight: 700;
              text-transform: uppercase;
            }
            .order-details-sub {
              font-size: 13px;
              color: #444;
            }
            .order-details-note {
              font-size: 12px;
              color: #666;
              margin-top: 2px;
            }
            .order-details-link {
              margin-left: auto;
              background: none;
              border: none;
              color: #0b61d6;
              font-weight: 700;
              cursor: pointer;
              padding: 0;
              white-space: nowrap;
            }
            .order-details-divider {
              height: 1px;
              background: #000;
              opacity: 0.18;
              margin: 8px 0;
            }
          `}</style>
        </>
      )}
    </>
  );
}
