// instrumentation.js
//
// Next.js runs this once when the server starts. It switches on Sentry
// error alerts for the server side (API routes: orders, payments, the Stripe
// webhook, delivery quotes) when NEXT_PUBLIC_SENTRY_DSN is set. See
// utils/errorReporting.js.
//
// Our API routes catch their own errors and log them with console.error
// before replying, so those logs are what gets reported (console.warn, used
// for expected problems, is not).
import { SENTRY_DSN, sentryOptions } from "./utils/errorReporting";

export async function register() {
  if (!SENTRY_DSN || process.env.NEXT_RUNTIME !== "nodejs") return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init(
    sentryOptions({
      integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
    })
  );
}

// Errors Next.js catches itself (a page or API route that crashes).
export async function onRequestError(...args) {
  if (!SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
