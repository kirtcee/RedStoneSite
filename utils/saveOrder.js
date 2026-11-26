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
      saveOrder.lastError = body?.reason || `http_${res.status}`;
      return null;
    }
    return body.id || null;
  } catch (e) {
    console.error("saveOrder error:", e);
    return null;
  }
}

// Plain-language message for a failed order/payment setup. The short code
// stays on the end so a screenshot still tells us which step failed.
export function friendlyOrderError(code, { card = false } = {}) {
  const c = String(code || "");
  let msg;
  if (c === "too_many_requests") msg = "Too many attempts in a row. Please wait a minute and try again.";
  else if (c.startsWith("invalid_auth")) msg = "Your session timed out. Please refresh the page and try again.";
  else if (["empty_cart", "bad_item", "bad_qty", "unpriceable_item", "too_many_items", "bad_deals"].includes(c))
    msg = "Something in your cart couldn't be processed. Please review your cart and try again.";
  else if (c === "missing_contact" || c === "bad_email") msg = "Please check your name, phone number and email, then try again.";
  else if (c === "delivery_too_far")
    msg = "This address is too far to price online. Please call us at 905-385-9888 and we'll arrange your delivery.";
  else if (c === "delivery_quote_failed")
    msg = "We couldn't work out the delivery fee for this address. Please check the address, or call us at 905-385-9888.";
  else if (c === "delivery_minimum") msg = "Delivery orders need at least $20.00 of food and drinks. Please add more items or switch to carryout.";
  else if (c === "item_sold_out")
    msg = "Sorry, something in your cart just sold out. It's marked in your cart. Please remove it and try again.";
  else if (c === "bad_cash_amount") msg = "The cash amount you're paying with is less than the total. Please check it.";
  else if (c === "ordering_paused")
    msg = "We've paused online orders for a little while. Please schedule your order for later, or call us at 905-385-9888.";
  else if (c === "store_closed")
    msg = "We're closed for online orders right now. Please schedule your order for later.";
  else if (c === "schedule_closed")
    msg = "We're not open at the time you picked, or it's too soon. Please choose another time.";
  else if (c === "schedule_too_far") msg = "Orders can be scheduled up to 2 weeks ahead. Please choose an earlier date.";
  else if (card) msg = "We couldn't connect to the payment system. Your card has not been charged. Please try again.";
  else msg = "We couldn't place your order. Please try again.";
  return c ? `${msg} (Code: ${c.split(":")[0]})` : msg;
}

// Pay Now, step 1: the server prices the order, parks it until it's paid,
// and sets up a Stripe payment for that exact total.
// Resolves { orderId, clientSecret } or { error }.
export async function startCardPayment(orderData) {
  try {
    const user = await waitForUser();
    if (!user) return { error: friendlyOrderError("invalid_auth", { card: true }) };
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
      return { error: friendlyOrderError(code, { card: true }) };
    }
    return { orderId: body.orderId, clientSecret: body.clientSecret };
  } catch (e) {
    console.error("startCardPayment error:", e);
    return { error: "We couldn't reach the payment system. Please check your connection and try again. Your card has not been charged." };
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

// Delivery fee for an address (see pages/api/deliveryQuote.js).
// Resolves { ok: true, minutes, km, feeCents, tooFar } or { ok: false, reason }.
export async function fetchDeliveryQuote(address) {
  try {
    const res = await fetch("/api/deliveryQuote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const body = await res.json().catch(() => ({}));
    return body && typeof body === "object" ? body : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
