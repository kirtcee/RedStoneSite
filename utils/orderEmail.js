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

// Email clients ignore most CSS and web fonts, so everything is inline and
// the fonts are ones every phone and computer already has.
const HEAD_FONT = "'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const BODY_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const RED = "#8b1a1a";
const BROWN = "#7a5a3a";
const CREAM = "#faf2e9";
const BORDER = "#e3cdb5";

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

// Everything the email says, worked out once for the HTML and plain text.
function emailFacts(order, id) {
  const isDelivery = order.serviceMethod === "Delivery";
  const isLater = order.orderTiming === "later";
  const first = order.contact?.firstName || String(order.contact?.name || "").split(" ")[0] || "";
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
      details: details || "",
      qty: Number(it.qty) || 1,
      cents: Number.isFinite(it.lineCents) ? it.lineCents : priceLineItem(it),
    };
  });
  const paidOnline = order.paymentMethod === "card" && order.paid;
  return {
    ref: orderRef(id),
    first,
    isDelivery,
    isLater,
    whenLabel: isLater ? "Scheduled For" : isDelivery ? "Estimated Delivery" : "Estimated Ready Time",
    when: when ? (isLater ? when : `Today at ${when}`) : "We'll have it ready as soon as possible",
    placeLabel: isDelivery ? "Delivering To" : "Pick Up At",
    place: isDelivery ? addressText(order.deliveryAddress) || "Not provided" : STORE_ADDRESS,
    payment: paidOnline ? "Paid online by card" : isDelivery ? "Pay at the door" : "Pay at the store",
    lines,
    subtotal: order.subtotalCents || 0,
    savings: order.discountCents || 0,
    delivery: isDelivery ? fees.deliveryCents || 0 : null,
    tax: fees.taxCents || 0,
    total: order.totalCents || 0,
    paidOnline,
    hst: String(process.env.HST_NUMBER || "").trim(),
  };
}

export function buildOrderEmail(order, id) {
  const f = emailFacts(order, id);
  const subject = `Your Red Stone Pizza order #${f.ref} is confirmed`;
  const taxLabel = `HST (${Math.round(TAX_RATE * 100)}%)`;
  const totalLabel = f.paidOnline ? "Total Paid" : "Total Due";

  const row = (label, value, strong = false) => `
      <tr>
        <td style="padding:4px 0;font:16px/1.4 ${BODY_FONT};color:${BROWN};">${esc(label)}</td>
        <td align="right" style="padding:4px 0;font:${strong ? "bold 20px" : "bold 16px"}/1.4 ${BODY_FONT};color:#000;">${esc(value)}</td>
      </tr>`;
  const fact = (label, value) => `
      <tr>
        <td style="padding:6px 0 0;font:bold 13px/1.3 ${BODY_FONT};color:${BROWN};text-transform:uppercase;letter-spacing:.5px;">${esc(label)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 8px;font:bold 18px/1.35 ${BODY_FONT};color:#000;">${br(value)}</td>
      </tr>`;
  const heading = (text) => `
      <tr>
        <td style="background:#000;padding:10px 16px;font:900 16px/1.2 ${HEAD_FONT};color:#fff;text-transform:uppercase;letter-spacing:.5px;">${esc(text)}</td>
      </tr>`;

  const itemRows = f.lines
    .map(
      (l) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
              <div style="font:bold 17px/1.35 ${BODY_FONT};color:#000;">${esc(l.name)}${l.qty > 1 ? ` <span style="font-weight:normal;color:${BROWN};">x ${l.qty}</span>` : ""}</div>
              ${l.details ? `<div style="font:15px/1.45 ${BODY_FONT};color:${BROWN};padding-top:2px;">${br(l.details)}</div>` : ""}
            </td>
            <td align="right" style="padding:10px 0 10px 12px;border-bottom:1px solid ${BORDER};vertical-align:top;white-space:nowrap;font:bold 17px/1.35 ${BODY_FONT};color:#000;">${formatMoney(l.cents)}</td>
          </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3ece4;">
<div style="display:none;max-height:0;overflow:hidden;">Order #${esc(f.ref)}. ${esc(f.whenLabel)}: ${esc(f.when)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ece4;">
  <tr>
    <td align="center" style="padding:20px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${BORDER};">
        <tr>
          <td align="center" style="background:#000;padding:22px 16px;font:900 28px/1 ${HEAD_FONT};color:#fff;text-transform:uppercase;letter-spacing:1px;">Red Stone Pizza</td>
        </tr>
        <tr>
          <td style="padding:24px 20px 8px;">
            <div style="font:900 26px/1.15 ${HEAD_FONT};color:#000;text-transform:uppercase;">Order Confirmed</div>
            <div style="font:17px/1.5 ${BODY_FONT};color:${BROWN};padding-top:8px;">Thanks${f.first ? `, ${esc(f.first)}` : ""}! We've got your order. This email is your receipt.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid ${BORDER};">
              <tr><td style="padding:12px 16px 4px;font:900 22px/1.2 ${HEAD_FONT};color:${RED};text-transform:uppercase;">Order #${esc(f.ref)}</td></tr>
              <tr><td style="padding:0 16px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${fact(f.isDelivery ? "Delivery" : "Carryout", f.whenLabel + ": " + f.when)}
                  ${fact(f.placeLabel, f.place)}
                  ${fact("Payment", f.payment)}
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};">
              ${heading("Your Order")}
              <tr><td style="padding:4px 16px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemRows}
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                  ${row("Food & Beverage", formatMoney(f.subtotal))}
                  ${f.savings > 0 ? row("Coupon Savings (included)", formatMoney(f.savings)) : ""}
                  ${f.delivery != null ? row("Delivery", formatMoney(f.delivery)) : ""}
                  ${row(taxLabel, formatMoney(f.tax))}
                  <tr><td colspan="2" style="border-top:2px solid #000;font-size:0;line-height:0;padding-top:6px;">&nbsp;</td></tr>
                  ${row(totalLabel, formatMoney(f.total), true)}
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px 24px;font:15px/1.55 ${BODY_FONT};color:${BROWN};">
            Questions or changes? Call us at <a href="tel:+1${STORE_PHONE.replace(/\D/g, "")}" style="color:${RED};font-weight:bold;white-space:nowrap;">${esc(STORE_PHONE)}</a> and mention order #${esc(f.ref)}.<br>
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
    "RED STONE PIZZA",
    "",
    `Order Confirmed: #${f.ref}`,
    `Thanks${f.first ? `, ${f.first}` : ""}! We've got your order. This email is your receipt.`,
    "",
    `${f.whenLabel}: ${f.when}`,
    `${f.placeLabel}: ${f.place}`,
    `Payment: ${f.payment}`,
    "",
    "YOUR ORDER",
    ...f.lines.map(
      (l) => `${l.name}${l.qty > 1 ? ` x ${l.qty}` : ""}: ${formatMoney(l.cents)}${l.details ? `\n  ${l.details.replace(/\n/g, "\n  ")}` : ""}`
    ),
    "",
    `Food & Beverage: ${formatMoney(f.subtotal)}`,
    ...(f.savings > 0 ? [`Coupon Savings (included): ${formatMoney(f.savings)}`] : []),
    ...(f.delivery != null ? [`Delivery: ${formatMoney(f.delivery)}`] : []),
    `${taxLabel}: ${formatMoney(f.tax)}`,
    `${totalLabel}: ${formatMoney(f.total)}`,
    "",
    `Questions or changes? Call us at ${STORE_PHONE} and mention order #${f.ref}.`,
    `Red Stone Pizza, ${STORE_ADDRESS}`,
    ...(f.hst ? [`HST Registration No. ${f.hst}`] : []),
  ].join("\n");

  return { subject, html, text };
}

// Sends the email. Resolves { status: "sent" | "off" | "no_email" | "failed", error? }.
// The Idempotency-Key makes Resend ignore a repeat for the same order.
export async function sendOrderEmail(order, id) {
  try {
    if (!emailConfigured()) return { status: "off" };
    const to = String(order?.contact?.email || "").trim();
    if (!to) return { status: "no_email" };
    const { subject, html, text } = buildOrderEmail(order, id);
    const body = { from: process.env.ORDER_EMAIL_FROM, to: [to], subject, html, text };
    if (process.env.ORDER_EMAIL_REPLY_TO) body.reply_to = process.env.ORDER_EMAIL_REPLY_TO;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `order-${id}`,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
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
