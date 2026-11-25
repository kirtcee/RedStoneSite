// pages/privacy.js
//
// Privacy Policy, written in formal, general legal language on purpose: it
// names no service providers or tools and describes no internal systems or
// operating details (the owner doesn't want competitors learning how the
// site and kitchen work). It still has to cover what Canadian privacy law
// (PIPEDA) expects: what is collected, why, disclosure to service providers,
// processing outside Canada, safeguards, retention, access and correction,
// and how to complain. If the site starts collecting something new, check
// it still fits the categories below. Have it reviewed before launch.
import Head from "next/head";
import LegalPage from "../components/LegalPage";
import { STORE_ADDRESS, STORE_PHONE } from "../utils/orderRules";

const UPDATED = "November 25, 2026";
const PHONE = STORE_PHONE || "905-385-9888";
const ADDRESS = STORE_ADDRESS || "576 Concession Street, Hamilton, Ontario";

const sections = [
  {
    heading: "1. Scope",
    body: [
      `This Privacy Policy describes how Red Stone Pizza ("Red Stone Pizza," "we," "us" or "our") collects, uses, discloses and otherwise processes personal information in connection with this website and any related online ordering services (collectively, the "Services"). By accessing or using the Services, you acknowledge that you have read and understood this Privacy Policy and consent to the processing of your personal information as described herein.`,
    ],
  },
  {
    heading: "2. Information We Collect",
    body: [
      "We may collect the following categories of personal information: (a) identifiers and contact information, such as your name, telephone number, email address and delivery address; (b) transaction information, such as the products ordered, order preferences, order history, promotional codes and payment method selected; (c) location information, where you choose to provide it; and (d) technical and usage information, such as your IP address, device and browser characteristics, and information about your interactions with the Services.",
      "Payment card information is collected and processed directly by our third-party payment processor. We do not store complete payment card numbers.",
    ],
  },
  {
    heading: "3. Use of Information",
    body: [
      "We may use personal information to: (a) process, fulfil and deliver orders; (b) communicate with you regarding your orders and the Services; (c) process payments and issue receipts and refunds; (d) detect, investigate and prevent fraudulent, unauthorized or abusive activity; (e) maintain, analyze and improve the Services; (f) comply with applicable legal, tax and accounting obligations; and (g) for any other purpose disclosed to you at the time of collection or to which you consent.",
      "We do not sell personal information.",
    ],
  },
  {
    heading: "4. Disclosure of Information",
    body: [
      "We may disclose personal information to third-party service providers that perform services on our behalf, including payment processing, hosting, data storage, mapping, analytics and related technical services. Such service providers are permitted to use personal information only as necessary to provide services to us.",
      "We may also disclose personal information: (a) where required or permitted by law, including in response to a lawful request by a public authority; (b) to protect the rights, property or safety of Red Stone Pizza, our customers or others; (c) in connection with a proposed or actual sale, merger or other transfer of all or part of our business; or (d) with your consent.",
    ],
  },
  {
    heading: "5. Processing Outside Canada",
    body: [
      "Personal information may be stored and processed outside of Canada, including in the United States, by us or our service providers. Such information may be subject to the laws of those jurisdictions and may be accessible to their courts, law enforcement and national security authorities.",
    ],
  },
  {
    heading: "6. Cookies and Similar Technologies",
    body: [
      "The Services use browser storage and similar technologies to operate the Services, remember your preferences and selections, and collect information about how the Services are used. You may be able to disable or clear these technologies through your browser settings; however, doing so may affect the functionality of the Services.",
    ],
  },
  {
    heading: "7. Retention",
    body: [
      "We retain personal information for as long as reasonably necessary to fulfil the purposes for which it was collected, or as required or permitted by applicable law. Personal information that is no longer required is destroyed, erased or anonymized.",
    ],
  },
  {
    heading: "8. Safeguards",
    body: [
      "We maintain reasonable administrative, technical and physical safeguards designed to protect personal information against loss, theft and unauthorized access, use, disclosure, copying or modification. No method of transmission or storage is completely secure, and we cannot guarantee the absolute security of personal information.",
    ],
  },
  {
    heading: "9. Access, Correction and Withdrawal of Consent",
    body: [
      "Subject to applicable law, you may request access to, or correction of, the personal information we hold about you, and you may withdraw your consent to certain processing, subject to legal or contractual restrictions and reasonable notice. Withdrawal of consent may affect our ability to provide the Services to you. We may require verification of your identity before responding to a request.",
      `Requests and inquiries may be directed to us by telephone at ${PHONE} or in person at ${ADDRESS}. If you are not satisfied with our response, you may contact the Office of the Privacy Commissioner of Canada.`,
    ],
  },
  {
    heading: "10. Minors",
    body: [
      "The Services are not directed to individuals under the age of 13, and we do not knowingly collect personal information from such individuals.",
    ],
  },
  {
    heading: "11. Changes to this Policy",
    body: [
      "We may amend this Privacy Policy at any time. Amendments are effective upon posting, as indicated by the \"Last updated\" date above. Your continued use of the Services following the posting of amendments constitutes acceptance of the amended Privacy Policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Red Stone Pizza | Privacy Policy</title>
      </Head>
      <LegalPage title="Privacy Policy" updated={UPDATED} sections={sections} />
    </>
  );
}
