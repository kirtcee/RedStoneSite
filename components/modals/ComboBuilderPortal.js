import React from "react";
import { createPortal } from "react-dom";
import ComboBuilder from "../ComboBuilder";
import useBodyLock from "../../hooks/useBodyLock";

export default function ComboBuilderPortal({ openComboId, onAdd, onClose }) {
  useBodyLock(!!openComboId);

  if (typeof document === "undefined" || !openComboId) return null;

  return createPortal(
    <ComboBuilder openComboId={openComboId} onAdd={onAdd} onClose={onClose} />,
    document.body
  );
}
