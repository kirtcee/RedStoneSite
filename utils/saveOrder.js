// utils/saveOrder.js
//
// Thin client-side wrapper — the real work (pricing, validation, the actual
// Firestore write) now happens server-side in pages/api/placeOrder.js. This
// used to call addDoc() directly from the browser with client-computed
// totals, which meant nothing stopped a tampered client from submitting a
// fake price (see firestore.rules and pages/api/placeOrder.js for the full
// story). Now this only ever sends *what's in the cart* — the server
// decides what it costs.
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// firebaseConfig.js signs every visitor in anonymously on load, but there's
// a brief async gap right after the app initializes where auth.currentUser
// can still be null. By the time someone reaches checkout this has almost
// always already resolved, but wait for it rather than fail an order over
// a timing fluke.
function waitForUser(timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const timer = setTimeout(() => {
      unsub();
      resolve(auth.currentUser);
    }, timeoutMs);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timer);
        unsub();
        resolve(user);
      }
    });
  });
}

export async function saveOrder(orderData) {
  try {
    const user = await waitForUser();
    if (!user) {
      console.error("saveOrder: no authenticated user available");
      return null;
    }
    const idToken = await user.getIdToken();

    const res = await fetch("/api/placeOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...orderData, idToken }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      console.error("saveOrder: server rejected the order", res.status, body);
      return null;
    }
    return body.id || null;
  } catch (e) {
    console.error("saveOrder error:", e);
    return null;
  }
}
