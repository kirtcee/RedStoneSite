// components/modals/DrinksPanelPortal.js
import React from "react";
import PortalShell from "./PortalShell";
import * as DrinksMod from "../DrinksDipsBuilder";

// Resolve the component whether it's a named or default export
const DrinksCategoryPanel =
  DrinksMod.DrinksCategoryPanel ?? DrinksMod.default ?? null;

export default function DrinksPanelPortal({
  open,
  categoryId,
  label = "Options",
  options = [],
  onAdd,
  onClose,
}) {
  // If we still failed to resolve a component, fail CLOSED (render nothing)
  if (!open || typeof DrinksCategoryPanel !== "function") {
    if (open && process.env.NODE_ENV !== "production") {
      console.error(
        "[DrinksPanelPortal] DrinksCategoryPanel is not a component.",
        { DrinksMod }
      );
    }
    return null;
  }

  return (
    <PortalShell open={open} onClose={onClose}>
      <DrinksCategoryPanel
        title={label}
        categoryId={categoryId}
        categoryLabel={label}
        options={options}
        initialItems={[]}
        onClose={onClose}
        onAdd={onAdd}
      />
    </PortalShell>
  );
}
