// utils/waitTimesServer.js
//
// SERVER-ONLY. The kitchen's current wait times (settings/waitTimes in
// Firestore), used to set a new order's pickup/delivery time. Falls back to
// the minimums if the setting can't be read, so an order is never blocked.
import { adminDb } from "./firebaseAdmin";
import { readWaitTimes, MIN_WAIT } from "./waitTimes";

let cache = null; // { at, value }

export async function getWaitTimes() {
  if (cache && Date.now() - cache.at < 15000) return cache.value;
  try {
    const snap = await adminDb.collection("settings").doc("waitTimes").get();
    const value = readWaitTimes(snap.exists ? snap.data() : null);
    cache = { at: Date.now(), value };
    return value;
  } catch (e) {
    console.error("getWaitTimes failed, using minimums", e?.message);
    return { ...MIN_WAIT };
  }
}
