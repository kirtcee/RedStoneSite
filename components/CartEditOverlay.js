// components/CartEditOverlay.js
import React from "react";
import dynamic from "next/dynamic";
import PizzaBuilder from "./PizzaBuilder";
import SideBuilder from "./SideBuilder";
import ComboBuilder from "./ComboBuilder";
import SpecialMenuBuilder from "./SpecialMenuBuilder";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";
import { useCart } from "./CartSystem";

// Client-only, matching how pages/menu.js loads it.
const WingsBuilder = dynamic(() => import("./WingsBuilder"), {
  ssr: false,
  loading: () => <div className="card">Loading wings…</div>,
});

const SPECIAL_NAME_TO_ITEM_TYPE = {
  "Panzerotti": "panzerotti",
  "Pizza Sub": "pizza-sub",
  "Meatball Sub": "meatball-sub",
};

/**
 * Reopens the right builder, pre-filled, for a cart item the user chose to
 * edit — wired app-wide via CartProvider's onEditItem (see pages/_app.js).
 * Saving replaces the existing cart line (via updateItem) instead of adding
 * a new one.
 */
export default function CartEditOverlay({ editingItem, onClose }) {
  const { updateItem } = useCart();
  if (!editingItem) return null;

  const saveAndClose = (payload) => {
    updateItem(editingItem.id, payload);
    onClose();
  };

  switch (editingItem.type) {
    // A "pizza-specialty" item (added straight off the Signature/Specialty
    // grid with no customization) is edited the same way a BYO pizza is —
    // matching what "Customize" already does for those pizzas elsewhere in
    // the app. Its preset toppings aren't stored on the cart item, so the
    // builder opens at the saved size with an otherwise blank build.
    case "pizza-byo":
    case "pizza-specialty":
      return (
        <DebugPizzaOverlay open onClose={onClose} mode="portal" blockRogue title="Edit Pizza">
          <PizzaBuilder
            initialData={editingItem}
            pizzaName={editingItem.pizzaName || editingItem.name || ""}
            onSave={saveAndClose}
          />
        </DebugPizzaOverlay>
      );

    case "wings":
      return (
        <DebugPizzaOverlay open onClose={onClose} mode="portal" blockRogue title="Edit Wings">
          <WingsBuilder
            initialData={editingItem}
            addToCartDirect={false}
            onClose={onClose}
            onAdd={saveAndClose}
          />
        </DebugPizzaOverlay>
      );

    case "side":
      return (
        <DebugPizzaOverlay open onClose={onClose} mode="portal" blockRogue title="Edit Side">
          <SideBuilder
            side={editingItem.side || editingItem.name}
            initialData={editingItem}
            addToCartDirect={false}
            onClose={onClose}
            onAdd={saveAndClose}
          />
        </DebugPizzaOverlay>
      );

    case "combo":
      // ComboBuilder manages its own overlay/open-state internally, driven
      // by the editingItem prop (see startComboFromEdit in ComboBuilder.js).
      return <ComboBuilder editingItem={editingItem} onClose={onClose} />;

    case "special":
      // SpecialMenuBuilder also manages its own overlay via its `open` prop.
      return (
        <SpecialMenuBuilder
          open
          itemType={SPECIAL_NAME_TO_ITEM_TYPE[editingItem.name] || "panzerotti"}
          initialData={editingItem}
          editingId={editingItem.id}
          onClose={onClose}
        />
      );

    default:
      return null;
  }
}
