// pages/terms.js
//
// Terms of Ordering (including cancellations and refunds). A plain-language
// draft based on how the site actually works: store hours, delivery fees and
// minimum, tax, payment options, coupons. The numbers come from the same
// files the site uses (utils/storeHours.js, utils/orderRules.js), so they
// stay in step if those change. Have it reviewed before launch.
import Head from "next/head";
import LegalPage from "../components/LegalPage";
import { hoursSummary, LAST_ORDER_BEFORE_CLOSE, MAX_SCHEDULE_DAYS } from "../utils/storeHours";
import {
  STORE_ADDRESS,
  STORE_PHONE,
  TAX_RATE,
  DELIVERY_MINIMUM_CENTS,
  DELIVERY_MAX_MINUTES,
  deliveryFeeForMinutes,
} from "../utils/orderRules";

const UPDATED = "November 24, 2026";
const money = (c) => `$${(c / 100).toFixed(2)}`;
const hours = hoursSummary()
  .map((r) => `${r.days}: ${r.hours}`)
  .join(". ");

const sections = [
  {
    heading: "About these terms",
    body: [
      `These terms apply when you order from Red Stone Pizza (${STORE_ADDRESS}) through this website. By placing an order you agree to them. If you have a question, call us at ${STORE_PHONE}.`,
    ],
  },
  {
    heading: "Placing an order",
    body: [
      "Your order is placed when you see the order confirmation page. Please check your items, contact details and (for delivery) your address before placing it. We use the phone number you give us if we need to reach you about your order, so please make sure it's correct.",
      "We may refuse or cancel any order, for example if an item is unavailable, a price on the site is clearly wrong, we can't reach you to confirm, or we believe the order is fake, a prank, or fraudulent. If you've already paid online and we cancel, we'll refund you in full.",
    ],
  },
  {
    heading: "Hours and timing",
    body: [
      `Online ordering is open during store hours (${hours}). Orders for now close ${LAST_ORDER_BEFORE_CLOSE} minutes before closing. You can also schedule an order for a later time, up to ${MAX_SCHEDULE_DAYS} days ahead.`,
      "Ready and delivery times shown on the site are estimates. Busy times, weather and traffic can cause delays, and we may lengthen the estimated time when we're busy. We'll do our best to have your order ready on time.",
    ],
  },
  {
    heading: "Prices, tax and fees",
    body: [
      `All prices are in Canadian dollars. HST of ${Math.round(TAX_RATE * 100)}% is added to the whole order, including the delivery fee. Some crusts, toppings, extra dips and other options cost extra, and the price you see in your cart and at checkout includes them.`,
      `Delivery is based on the driving time from our store: ${money(deliveryFeeForMinutes(4))} for up to 4 minutes, then ${money(100)} more for each extra minute, up to ${DELIVERY_MAX_MINUTES} minutes. Delivery orders need at least ${money(DELIVERY_MINIMUM_CENTS)} of food and drinks before tax and the delivery fee. For addresses further away, please call us.`,
      "Prices, menu items and deals can change without notice. The price shown when you place your order is the price you pay.",
    ],
  },
  {
    heading: "Paying",
    body: [
      "Pay Now: pay online by card when you order. Payments are processed securely by Stripe.",
      "Pay at Store or Pay at Door: pay when you pick up or receive your order. Please have payment ready. If an order isn't picked up or paid for, we may ask you to pay online for future orders.",
    ],
  },
  {
    heading: "Coupons and deals",
    body: [
      "Each deal has its own conditions shown on the deals page (for example a minimum number of items, or carryout only). Deals can't be exchanged for cash, can end or change at any time, and may not be combined unless the site says so. If an order doesn't meet a deal's conditions, the regular price applies.",
    ],
  },
  {
    heading: "Pickup and delivery",
    body: [
      `Carryout orders are picked up at ${STORE_ADDRESS}. Please bring the name on the order.`,
      "For delivery, please give a complete address (including any unit number) and be available to receive your order. If our driver can't reach you or the address is wrong, we'll try to call you; if we still can't deliver, the order may be returned to the store and, where you've paid online, a refund may not be given for food that was already made.",
    ],
  },
  {
    heading: "Cancellations, problems and refunds",
    body: [
      `To cancel or change an order, call us right away at ${STORE_PHONE}. Once we've started making your food we may not be able to cancel it.`,
      "If something is missing or wrong with your order, please call us the same day, ideally within 24 hours, and we'll make it right with a replacement, a credit, or a refund.",
      "Refunds for online payments go back to the card you paid with and usually appear within 5 to 10 business days, depending on your bank. Refunds for orders paid in person are given in store.",
    ],
  },
  {
    heading: "Allergies and special requests",
    body: [
      "Our kitchen handles common allergens, including wheat (gluten), milk, eggs, soy, nuts and others. We can't guarantee any item is free from allergens or cross-contact. If you have an allergy, please call us before ordering. We do our best with special instructions but can't guarantee them.",
    ],
  },
  {
    heading: "Using the website",
    body: [
      "Please use the site only to place genuine orders. Don't place fake or prank orders, try to interfere with the site, or use someone else's details or payment card.",
      "We work to keep the site accurate and running, but it may sometimes be unavailable or contain mistakes. If that happens, you can always call us to order.",
    ],
  },
  {
    heading: "Our responsibility",
    body: [
      "As far as the law allows, our responsibility for any problem with an order is limited to the amount you paid for that order. Nothing in these terms takes away rights you have under Ontario consumer protection law.",
    ],
  },
  {
    heading: "Changes and governing law",
    body: [
      "We may update these terms; the \"last updated\" date shows when. The terms in place when you placed your order apply to that order. These terms are governed by the laws of Ontario and the federal laws of Canada that apply there.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Red Stone Pizza | Terms of Ordering</title>
      </Head>
      <LegalPage
        title="Terms of Ordering"
        updated={UPDATED}
        intro="The rules for ordering online from Red Stone Pizza, including fees, cancellations and refunds."
        sections={sections}
      />
    </>
  );
}
