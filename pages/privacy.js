// pages/privacy.js
//
// Privacy Policy. A plain-language draft based on what the site actually
// collects and where it goes (checkout form, delivery address, Firebase,
// Stripe, Google Maps, Vercel). Have it reviewed before launch, and update
// it whenever the site starts collecting something new (accounts, texts,
// analytics, marketing emails...).
import Head from "next/head";
import LegalPage from "../components/LegalPage";
import { STORE_ADDRESS, STORE_PHONE } from "../utils/orderRules";

const UPDATED = "November 25, 2026";
const PHONE = STORE_PHONE || "905-385-9888";
const ADDRESS = STORE_ADDRESS || "576 Concession Street, Hamilton, Ontario";

const sections = [
  {
    heading: "Who we are",
    body: [
      `Red Stone Pizza ("we", "us") runs this website so you can order food for carryout or delivery from our store at ${ADDRESS}. This policy explains what personal information we collect when you use the site, why, and what we do with it.`,
    ],
  },
  {
    heading: "What we collect",
    body: [
      "Your contact details when you order: first and last name, phone number and email address.",
      "Your delivery address, if you choose delivery. If you tap \"use my location\", your device shares its location once so we can fill in your address; we don't keep tracking it.",
      "Your order: the items, any coupon used, carryout or delivery, the time you asked for, the total, and how you chose to pay.",
      "Payment details: if you pay online, your card details go straight to our payment processor, Stripe. We never see or store your full card number.",
      "Technical information: when you visit, our site and its service providers automatically receive basic information such as your IP address, browser type and the pages you visit. We use a random anonymous ID (not your name) so your cart and order can be linked to your device.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "To prepare, deliver and hand over your order, and to work out your delivery fee from your address.",
      "To contact you about your order, for example if we have a question or there's a delay.",
      "To send your payment receipt (Stripe emails it when you pay online).",
      "To prevent fake or prank orders and fraud, for example by refusing orders from numbers that have caused problems before.",
      "To keep the records we're required to keep for tax and accounting.",
      "We don't sell your personal information, and we don't use it to send you advertising. If we ever start sending offers, we'll ask for your permission first.",
    ],
  },
  {
    heading: "Who we share it with",
    body: [
      "We only share what's needed to run the site and fill your order, with these service providers:",
      "Google Firebase (stores orders and runs the anonymous ID), Stripe (online payments), Google Maps (address search and delivery distance), Vercel (hosts the website), and PostHog (anonymous usage statistics).",
      "These companies may store and process information on servers outside Canada, including in the United States, where it may be subject to the laws of that country. They may only use it to provide their service to us.",
      "We may also share information if the law requires it, or to protect our rights, our staff or our customers.",
    ],
  },
  {
    heading: "Your browser",
    body: [
      "The site saves a few things in your browser so it remembers your choices: your cart, carryout or delivery, your delivery address, your chosen order time, and, for the current tab only, the details you typed at checkout. You can clear these at any time by clearing your browser's data for this site.",
      "We use PostHog to collect anonymous usage statistics, such as which pages and deals people open and where they stop before ordering, so we can make the site easier to use. It doesn't use cookies (it keeps a random ID for the current tab only), it never receives your name, phone number, email or address, and anything you type into a box is hidden from it.",
      "We don't use advertising cookies, and we don't sell or share your information for advertising.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "We keep order records (including your name, phone number, email and address for that order) for as long as we need them for the order and for our tax and accounting records, which is generally up to 7 years. Information saved in your browser stays until you clear it.",
    ],
  },
  {
    heading: "Keeping it safe",
    body: [
      "Your information is sent over a secure (HTTPS) connection. Order records can only be viewed by our staff through a password-protected kitchen screen, and online payments are handled by Stripe, which is certified to the payment card industry's security standard. No method is completely secure, but we take reasonable steps to protect your information.",
    ],
  },
  {
    heading: "Your choices and rights",
    body: [
      "You can ask to see the personal information we have about you, ask us to correct it, or ask us to delete it where we're not required to keep it. You can also withdraw your consent, though we may then be unable to take your orders online.",
      `To make a request or ask a question about your privacy, call us at ${PHONE} or visit us at ${ADDRESS}. If you're not satisfied with our answer, you can contact the Office of the Privacy Commissioner of Canada.`,
    ],
  },
  {
    heading: "Children",
    body: ["The site is meant for people who are able to place an order and pay for it. We don't knowingly collect information from children under 13."],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this policy when the site changes. The \"last updated\" date at the top shows when it last changed. Ordering after a change means you accept the updated policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Red Stone Pizza | Privacy Policy</title>
      </Head>
      <LegalPage
        title="Privacy Policy"
        updated={UPDATED}
        intro="In short: we collect what we need to make and deliver your order, we don't sell it, and card details are handled by Stripe, not stored by us."
        sections={sections}
      />
    </>
  );
}
