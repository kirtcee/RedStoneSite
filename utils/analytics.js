// utils/analytics.js
//
// Anonymous usage statistics with PostHog (posthog.com), so we can see where
// people drop off between opening the site and placing an order.
//
// Switched on only when NEXT_PUBLIC_POSTHOG_KEY is set (the project token,
// starting phc_; never the secret phs_ key). Region: NEXT_PUBLIC_POSTHOG_HOST
// (https://us.i.posthog.com by default, https://eu.i.posthog.com for EU).
//
// Privacy (see pages/privacy.js):
//   - no cookies: an anonymous ID kept for the browser tab only
//   - never sends names, phone numbers, emails or addresses
//   - session recordings hide everything typed into boxes
//   - off on the staff pages (kitchen, stats)
//
// Use track("event_name", { ...details }) anywhere; it does nothing if
// analytics is off.
let ph = null;
let started = false;
const STAFF_PAGES = ["/kitchen", "/kitchen-login", "/stats"];

export async function initAnalytics(pathname = "") {
  if (started || typeof window === "undefined") return;
  const key = String(process.env.NEXT_PUBLIC_POSTHOG_KEY || "").trim();
  if (!key || !key.startsWith("phc_")) return; // off (or the wrong kind of key)
  if (STAFF_PAGES.some((p) => pathname.startsWith(p))) return;
  started = true;
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    persistence: "sessionStorage", // no cookies; resets when the tab closes
    person_profiles: "identified_only", // we never identify anyone
    capture_pageview: "history_change", // counts page changes in this app
    capture_pageleave: true,
    autocapture: true, // taps on buttons and links (not what's typed)
    session_recording: { maskAllInputs: true },
  });
  ph = posthog;

  // Home / menu promo cards: which deal card got tapped
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target?.closest?.('a[href*="/coupons?deal="]');
      if (!a) return;
      const deal = new URL(a.href, window.location.origin).searchParams.get("deal");
      track("promo_card_clicked", { deal, page: window.location.pathname });
    },
    true
  );
}

export function track(event, props = {}) {
  try {
    ph?.capture(event, props);
  } catch {
    // analytics must never break ordering
  }
}
