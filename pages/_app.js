// pages/_app.js
import { installBackToClose } from "../hooks/useBackToClose";
import { initAnalytics } from "../utils/analytics";
import OrderingNotice from "../components/OrderingNotice";
import SoldOutNotice from "../components/SoldOutNotice";
import AddedToCartNotice from "../components/AddedToCartNotice";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import "../styles/globals.css";
import "../styles/feast.css";
import Header from "../components/Header";
import { CartProvider } from "../components/CartSystem";
import CartEditOverlay from "../components/CartEditOverlay";
import ServiceGateOverlay from "../components/ServiceGateOverlay";
import DeliveryMinimumOverlay from "../components/DeliveryMinimumOverlay";
import DealBuilder from "../components/DealBuilder";

// The live address, used for link previews (they need full addresses).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://redstonepizza.net").replace(/\/+$/, "");

function RootApp({ Component, pageProps }) {
  const router = useRouter();
  // Back closes the open popup first (hooks/useBackToClose.js)
  useEffect(() => {
    installBackToClose(router);
  }, [router]);
  // anonymous usage stats (utils/analytics.js); off until the key is set
  useEffect(() => {
    if (router.isReady) initAnalytics(router.pathname);
  }, [router.isReady, router.pathname]);
  const isStaffPage = router.pathname.startsWith("/kitchen");
  const [editingItem, setEditingItem] = useState(null);

  // Pages that render the two-column layout with the Order Settings aside
  // (see components/OrderSettingsAside.js) have a narrower main content
  // column than full-width pages like the homepage. page-shell--compact
  // shrinks just those pages ~10% so their text/images read at the same
  // visual size as the full-width pages, instead of looking cramped next
  // to the sidebar. Pages without the aside stay at their natural 100%.
  const hasOrderSettingsAside = ["/menu", "/coupons", "/cart"].includes(router.pathname);

  const siteHead = (
    <Head>
      <title>Red Stone Pizza | Order Online</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="description"
        content="Order pizza, wings, sides, and drinks online from Red Stone Pizza for carryout or delivery."
      />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      {/* Home-screen icons and link previews (scripts/share-images.py) */}
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#000000" />
      <meta key="og:type" property="og:type" content="website" />
      <meta key="og:site_name" property="og:site_name" content="Red Stone Pizza" />
      <meta key="og:title" property="og:title" content="Red Stone Pizza | Order Online" />
      <meta
        key="og:description"
        property="og:description"
        content="Pizza, wings, sides and drinks from Red Stone Pizza in Hamilton. Order online for carryout or delivery."
      />
      <meta key="og:image" property="og:image" content={`${SITE_URL}/images/share/og.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta key="og:url" property="og:url" content={`${SITE_URL}${router.asPath === "/" ? "" : router.pathname}`} />
      <meta name="twitter:card" content="summary_large_image" />
      {/* Start downloading the two Red Stone Face files right away so text
          doesn't visibly swap from the fallback font. The ?v= must match
          styles/globals.css exactly or the browser downloads them twice. */}
      <link
        rel="preload"
        href="/fonts/RedStoneFace-Variable.woff2?v=3"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/RedStoneFace-ExtraBlack.woff2?v=2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </Head>
  );

  // Staff-only pages (e.g. the kitchen dashboard) skip the customer chrome
  // (order/delivery header, cart, Google Maps) entirely.
  if (isStaffPage) {
    return (
      <>
        {siteHead}
        <main id="page" className="page-shell">
          <Component {...pageProps} />
        </main>
      </>
    );
  }

  return (
    <>
      {siteHead}
      {/* Google calls gm_authFailure when it rejects the Maps key (wrong
          website restriction, or a needed API not allowed on the key). Say so
          plainly in the console instead of leaving only a cryptic error. */}
      <Script id="google-maps-auth" strategy="beforeInteractive">
        {`window.gm_authFailure = function () {
  console.error("Google Maps rejected the API key. In Google Cloud > Credentials, this key's API restrictions must allow: Maps JavaScript API, Places API and Geocoding API, and its website restrictions must include this site's address.");
};`}
      </Script>
      {/* Load Google Maps JS + Places library once for the whole app */}
      <Script
        id="google-maps"
        strategy="afterInteractive"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`}
        onError={(e) => console.error("Google Maps JS failed to load", e)}
      />

      <CartProvider onEditItem={setEditingItem}>
        <Header />
        <OrderingNotice />
        {/* Content always starts below the header (and subheader when present). */}
        <main id="page" className={`page-shell${hasOrderSettingsAside ? " page-shell--compact" : ""}`}>
          <Component {...pageProps} />
        </main>
        <CartEditOverlay editingItem={editingItem} onClose={() => setEditingItem(null)} />
        <ServiceGateOverlay />
        <DeliveryMinimumOverlay />
        <SoldOutNotice />
        <AddedToCartNotice />
        {/* The coupon builder — driven by CartProvider's openDealId, so a code
            redeemed anywhere (/cart, checkout), a card clicked on /coupons, or
            "Add another item to this coupon" all open this same builder. */}
        <DealBuilder />
      </CartProvider>
    </>
  );
}

export default RootApp;
