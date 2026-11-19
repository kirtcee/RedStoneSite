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

## Fonts
- Red Stone Face (variable, `public/fonts/RedStoneFace-Variable.woff2`) is
  being tested on checkout (`FONT_TEST_RED_STONE_FACE` in `pages/checkout.js`).
  Never use a weight under 300. A site-wide switch is planned (see the
  weight/size system discussion before doing it).
