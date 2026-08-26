// pages/_app.js
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import "../styles/globals.css";
import Header from "../components/Header";
import { CartProvider, CartSidebar } from "../components/CartSystem";
import CartEditOverlay from "../components/CartEditOverlay";

function RootApp({ Component, pageProps }) {
  const router = useRouter();
  const isStaffPage = router.pathname.startsWith("/kitchen");
  const [editingItem, setEditingItem] = useState(null);

  // Enable compact scaling globally (no CSS zoom/transform)
  useEffect(() => {
    document.body.classList.add("scale-90"); // change to 'scale-100' or remove to go back to 100%
    return () => document.body.classList.remove("scale-90");
  }, []);

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
        {/* Content always starts below the header (and subheader when present) */}
        <main id="page" className="page-shell">
          <Component {...pageProps} />
        </main>
        <CartSidebar />
        <CartEditOverlay editingItem={editingItem} onClose={() => setEditingItem(null)} />
      </CartProvider>
    </>
  );
}

export default RootApp;
