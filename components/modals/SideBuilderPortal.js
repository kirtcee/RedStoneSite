import React from "react";
import PortalShell from "./PortalShell";
import SideBuilder from "../SideBuilder";

export default function SideBuilderPortal({ open, side, onAdd, onClose }) {
  return (
    <PortalShell open={open} onClose={onClose}>
      <SideBuilder side={side} onClose={onClose} onAdd={onAdd} />
    </PortalShell>
  );
}
