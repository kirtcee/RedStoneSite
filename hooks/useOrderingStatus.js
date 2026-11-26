// hooks/useOrderingStatus.js
//
// The kitchen's Online Ordering switch (paused / closed days), live. One
// shared Firestore listener for the whole page; every change is applied to
// utils/storeHours.js (so canOrderNow(), timeSlotsFor() etc. follow it) and
// re-renders the components using this hook.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { readOrderingStatus, OPEN_STATUS } from "../utils/orderingStatus";
import { applyOrderingStatus } from "../utils/storeHours";

let current = { ...OPEN_STATUS };
let rev = 0;
const listeners = new Set();
let unsub = null;

function start() {
  if (unsub) return;
  try {
    unsub = onSnapshot(
      doc(db, "settings", "ordering"),
      (snap) => {
        current = readOrderingStatus(snap.exists() ? snap.data() : null);
        applyOrderingStatus(current);
        rev += 1;
        listeners.forEach((fn) => fn(rev));
      },
      () => {
        // can't read it: leave ordering open
      }
    );
  } catch {
    unsub = null;
  }
}

// Returns { paused, pausedUntilMs, closedDates, rev }. rev changes on every
// update: add it to useMemo/useEffect deps that call the store-hours helpers.
export default function useOrderingStatus() {
  const [, setRev] = useState(rev);
  useEffect(() => {
    start();
    listeners.add(setRev);
    // a pause that ends on its own: re-render when it runs out
    let timer = null;
    if (current.paused && current.pausedUntilMs) {
      const wait = current.pausedUntilMs - Date.now();
      if (wait > 0 && wait < 2 ** 31 - 1) timer = setTimeout(() => setRev((r) => r + 0.5), wait + 1000);
    }
    return () => {
      listeners.delete(setRev);
      if (timer) clearTimeout(timer);
    };
  });
  return { ...current, rev };
}
