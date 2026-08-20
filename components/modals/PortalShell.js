import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function PortalShell({ open, onClose, children, maxWidth = 1100 }) {
  if (typeof document === "undefined" || !open) return null;

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, []);

  const node = (
    <>
      <div className="pb-backdrop" onClick={onClose} />
      <div className="pb-viewport" role="dialog" aria-modal="true"
           onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
        <div className="pb-panel" style={{ maxWidth }} onClick={(e)=>e.stopPropagation()}>
          <button className="pb-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="pb-body">{children}</div>
        </div>
      </div>
      <style jsx global>{`
        .pb-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2990;}
        .pb-viewport{position:fixed;inset:0;z-index:3000;display:flex;justify-content:center;align-items:flex-start;
          overflow-y:auto;-webkit-overflow-scrolling:touch;padding:24px;overflow-anchor:none;}
        .pb-panel{position:relative;width:100%;background:#fff;border:1px solid #e5e5e5;box-shadow:0 10px 24px rgba(0,0,0,.16);}
        .pb-close{position:absolute;top:12px;right:12px;background:none;border:0;cursor:pointer;font-size:20px;line-height:1;padding:6px;}
        .pb-body{padding:0;}
      `}</style>
    </>
  );
  return createPortal(node, document.body);
}
