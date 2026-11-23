// components/promos/AhhhCard.js
//
// Home page drinks "easter egg" strip (no button, nothing to click):
// "Add ahhh to your order" with a row of our drinks, over the photo
// public/images/promos/ahhh.jpg (a web copy of ahhh.png with the black bar
// at the top trimmed off). The photo fills the whole strip; the person is on
// the left, so the words and drinks sit on the right.
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
  return (
    <div className="ah">
      <div className="ah-photo" style={{ backgroundImage: `url(${PHOTO_SRC})` }} aria-hidden="true" />
      <div className="ah-shade" aria-hidden="true" />

      <p className="ah-line">
        <span className="ah-row">Add ahhh</span> <span className="ah-row">to your order</span>
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
          background: #1a0f07;
          color: #fff3dc;
        }
        /* the photo always fits the strip's full height (never zoomed in),
           pinned to the left; any extra on the right is just dark room */
        .ah-photo {
          position: absolute;
          inset: 0;
          background-color: #1a0f07;
          background-repeat: no-repeat;
          background-position: left center;
          background-size: auto 100%;
        }
        /* darken the right side a little so the words read clearly */
        .ah-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 40%, rgba(15, 8, 3, 0.45) 75%);
        }
        .ah-line {
          position: absolute;
          left: 46cqw;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          margin: 0;
          font-family: var(--font-display);
          font-size: min(3.4cqw, 20cqh);
          line-height: 1.1;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          text-shadow: 0 0.2cqw 1cqw rgba(0, 0, 0, 0.7);
        }
        .ah-row {
          display: block;
          white-space: nowrap;
        }
        .ah-drinks {
          position: absolute;
          right: 2.5cqw;
          top: 10%;
          bottom: 6%;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          gap: 0.5cqw;
        }
        .ah-drinks img {
          width: auto;
          filter: drop-shadow(0 0.4cqw 0.6cqw rgba(0, 0, 0, 0.6)) drop-shadow(0 0 1.2cqw rgba(255, 170, 70, 0.25));
          user-select: none;
        }
        /* phones: slightly bigger words, smaller drinks */
        @container (max-aspect-ratio: 5 / 1) {
          .ah-line { left: 50cqw; top: 7%; transform: none; font-size: 4.8cqw; }
          .ah-drinks { right: 2cqw; top: 48%; gap: 0.3cqw; }
        }
      `}</style>
    </div>
  );
}
