// pages/terms.js
//
// Terms of Ordering, written in formal, general legal language on purpose:
// no fee formulas, order minimums, scheduling limits, fraud checks or other
// operating details that a competitor could copy (those are shown to the
// customer in the cart and at checkout instead). Have it reviewed before
// launch.
import Head from "next/head";
import LegalPage from "../components/LegalPage";
import { STORE_ADDRESS, STORE_PHONE } from "../utils/orderRules";

const UPDATED = "November 25, 2026";
const PHONE = STORE_PHONE || "905-385-9888";
const ADDRESS = STORE_ADDRESS || "576 Concession Street, Hamilton, Ontario";

const sections = [
  {
    heading: "1. Acceptance of Terms",
    body: [
      `These Terms of Ordering (the "Terms") govern your access to and use of this website and the online ordering services offered by Red Stone Pizza ("Red Stone Pizza," "we," "us" or "our") (collectively, the "Services"). By accessing or using the Services or placing an order, you agree to be bound by these Terms. If you do not agree, you must not use the Services.`,
    ],
  },
  {
    heading: "2. Orders",
    body: [
      "All orders are subject to acceptance by us. We reserve the right, in our sole discretion, to refuse, limit or cancel any order for any reason, including product availability, errors in pricing or product information, inability to verify order or customer information, or suspected fraudulent, unauthorized or improper activity. Where an order that has been paid is cancelled by us, the amount paid will be refunded.",
      "You are responsible for ensuring that all information you provide is accurate and complete.",
    ],
  },
  {
    heading: "3. Prices, Taxes and Fees",
    body: [
      "All prices are stated in Canadian dollars and are subject to change without notice. Applicable taxes and any applicable fees will be added to your order and displayed prior to order placement. Minimum order requirements and other conditions may apply to certain services. The total displayed at the time your order is placed is the amount payable.",
    ],
  },
  {
    heading: "4. Payment",
    body: [
      "Payment may be made by the methods made available through the Services. Online payments are processed by a third-party payment processor. By submitting payment information, you represent that you are authorized to use the payment method provided. We reserve the right to require payment in advance for any order.",
    ],
  },
  {
    heading: "5. Promotions",
    body: [
      "Promotional offers and coupon codes are subject to their stated conditions, have no cash value, may not be combined unless expressly stated, and may be modified, suspended or withdrawn at any time without notice. If an order does not satisfy the conditions of a promotion, regular pricing applies.",
    ],
  },
  {
    heading: "6. Order Timing, Pickup and Delivery",
    body: [
      "Online ordering is available only during such hours as we may determine. Any preparation, pickup or delivery times provided are estimates only and are not guaranteed.",
      "Delivery is available only within areas determined by us from time to time. You are responsible for providing a complete and accurate delivery address and for being available to receive your order. Where an order cannot be delivered or is not collected due to circumstances within your control, no refund will be issued.",
    ],
  },
  {
    heading: "7. Cancellations and Refunds",
    body: [
      `Requests to cancel or modify an order must be made by contacting us at ${PHONE} and may not be possible once preparation has begun. Concerns regarding an order must be reported to us promptly. Any replacement, credit or refund is provided at our discretion, except as otherwise required by applicable law. Refunds of online payments are issued to the original method of payment.`,
    ],
  },
  {
    heading: "8. Allergens",
    body: [
      "Our products are prepared in facilities that handle common allergens, including wheat (gluten), milk, eggs, soy and others. We cannot guarantee that any product is free from allergens or cross-contact. Customers with allergies or dietary restrictions should contact us before ordering. Special requests are accommodated where possible but are not guaranteed.",
    ],
  },
  {
    heading: "9. Acceptable Use",
    body: [
      "You agree not to: (a) place false, fraudulent or unauthorized orders; (b) use another person's information or payment method without authorization; (c) interfere with or disrupt the operation or security of the Services; or (d) access, copy, scrape or otherwise use the Services or their content by automated means or for any commercial purpose without our prior written consent.",
    ],
  },
  {
    heading: "10. Intellectual Property",
    body: [
      "The Services and all content made available through them, including names, logos, menu items, descriptions, images, graphics, designs, layout and software, are owned by or licensed to Red Stone Pizza and are protected by applicable intellectual property laws. No right or licence is granted to you except the limited right to use the Services for personal, non-commercial ordering purposes. Any reproduction, distribution, modification or other use without our prior written consent is prohibited.",
    ],
  },
  {
    heading: "11. Disclaimer",
    body: [
      "The Services are provided on an \"as is\" and \"as available\" basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including any warranty that the Services will be uninterrupted, error free or free of harmful components.",
    ],
  },
  {
    heading: "12. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, Red Stone Pizza shall not be liable for any indirect, incidental, special, consequential or punitive damages arising out of or relating to the Services or any order, and our total liability for any claim shall not exceed the amount paid by you for the order giving rise to the claim. Nothing in these Terms limits any rights you may have under applicable consumer protection legislation that cannot be waived.",
    ],
  },
  {
    heading: "13. Indemnification",
    body: [
      "You agree to indemnify and hold harmless Red Stone Pizza and its owners, employees and agents from any claims, losses, liabilities and expenses arising out of your breach of these Terms or your misuse of the Services.",
    ],
  },
  {
    heading: "14. Governing Law",
    body: [
      "These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. You agree to submit to the jurisdiction of the courts of the Province of Ontario.",
    ],
  },
  {
    heading: "15. Changes and Severability",
    body: [
      "We may amend these Terms at any time. Amendments are effective upon posting, as indicated by the \"Last updated\" date above, and apply to orders placed after that date. If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.",
    ],
  },
  {
    heading: "16. Contact",
    body: [`Questions regarding these Terms may be directed to Red Stone Pizza at ${ADDRESS} or by telephone at ${PHONE}.`],
  },
];

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Red Stone Pizza | Terms of Ordering</title>
      </Head>
      <LegalPage title="Terms of Ordering" updated={UPDATED} sections={sections} />
    </>
  );
}
