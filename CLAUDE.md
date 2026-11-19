# Red Stone Pizza site: notes for whoever edits it

## Writing rules for anything customers see
- **No em dashes (—) or en dashes (–).** Use instead:
  - joining two sentences: a period ("Couldn't check that code. Please try again.")
  - label then value: a colon, comma or brackets ("Add Item ($4.99)", "Carry Out Special: 1 Large Pizza")
  - ranges: "to" ("Mon to Sat", "11:00 AM to 10:00 PM", "20 to 45 minutes")
  - an empty value: "Not provided" for customers, "N/A" on the kitchen screen
  - browser tab titles: a vertical bar ("Red Stone Pizza | Order Online")
- **No bullet (•) separators.** Put each kind of detail on its own line
  (join with "\n"; the element showing it needs `white-space: pre-line`) and
  use commas inside a line ("6-piece, Hot, Sauced & Tossed").
- Code comments can use anything; these rules are for visible text.

## Fonts and type scale
- **Red Stone Face is the only brand font** (`public/fonts/RedStoneFace-Variable.woff2`
  = weights 300 to 950, `RedStoneFace-ExtraBlack.woff2` = the always-950 "Max"
  version). Red Stone Display, TT Commons and the Google fonts are retired.
- **Headings, buttons, labels, prices:** `var(--font-display)` (always 950)
  **and always ALL CAPS** (`text-transform: uppercase`). The font has lowercase
  letters, so caps must be set explicitly.
- **Everything else:** `var(--font-body)` with a weight from the scale.
- **Weights** (globals.css `:root`): `--w-light` 300, `--w-regular` 400,
  `--w-medium` 500, `--w-semibold` 600, `--w-bold` 800, `--w-black` 950.
  **Never below 300.**
- **Sizes:** `--fs-xs` 15px (smallest allowed), `--fs-sm` 16, `--fs-base` 18,
  `--fs-md` 20, `--fs-lg` 24, `--fs-xl` 28, `--fs-2xl` 34, `--fs-3xl` 42.
  Use these instead of one-off sizes when touching a section.
- **Kitchen screen, kitchen login, printed receipts:** plain system font
  (`var(--font-plain)`), not the brand font. Keep them plain and legible.
- When replacing a font file, bump its `?v=` in BOTH `styles/globals.css`
  and the preload links in `pages/_app.js` (and `components/StripeCardPayment.js`).
