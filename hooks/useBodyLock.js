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

function applyLock() {
  if (typeof window === "undefined") return;
  const html = document.documentElement;
  const body = document.body;

  savedState = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    scrollbarGutter: html.style.scrollbarGutter,
    y: window.scrollY || window.pageYOffset || 0,
  };

  html.style.scrollbarGutter = "stable";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${savedState.y}px`;
  body.style.width = "100%";
  html.classList.add("modal-open");
}

function releaseLock() {
  if (typeof window === "undefined" || !savedState) return;
  const html = document.documentElement;
  const body = document.body;
  const { overflow, position, top, width, scrollbarGutter, y } = savedState;

  body.style.overflow = overflow || "";
  body.style.position = position || "";
  body.style.top = top || "";
  body.style.width = width || "";
  html.style.scrollbarGutter = scrollbarGutter || "";
  html.classList.remove("modal-open");
  savedState = null;
  window.scrollTo(0, y);
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
