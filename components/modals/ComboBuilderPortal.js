import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import ComboBuilder from "../ComboBuilder";

export default function ComboBuilderPortal({ openComboId, onAdd, onClose }) {
  if (typeof document === "undefined" || !openComboId) return null;

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, []);

  return createPortal(
    <ComboBuilder openComboId={openComboId} onAdd={onAdd} onClose={onClose} />,
    document.body
  );
}
