// pages/_app.js
import React, { useState } from "react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import "../styles/globals.css";
import "../styles/feast.css";
import Header from "../components/Header";
import { CartProvider, CartSidebar } from "../components/CartSystem";
import CartEditOverlay from "../components/CartEditOverlay";
import ServiceGateOverlay from "../components/ServiceGateOverlay";
import DealBuilder from "../components/DealBuilder";

function RootApp({ Component, pageProps }) {
  const router = useRouter();
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
      <title>Red Stone Pizza — Order Online</title>
      <meta
        name="description"
        content="Order pizza, wings, sides, and drinks online from Red Stone Pizza for carryout or delivery."
      />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
      {/* Load Google Maps JS + Places library once for the whole app */}
      <Script
        id="google-maps"
        strategy="afterInteractive"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`}
        onError={(e) => console.error("Google Maps JS failed to load", e)}
      />

      <CartProvider onEditItem={setEditingItem}>
        <Header />
        {/* Content always starts below the header (and subheader when present). */}
        <main id="page" className={`page-shell${hasOrderSettingsAside ? " page-shell--compact" : ""}`}>
          <Component {...pageProps} />
        </main>
        <CartSidebar />
        <CartEditOverlay editingItem={editingItem} onClose={() => setEditingItem(null)} />
        <ServiceGateOverlay />
        {/* Fresh-open instance — driven by CartProvider's openDealId, so a
            code redeemed from anywhere (cart dropdown, /cart, checkout) or a
            card clicked on /coupons opens the same builder. Editing an
            existing "deal" cart item uses a separate instance inside
            CartEditOverlay above. */}
        <DealBuilder />
      </CartProvider>
    </>
  );
}

export default RootApp;
