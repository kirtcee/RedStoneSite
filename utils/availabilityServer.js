// utils/availabilityServer.js
//
// SERVER-ONLY. The kitchen's sold-out list (settings/menu), cached for a few
// seconds. If it can't be read, nothing is treated as sold out.
import { adminDb } from "./firebaseAdmin";
import { readSoldOut } from "./availability";

let cache = null; // { at, value: Set }

export async function getSoldOut() {
  if (cache && Date.now() - cache.at < 5000) return cache.value;
  try {
    const snap = await adminDb.collection("settings").doc("menu").get();
    cache = { at: Date.now(), value: new Set(readSoldOut(snap.exists ? snap.data() : null)) };
    return cache.value;
  } catch (e) {
    console.warn("getSoldOut failed, treating everything as available", e?.message);
    return new Set();
  }
}
