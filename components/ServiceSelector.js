// components/ServiceSelector.js
import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useCart } from "./CartSystem";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Fallback center (Hamilton-ish) if geocoding fails
const STORE_LAT = parseFloat(process.env.NEXT_PUBLIC_STORE_LAT || "43.2557");
const STORE_LNG = parseFloat(process.env.NEXT_PUBLIC_STORE_LNG || "-79.8711");

// Canonical store address (geocoded at runtime)
const STORE_ADDRESS = "576 Concession Street, Hamilton, Ontario";

const addressTypes = [
  "House",
  "Apartment",
  "Business",
  "Campus/Base",
  "Hotel",
  "Dormitory",
  "Other",
];

function CarIcon({ filled }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "currentColor" }}
    >
      <path d="M3 13l1-3 1-3a2 2 0 0 1 2-1h9a2 2 0 0 1 2 1l2 6" />
      <path d="M5 16h14" />
      <circle
        cx="7.5"
        cy="16.5"
        r="1.5"
        fill={filled ? "currentColor" : "none"}
      />
      <circle
        cx="16.5"
        cy="16.5"
        r="1.5"
        fill={filled ? "currentColor" : "none"}
      />
      <path d="M6 10h12" />
    </svg>
  );
}

function RunnerIcon({ filled }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "currentColor" }}
    >
      <circle
        cx="13"
        cy="4"
        r="2"
        fill={filled ? "currentColor" : "none"}
      />
      <path d="M4 17l5-4 2-4" />
      <path d="M12 8l4 1 4 2" />
      <path d="M7 22l2-5 5-3 3 3" />
    </svg>
  );
}

function StoreMap({ onCarryoutClick, mapsReady, storeLatLng }) {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markerRef = useRef(null);
  const infowinRef = useRef(null);
  const domReadyListenerRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapsReady || !window.google || !mapRef.current || mapObjRef.current)
      return;

    const g = window.google;
    const center = new g.maps.LatLng(storeLatLng.lat, storeLatLng.lng);

    const map = new g.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });
    mapObjRef.current = map;

    const marker = new g.maps.Marker({
      position: center,
      map,
      title: "Our Store",
    });
    markerRef.current = marker;

    const infoDiv = document.createElement("div");
    infoDiv.style.fontFamily = "system-ui,sans-serif";
    infoDiv.innerHTML = `
      <div style="min-width:220px">
        <div style="font-weight:700;margin-bottom:6px;">Redstone Pizza</div>
        <div style="margin-bottom:4px;">576 Concession St, Hamilton, ON</div>
        <div style="margin-bottom:4px;">Phone: <a href="tel:+1-905-385-9888">905-385-9888</a></div>
        <div style="margin-bottom:8px;">Hours: 11:00–22:00</div>
        <button id="map-carryout-btn" style="background:#e91e28;color:#fff;border:0;border-radius:4px;padding:.5rem .75rem;font-weight:800;cursor:pointer;width:100%;text-transform:uppercase">Carryout</button>
      </div>
    `;
    const iw = new g.maps.InfoWindow({ content: infoDiv });
    infowinRef.current = iw;

    marker.addListener("click", () => iw.open({ anchor: marker, map }));

    domReadyListenerRef.current = g.maps.event.addListenerOnce(
      iw,
      "domready",
      () => {
        const btn = document.getElementById("map-carryout-btn");
        if (btn) btn.addEventListener("click", () => onCarryoutClick?.());
      }
    );

    iw.open({ anchor: marker, map });

    return () => {
      if (domReadyListenerRef.current) {
        g.maps.event.removeListener(domReadyListenerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady]);

  // Recenter if store location changes (after geocoding)
  useEffect(() => {
    if (!mapObjRef.current || !markerRef.current) return;
    const pos = new window.google.maps.LatLng(storeLatLng.lat, storeLatLng.lng);
    markerRef.current.setPosition(pos);
    mapObjRef.current.setCenter(pos);
    mapObjRef.current.setZoom(14);
  }, [mapsReady, storeLatLng]);

  return (
    <div
      ref={mapRef}
      className="mapBox"
      style={{
        width: "100%",
        height: 420,
        background: "#f1f1f1",
        border: "1px solid var(--border, #e3e3e3)",
        borderRadius: 4,
      }}
    />
  );
}

/**
 * The carryout/delivery + address picker. Used both as the standalone
 * /order page (see pages/order.js) and as the in-place gate overlay opened
 * by CartSystem.js when a service method hasn't been confirmed yet — in
 * both cases `onConfirmed` is called once the user has picked Carryout, or
 * entered and confirmed a Delivery address.
 */
export default function ServiceSelector({ onConfirmed }) {
  const { confirmCarryout, confirmDelivery } = useCart();
  const [choice, setChoice] = useState(null); // 'delivery' | 'carryout' | null
  const [mapsReady, setMapsReady] = useState(false);

  // Keep store location in parent so Autocomplete can bias to it
  const [storeLatLng, setStoreLatLng] = useState({
    lat: STORE_LAT,
    lng: STORE_LNG,
  });

  // If maps already loaded globally, pick it up
  useEffect(() => {
    if (window.google?.maps) setMapsReady(true);
  }, []);

  // Geocode store address -> set exact lat/lng
  useEffect(() => {
    if (!mapsReady || !window.google) return;
    const g = window.google;
    const geocoder = new g.maps.Geocoder();

    geocoder.geocode(
      { address: STORE_ADDRESS, componentRestrictions: { country: "CA" } },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setStoreLatLng({ lat: loc.lat(), lng: loc.lng() });
        }
      }
    );
  }, [mapsReady]);

  // Delivery form state
  const [addrType, setAddrType] = useState("House");
  const [street, setStreet] = useState("");
  const [suite, setSuite] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("ON"); // captured from Places silently
  const [postal, setPostal] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const autoRef = useRef(null);
  const autoObjRef = useRef(null);

  // Init Places Autocomplete with strong local bias
  useEffect(() => {
    if (
      !mapsReady ||
      choice !== "delivery" ||
      !autoRef.current ||
      !window.google
    )
      return;

    const g = window.google;
    const inputEl = autoRef.current;

    // ~20 km Hamilton area (feel free to adjust)
    const localBounds = new g.maps.Circle({
      center: storeLatLng,
      radius: 20000,
    }).getBounds();

    const ac = new g.maps.places.Autocomplete(inputEl, {
      fields: ["address_components", "formatted_address", "geometry", "name"],
      componentRestrictions: { country: "ca" },
      types: ["address"],
      bounds: localBounds,
      strictBounds: true, // <= keep early suggestions local
      origin: new g.maps.LatLng(storeLatLng.lat, storeLatLng.lng), // ranking hint
    });
    autoObjRef.current = ac;

    // As user types more characters, relax the bounds so they can search farther
    const handleInput = () => {
      const n = inputEl.value.trim().length;
      // <6 chars: keep strict local; >=6 chars: allow Canada-wide (still country=ca)
      ac.setOptions({ strictBounds: n < 6 });
      if (n >= 6) {
        // keep a (weaker) bias so Hamilton still ranks well
        ac.setBounds(localBounds);
      }
    };
    inputEl.addEventListener("input", handleInput);

    // Optional: user geolocation for even better ranking if available
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const near = new g.maps.Circle({
              center: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              },
              radius: 15000,
            }).getBounds();
            ac.setBounds(near);
          },
          () => {}
        );
      }
    } catch {}

    const partsOf = (place, t) =>
      place.address_components?.find((c) => c.types.includes(t))?.long_name ||
      "";

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place || !place.address_components) return;

      const streetNum = partsOf(place, "street_number");
      const route = partsOf(place, "route");
      const locality =
        partsOf(place, "locality") ||
        partsOf(place, "sublocality_level_1");
      const admin1 = partsOf(place, "administrative_area_level_1");
      const pc = partsOf(place, "postal_code");

      setStreet([streetNum, route].filter(Boolean).join(" "));
      setCity(locality);
      setProvince(admin1 || "ON");
      setPostal(pc || "");
    });

    // Keep PAC aligned with the input
    const fixPacPosition = () => {
      const pac = document.querySelector(".pac-container");
      if (!pac || !inputEl) return;
      const r = inputEl.getBoundingClientRect();
      pac.style.left = `${r.left + window.scrollX}px`;
      pac.style.top = `${r.bottom + window.scrollY}px`;
      pac.style.width = `${r.width}px`;
      pac.style.transform = "none";
    };
    const onFocus = () => setTimeout(fixPacPosition, 0);
    inputEl.addEventListener("focus", onFocus);
    window.addEventListener("resize", fixPacPosition);
    document.addEventListener("scroll", fixPacPosition, true);
    fixPacPosition();

    return () => {
      inputEl.removeEventListener("input", handleInput);
      inputEl.removeEventListener("focus", onFocus);
      window.removeEventListener("resize", fixPacPosition);
      document.removeEventListener("scroll", fixPacPosition, true);
      autoObjRef.current = null;
    };
  }, [mapsReady, choice, storeLatLng]);

  const canSubmitDelivery = street.trim() && city.trim() && postal.trim();

  const handleConfirmDelivery = () => {
    const payload = {
      addressType: addrType,
      street,
      suite,
      city,
      province,
      postal,
    };
    confirmDelivery(payload);
    onConfirmed?.();
  };

  const goCarryout = () => {
    confirmCarryout();
    onConfirmed?.();
  };

  return (
    <div className="container" style={{ padding: "1rem 0 2rem" }}>
      {/* If Maps also loads in _app.js, this is a harmless no-op */}
      {GOOGLE_KEY ? (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
        />
      ) : null}

      <h1 className="menu-title" style={{ marginBottom: 12 }}>
        Select Your Service Method
      </h1>

      <div className="section">
        <div className="section__title">
          Select from one of the below service methods
        </div>
        <div className="section__body">
          <div className="methodRow">
            <button
              className={`methodBtn ${
                choice === "delivery" ? "is-selected" : ""
              }`}
              onClick={() => setChoice("delivery")}
              aria-pressed={choice === "delivery"}
            >
              <span className="methodIcon">
                <CarIcon filled={choice === "delivery"} />
              </span>
              <span className="methodLabel">DELIVERY</span>
            </button>

            <span className="or">— OR —</span>

            <button
              className={`methodBtn ${
                choice === "carryout" ? "is-selected" : ""
              }`}
              onClick={() => setChoice("carryout")}
              aria-pressed={choice === "carryout"}
            >
              <span className="methodIcon">
                <RunnerIcon filled={choice === "carryout"} />
              </span>
              <span className="methodLabel">CARRYOUT</span>
            </button>
          </div>

          {/* Carryout view */}
          {choice === "carryout" && (
            <div className="stack">
              <StoreMap
                mapsReady={mapsReady}
                onCarryoutClick={goCarryout}
                storeLatLng={storeLatLng}
              />
              <button className="bigRedNarrow" onClick={goCarryout}>
                CONTINUE FOR CARRYOUT
              </button>
            </div>
          )}

          {/* Delivery view */}
          {choice === "delivery" && (
            <div className="deliveryBox">
              {/* Google location (centered & wider) */}
              <label className="field googleField">
                <span className="field__label">Enter Location</span>
                <input
                  ref={autoRef}
                  className="textInput googleInput"
                  placeholder="Enter Location"
                />
              </label>

              <div className="softDivider" />

              {/* Inline rows: label right-aligned, inputs aligned */}
              <div className="formList">
                <div className="formRow">
                  <label className="lab">Address Type:</label>
                  <select
                    className="textInput"
                    value={addrType}
                    onChange={(e) => setAddrType(e.target.value)}
                  >
                    {addressTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="formRow">
                  <label className="lab req">* Street Address:</label>
                  <input
                    className="textInput"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>

                <div className="formRow">
                  <label className="lab">Suite/Apt #:</label>
                  <input
                    className="textInput"
                    value={suite}
                    onChange={(e) => setSuite(e.target.value)}
                  />
                </div>

                <div className="formRow">
                  <label className="lab req">* City:</label>
                  <input
                    className="textInput"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="formRow">
                  <label className="lab req">* Postal Code:</label>
                  <input
                    className="textInput"
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                  />
                </div>

                <div className="note">
                  <span className="req">*</span> Indicates required field.
                </div>

                <div className="btnRow">
                  <button
                    className="bigRedNarrow"
                    disabled={!canSubmitDelivery}
                    onClick={() => setShowConfirm(true)}
                  >
                    CONTINUE FOR DELIVERY
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation popup – standalone modal (no DebugPizzaOverlay) */}
      {showConfirm && (
        <>
          <div
            className="addrModal-backdrop"
            onClick={() => setShowConfirm(false)}
          />

          <div
            className="addrModal-root"
            role="dialog"
            aria-modal="true"
            aria-label="Address details confirmation"
            onClick={() => setShowConfirm(false)}
          >
            <div
              className="confirmCard"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirmTitle">ADDRESS DETAILS</div>
              <div className="confirmBody">
                <div className="row">
                  <div className="k">Address Type:</div>
                  <div className="v">{addrType || "—"}</div>
                </div>
                <div className="row">
                  <div className="k">Street Address:</div>
                  <div className="v">{street || "—"}</div>
                </div>
                <div className="row">
                  <div className="k">Suite/Apt #:</div>
                  <div className="v">{suite || "NONE"}</div>
                </div>
                <div className="row">
                  <div className="k">City:</div>
                  <div className="v">{city || "—"}</div>
                </div>
                <div className="row">
                  <div className="k">Province:</div>
                  <div className="v">{province || "—"}</div>
                </div>
                <div className="row">
                  <div className="k">Postal Code:</div>
                  <div className="v">{postal || "—"}</div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    className="linkBtn"
                    onClick={() => setShowConfirm(false)}
                  >
                    Change Address
                  </button>

                  <button
                    type="button"
                    className="bigRedNarrow"
                    style={{ margin: 0, width: "auto" }}
                    onClick={handleConfirmDelivery}
                  >
                    Confirm &amp; Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        :global(:root) {
          --brand-blue: #006491;
          --red: #e91e28;
          --maroon: #7e0f14;
          --maroon-dark: #5f0b0f;
          --glow: #2ecc71;
          --border: #d4d4d4;
        }

        .section {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        .section__title {
          background: var(--maroon);
          color: #fff;
          font-family: var(--font-heading, Oswald, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          padding: 0.65rem 0.9rem;
        }
        .section__body {
          padding: 1rem;
        }

        .methodRow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          margin: 10px 0 16px;
          flex-wrap: wrap;
        }
        .or {
          color: #777;
          font-weight: 700;
        }

        .methodBtn {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #0b6d97;
          color: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.12s ease,
            background 0.12s ease;
        }
        .methodBtn:hover {
          transform: translateY(-1px);
        }
        .methodBtn.is-selected {
          background: #085a79;
          box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.35),
            0 6px 16px rgba(0, 0, 0, 0.15);
        }
        .methodIcon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .methodLabel {
          font-family: var(--font-heading, Oswald, sans-serif);
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 0.3px;
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bigRedNarrow {
          background: var(--red);
          color: #fff;
          border: none;
          padding: 0.85rem 1.2rem;
          font-family: var(--font-heading, Oswald, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-size: 1.15rem;
          width: 360px;
          max-width: 90%;
          align-self: center;
          cursor: pointer;
        }
        .bigRedNarrow:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .deliveryBox {
          max-width: 760px;
          margin: 0 auto;
          padding: 8px 0 2px;
        }

        .field {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
        }
        .field__label {
          font-weight: 500;
          margin-bottom: 6px;
        }
        .googleField {
          align-items: center;
          text-align: center;
        }
        .googleField .field__label {
          align-self: center;
        }
        .googleInput {
          width: 720px;
          max-width: 100%;
        }

        .softDivider {
          margin: 18px 0 26px;
          border-top: 1px solid #ededed;
        }

        .formList {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .formRow {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lab {
          width: 170px;
          text-align: right;
          font-weight: 500;
          color: #333;
        }
        .lab.req {
          font-weight: 800;
        }

        .textInput {
          border: 1px solid var(--border);
          border-radius: 0;
          padding: 0.45rem 0.5rem;
          outline: none;
          width: 420px;
          max-width: 100%;
          background: #fff;
        }
        .textInput:focus {
          border-color: #c9c9c9;
        }

        .note {
          color: #666;
          font-size: 0.9rem;
          margin: 6px 0 10px;
        }
        .btnRow {
          margin-top: 6px;
          display: flex;
          justify-content: center;
        }

        /* Address confirmation card */
.confirmCard {
  border: none;                  /* remove border */
  border-radius: 0;              /* remove rounding */
  background: #fff;              /* clean white bottom panel */
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35); /* stronger shadow */
  max-width: 520px;
  width: 100%;
  overflow: hidden;
}

/* Header stays flush edge-to-edge */
.confirmTitle {
  background: var(--maroon);
  color: #fff;
  font-family: var(--font-heading, Oswald, sans-serif);
  font-weight: 900;
  text-transform: uppercase;
  padding: 0.75rem 1rem;
  border-radius: 0;               /* make header squared */
  border: none;                   /* no border */
}

        .confirmBody {
          padding: 12px;
        }
        .row {
          display: flex;
          gap: 12px;
          margin: 6px 0;
        }
        .k {
          width: 140px;
          color: #666;
        }
        .v {
          flex: 1;
          font-weight: 700;
        }
        .linkBtn {
          background: none;
          border: none;
          color: var(--brand-blue);
          padding: 0;
          cursor: pointer;
          font-weight: 700;
        }

        /* Address confirmation modal wrapper */
        .addrModal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 9990;
        }
        .addrModal-root {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 80px;
          padding-bottom: 40px;
          z-index: 9991;
        }

        :global(.pac-container) {
          z-index: 99999 !important;
          border-radius: 0px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
        }
      `}</style>
    </div>
  );
}
