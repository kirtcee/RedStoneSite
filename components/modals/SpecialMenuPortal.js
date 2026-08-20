import React from "react";
import PortalShell from "./PortalShell";
import SpecialMenuBuilder from "../SpecialMenuBuilder";

export default function SpecialMenuPortal({ open, itemType, onAdd, onClose }) {
  return (
    <PortalShell open={open} onClose={onClose}>
      <SpecialMenuBuilder itemType={itemType} onClose={onClose} onAdd={onAdd} />
    </PortalShell>
  );
}
