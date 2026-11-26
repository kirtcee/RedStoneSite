// hooks/useSoldOut.js
//
// The kitchen's sold-out list (settings/menu, see utils/availability.js),
// live. One shared Firestore listener for the page. Returns a Set of keys.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { readSoldOut } from "../utils/availability";

let current = new Set();
const listeners = new Set();
let unsub = null;

function start() {
  if (unsub) return;
  try {
    unsub = onSnapshot(
      doc(db, "settings", "menu"),
      (snap) => {
        current = new Set(readSoldOut(snap.exists() ? snap.data() : null));
        listeners.forEach((fn) => fn(current));
      },
      () => {
        // can't read it: treat everything as available
      }
    );
  } catch {
    unsub = null;
  }
}

// For code outside React (the cart's add-to-cart check)
export const currentSoldOut = () => current;

export default function useSoldOut() {
  const [set, setSet] = useState(current);
  useEffect(() => {
    start();
    listeners.add(setSet);
    setSet(current);
    return () => listeners.delete(setSet);
  }, []);
  return set;
}
