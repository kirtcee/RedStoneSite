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
- [ ] **Merge `mac-handoff` → `main`** to go live.

## Should do
- [ ] Desktop home page DELIVERY / CARRYOUT buttons: their page-specific
      styles never apply (same `<Link>` scoping issue fixed on the mobile
      Order Online button).
- [ ] Review the 7 remaining `npm audit` warnings (don't use `--force`).
- [ ] Decide where else to use the Red Stone Display font
      (`font-family: var(--font-display)`).
