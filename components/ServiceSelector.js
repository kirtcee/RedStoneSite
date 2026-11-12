// components/ServiceSelector.js
import React, { useEffect, useRef, useState } from "react";
import { useCart } from "./CartSystem";

// Fallback center (Hamilton-ish) if geocoding fails. Strip stray quotes /
// whitespace and fall back if the env value still isn't a finite number, so
// a malformed env var can't hand Google Maps a NaN center.
const envCoord = (raw, fallback) => {
  const n = parseFloat(String(raw ?? "").replace(/["'\s]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};
const STORE_LAT = envCoord(process.env.NEXT_PUBLIC_STORE_LAT, 43.2557);
const STORE_LNG = envCoord(process.env.NEXT_PUBLIC_STORE_LNG, -79.8711);

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

// Custom service-method icons. Single solid shape filled with
// currentColor, so they take the button's text color (white). The viewBoxes
// are cropped to the artwork so both icons render at the same visual size.
function CarIcon() {
  return (
    <svg width="44" height="44" viewBox="8 14 61 59" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M53.33 62.83 L53 63.33 L53 67.83 L53.33 68.67 L54 69.67 L55.33 70.67 L57 70.83 L58.17 70.33 L59.33 69.33 L59.83 68.5 L60 63.33 L59.5 62.83 Z M16.5 63.33 L16.5 67.17 L17.17 69.17 L18.17 70.17 L19.67 70.83 L21.17 70.67 L22.67 69.67 L23.67 68 L23.67 64.17 L23.83 64 L23.67 63.17 L23.17 62.83 L17.17 62.83 Z M9.83 42.67 L9.83 56.83 L10.17 57.67 L11 58.67 L13.17 59.67 L63.33 59.67 L65.33 58.83 L65.83 58.33 L66.83 56.5 L66.83 43.17 L66 41.5 L65.33 40.83 L63.83 40 L12.67 40 L11 41 L10.17 41.83 Z M32.83 51.67 L33.33 51 L43.17 51 L43.67 51.5 L43.83 52.17 L43.33 52.83 L42.83 53 L33.5 53 L33 52.67 Z M32.83 47.33 L33.5 46.67 L42.83 46.67 L43.33 46.83 L43.83 47.33 L43.83 47.67 L43.17 48.5 L34 48.5 L33.67 48.67 L33 48.17 Z M56.17 45.17 L57 45.17 L59.17 46.17 L60.33 47.5 L61 48.83 L60.83 51.17 L60 52.5 L58.33 53.83 L57 54.17 L55.17 54 L53.67 53.17 L52 51.17 L51.83 50.17 L52 48.5 L52.67 47.33 L54 46 Z M19.67 45.17 L21 45.33 L22.5 46 L24 47.5 L24.5 49.17 L24.5 50.33 L23.67 52.5 L22.17 53.67 L20.5 54.17 L18.67 54 L17.67 53.5 L16.17 52.17 L15.67 50.83 L15.67 48.67 L16 47.5 L17.83 45.83 Z M19.17 27.5 L19.17 36.83 L19.83 37.5 L21.33 37.5 L21.83 37.17 L22 36.67 L22 27.83 L22.67 26.67 L23.5 25.83 L24.83 25.17 L25.83 25 L26.17 25.17 L49.67 25.17 L49.83 25 L51.5 25.17 L53 25.83 L53.83 26.67 L54.17 27.5 L54.5 37.17 L55.17 37.5 L56.5 37.5 L57 37.33 L57.33 36.83 L57.33 27.5 L56.83 25.83 L55.83 24.33 L54.17 23 L52 22.5 L46.5 22.5 L45.5 22 L40 16.83 L38.5 15.83 L37.5 16 L32.17 21 L30.17 22.5 L24.5 22.5 L22.17 23.17 L20.17 25 Z"
      />
    </svg>
  );
}

function RunnerIcon() {
  return (
    <svg width="44" height="44" viewBox="11 18 61 67" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M43 42.5 L43 43.75 L43.5 44.75 L44.5 45.75 L45.75 46.25 L67.25 46.25 L69.25 45.25 L70 43.5 L69.75 41.5 L67.75 40 L45.5 40 L44.75 40.25 L43.25 41.75 Z M27.5 37 L26 38.25 L25.5 39.75 L25.5 57.5 L22.5 62.5 L21.75 64.25 L20.25 66.25 L20 67.25 L19.25 68 L17.75 71 L16 73.5 L16 74 L13 78.75 L13 80.5 L14.5 82.5 L15.25 82.75 L17.25 82.75 L17.75 82.5 L19.75 80.25 L20 79.25 L21.5 77.25 L27.75 66.25 L28.5 65.5 L29 65.5 L30.25 66.5 L43.25 81.75 L44.5 82.5 L46.5 82.5 L48.5 80.5 L48.75 79.75 L48.5 78.25 L47.5 76.75 L32 58.75 L31.75 58.25 L31.75 50.25 L32.25 49.75 L32.75 49.75 L36.5 54.25 L39.25 55.75 L46.25 55.75 L47.25 55.5 L48.75 54.5 L49.5 53.25 L49.5 51.75 L48.75 50.5 L47 49.25 L41.25 49.25 L40.25 48.75 L37.75 45.5 L30.25 37.25 L29.75 37 Z M58.75 23 L58.25 23.5 L58.25 24.25 L59.75 26.75 L57 31.25 L57 32.5 L58 33.75 L58.5 35 L59 35.5 L59.75 35.5 L60 35.25 L60 33.75 L59 32.25 L59 31.5 L59.75 30.5 L60 29.5 L61.5 27.5 L61.75 26.5 L60 23.5 L59.5 23 Z M53.5 23 L53 23.5 L53 24.25 L53.75 25.25 L54.25 26.75 L53.5 28.5 L52 30.5 L51.75 32.5 L53 34.75 L53.5 35.25 L54.5 35.5 L54.75 35.25 L54.75 34 L53.75 32.5 L53.75 31.25 L55.75 28.25 L56.25 26.25 L54.75 23.5 L54.25 23 Z M30.5 19.75 L29 19.75 L28.75 19.5 L25.5 20.25 L22.75 22.5 L22 23.5 L21.5 25.5 L21.5 28.25 L22.25 30.5 L23.75 32.25 L25.75 33.5 L27.5 34 L31 33.75 L33 32.75 L34.75 31 L35.75 29.25 L36 25.75 L35.5 23.75 L34.75 22.5 L33.25 21 Z"
      />
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

    // Title goes in the InfoWindow's header row, beside the close (X)
    // button, instead of below it (which left an empty gap at the top).
    const infoHeader = document.createElement("div");
    infoHeader.style.cssText =
      "font-family:system-ui,sans-serif;font-weight:700;font-size:16px;line-height:1.2;padding-top:2px;";
    infoHeader.textContent = "Red Stone Pizza";

    // No fixed min-width, and the button uses border-box sizing so its
    // padding can't push it wider than the popup (that was what caused the
    // sideways scrolling on phones). The address is split over two lines.
    const infoDiv = document.createElement("div");
    infoDiv.style.cssText =
      "font-family:system-ui,sans-serif;font-size:14px;line-height:1.35;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere;";
    infoDiv.innerHTML = `
      <div style="margin-bottom:4px;">576 Concession St<br />Hamilton, ON</div>
      <div style="margin-bottom:4px;">Phone: <a href="tel:+1-905-385-9888">905-385-9888</a></div>
      <div style="margin-bottom:10px;">Hours: 11:00–22:00</div>
      <button id="map-carryout-btn" style="display:block;box-sizing:border-box;width:100%;background:#8b1a1a;color:#fff;border:0;border-radius:4px;padding:.5rem .75rem;font-weight:800;cursor:pointer;text-transform:uppercase">Carryout</button>
    `;
    const iw = new g.maps.InfoWindow({
      headerContent: infoHeader,
      content: infoDiv,
      maxWidth: 230,
    });
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
      // Tear the map down explicitly so Google Maps stops tracking the
      // container once React removes it.
      iw.close();
      g.maps.event.clearInstanceListeners(iw);
      marker.setMap(null);
      g.maps.event.clearInstanceListeners(marker);
      g.maps.event.clearInstanceListeners(map);
      mapObjRef.current = null;
      markerRef.current = null;
      infowinRef.current = null;
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
export default function ServiceSelector({ onConfirmed, initialChoice = null }) {
  const { confirmCarryout, confirmDelivery } = useCart();
  const [choice, setChoice] = useState(initialChoice); // 'delivery' | 'carryout' | null
  const [mapsReady, setMapsReady] = useState(false);

  // Once a view has been opened, keep it mounted and only hide it when the
  // user switches away. Unmounting tore the map / autocomplete DOM out from
  // under Google Maps while it still had async work pending, which crashed
  // Safari ("IntersectionObserver.observe must be an instance of Element").
  const [carryoutOpened, setCarryoutOpened] = useState(initialChoice === "carryout");
  const [deliveryOpened, setDeliveryOpened] = useState(initialChoice === "delivery");
  useEffect(() => {
    if (choice === "carryout") setCarryoutOpened(true);
    if (choice === "delivery") setDeliveryOpened(true);
  }, [choice]);

  // Keep store location in parent so Autocomplete can bias to it
  const [storeLatLng, setStoreLatLng] = useState({
    lat: STORE_LAT,
    lng: STORE_LNG,
  });

  // Google Maps is loaded once for the whole site by pages/_app.js. Wait
  // for it here rather than adding a second <script> (loading the API twice
  // causes "included multiple times" errors and crashes in Safari).
  useEffect(() => {
    if (window.google?.maps?.places) {
      setMapsReady(true);
      return;
    }
    const id = setInterval(() => {
      if (window.google?.maps?.places) {
        setMapsReady(true);
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
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
  const localBoundsRef = useRef(null);

  // Init Places Autocomplete with strong local bias
  useEffect(() => {
    if (
      !mapsReady ||
      !deliveryOpened ||
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
    localBoundsRef.current = localBounds;

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
        ac.setBounds(localBoundsRef.current);
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
      g.maps.event.clearInstanceListeners(ac);
      autoObjRef.current = null;
    };
    // Created once per mounted input; storeLatLng updates are applied below
    // instead of rebuilding the Autocomplete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, deliveryOpened]);

  // Re-bias the existing Autocomplete when geocoding refines the store location
  useEffect(() => {
    const ac = autoObjRef.current;
    if (!ac || !window.google) return;
    const g = window.google;
    const localBounds = new g.maps.Circle({
      center: storeLatLng,
      radius: 20000,
    }).getBounds();
    localBoundsRef.current = localBounds;
    ac.setBounds(localBounds);
    ac.setOptions({
      origin: new g.maps.LatLng(storeLatLng.lat, storeLatLng.lng),
    });
  }, [storeLatLng]);

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
              <span className="methodCircle">
                <CarIcon />
              </span>
              <span className="methodLabel">DELIVERY</span>
            </button>

            <span className="or">OR</span>

            <button
              className={`methodBtn ${
                choice === "carryout" ? "is-selected" : ""
              }`}
              onClick={() => setChoice("carryout")}
              aria-pressed={choice === "carryout"}
            >
              <span className="methodCircle">
                <RunnerIcon />
              </span>
              <span className="methodLabel">CARRYOUT</span>
            </button>
          </div>

          {/* Carryout view */}
          {carryoutOpened && (
            <div
              className="stack"
              style={choice === "carryout" ? undefined : { display: "none" }}
            >
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
          {deliveryOpened && (
            <div
              className="deliveryBox"
              style={choice === "delivery" ? undefined : { display: "none" }}
            >
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
        /* Reskin note: this used to define its own --red/--maroon/--glow/
           --border custom properties on :global(:root) — a separate, older
           palette than the rest of the site's cream-box look (cart.js,
           checkout.js, DealBuilder.js), which is why this screen looked out
           of place next to them. Replaced with the same literal values
           those files use (no shared CSS vars for these — cart.js/
           checkout.js don't use any either, they just repeat the hex
           values), so it now matches instead of drifting independently.
           --brand-blue is left alone since it's a real global token
           (defined once in globals.css :root) already used correctly here. */
        .section {
          background: var(--menu-box-bg);
          border: 1px solid var(--menu-box-border);
          border-radius: .1875rem;
          overflow: hidden;
        }
        .section__title {
          background: #000;
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
          --method-circle: 84px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 22px;
          margin: 10px 0 16px;
          flex-wrap: wrap;
        }
        .or {
          color: var(--text-brown);
          font-weight: 800; /* a step bolder than the 700 labels */
          /* line up with the middle of the circles, not circle + label */
          line-height: 1.2;
          margin-top: calc(var(--method-circle) / 2 - 0.6em);
        }

        /* The whole column (circle + label) is the click target */
        .methodBtn {
          background: none;
          border: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font: inherit;
        }
        .methodCircle {
          width: var(--method-circle);
          height: var(--method-circle);
          border-radius: 50%;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.08s ease, box-shadow 0.12s ease,
            background 0.12s ease;
        }
        .methodCircle :global(svg) {
          width: 52%;
          height: 52%;
        }
        .methodBtn:hover .methodCircle {
          transform: translateY(-1px);
        }
        .methodBtn.is-selected .methodCircle {
          background: #262626;
          box-shadow: 0 0 0 4px rgba(139, 26, 26, 0.35),
            0 6px 16px rgba(0, 0, 0, 0.15);
        }
        /* Same look as the brown form labels ("Enter Location" etc.) */
        .methodLabel {
          font-weight: 700;
          color: var(--text-brown);
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bigRedNarrow {
          background: #8b1a1a;
          color: #fff;
          border: none;
          border-radius: .1875rem;
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
          font-weight: 700;
          color: var(--text-brown);
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
          font-weight: 700;
          color: var(--text-brown);
        }
        .lab.req {
          font-weight: 800;
        }

        .textInput {
          border: 1px solid var(--menu-box-border);
          border-radius: 6px;
          padding: 0.45rem 0.5rem;
          outline: none;
          width: 420px;
          max-width: 100%;
          background: #fff;
        }
        .textInput:focus {
          border-color: #8b1a1a;
        }

        .note {
          color: var(--text-brown);
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
  background: #000;
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
          color: var(--text-brown);
        }
        .v {
          flex: 1;
          font-weight: 700;
        }
        .linkBtn {
          background: none;
          border: none;
          color: var(--text-brown);
          text-decoration: underline;
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

        /* Mobile only: this page's form rows were built as a fixed
           170px-right-aligned-label + 420px-input pair, which on a phone
           left almost no room for the input and dragged everything toward
           the left edge. Stack label above input instead, and let
           everything else size to the actual screen instead of desktop
           pixel widths. */
        @media (max-width: 640px) {
          /* !important needed: the root div sets padding via an inline
             style prop (style={{ padding: "1rem 0 2rem" }}), which already
             zeroes out left/right padding on every screen size — that's the
             real source of "content jammed against the left edge" on
             mobile. A plain class rule can't out-rank an inline style. */
          .container {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
          .menu-title {
            font-size: 1.5rem;
          }
          .section__body {
            padding: 0.75rem;
          }
          .methodRow {
            gap: 14px;
          }
          .methodRow {
            --method-circle: 72px;
          }
          .deliveryBox {
            padding: 4px 0 0;
          }
          .googleInput {
            width: 100%;
          }
          .softDivider {
            margin: 14px 0 18px;
          }
          .formRow {
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
          }
          .lab {
            width: auto;
            text-align: left;
          }
          .textInput {
            width: 100%;
          }
          .bigRedNarrow {
            width: 100%;
            font-size: 1rem;
          }
          .row {
            flex-direction: column;
            gap: 2px;
          }
          .k {
            width: auto;
            color: #888;
            font-size: 0.8rem;
          }
          .addrModal-root {
            padding-top: 40px;
            padding-left: 12px;
            padding-right: 12px;
          }
        }
      `}</style>
    </div>
  );
}
