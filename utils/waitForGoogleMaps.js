// Resolves once the Maps JS (with Places) is ready.
// Times out after 12s with a descriptive error.
export function waitForGoogleMaps(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    // Already loaded?
    if (window.google?.maps?.places) return resolve(window.google);

    let done = false;
    const finish = () => {
      if (!done && window.google?.maps?.places) {
        done = true;
        resolve(window.google);
      }
    };

    // Listen to our onLoad event from _app.js
    window.addEventListener("gmaps-loaded", finish, { once: true });

    // Also poll in case user navigated before onLoad was registered
    const t0 = Date.now();
    const id = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(id);
        finish();
      } else if (Date.now() - t0 > timeoutMs) {
        clearInterval(id);
        reject(new Error("Google Maps failed to load (timeout). Check API key, referrer restrictions, and billing."));
      }
    }, 100);
  });
}
