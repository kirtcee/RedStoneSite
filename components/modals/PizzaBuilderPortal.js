// components/modals/BarePizzaOverlay.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export default function BarePizzaOverlay({ open, onClose, children }) {
  const [root, setRoot] = useState(null);
  const bodyRef = useRef(null);
  const frozenChildRef = useRef(null); // freeze builder to avoid remounts

  // Create a single root under <body>
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

  // Lock background scroll while open (keep tests simple)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Freeze the child the first time the overlay opens so it doesn't remount
  if (open && !frozenChildRef.current) {
    frozenChildRef.current = React.isValidElement(children) ? children : null;
  }

  // CAPTURE-PHASE GUARD: stop anchors "#" and form submits dead in their tracks
  const onClickCapture = useCallback((e) => {
    const path = e.composedPath ? e.composedPath() : buildPath(e.target);

    // Block <a href="#"> (or empty href) anywhere in the path
    const a = path.find(
      (el) =>
        el &&
        el.tagName === "A" &&
        el.getAttribute &&
        /^(#|)$/.test(el.getAttribute("href") || "")
    );
    if (a) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block submit-type buttons inside forms (also buttons with no type)
    const btn = path.find((el) => el && el.tagName === "BUTTON");
    if (btn) {
      const type = (btn.getAttribute && (btn.getAttribute("type") || ""))?.toLowerCase();
      const isSubmit = !type || type === "submit";
      if (isSubmit) {
        const formInPath = path.find((el) => el && el.tagName === "FORM");
        if (formInPath) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
    }
  }, []);

  const onSubmitCapture = useCallback((e) => {
    // Belt-and-suspenders: never let a form submit inside this overlay
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (!open || !root) return null;

  return createPortal(
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Pizza Builder"
      onClickCapture={onClickCapture}
      onSubmitCapture={onSubmitCapture}
    >
      <div style={topbarStyle}>
        <button type="button" style={closeBtnStyle} onClick={onClose} aria-label="Close">✕</button>
        <div style={titleStyle}>Build Your Pizza</div>
      </div>

      {/* the ONLY scroller */}
      <div ref={bodyRef} style={bodyStyle}>
        <div style={contentStyle}>
          {frozenChildRef.current ?? (
            <div style={{ padding: 12, color: "#b00" }}>
              Invalid builder element. Check your PizzaBuilder import (default vs named).
            </div>
          )}
        </div>
      </div>
    </div>,
    root
  );
}

// Fallback for composedPath on older browsers
function buildPath(target) {
  const arr = [];
  for (let n = target; n; n = n.parentNode) arr.push(n);
  return arr;
}

/* -------- inline styles (minimal) -------- */
const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 3000,
  background: "#fff",
  display: "flex",
  flexDirection: "column",
};

const topbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 48,
  padding: "10px 12px",
  borderBottom: "1px solid #e5e5e5",
};

const titleStyle = {
  fontFamily: "var(--font-heading, Oswald, sans-serif)",
  fontWeight: 900,
  fontSize: "1.05rem",
};

const closeBtnStyle = {
  fontSize: 20,
  lineHeight: 1,
  background: "transparent",
  border: 0,
  cursor: "pointer",
  padding: "6px 8px",
};

const bodyStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  overflowAnchor: "none",
  scrollBehavior: "auto",
  padding: 12,
  scrollbarGutter: "stable both-edges",
};

const contentStyle = {
  maxWidth: 1100,
  margin: "0 auto",
};
