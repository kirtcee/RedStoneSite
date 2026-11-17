// components/ItemCheck.js
// Green check-in-a-circle used beside each line in the builders' "Item"
// summaries (wings, sides, drinks & dips, special menu, combos).
// Cropped from the 76x62 artwork to just its 39x39 circle.
import React from "react";

export default function ItemCheck({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="12.5 11.5 39 39"
      aria-hidden="true"
      style={{ flex: "0 0 auto", display: "inline-block", verticalAlign: "-0.2em" }}
    >
      <path
        fill="#6F9F47"
        fillRule="evenodd"
        d="M 32 11.5 A 19.5 19.5 0 1 1 32 50.5 A 19.5 19.5 0 1 1 32 11.5 Z M 29.50 40.00 L 43.50 26.00 L 43.50 24.00 L 42.00 22.50 L 41.00 22.50 L 29.00 34.50 L 28.00 34.50 L 24.00 30.50 L 23.00 30.50 L 20.50 33.00 L 22.50 35.00 L 22.50 36.00 L 23.00 36.50 L 24.00 36.50 L 24.50 37.00 L 24.50 38.00 L 27.00 40.50 L 29.00 40.50 Z"
      />
    </svg>
  );
}
