// pages/api/stripeWebhook.js
//
// Stripe calls this when a payment succeeds, so a paid order still reaches
// the kitchen even if the customer closed the page before the browser
// could report back. Set up in Stripe: Developers -> Webhooks -> Add
// endpoint -> https://<your-domain>/api/stripeWebhook with the event
// payment_intent.succeeded, then put its signing secret (whsec_...) in the
// STRIPE_WEBHOOK_SECRET environment variable.
import { getStripe, finalizeCardOrder } from "../../utils/stripeServer";

// Stripe signs the raw request body, so Next must not parse it first.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("stripeWebhook: STRIPE_WEBHOOK_SECRET is not set");
    res.status(500).end();
    return;
  }

  let event;
  try {
    const raw = await readRawBody(req);
    event = getStripe().webhooks.constructEvent(raw, req.headers["stripe-signature"], secret);
  } catch (e) {
    // Not really from Stripe (or the secret is wrong).
    res.status(400).send("Invalid signature");
    return;
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const orderId = event.data.object?.metadata?.pendingOrderId;
      if (orderId) await finalizeCardOrder(orderId);
    }
    res.status(200).json({ received: true });
  } catch (e) {
    // A 500 makes Stripe retry later.
    console.error("stripeWebhook handling failed", e);
    res.status(500).end();
  }
}
