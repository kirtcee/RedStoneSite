// hooks/useBodyLock.js
import { useEffect } from "react";

/**
 * Locks the document scroll when `isOpen` is true.
 * - Keeps the right-side scrollbar width reserved (no layout jump)
 * - Freezes body at current scroll Y and restores on unlock
 */
export default function useBodyLock(isOpen) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      sg: html.style.scrollbarGutter,
    };

    const saveY = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      body.dataset.lockScrollY = String(y);
      return y;
    };
    const getSavedY = () => parseInt(body.dataset.lockScrollY || "0", 10) || 0;
    const clearSavedY = () => delete body.dataset.lockScrollY;

    if (isOpen) {
      const y = saveY();
      // reserve scrollbar space to avoid layout shift
      html.style.scrollbarGutter = "stable";
      // lock body in place
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${y}px`;
      body.style.width = "100%";
      html.classList.add("modal-open");
    } else {
      // restore immediately (also happens in cleanup)
      const y = getSavedY();
      body.style.overflow = prev.overflow || "";
      body.style.position = prev.position || "";
      body.style.top = prev.top || "";
      body.style.width = prev.width || "";
      html.style.scrollbarGutter = prev.sg || "";
      clearSavedY();
      html.classList.remove("modal-open");
      window.scrollTo(0, y);
    }

    // Cleanup (also handles route changes/unmount while open)
    return () => {
      const y = getSavedY();
      body.style.overflow = prev.overflow || "";
      body.style.position = prev.position || "";
      body.style.top = prev.top || "";
      body.style.width = prev.width || "";
      html.style.scrollbarGutter = prev.sg || "";
      clearSavedY();
      html.classList.remove("modal-open");
      if (isOpen) window.scrollTo(0, y);
    };
  }, [isOpen]);
}
