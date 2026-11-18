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

// Pay Now, step 1: the server prices the order, parks it until it's paid,
// and sets up a Stripe payment for that exact total.
// Resolves { orderId, clientSecret } or { error }.
export async function startCardPayment(orderData) {
  try {
    const user = await waitForUser();
    if (!user) return { error: "Couldn't start the payment. Please refresh and try again." };
    const idToken = await user.getIdToken();
    const res = await fetch("/api/createPayment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...orderData, idToken }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      console.error("startCardPayment: server refused", res.status, body);
      // The short code in brackets tells us which step failed.
      const code = body?.reason || `http_${res.status}`;
      return { error: `Couldn't start the payment. Please try again. (${code})` };
    }
    return { orderId: body.orderId, clientSecret: body.clientSecret };
  } catch (e) {
    console.error("startCardPayment error:", e);
    return { error: "Couldn't start the payment. Please check your connection and try again." };
  }
}

// Pay Now, last step: the server checks with Stripe that the payment went
// through and turns the parked order into a real one.
// Resolves "paid" | "processing" | "unpaid" | "not_found" | "error".
export async function finalizeCardPayment(orderId) {
  try {
    const res = await fetch("/api/finalizePayment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const body = await res.json().catch(() => ({}));
    return body?.status || "error";
  } catch {
    return "error";
  }
}
