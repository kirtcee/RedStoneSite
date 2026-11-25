// components/StripeCardPayment.js
//
// The "Pay Now" card form on the checkout page: Stripe's Payment Element
// (card number, expiry, CVC, postal code — plus Apple Pay / Google Pay
// where available), styled to match the rest of the checkout. Card details
// go straight from this form to Stripe; they never touch our server.
//
// The checkout page calls `pay()` through a ref when the customer taps
// Place Your Order. See utils/stripeServer.js for the whole flow.
import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

// Loaded the first time someone picks Pay Now, not on every page.
let stripePromise = null;
function getStripePromise() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

// Matches the checkout's own fields: white inputs with the tan border,
// 3px corners, Red Stone Face ExtraBlack labels in brown, red error bar on the left.
const BROWN = "#8f6c49";
const BORDER = "#c0a58b";
const ERROR_RED = "#d0021b";
const APPEARANCE = {
  theme: "stripe",
  variables: {
    colorPrimary: "#000000",
    colorBackground: "#ffffff",
    colorText: "#000000",
    colorTextSecondary: BROWN,
    colorTextPlaceholder: "#9b8a78",
    colorDanger: ERROR_RED,
    fontFamily: "'Red Stone Face', system-ui, sans-serif",
    fontSizeBase: "16px", // 16px+ stops iPhones zooming into the field
    borderRadius: "3px",
    spacingUnit: "4px",
  },
  rules: {
    ".Label": {
      fontFamily: "'Red Stone Face Max', sans-serif",
      fontWeight: "400",
      fontSize: "16px",
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: BROWN,
      marginBottom: "6px",
    },
    ".Input": {
      border: `1px solid ${BORDER}`,
      boxShadow: "none",
      padding: "11px 12px",
      // same as the checkout's other boxes (pages/checkout.js .co-input)
      fontSize: "19px", // keep in step with --fs-input in globals.css (the card box is an iframe, so it can't read the variable)
      fontWeight: "650",
    },
    ".Input:focus": {
      border: `1px solid ${BORDER}`,
      boxShadow: `0 0 0 2px ${BROWN}`,
    },
    ".Input--invalid": {
      border: `1px solid ${ERROR_RED}`,
      boxShadow: `inset 5px 0 0 ${ERROR_RED}`,
      paddingLeft: "16px",
      color: "#000000",
    },
    ".Error": {
      fontSize: "13.6px",
      fontWeight: "600",
      color: ERROR_RED,
    },
    ".Tab": {
      border: `1px solid ${BORDER}`,
      boxShadow: "none",
      fontFamily: "'Red Stone Face Max', sans-serif",
      textTransform: "uppercase",
    },
    ".Tab--selected": {
      border: "1px solid #000000",
      boxShadow: "0 0 0 1px #000000",
    },
  },
};

const CardForm = forwardRef(function CardForm({ onReadyChange }, ref) {
  const stripe = useStripe();
  const elements = useElements();

  useImperativeHandle(
    ref,
    () => ({
      // createPayment(): asks our server to price the order and set up the
      // payment; resolves { orderId, clientSecret } or { error }.
      // Resolves { orderId, status } on success, or { error, field? }.
      async pay({ createPayment, billing, returnUrlFor }) {
        if (!stripe || !elements) return { error: "The card form is still loading. Please try again." };

        // Checks the card fields first (shows errors right in the form).
        const { error: submitError } = await elements.submit();
        if (submitError) return { error: submitError.message, field: true };

        const created = await createPayment();
        if (!created || created.error) return { error: created?.error || "Couldn't start the payment." };

        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret: created.clientSecret,
          confirmParams: {
            return_url: returnUrlFor(created.orderId),
            payment_method_data: { billing_details: billing },
          },
          // Cards finish right here (3-D Secure pops up over the page);
          // only payment types that need a bank's website leave the page.
          redirect: "if_required",
        });
        if (error) return { error: error.message, orderId: created.orderId, field: error.type === "card_error" || error.type === "validation_error" };
        return { orderId: created.orderId, status: paymentIntent?.status || "succeeded" };
      },
    }),
    [stripe, elements]
  );

  return (
    <PaymentElement
      onReady={() => onReadyChange?.(true)}
      options={{
        layout: "tabs",
        // Name / email / phone come from "Your Information" above.
        fields: { billingDetails: { name: "never", email: "never", phone: "never" } },
        wallets: { applePay: "auto", googlePay: "auto" },
      }}
    />
  );
});

const StripeCardPayment = forwardRef(function StripeCardPayment({ amountCents }, ref) {
  const promise = getStripePromise();
  const [ready, setReady] = useState(false);

  // Stripe draws the form in its own frame, so our fonts are passed in by
  // full URL. Built once, on the client.
  const fonts = useMemo(() => {
    if (typeof window === "undefined") return [];
    const o = window.location.origin;
    return [
      { family: "Red Stone Face", src: `url(${o}/fonts/RedStoneFace-Variable.woff2?v=3)`, weight: "400" },
      { family: "Red Stone Face", src: `url(${o}/fonts/RedStoneFace-Variable.woff2?v=3)`, weight: "600" },
      { family: "Red Stone Face Max", src: `url(${o}/fonts/RedStoneFace-ExtraBlack.woff2?v=2)`, weight: "400" },
    ];
  }, []);

  if (!promise) {
    return (
      <div className="co-card co-card--missing">
        Card payments aren't set up yet (missing Stripe publishable key).
      </div>
    );
  }

  return (
    <div className="co-card">
      {!ready && <div className="co-card__loading">Loading secure card form…</div>}
      <Elements
        stripe={promise}
        options={{
          mode: "payment",
          amount: Math.max(50, Math.round(amountCents || 0)),
          currency: "cad",
          appearance: APPEARANCE,
          fonts,
        }}
      >
        <CardForm ref={ref} onReadyChange={setReady} />
      </Elements>
      <p className="co-card__secure">
        Payments are processed securely by Stripe. Your card details never touch our servers.
      </p>
    </div>
  );
});

export default StripeCardPayment;
