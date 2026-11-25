# Before launch

Running list of things to finish before `mac-handoff` is merged into `main`
(which is what Vercel deploys to the live site).

## Must do (launch blockers)

### Accounts, keys and settings
- [x] **Stripe test payments + webhook on the preview link**: working (test
      card order reaches the kitchen, webhook returns 200).
- [ ] **Stripe at launch**: swap the test keys for the live ones in Vercel
      (Production only), create a live-mode webhook destination for
      `https://<domain>/api/stripeWebhook` (event `payment_intent.succeeded`,
      no `#` in the URL) and put its new `whsec_` secret in
      `STRIPE_WEBHOOK_SECRET` (Production), then redeploy. Apple Pay: add the
      live domain in Stripe → Payment method domains.
- [ ] **Vercel Deployment Protection** was turned off for previews so Stripe
      can reach them. Decide whether to turn it back on after launch (preview
      links are then public to anyone who has the address).
- [ ] **Google server key for delivery fees**: create a key with the
      **Routes API**, save it in Vercel (Production + Preview) and `.env.local`
      as `GOOGLE_MAPS_SERVER_KEY`. Without it delivery orders can't be priced.
- [ ] **Publish the updated Firestore rules**: copy all of `firestore.rules` into
      Firebase Console → Firestore Database → Rules → Publish. Needed for the
      kitchen's wait-time buttons (settings/waitTimes); until then they show
      "Couldn't save" and customers see 20 / 45 minutes.
- [ ] **Domain: launch on `redstonepizza.net`** (it currently runs the
      Squarespace site; `.ca` is taken, `.com` is $1,900, so skipped).
      Optional: buy `redstonepizzahamilton.ca` and point it at the `.net` site.
      **Before launch day**
      - In Vercel: Settings → Domains → add `redstonepizza.net` and
        `www.redstonepizza.net` (they show "invalid configuration" until the
        switch; note the DNS records Vercel shows).
      - In Squarespace: Domains → DNS settings. Check for email records (MX,
        and any TXT for email). **Never change or delete those.**
      **Launch day**
      - In Squarespace DNS, replace only the website records for `@` and
        `www` with the ones Vercel showed (usually an A record and a CNAME).
      - Wait for Vercel to show the domains as valid (minutes, sometimes a
        couple of hours) and check the site loads on the domain.
      - Add `https://redstonepizza.net/*` and `https://www.redstonepizza.net/*`
        to the Google Maps browser key's website list; add the domain in
        Firebase → Authentication → Settings → Authorized domains.
      - Stripe live webhook + Apple Pay domain (see the Stripe item above).
      - Point the Google Business listing at the new site.
      - Only then cancel the Squarespace **website** plan (keep the domain).
      Optional, no downtime: launch first at `order.redstonepizza.net` (one
      CNAME record) while Squarespace keeps the main address.
- [ ] **Check every Vercel environment variable is set for Production**
      (Firebase, Firebase Admin, Stripe, both Google keys), not just Preview.
- [ ] **Kitchen login**: make sure the staff account has a strong password.

### Pages
- [ ] **Review the Privacy Policy and Terms of Ordering drafts** (`/privacy`,
      `/terms`; text in `pages/privacy.js` and `pages/terms.js`). Check the
      details match how you actually run things (refunds, paying at the door,
      how long you keep records), and ideally have a lawyer look them over.
- [x] "Coming Soon" pages (Rewards, Order Tracker, Pizza Calculator) hidden
      for launch: removed from the menu bar and redirected to /menu
      (`next.config.js`). Bring each back when it's built.

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
