// components/HeaderOrnaments.js
// Decorative Moroccan-tile-style rosette icons for the header's middle deadspace.
import React from "react";

// Parametric petal: a leaf/lens shape pointing outward from the shape's center (50,50).
// `len` = how far the tip extends from center, `width` = max half-width of the belly.
function petalPath(len, width) {
  const tipY = 50 - len;
  const bellyY = 50 - len * 0.42;
  return `M50,50 C${50 - width},${50 - len * 0.15} ${50 - width},${bellyY} 50,${tipY} C${50 + width},${bellyY} ${50 + width},${50 - len * 0.15} 50,50 Z`;
}

function Petals({ angles, len, width, fill }) {
  const d = petalPath(len, width);
  return (
    <>
      {angles.map((deg) => (
        <path key={deg} d={d} fill={fill} transform={`rotate(${deg} 50 50)`} />
      ))}
    </>
  );
}

const FOUR = [0, 90, 180, 270];
const EIGHT = [0, 45, 90, 135, 180, 225, 270, 315];

function Quatrefoil(props) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <Petals angles={FOUR} len={44} width={34} fill="#1E7A42" />
      <Petals angles={FOUR} len={38} width={28} fill="#55C2F2" />
      <Petals angles={FOUR} len={20} width={10} fill="#F9C531" />
    </svg>
  );
}

function RedPetalFlower(props) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <Petals angles={FOUR} len={46} width={20} fill="#FBC02D" />
      <Petals angles={FOUR} len={38} width={15} fill="#D8342A" />
      <Petals angles={FOUR} len={32} width={11} fill="#3FA14D" />
      <circle cx="50" cy="50" r="9" fill="#fff" />
    </svg>
  );
}

function TealPetalFlower(props) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <Petals angles={FOUR} len={46} width={20} fill="#FBC02D" />
      <Petals angles={FOUR} len={36} width={14} fill="#1C7EA5" />
      <Petals angles={FOUR} len={30} width={6} fill="#fff" />
      <circle cx="50" cy="50" r="8" fill="#1F6B3D" />
    </svg>
  );
}

function StarFlower(props) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <Petals angles={EIGHT} len={44} width={13} fill="#2C4A96" />
      <Petals angles={EIGHT} len={35} width={9} fill="#3E76D8" />
      <Petals angles={EIGHT} len={27} width={6} fill="#fff" />
      <circle cx="50" cy="50" r="9" fill="#FFC72C" />
    </svg>
  );
}

// Equal-width flex spacers so the gap between every pair of icons and the
// gap after the last icon are all the exact same size — mathematically
// identical, and self-adjusting if the surrounding nav content ever changes
// width. The very first spacer (before icon 1) gets less flex-grow than the
// rest: the nav button to its left (CONTACT/COMBOS) has no visible
// background at rest, so its box extends well past the visible text via
// padding — measuring the gap from that invisible box edge reads as too
// wide. Shrinking just this one spacer accounts for the text, not the box.
function Spacer({ lead }) {
  return (
    <span
      className={`header-ornament-spacer${lead ? " header-ornament-spacer--lead" : ""}`}
    />
  );
}

export default function HeaderOrnaments() {
  return (
    <div className="header-ornaments" aria-hidden="true">
      <Spacer lead />
      <Quatrefoil className="header-ornament" />
      <Spacer />
      <RedPetalFlower className="header-ornament" />
      <Spacer />
      <TealPetalFlower className="header-ornament" />
      <Spacer />
      <StarFlower className="header-ornament" />
      <Spacer />
    </div>
  );
}
