// instrumentation-client.js
//
// Next.js runs this in the browser before the page starts. It switches on
// Sentry error alerts for the browser side (a page or popup that crashes,
// checkout errors, the kitchen screen) when NEXT_PUBLIC_SENTRY_DSN is set.
// Loaded in the background so it never slows the page. See
// utils/errorReporting.js.
import { SENTRY_DSN, sentryOptions } from "./utils/errorReporting";

if (SENTRY_DSN && typeof window !== "undefined") {
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.init(
        sentryOptions({
          // Noise from browser extensions, old cached pages after a deploy,
          // and phones losing signal, none of which we can fix.
          ignoreErrors: [
            "ResizeObserver loop",
            "Non-Error promise rejection captured",
            "Load failed",
            "Failed to fetch",
            "NetworkError when attempting to fetch resource",
            "ChunkLoadError",
            "Loading chunk",
          ],
          denyUrls: [/extensions\//i, /^chrome:\/\//i, /^safari-extension:/i],
        })
      );
    })
    .catch(() => {
      // error reporting must never break the site
    });
}
