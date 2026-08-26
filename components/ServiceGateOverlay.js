// components/ServiceGateOverlay.js
import React from "react";
import DebugPizzaOverlay from "./modals/DebugPizzaOverlay";
import ServiceSelector from "./ServiceSelector";
import { useCart } from "./CartSystem";

/**
 * Global carryout/delivery picker, opened either by CartSystem.addItem
 * (when a service method isn't confirmed yet — see openServiceGate) or by
 * Header's mode chip. Rendered once in pages/_app.js.
 */
export default function ServiceGateOverlay() {
  const { serviceGateOpen, closeServiceGate, handleGateConfirmed } = useCart();

  return (
    <DebugPizzaOverlay
      open={serviceGateOpen}
      onClose={closeServiceGate}
      mode="portal"
      blockRogue
      title="Choose Carryout or Delivery"
    >
      {serviceGateOpen && <ServiceSelector onConfirmed={handleGateConfirmed} />}
    </DebugPizzaOverlay>
  );
}
