// utils/errorReporting.js
//
// Error alerts with Sentry (sentry.io): when something breaks on the site or
// in an order/payment API, Sentry records it and emails the owner.
//
// Switched on only when NEXT_PUBLIC_SENTRY_DSN is set in Vercel (the "DSN"
// from Sentry → Project Settings → Client Keys). Without it nothing loads.
// The Sentry code is only downloaded when it's switched on, so it adds
// nothing to the page size while off.
//
// Privacy: no personal details are sent (sendDefaultPii off, no session
// replay, no request bodies), and performance tracing is off to stay inside
// the free plan.
//
// Wired up in instrumentation.js (server) and instrumentation-client.js
// (browser), which Next.js runs automatically.
export const SENTRY_DSN = String(process.env.NEXT_PUBLIC_SENTRY_DSN || "").trim();

export function sentryOptions(extra = {}) {
  return {
    dsn: SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    sendDefaultPii: false,
    tracesSampleRate: 0,
    ...extra,
  };
}
