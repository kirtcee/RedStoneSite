// utils/deliveryQuote.js
//
// SERVER-ONLY. Works out a delivery fee from the drive time between the
// store and an address, using Google's Routes API with the server key
// GOOGLE_MAPS_SERVER_KEY (Vercel env vars / .env.local; Routes API enabled).
// The browser's Maps key can't be used here: it's locked to the website.
//
// Drive time is calculated WITHOUT live traffic, so the same address always
// gets the same price. The fee table lives in utils/orderRules.js.
import { STORE_ADDRESS, deliveryFeeForMinutes } from "./orderRules";

const cache = new Map(); // address text -> quote (per server instance)
const CACHE_MS = 24 * 60 * 60 * 1000;

// One line of text for an address object from the delivery form.
export function addressText(addr) {
  if (!addr || typeof addr !== "object") return "";
  const clean = (v) => String(v || "").trim().slice(0, 120);
  const parts = [clean(addr.street), clean(addr.city), [clean(addr.province), clean(addr.postal)].filter(Boolean).join(" ")];
  if (!clean(addr.street) || !clean(addr.city)) return "";
  return `${parts.filter(Boolean).join(", ")}, Canada`;
}

// Resolves { ok: true, minutes, km, feeCents, tooFar } or { ok: false, reason }.
// feeCents is null when tooFar (over the online delivery limit).
export async function quoteDelivery(addr) {
  const destination = addressText(addr);
  if (!destination) return { ok: false, reason: "bad_address" };

  const key = String(process.env.GOOGLE_MAPS_SERVER_KEY || "").replace(/^[\s"']+|[\s"']+$/g, "");
  if (!key) return { ok: false, reason: "not_configured" };

  const cacheKey = destination.toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.quote;

  let data;
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { address: STORE_ADDRESS },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        regionCode: "CA",
      }),
    });
    data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("quoteDelivery: Google refused", res.status, data?.error?.status, data?.error?.message);
      return { ok: false, reason: `google_${data?.error?.status || res.status}` };
    }
  } catch (e) {
    console.error("quoteDelivery: request failed", e);
    return { ok: false, reason: "network" };
  }

  const route = data?.routes?.[0];
  const seconds = parseInt(String(route?.duration || "").replace("s", ""), 10);
  if (!route || !Number.isFinite(seconds)) return { ok: false, reason: "no_route" };

  const minutes = Math.max(1, Math.ceil(seconds / 60));
  const feeCents = deliveryFeeForMinutes(minutes);
  const quote = {
    ok: true,
    minutes,
    km: Math.round((Number(route.distanceMeters) || 0) / 100) / 10,
    feeCents,
    tooFar: feeCents == null,
  };
  cache.set(cacheKey, { at: Date.now(), quote });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return quote;
}
