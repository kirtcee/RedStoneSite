// pages/404.js
//
// "Page not found": shown for any address that doesn't exist (an old link,
// a typo). A pizza with a slice missing (public/images/404-pizza.webp) and
// two ways back: the menu and the home page.
import Head from "next/head";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Red Stone Pizza | Page Not Found</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="container nf">
        <img className="nf-img" src="/images/404-pizza.webp" alt="A pepperoni pizza with one slice missing" />
        <div className="nf-words">
          <p className="nf-code">404</p>
          <h1 className="nf-title">This slice is missing</h1>
          <p className="nf-text">
            The page you're looking for doesn't exist or has moved. The pizza is still here, though.
          </p>
          <div className="nf-btns">
            <Link href="/menu" className="rs-pill-btn nf-btn">
              See the Menu
            </Link>
            <Link href="/" className="nf-link">
              Go to the Home Page
            </Link>
          </div>
        </div>
      </main>
      <style jsx>{`
        .nf {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          min-height: 62vh;
          padding-top: 32px;
          padding-bottom: 48px;
        }
        .nf-img {
          width: min(40vw, 360px);
          height: auto;
          filter: drop-shadow(10px 14px 18px rgba(0, 0, 0, 0.3));
        }
        .nf-words {
          max-width: 440px;
          color: var(--text-brown);
        }
        .nf-code {
          margin: 0;
          font-family: var(--font-display);
          font-size: var(--fs-xl);
          text-transform: uppercase;
          color: #8b1a1a;
        }
        .nf-title {
          margin: 4px 0 12px;
          font-family: var(--font-display);
          font-size: var(--fs-3xl);
          line-height: 1;
          text-transform: uppercase;
          color: #000;
        }
        .nf-text {
          margin: 0 0 22px;
          font-size: var(--fs-base);
          line-height: 1.5;
        }
        .nf-btns {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 18px;
        }
        .nf-btns :global(.nf-btn) {
          display: inline-block;
          width: auto;
          padding-left: 28px;
          padding-right: 28px;
        }
        .nf-btns :global(.nf-link) {
          font-family: var(--font-display);
          font-size: var(--fs-min);
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 3px;
          color: var(--text-brown);
        }
        @media (max-width: 640px) {
          .nf {
            flex-direction: column;
            gap: 18px;
            text-align: center;
            min-height: 0;
          }
          .nf-img {
            width: min(62vw, 260px);
          }
          .nf-title {
            font-size: var(--fs-2xl);
          }
          .nf-btns {
            flex-direction: column;
            align-items: stretch;
          }
          .nf-btns :global(.nf-btn) {
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
