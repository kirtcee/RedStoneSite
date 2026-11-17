// hooks/useBodyLock.js
import { useEffect } from "react";

// Module-level so every mounted lock (nested modals included) shares one
// counter — the DOM is only touched on the 0->1 (first lock) and 1->0 (last
// unlock) transitions, whichever component's cleanup happens to run last.
// Previously each modal rolled its own useEffect with its own locally
// captured "previous overflow" snapshot; when several were mounted at once
// (e.g. the Combo builder nesting several overlays) and closed together in
// one state batch, whichever cleanup ran last could restore to a snapshot
// that was already "hidden", leaving scroll permanently locked.
let lockCount = 0;
let savedState = null;

// Freezes the page with overflow:hidden on <html> only, instead of pinning
// <body> with position:fixed. Pinning made the sticky header and the bars
// under it un-stick and slide off the top while a builder was open. <body>
// is left alone on purpose: overflow:hidden there turns it into its own
// scroll box, which un-sticks the header the same way.
function applyLock() {
  if (typeof window === "undefined") return;
  const html = document.documentElement;

  savedState = {
    htmlOverflow: html.style.overflow,
    scrollbarGutter: html.style.scrollbarGutter,
    y: window.scrollY || window.pageYOffset || 0,
  };

  html.style.scrollbarGutter = "stable";
  html.style.overflow = "hidden";
  html.classList.add("modal-open");
}

function releaseLock() {
  if (typeof window === "undefined" || !savedState) return;
  const html = document.documentElement;
  const { htmlOverflow, scrollbarGutter, y } = savedState;

  html.style.overflow = htmlOverflow || "";
  html.style.scrollbarGutter = scrollbarGutter || "";
  html.classList.remove("modal-open");
  savedState = null;
  // Should already be here; just in case the browser nudged it.
  if (Math.abs((window.scrollY || 0) - y) > 1) window.scrollTo(0, y);
}

/**
 * Locks document scroll while `isOpen` is true. Safe to call from multiple
 * components mounted at once (nested modals) — see the reference-counting
 * note above.
 */
export default function useBodyLock(isOpen) {
  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) return;

    lockCount += 1;
    if (lockCount === 1) applyLock();

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [isOpen]);
}
