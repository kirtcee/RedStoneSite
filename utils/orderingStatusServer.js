// utils/orderingStatusServer.js
//
// SERVER-ONLY. Reads the kitchen's Online Ordering switch
// (settings/ordering, see utils/orderingStatus.js) and applies it to the
// store hours before an order is checked. Cached for a few seconds. If it
// can't be read, orders aren't blocked (same as the wait times).
import { adminDb } from "./firebaseAdmin";
import { readOrderingStatus, OPEN_STATUS } from "./orderingStatus";
import { applyOrderingStatus } from "./storeHours";

let cache = null; // { at, value }

export async function getOrderingStatus() {
  if (!cache || Date.now() - cache.at >= 5000) {
    try {
      const snap = await adminDb.collection("settings").doc("ordering").get();
      cache = { at: Date.now(), value: readOrderingStatus(snap.exists ? snap.data() : null) };
    } catch (e) {
      console.warn("getOrderingStatus failed, treating ordering as open", e?.message);
      return applyAndReturn({ ...OPEN_STATUS });
    }
  }
  return applyAndReturn(cache.value);
}

function applyAndReturn(value) {
  applyOrderingStatus(value);
  return value;
}
