# Before launch

Running list of things to finish before `mac-handoff` is merged into `main`
(which is what Vercel deploys to the live site).

## Must do (launch blockers)

### Bugs / missing logic
- [ ] **Scheduled times are off by 5 hours on the live site.** The server reads
      a scheduled "7:00 PM" in UTC (Vercel's time zone), so it's saved as
      2:00 PM Toronto time: wrong kitchen timers, wrong "Later" section, wrong
      time on the confirmation page. Fix `pickupTimeFor` in
      `utils/orderBuilder.js` to use America/Toronto.
- [ ] **Store hours aren't enforced.** ASAP orders can be placed at 3 AM, and
      scheduled times are offered 11 AM to 10 PM every day (Sunday is really
      12 to 9, see `pages/contact.js`). Need: one shared hours table, "We're
      closed, schedule for later" when closed, Sunday hours in the time picker,
      and the server refusing closed / past times.

### Accounts, keys and settings
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
- [ ] **Publish the updated Firestore rules**: copy all of `firestore.rules` into
      Firebase Console → Firestore Database → Rules → Publish. Needed for the
      kitchen's wait-time buttons (settings/waitTimes); until then they show
      "Couldn't save" and customers see 20 / 45 minutes.
- [ ] **Real domain**: connect it in Vercel, then add it to the Google Maps
      browser key's website list (and remove `*.vercel.app` after launch).
- [ ] **Check every Vercel environment variable is set for Production**
      (Firebase, Firebase Admin, Stripe, both Google keys), not just Preview.
- [ ] **Kitchen login**: make sure the staff account has a strong password.

### Pages
- [ ] **Privacy Policy and Terms / Refund Policy pages.** The site collects
      names, phone numbers, emails and payments; Canadian privacy law (PIPEDA)
      and Stripe both expect these. Link them in the footer and at checkout.
- [ ] **"Coming Soon" pages in the menu**: Rewards, Order Tracker and Pizza
      Calculator are placeholders. Hide them from the navigation for launch,
      or finish them.

### Testing
- [ ] **Test "use my location" on delivery** on a real iPhone (Vercel preview
      link): tap DELIVERY → Allow and check the address fills in. If nothing
      fills, enable the **Geocoding API** for the Maps key.
- [ ] **Full test order of every kind** on the preview link: carryout and
      delivery, pay now / pay at store / pay at door, ASAP and scheduled, a
      coupon and a combo. Check each one on the kitchen screen and its
      confirmation page.
- [ ] **Kitchen tablet test**: alerts, Accept, Undo, Past Orders, wait times.

- [ ] **Merge `mac-handoff` → `main`** to go live.

## Prank / fake order protection (pick which to build)
Card orders are already safe; these are for Pay at Store / Pay at Door.
- [ ] **Flag risky orders on the kitchen screen**: "First order from this
      number" badge, and "Call to confirm" on first-time numbers or big
      orders (e.g. over $60).
- [ ] **Block list**: a "Block this number" button on kitchen orders and Past
      Orders; the server then refuses pay-later orders from that number.
- [ ] **Pay-later limits**: orders over e.g. $75 must pay by card; at most 2
      open pay-later orders per phone number; first-time delivery customers
      must pay by card.
- [ ] **Bot protection**: reCAPTCHA or Firebase App Check on ordering
      (invisible to customers).
- [ ] **Text-message code** for pay-later orders (Firebase phone sign-in),
      maybe only the first time a number orders. Strongest; a little friction.

## Should do
- [ ] **Button design pass**: restyle the remaining buttons together (map
      popup CARRYOUT, CONTINUE FOR CARRYOUT/DELIVERY, etc.).
- [ ] Desktop home page DELIVERY / CARRYOUT buttons: their page-specific
      styles never apply (same `<Link>` scoping issue fixed on the mobile
      Order Online button).
- [ ] **Order confirmation by email or text** for Pay at Store / Pay at Door
      orders (card orders get Stripe's receipt email).
- [ ] **A proper "page not found" page** (it's Next.js's plain default now).
- [ ] **Social sharing preview**: an image and title for when the link is
      shared in texts or social media (`og:image` in `pages/_app.js`).
- [ ] Review the 7 remaining `npm audit` warnings (don't use `--force`).
- [ ] Clean out unused old images in `public/images` (old placeholders like
      `home/deal-*.jpg`, `menu_*.png`, `deal_title.jpg`).

## Hardware
- [ ] Kitchen tablet (Android, e.g. Galaxy Tab A9+, with Chrome), stand,
      always plugged in; UPS battery backup for modem, router and printer.
- [ ] Star TSP143IV UEWB for website orders; test whether Uber / DoorDash /
      Skip can print to it before buying used Bluetooth printers for them.
- [ ] Once the printer is here: automatic printing of website orders
      (Star CloudPRNT).

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
