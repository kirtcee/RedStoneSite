// utils/cartPersistence.js
import { db, auth } from "./firebaseConfig";
import {
  doc, setDoc, getDoc, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

const LOCAL_KEY = "cart.v1";

// Resolve to a user or null (never throws). Browser-only.
function authReady() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const stop = onAuthStateChanged(auth, async (user) => {
      if (user) {
        stop();
        return resolve(user);
      }
      // try anonymous sign-in if enabled; if not, resolve null (fallback to localStorage)
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn("signInAnonymously failed:", e?.code || e);
        stop();
        return resolve(null);
      }
      // wait for next onAuthStateChanged tick to get the user
    });
  });
}

async function getCartRef() {
  const user = auth.currentUser || (await authReady());
  if (!user) return null;
  return doc(db, "carts", user.uid);
}

export async function loadCart() {
  try {
    if (typeof window === "undefined") return { items: [] };
    // Try Firestore (if auth available)
    const ref = await getCartRef();
    if (!ref) {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : { items: [] };
    }
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : { items: [] };
    }
    const data = snap.data() || {};
    return {
      items: Array.isArray(data.items) ? data.items : [],
      updatedAt: data.updatedAt || null,
      uid: data.uid || null,
      subtotalCents: data.subtotalCents || 0,
    };
  } catch (e) {
    console.warn("loadCart fallback:", e);
    if (typeof window === "undefined") return { items: [] };
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  }
}

export async function saveCart(items, meta = {}) {
  try {
    if (typeof window === "undefined") return;
    // always mirror to localStorage
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ items, ...meta }));
    // also try Firestore if we have a user
    const ref = await getCartRef();
    if (!ref) return;
    await setDoc(
      ref,
      { items, updatedAt: serverTimestamp(), uid: auth.currentUser?.uid || null, ...meta },
      { merge: true }
    );
  } catch (e) {
    console.warn("saveCart fallback:", e);
  }
}

// Keep this simple: only live-subscribe if auth available; otherwise read once from localStorage
export function subscribeCart(cb) {
  if (typeof window === "undefined") return () => {};
  let unsub = () => {};
  authReady().then(async (user) => {
    if (!user) {
      // localStorage “subscription”: fire now and re-fire on storage changes (other tabs)
      const fire = () => {
        const raw = localStorage.getItem(LOCAL_KEY);
        cb(raw ? JSON.parse(raw) : { items: [] });
      };
      fire();
      const handler = (e) => {
        if (e.key === LOCAL_KEY) fire();
      };
      window.addEventListener("storage", handler);
      unsub = () => window.removeEventListener("storage", handler);
      return;
    }
    // Firestore live updates
    const ref = doc(db, "carts", user.uid);
    const off = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return cb({ items: [] });
        const data = snap.data() || {};
        cb({
          items: Array.isArray(data.items) ? data.items : [],
          updatedAt: data.updatedAt || null,
          uid: data.uid || null,
          subtotalCents: data.subtotalCents || 0,
        });
      },
      (err) => console.warn("subscribeCart error:", err)
    );
    unsub = off;
  });
  return () => unsub && unsub();
}
