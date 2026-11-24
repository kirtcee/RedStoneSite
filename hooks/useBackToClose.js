// hooks/useBackToClose.js
//
// Makes the phone/browser Back button close popups (builders, the drinks
// picker, the hamburger menu...) instead of leaving the page.
//
// How it works: when a popup opens it adds one step to the browser history
// (same address, nothing visible changes). Pressing Back removes that step;
// the handler installed by installBackToClose() (pages/_app.js) sees that a
// popup is open, closes the top one and tells Next.js to ignore that Back.
// If the popup is closed some other way (its X, Cancel, Add to Order), the
// helper removes its own history step so Back still behaves normally next
// time. Popups opened inside popups stack: each Back closes one.
import { useEffect, useRef } from "react";

const stack = []; // open popups, newest last: { id, close }
let nextId = 1;
let selfBack = 0; // Back presses we triggered ourselves (to drop a step)

function topId() {
  return stack.length ? stack[stack.length - 1].id : 0;
}

// Decides what one Back/Forward press does. Returns true to let Next.js
// navigate normally, false when it was handled here (a popup closed).
function onHistoryStep(state) {
  if (selfBack > 0) {
    // our own history.back() after a popup closed normally: ignore it
    selfBack -= 1;
    return false;
  }
  const landedOn = state?.__rsModal || 0;
  if (stack.length && landedOn < topId()) {
    // Back while a popup is open: close it, stay on the page
    const top = stack.pop();
    top.close();
    // Some popups ask first ("Discard combo?") and stay open. If it's
    // still open a moment later, put its history step back.
    setTimeout(() => {
      if (top.alive) {
        stack.push(top);
        try {
          window.history.pushState({ ...(window.history.state || {}), __rsModal: top.id }, "");
        } catch {
          // ignore
        }
      }
    }, 0);
    return false;
  }
  if (landedOn && !stack.some((m) => m.id === landedOn)) {
    // Forward onto a step for a popup that's already closed: skip it
    selfBack += 1;
    window.history.back();
    return false;
  }
  return true;
}

let installed = false;
let handledByNext = false;

// Called once from pages/_app.js with the Next.js router. Next.js asks
// beforePopState first (so it can be told to stay put), but it skips that on
// some presses (e.g. the very first Back of a visit when the address hasn't
// changed), so a plain popstate listener catches those.
export function installBackToClose(router) {
  router.beforePopState((state) => {
    handledByNext = true;
    return onHistoryStep(state);
  });
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("popstate", (e) => {
    // Next.js's own listener runs first; if it already asked us, done
    if (handledByNext) {
      handledByNext = false;
      return;
    }
    onHistoryStep(e.state);
  });
}

// Use in a popup component: useBackToClose(open, onClose)
export default function useBackToClose(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;
    const id = nextId++;
    const entry = { id, alive: true, close: () => closeRef.current?.() };
    stack.push(entry);
    try {
      window.history.pushState({ ...(window.history.state || {}), __rsModal: id }, "");
    } catch {
      // history not available: Back just behaves as before
    }
    return () => {
      entry.alive = false;
      const i = stack.indexOf(entry);
      if (i === -1) return; // already closed by Back
      stack.splice(i, 1);
      // closed by its own button: drop the history step it added
      if (window.history.state?.__rsModal === id) {
        selfBack += 1;
        window.history.back();
      }
    };
  }, [open]);
}
