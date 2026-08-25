// components/modals/DebugPizzaOverlay.js
'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import useBodyLock from "../../hooks/useBodyLock";

/**
 * DebugPizzaOverlay
 * Props:
 *  - open
 *  - onClose
 *  - mode: "takeover" | "portal"
 *  - blockRogue
 *  - title
 *  - showTopbar
 *  - freezeChild: boolean   // 👈 NEW – defaults to true (good for PizzaBuilder), set to false for dynamic modals
 */
export default function DebugPizzaOverlay({
  open,
  onClose,
  children,
  mode = "takeover",
  blockRogue = true,
  title = "Build Your Pizza",
  showTopbar = true,
  freezeChild = true,
}) {
  // ---------- shared: blocker for anchors/submits ----------
  useEffect(() => {
    if (!open || !blockRogue) return;

    function buildPath(t) { var a = []; for (var n = t; n; n = n.parentNode) a.push(n); return a; }
    function findInPath(path, tag) {
      for (var i = 0; i < path.length; i++) {
        var el = path[i];
        if (el && el.tagName === tag) return el;
      }
      return null;
    }

    function onClickCapture(e) {
      var path = e.composedPath ? e.composedPath() : buildPath(e.target);

      // Block <a href="#"> or empty href
      var a = findInPath(path, "A");
      if (a) {
        var href = a.getAttribute ? (a.getAttribute("href") || "") : "";
        if (href === "#" || href === "") {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // Block submit buttons inside forms
      var btn = findInPath(path, "BUTTON");
      if (btn) {
        var typeAttr = btn.getAttribute ? (btn.getAttribute("type") || "") : "";
        var type = typeAttr.toLowerCase();
        var isSubmit = !type || type === "submit";
        var hasForm = !!findInPath(path, "FORM");
        if (isSubmit && hasForm) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }

    function onSubmitCapture(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("submit", onSubmitCapture, true);
    return () => {
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("submit", onSubmitCapture, true);
    };
  }, [open, blockRogue]);

  if (!open) return null;

  if (mode === "takeover") {
    return (
      <div style={takeoverWrap}>
        <div aria-hidden style={veilFixed} />

        <div style={takeoverPanel}>
          {showTopbar && (
            <div style={topbarStyle}>
              <div style={titleStyle}>{title}</div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                style={closeBtnStyle}
              >
                ✕
              </button>
            </div>
          )}

          <div style={bodyPlain}>
            <div style={contentStyle}>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PortalMode
      open={open}
      onClose={onClose}
      title={title}
      showTopbar={showTopbar}
      freezeChild={freezeChild}
    >
      {children}
    </PortalMode>
  );
}

/* ================== Portal mode ================== */
function PortalMode({ open, onClose, children, title = "Build Your Pizza", showTopbar = true, freezeChild = true }) {
  const [root, setRoot] = useState(null);
  const scrollerRef = useRef(null);

  // 👇 freeze only if freezeChild === true
  const frozenChildRef = useRef(null);
  if (freezeChild && open && !frozenChildRef.current) {
    frozenChildRef.current = React.isValidElement(children) ? children : null;
  }

  const viewportStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 3000,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    overflowAnchor: "none",
    scrollbarGutter: "stable both-edges",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 24,
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    let node = document.getElementById("modal-root");
    if (!node) {
      node = document.createElement("div");
      node.id = "modal-root";
      document.body.appendChild(node);
    }
    setRoot(node);
  }, []);

  // lock background
  useBodyLock(open);

  // close on outside click (but not on scrollbar)
  const onViewportMouseDown = useCallback(
    (e) => {
      const el = scrollerRef.current;
      if (!el) return;
      if (e.target && e.target.closest?.("[data-modal-panel]")) return;

      const rect = el.getBoundingClientRect();
      const vBar = el.offsetWidth - el.clientWidth;
      const hBar = el.offsetHeight - el.clientHeight;
      const onVBar = vBar > 0 && e.clientX >= rect.right - vBar;
      const onHBar = hBar > 0 && e.clientY >= rect.bottom - hBar;
      if (onVBar || onHBar) return;

      onClose?.();
    },
    [onClose]
  );

  // anti-jump
  const userScrollingRef = useRef(false);
  const beforeRef = useRef(0);

  const snapshotBefore = useCallback(() => {
    if (scrollerRef.current) beforeRef.current = scrollerRef.current.scrollTop;
  }, []);
  const restoreAfter = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const after = el.scrollTop;
      const before = beforeRef.current;
      if (!userScrollingRef.current && Math.abs(after - before) > 2) {
        el.scrollTop = before;
      }
    });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function markUserScroll() {
      userScrollingRef.current = true;
      window.clearTimeout(markUserScroll._t);
      markUserScroll._t = window.setTimeout(() => {
        userScrollingRef.current = false;
      }, 160);
    }
    el.addEventListener("wheel", markUserScroll, { passive: true });
    el.addEventListener("touchstart", markUserScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", markUserScroll);
      el.removeEventListener("touchstart", markUserScroll);
      window.clearTimeout(markUserScroll._t);
    };
  }, [root]);

  if (!open || !root) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDownCapture={snapshotBefore}
      onClickCapture={snapshotBefore}
      onKeyDownCapture={snapshotBefore}
      onMouseUpCapture={restoreAfter}
      onClick={restoreAfter}
      onKeyUpCapture={restoreAfter}
    >
      <div style={backdropStyle} aria-hidden onMouseDown={onClose} />
      <div
        ref={scrollerRef}
        style={viewportStyle}
        onMouseDown={onViewportMouseDown}
      >
        <div
          data-modal-panel
          style={panelStyle}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {showTopbar && (
            <div style={topbarStyle}>
              <div style={titleStyle}>{title}</div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                style={closeBtnStyle}
              >
                ✕
              </button>
            </div>
          )}

          <div style={panelBodyStyle}>
            <div style={contentStyle}>
              {freezeChild
                ? (frozenChildRef.current || null)
                : children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    root
  );
}

/* ========== styles ========== */
const takeoverWrap = { position: "relative", zIndex: 3000 };
const veilFixed = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.32)",
  zIndex: 0,
  pointerEvents: "none",
};
const takeoverPanel = {
  position: "relative",
  zIndex: 1,
  background: "#fff",
  border: "1px solid #e5e5e5",
  boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
  maxWidth: 878,
  margin: "16px auto 0",
};
const bodyPlain = { padding: "8px 16px 16px" };
const contentStyle = { maxWidth: 846, margin: "0 auto" };

const topbarStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 48,
  padding: "10px 12px",
  borderBottom: "1px solid #e5e5e5",
};
const closeBtnStyle = {
  position: "absolute",
  right: 8,
  top: 8,
  fontSize: 20,
  lineHeight: 1,
  background: "transparent",
  border: 0,
  cursor: "pointer",
  padding: "6px 8px",
};
const titleStyle = {
  paddingRight: 44,
  paddingLeft: 5,
  fontFamily: "var(--font-heading, Oswald, sans-serif)",
  fontWeight: 500,
  fontSize: "2.3rem",
};

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 2990,
};
const panelStyle = {
  position: "relative",
  width: "100%",
  maxWidth: 878,
  marginTop: 48,
  background: "#fff",
  border: "1px solid #e5e5e5",
  boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
};
const panelBodyStyle = { padding: "8px 16px 16px" };
