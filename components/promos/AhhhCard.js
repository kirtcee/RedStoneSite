// components/promos/AhhhCard.js
//
// Home page drinks "easter egg" strip (no button, nothing to click):
// "Add ahhh to your order" with a row of our drinks. Warm, dark, lamp-lit
// amber look.
//
// Optional photo: put a file at PHOTO_SRC and it shows on the left, its
// edges faded into the background (no cut-out needed). If the file isn't
// there, the strip just shows the words and the drinks.
import { useEffect, useRef, useState } from "react";

const PHOTO_SRC = "/images/promos/ahhh.jpg";

// left to right; h = height compared to the strip
const DRINKS = [
  { src: "can-sprite", h: 46 },
  { src: "can-coke", h: 46 },
  { src: "can-crush-orange", h: 46 },
  { src: "2l-coke", h: 92 },
  { src: "gatorade-blue", h: 66 },
  { src: "red-bull", h: 50 },
  { src: "apple-juice", h: 58 },
];

export default function AhhhCard() {
  const imgRef = useRef(null);
  const [photoOk, setPhotoOk] = useState(false);
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) setPhotoOk(true);
  }, []);

  return (
    <div className={`ah${photoOk ? " ah--photo" : ""}`}>
      <div className="ah-bg" aria-hidden="true" />
      <span className="ah-lamp ah-lamp--a" aria-hidden="true" />
      <span className="ah-lamp ah-lamp--b" aria-hidden="true" />

      <img
        ref={imgRef}
        className="ah-photo"
        src={PHOTO_SRC}
        alt=""
        aria-hidden="true"
        onLoad={() => setPhotoOk(true)}
        onError={() => setPhotoOk(false)}
      />

      <p className="ah-line">
        <span className="ah-row">
          Add <span className="ah-big">ahhh</span>
        </span>{" "}
        <span className="ah-row">to your order</span>
      </p>

      <div className="ah-drinks" aria-hidden="true">
        {DRINKS.map((d) => (
          <img key={d.src} src={`/images/drinks/${d.src}.webp`} alt="" style={{ height: `${d.h}%` }} />
        ))}
      </div>

      <style jsx>{`
        .ah {
          container-type: size;
          position: absolute;
          inset: 0;
          overflow: hidden;
          color: #fff3dc;
        }
        /* dark wood room, warm light */
        .ah-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(40% 120% at 30% 50%, rgba(255, 170, 70, 0.28), transparent 70%),
            radial-gradient(35% 120% at 78% 60%, rgba(255, 190, 100, 0.18), transparent 70%),
            repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0 1px, transparent 1px 1.6cqw),
            linear-gradient(180deg, #3a2412 0%, #24160b 60%, #160d06 100%);
        }
        /* two glowing wall lamps */
        .ah-lamp {
          position: absolute;
          top: 22cqh;
          width: 2.6cqw;
          height: 22cqh;
          border-radius: 0.4cqw;
          background: linear-gradient(180deg, #ffd59a, #ff9f3a);
          box-shadow: 0 0 3cqw 1.4cqw rgba(255, 160, 60, 0.55);
          opacity: 0.85;
        }
        .ah-lamp--a { left: 50cqw; top: 8cqh; }
        .ah-lamp--b { left: 31cqw; top: 12cqh; opacity: 0.45; }

        /* optional photo, faded into the room on every side */
        .ah-photo {
          display: none;
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: auto;
          max-width: 40cqw;
          object-fit: cover;
          object-position: 30% 40%;
          -webkit-mask-image: linear-gradient(90deg, #000 70%, transparent 100%);
          mask-image: linear-gradient(90deg, #000 70%, transparent 100%);
          filter: sepia(0.15) saturate(1.1) contrast(1.05);
        }
        .ah--photo .ah-photo { display: block; }

        .ah-line {
          position: absolute;
          left: 4cqw;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          margin: 0;
          font-family: var(--font-display);
          font-size: min(4.2cqw, 20cqh);
          line-height: 1.05;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          white-space: nowrap;
          text-shadow: 0 0 1.6cqw rgba(255, 170, 70, 0.6);
        }
        .ah--photo .ah-line { left: 30cqw; font-size: min(3.4cqw, 18cqh); }
        .ah--photo .ah-photo { max-width: 30cqw; }
        .ah--photo .ah-drinks { top: 16%; }
        .ah-row { white-space: nowrap; }
        /* "ahhh" glows like a cold drink in warm light */
        .ah-big {
          display: inline-block;
          margin: 0 0.15em;
          font-size: 1.7em;
          color: #c9ff7a;
          text-shadow: 0 0 1cqw rgba(170, 255, 90, 0.9), 0 0 3cqw rgba(120, 220, 60, 0.6);
          transform: rotate(-4deg) translateY(0.04em);
          animation: ah-fizz 2.4s ease-in-out infinite;
        }
        @keyframes ah-fizz {
          0%, 100% { transform: rotate(-4deg) translateY(0.04em) scale(1); }
          50% { transform: rotate(-2deg) translateY(-0.02em) scale(1.05); }
        }

        .ah-drinks {
          position: absolute;
          right: 3cqw;
          top: 6%;
          bottom: 6%;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          gap: 0.6cqw;
        }
        .ah-drinks img {
          width: auto;
          filter: drop-shadow(0 0.4cqw 0.6cqw rgba(0, 0, 0, 0.6)) drop-shadow(0 0 1.2cqw rgba(255, 170, 70, 0.25));
          user-select: none;
        }
        /* phones (shorter, narrower strip): two lines, smaller drinks */
        @container (max-aspect-ratio: 5 / 1) {
          .ah-row { display: block; }
          .ah-line { font-size: 6.4cqw; }
          .ah--photo .ah-line { left: 27cqw; font-size: 4.4cqw; }
          .ah--photo .ah-photo { max-width: 30cqw; }
          .ah-drinks { right: 2cqw; top: 10%; bottom: 6%; gap: 0.4cqw; }
          .ah--photo .ah-drinks { top: 28%; }
          .ah-lamp { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ah-big { animation: none; }
        }
      `}</style>
    </div>
  );
}
