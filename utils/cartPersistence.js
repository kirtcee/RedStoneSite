// utils/cartPersistence.js
import { db, auth } from "./firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const LOCAL_KEY = "cart.v1";

// localStorage is the source of truth for the cart. This app has no
// customer accounts, so there's no cross-device session to reconcile —
// every browser tab on this device already shares the same storage.
// Firestore is kept only as a best-effort mirror; reads always come from
// localStorage so a slow, failed, or stale Firestore write can never wipe
// out real, in-hand cart data (which is exactly what happened when a
// naive Firestore-first read raced against an in-flight save).

export function loadCart() {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch (e) {
    console.warn("loadCart: localStorage read failed", e);
    return { items: [] };
  }
}

export async function saveCart(items, meta = {}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ items, ...meta }));
  } catch (e) {
    console.warn("saveCart: localStorage write failed", e);
  }
  // Best-effort mirror only — never blocks or overrides local state.
  try {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, "carts", user.uid);
    await setDoc(
      ref,
      { items, updatedAt: serverTimestamp(), uid: user.uid, ...meta },
      { merge: true }
    );
  } catch (e) {
    console.warn("saveCart: Firestore mirror failed", e);
  }
}

// Fires on load and whenever another tab in this browser updates the cart.
export function subscribeCart(cb) {
  if (typeof window === "undefined") return () => {};

  const fire = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      cb(raw ? JSON.parse(raw) : { items: [] });
    } catch (e) {
      console.warn("subscribeCart: localStorage read failed", e);
      cb({ items: [] });
    }
  };

  const handler = (e) => {
    if (e.key === LOCAL_KEY) fire();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
