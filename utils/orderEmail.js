// utils/orderEmail.js  (server only)
//
// The order confirmation email, which is also the customer's receipt.
// Sent once per order, right after it's saved:
//   pages/api/placeOrder.js     Pay at Store / Pay at Door orders
//   utils/stripeServer.js       card orders, once the payment is confirmed
//
// Sent with Resend (resend.com). Switched off until these are set in Vercel:
//   RESEND_API_KEY      the Resend API key (starts re_)   [secret]
//   ORDER_EMAIL_FROM    e.g.  Red Stone Pizza <orders@redstonepizza.net>
//                       (the domain must be verified in Resend)
// Optional:
//   ORDER_EMAIL_REPLY_TO  where replies go, e.g. the store's own inbox
//   HST_NUMBER            the store's HST registration number, printed on the
//                         receipt (business customers need it for receipts
//                         over $30)
//
// Never throws and never holds an order up: if the email can't be sent the
// order still goes through, and the reason is saved on the order
// (emailStatus / emailError) for staff to see in the Firestore console.
import { formatMoney, priceLineItem } from "../components/Pricing";
import { comboItemLabel } from "./comboCatalog";
import { STORE_ADDRESS, STORE_PHONE, TAX_RATE } from "./orderRules";
import { getNameAndSubtitle, orderRef, formatScheduleText, clockText, addressText } from "./orderText";

const RESEND_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 6000;

// Look: a clean, modern receipt (light grey page, white rounded cards, one
// big total, quiet grey labels). Email apps can't load the site's Red Stone
// Face font reliably (Gmail ignores web fonts), so it uses each device's own
// system font, the same approach big-company receipts use.
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const INK = "#1a1a1a"; // main text
const MUTED = "#6b6b6b"; // labels and details
const FAINT = "#8f8f8a"; // tax line, fine print
const LINE = "#e6e5df"; // dividers and card borders
const PAGE = "#f0efea"; // background behind the cards

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const br = (s) => esc(s).replace(/\n/g, "<br>");

export function emailConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM);
}

// Where the email's logo is loaded from: this website. Production uses the
// live domain; previews use their own address. EMAIL_ASSET_BASE_URL
// (e.g. https://redstonepizza.net) overrides both.
function assetBase() {
  const explicit = String(process.env.EMAIL_ASSET_BASE_URL || "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL;
  return host ? `https://${host}` : "https://redstonepizza.net";
}

const dateText = (d) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Toronto" });

// Everything the email says, worked out once for the HTML and plain text.
// order.card (optional, card orders): { brand: "visa", last4: "4242" }
function emailFacts(order, id) {
  const isDelivery = order.serviceMethod === "Delivery";
  const isLater = order.orderTiming === "later";
  const fees = order.fees || {};
  const when = isLater
    ? formatScheduleText(order.schedule?.date, order.schedule?.time)
    : clockText(order.pickupTime);
  const lines = (Array.isArray(order.items) ? order.items : []).map((it) => {
    const { name, subtitle } = getNameAndSubtitle(it);
    const details =
      it.type === "combo" && it.meta?.items
        ? Object.entries(it.meta.items)
            .map(([key, child]) => `${comboItemLabel(key)}: ${child?.summary || "Standard"}`)
            .join("\n")
        : subtitle;
    return {
      name,
      details: [details, it.note ? `Note: ${it.note}` : ""].filter(Boolean).join("\n"),
      qty: Number(it.qty) || 1,
      cents: Number.isFinite(it.lineCents) ? it.lineCents : priceLineItem(it),
    };
  });
  const paidOnline = order.paymentMethod === "card" && order.paid;
  const brand = String(order.card?.brand || "").toUpperCase();
  const last4 = String(order.card?.last4 || "");
  const today = dateText(new Date());
  return {
    ref: orderRef(id),
    isDelivery,
    service: isDelivery ? "Delivery" : "Carryout",
    whenLabel: isLater ? "Scheduled for" : isDelivery ? "Estimated delivery" : "Estimated ready time",
    when: when ? (isLater ? when : `Today at ${when}`) : "As soon as possible",
    placeLabel: isDelivery ? "Delivering to" : "Pick up at",
    place: isDelivery ? addressText(order.deliveryAddress) || "Not provided" : STORE_ADDRESS,
    orderNote: order.orderNote || "",
    payNote: paidOnline
      ? `Paid on ${today}${brand && last4 ? ` with ${brand} ending ${last4}` : " by card"}`
      : `Ordered on ${today}. ${
          !isDelivery
            ? "Pay at the store."
            : order.doorPayment?.method === "cash"
            ? `Pay the driver in cash${
                order.doorPayment.cashGivenCents > (order.totalCents || 0)
                  ? ` (paying with ${formatMoney(order.doorPayment.cashGivenCents)}, change ${formatMoney(order.doorPayment.cashGivenCents - order.totalCents)})`
                  : ""
              }.`
            : order.doorPayment?.method === "card"
            ? "Pay the driver by debit or credit."
            : "Pay at the door."
        }`,
    lines,
    subtotal: order.subtotalCents || 0,
    savings: order.discountCents || 0,
    delivery: isDelivery ? fees.deliveryCents || 0 : null,
    tax: fees.taxCents || 0,
    tip: fees.tipCents || 0,
    total: order.totalCents || 0,
    paidOnline,
    hst: String(process.env.HST_NUMBER || "").trim(),
  };
}

export function buildOrderEmail(order, id) {
  const f = emailFacts(order, id);
  const subject = `Your Red Stone Pizza order #${f.ref}`;
  const taxLabel = `HST (${Math.round(TAX_RATE * 100)}%)`;
  const finalLabel = f.paidOnline ? "Amount paid" : "Amount due";
  const logo = `${assetBase()}/images/email/logo.png`;

  const divider = `<tr><td colspan="2" style="padding:0;"><div style="height:1px;line-height:1px;font-size:1px;background:${LINE};">&nbsp;</div></td></tr>`;
  const money = (label, value, { color = INK, weight = 500, pad = "14px 0" } = {}) => `
          <tr>
            <td style="padding:${pad};font-family:${FONT};font-size:16px;line-height:1.4;color:${color};font-weight:${weight};">${esc(label)}</td>
            <td align="right" style="padding:${pad};font-family:${FONT};font-size:16px;line-height:1.4;color:${color};font-weight:${weight};white-space:nowrap;">${esc(value)}</td>
          </tr>`;
  const detail = (label, value) => `
          <tr>
            <td style="padding:6px 16px 6px 0;font-family:${FONT};font-size:15px;line-height:1.45;color:${MUTED};vertical-align:top;white-space:nowrap;">${esc(label)}</td>
            <td align="right" style="padding:6px 0;font-family:${FONT};font-size:15px;line-height:1.45;color:${INK};vertical-align:top;">${br(value)}</td>
          </tr>`;
  const items = f.lines
    .map(
      (l) => `
          <tr>
            <td style="padding:12px 16px 12px 0;vertical-align:top;">
              <div style="font-family:${FONT};font-size:16px;line-height:1.4;color:${INK};font-weight:500;">${esc(l.name)}</div>
              ${l.details ? `<div style="font-family:${FONT};font-size:14px;line-height:1.5;color:${MUTED};padding-top:3px;">${br(l.details)}</div>` : ""}
              <div style="font-family:${FONT};font-size:14px;line-height:1.5;color:${FAINT};padding-top:3px;">Qty ${l.qty}</div>
            </td>
            <td align="right" style="padding:12px 0;vertical-align:top;font-family:${FONT};font-size:16px;line-height:1.4;color:${INK};font-weight:500;white-space:nowrap;">${formatMoney(l.cents)}</td>
          </tr>`
    )
    .join("");
  const card = (inner, pad = "32px") =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${LINE};border-radius:14px;border-collapse:separate;"><tr><td style="padding:${pad};">${inner}</td></tr></table>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(subject)}</title>
<style>
  @media (max-width: 520px) {
    .rs-pad { padding: 24px 20px !important; }
    .rs-total { font-size: 38px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAGE};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Order #${esc(f.ref)}. ${esc(f.whenLabel)}: ${esc(f.when)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};">
  <tr>
    <td align="center" style="padding:28px 12px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 4px 24px;">
            <img src="${esc(logo)}" width="120" height="57" alt="Red Stone Pizza" style="display:block;border:0;width:120px;height:auto;">
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:16px;">
            ${card(`
              <div style="font-family:${FONT};font-size:17px;line-height:1.4;color:${MUTED};">Receipt from Red Stone Pizza</div>
              <div class="rs-total" style="font-family:${FONT};font-size:46px;line-height:1.15;color:${INK};font-weight:600;letter-spacing:-0.5px;padding:6px 0 8px;">${formatMoney(f.total)}</div>
              <div style="font-family:${FONT};font-size:16px;line-height:1.45;color:${MUTED};">${esc(f.payNote)}</div>
            `)}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:16px;">
            ${card(`
              <div style="font-family:${FONT};font-size:20px;line-height:1.3;color:${INK};font-weight:500;padding-bottom:14px;">Order #${esc(f.ref)}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${detail("Service", f.service)}
                ${detail(f.whenLabel, f.when)}
                ${detail(f.placeLabel, f.place)}
                ${f.orderNote ? detail("Your note", f.orderNote) : ""}
              </table>
              <div style="height:1px;line-height:1px;font-size:1px;background:${LINE};margin:16px 0 4px;">&nbsp;</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${items}
                ${divider}
                ${money("Subtotal", formatMoney(f.subtotal))}
                ${f.savings > 0 ? money("Coupon savings (included)", formatMoney(f.savings), { color: MUTED, weight: 400, pad: "0 0 14px" }) : ""}
                ${divider}
                ${f.delivery != null ? money("Delivery", formatMoney(f.delivery), { pad: "14px 0 0" }) : ""}
                ${money(taxLabel, formatMoney(f.tax), { color: FAINT, weight: 400 })}
                ${f.tip > 0 ? money("Driver tip", formatMoney(f.tip), { pad: "0 0 14px" }) : ""}
                ${divider}
                ${money("Total", formatMoney(f.total))}
                ${divider}
                ${money(finalLabel, formatMoney(f.total), { weight: 600, pad: "14px 0 0" })}
              </table>
            `, "32px 32px 24px")}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 4px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${FAINT};">
            Questions about your order? Call <a href="tel:+1${STORE_PHONE.replace(/\D/g, "")}" style="color:${MUTED};text-decoration:underline;white-space:nowrap;">${esc(STORE_PHONE)}</a> and mention order #${esc(f.ref)}.<br>
            Red Stone Pizza, ${esc(STORE_ADDRESS)}${f.hst ? `<br>HST Registration No. ${esc(f.hst)}` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    "Receipt from Red Stone Pizza",
    formatMoney(f.total),
    f.payNote,
    "",
    `Order #${f.ref}`,
    `Service: ${f.service}`,
    `${f.whenLabel}: ${f.when}`,
    `${f.placeLabel}: ${f.place}`,
    ...(f.orderNote ? [`Your note: ${f.orderNote}`] : []),
    "",
    ...f.lines.map(
      (l) => `${l.name}, Qty ${l.qty}: ${formatMoney(l.cents)}${l.details ? `\n  ${l.details.replace(/\n/g, "\n  ")}` : ""}`
    ),
    "",
    `Subtotal: ${formatMoney(f.subtotal)}`,
    ...(f.savings > 0 ? [`Coupon savings (included): ${formatMoney(f.savings)}`] : []),
    ...(f.delivery != null ? [`Delivery: ${formatMoney(f.delivery)}`] : []),
    `${taxLabel}: ${formatMoney(f.tax)}`,
    ...(f.tip > 0 ? [`Driver tip: ${formatMoney(f.tip)}`] : []),
    `Total: ${formatMoney(f.total)}`,
    `${finalLabel}: ${formatMoney(f.total)}`,
    "",
    `Questions about your order? Call ${STORE_PHONE} and mention order #${f.ref}.`,
    `Red Stone Pizza, ${STORE_ADDRESS}`,
    ...(f.hst ? [`HST Registration No. ${f.hst}`] : []),
  ].join("\n");

  return { subject, html, text };
}

// Sends any email through Resend. Resolves { status: "sent" | "off" | "failed", error? }.
// idempotencyKey makes Resend ignore a repeat of the same email.
export async function sendEmail({ to, subject, html, text, idempotencyKey, replyTo }) {
  try {
    if (!emailConfigured()) return { status: "off" };
    const list = (Array.isArray(to) ? to : String(to || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
    if (!list.length) return { status: "no_email" };
    const body = { from: process.env.ORDER_EMAIL_FROM, to: list, subject, html, text };
    const reply = replyTo || process.env.ORDER_EMAIL_REPLY_TO;
    if (reply) body.reply_to = reply;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);
    try {
      const headers = {
        Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        "Content-Type": "application/json",
      };
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
      const res = await fetch(RESEND_URL, { method: "POST", headers, body: JSON.stringify(body), signal: ctrl.signal });
      if (res.ok) return { status: "sent" };
      const detail = await res.text().catch(() => "");
      console.warn("orderEmail: Resend refused the email", res.status, detail.slice(0, 300));
      return { status: "failed", error: `resend_${res.status}: ${detail.slice(0, 200)}` };
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    console.warn("orderEmail: sending failed", e);
    return { status: "failed", error: String(e?.message || e).slice(0, 200) };
  }
}

// The confirmation email for one order. Resolves { status: "sent" | "off" | "no_email" | "failed", error? }.
export async function sendOrderEmail(order, id) {
  const to = String(order?.contact?.email || "").trim();
  if (!emailConfigured()) return { status: "off" };
  if (!to) return { status: "no_email" };
  const { subject, html, text } = buildOrderEmail(order, id);
  return sendEmail({ to, subject, html, text, idempotencyKey: `order-${id}` });
}

// Sends the email and notes the outcome on the order document.
export async function emailOrderAndRecord(orderRefDoc, order, id, FieldValue) {
  const result = await sendOrderEmail(order, id);
  try {
    const patch = { emailStatus: result.status };
    if (result.status === "sent") patch.emailSentAt = FieldValue.serverTimestamp();
    if (result.error) patch.emailError = result.error;
    await orderRefDoc.update(patch);
  } catch (e) {
    console.warn("orderEmail: couldn't note the email status on the order", e);
  }
  return result;
}
