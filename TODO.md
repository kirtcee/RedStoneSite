# Before launch

Running list of things to finish before `mac-handoff` is merged into `main`
(which is what Vercel deploys to the live site).

## Must do
- [ ] **Real images** — swap the placeholder food/deal photos for the real ones.
- [ ] **Test "use my location" on delivery** — on a real iPhone (Vercel preview
      link), tap DELIVERY → Allow and check the address fills in correctly.
      If nothing fills, enable the **Geocoding API** for the Maps key in
      Google Cloud Console (APIs & Services → Library).
- [ ] **Button design pass** — restyle the remaining buttons together
      (map popup CARRYOUT, CONTINUE FOR CARRYOUT/DELIVERY, etc.).
- [ ] **Stripe "Pay Now"** is built (see `utils/stripeServer.js`). Left to do:
      - test it on the preview link with Stripe's test card 4242 4242 4242 4242
      - add the webhook in Stripe (Developers → Webhooks →
        `https://<domain>/api/stripeWebhook`, event `payment_intent.succeeded`)
        and put its signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`
      - at launch: swap the test keys for live ones (and a live webhook)
      - Apple Pay: add the live domain in Stripe → Payment method domains
- [ ] **Google server key for delivery fees**: create a key with the
      **Routes API**, save it in Vercel (Production + Preview) and `.env.local`
      as `GOOGLE_MAPS_SERVER_KEY`. Without it delivery orders can't be priced.
- [ ] **Merge `mac-handoff` → `main`** to go live.

## Should do
- [ ] Desktop home page DELIVERY / CARRYOUT buttons: their page-specific
      styles never apply (same `<Link>` scoping issue fixed on the mobile
      Order Online button).
- [ ] Review the 7 remaining `npm audit` warnings (don't use `--force`).
- [ ] Missing image: `/images/dips/blue-cheese.png` (Blue Cheese dip shows
      a broken image).
- [ ] Decide where else to use the Red Stone Display font
      (`font-family: var(--font-display)`).

## Pizza builder graphics
Toppings are now drawn by placing single pieces (see `utils/pizzaPieces.js`
and the art list in `utils/pizzaToppingArt.js`). Current piece images are
placeholders cut from the old full-pizza layers.
- [ ] New piece art (256x256 transparent PNGs, 2-4 variations each) — start
      with Pepperoni, Mushroom, Green Pepper, Onion to check the style.
- [ ] Halal Chicken: own art (borrows Grilled Chicken for now).
- [ ] Ginger / Fresh Garlic and Coriander / Sumac currently share the same art.
- [ ] Spreads still use full layers: BBQ Drizzle, Chipotle Mayo Drizzle (and
      sauces/cheese). BBQ Drizzle has no left/right half images yet.
- [ ] Sauce Less/Extra, crust type and dairy-free cheese aren't
      shown on the pizza yet.
