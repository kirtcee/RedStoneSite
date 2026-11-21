// components/PizzaPhoto.js
//
// A Signature / Specialty pizza photo inside a card's image box. Two styles
// (photos in public/images/pizzas/<style>/<slug>.webp, trimmed to the pizza):
//   - "overhead": the whole pizza from above, centred, fitting the box.
//   - "angled":   the side-on photo, top and bottom almost filling the box,
//                 with about a fifth of the pizza cut off on the left. Every
//                 angled photo is stretched to the same 760x481 shape (the
//                 Hawaiian / Meat Lover shot) so all pizzas look the same size.
// The style used site-wide is DEFAULT_STYLE below. To compare on a phone,
// add ?photos=overhead or ?photos=angled to a page address; that choice is
// remembered for the rest of the visit.
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

export const DEFAULT_STYLE = "angled";
const STYLES = ["overhead", "angled"];

export function usePizzaPhotoStyle() {
  const router = useRouter();
  const [style, setStyle] = useState(DEFAULT_STYLE);
  useEffect(() => {
    const fromUrl = String(router.query.photos || "");
    try {
      if (STYLES.includes(fromUrl)) sessionStorage.setItem("rs_photo_style", fromUrl);
      const saved = sessionStorage.getItem("rs_photo_style");
      setStyle(STYLES.includes(saved) ? saved : DEFAULT_STYLE);
    } catch {
      setStyle(STYLES.includes(fromUrl) ? fromUrl : DEFAULT_STYLE);
    }
  }, [router.query.photos]);
  return style;
}

export function pizzaPhotoSrc(slug, style = "overhead") {
  return `/images/pizzas/${style}/${slug}.webp`;
}

export default function PizzaPhoto({ slug, alt = "" }) {
  const style = usePizzaPhotoStyle();
  return (
    <div className={`pizza-photo pizza-photo--${style}`}>
      <img src={pizzaPhotoSrc(slug, style)} alt={alt} loading="lazy" draggable={false} />
      <style jsx>{`
        /* Tweak in Inspect on the .pizza-photo element:
             --angled-fill: how much of the box height the angled pizza fills
             --angled-cut:  how much of the angled pizza is cut off on the left
             --overhead-fill: how much of the box the overhead pizza fills */
        .pizza-photo {
          --angled-fill: 99%;
          --angled-cut: 20%;
          --overhead-fill: 94%;
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .pizza-photo img {
          position: absolute;
          display: block;
          max-width: none;
          user-select: none;
        }
        .pizza-photo--angled img {
          top: 50%;
          left: 0;
          height: var(--angled-fill);
          width: auto;
          transform: translate(calc(-1 * var(--angled-cut)), -50%);
        }
        .pizza-photo--overhead img {
          inset: 0;
          margin: auto;
          width: var(--overhead-fill);
          height: var(--overhead-fill);
          object-fit: contain;
        }
      `}</style>
    </div>
  );
}
