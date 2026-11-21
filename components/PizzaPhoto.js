// components/PizzaPhoto.js
//
// A Signature / Specialty pizza photo inside a card's image box. Two styles
// (photos in public/images/pizzas/<style>/<slug>.webp, trimmed to the pizza):
//   - "overhead": the whole pizza from above, centred, fitting the box.
//   - "angled":   the side-on photo, top and bottom almost filling the box,
//                 with about 18% of the pizza cut off on the left. Every
//                 angled photo is stretched to the same 760x481 shape (the
//                 Hawaiian / Meat Lover shot) so all pizzas look the same size.
// The style used site-wide is DEFAULT_STYLE below. To compare on a phone,
// add ?photos=overhead or ?photos=angled to a page address; that choice is
// remembered for the rest of the visit.
import React, { useEffect, useRef, useState } from "react";
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
  // Fade the photo in once it has loaded. Besides looking smoother, this
  // makes the browser redraw it in full: without it, a photo that loaded
  // after the page was drawn could have the right side of its shadow cut
  // off by a white strip until something else made the page redraw.
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const src = pizzaPhotoSrc(slug, style);
  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) requestAnimationFrame(() => setLoaded(true)); // already cached
  }, [src]);
  return (
    <div className={`pizza-photo pizza-photo--${style}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={loaded ? "is-loaded" : undefined}
        onLoad={() => requestAnimationFrame(() => setLoaded(true))}
      />
      <style jsx>{`
        /* Tweak in Inspect on the .pizza-photo element:
             --angled-fill: how much of the box height the angled pizza fills
             --angled-cut:  how much of the angled pizza is cut off on the left
             --overhead-fill: how much of the box the overhead pizza fills
             --photo-shadow: the soft shadow under the pizza (follows its shape) */
        .pizza-photo {
          --angled-fill: 92%;
          --angled-cut: 18%;
          --overhead-fill: 94%;
          --photo-shadow: drop-shadow(7px 8px 6px rgba(0, 0, 0, 0.5));
          position: relative;
          background: #fff;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .pizza-photo img {
          position: absolute;
          display: block;
          max-width: none;
          user-select: none;
          filter: var(--photo-shadow);
          /* its own drawing layer, so the shadow outside the photo's edges
             is always painted (Safari/Chrome could leave it clipped) */
          will-change: transform, filter, opacity;
          backface-visibility: hidden;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .pizza-photo img.is-loaded {
          opacity: 1;
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
