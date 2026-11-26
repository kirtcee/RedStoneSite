// pages/api/cron/missedOrders.js
//
// Missed-order alert. Vercel runs this every minute (vercel.json "crons",
// production only). It looks for open orders the kitchen hasn't accepted:
//   ASAP orders placed more than ALERT_AFTER_MIN minutes ago
//   scheduled orders due within SCHEDULED_WINDOW_MIN minutes
// and emails the owner (ALERT_EMAILS) once per order, so a tablet that's off,
// asleep or offline doesn't mean a customer waiting for food that was never
// made.
//
// Needs in Vercel (Production):
//   CRON_SECRET    any long random text; Vercel sends it with each run so
//                  nobody else can trigger this
//   ALERT_EMAILS   who gets the alert, e.g. "owner@gmail.com, manager@gmail.com"
//   plus the email settings from utils/orderEmail.js (RESEND_API_KEY, ORDER_EMAIL_FROM)
import { adminDb, adminSetupProblem } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendEmail } from "../../../utils/orderEmail";
import { formatMoney } from "../../../components/Pricing";
import { orderRef, clockText, formatScheduleText } from "../../../utils/orderText";

const ALERT_AFTER_MIN = 4;
const SCHEDULED_WINDOW_MIN = 45;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Orders that need an alert now (pure, so it can be tested on its own)
export function ordersToAlert(orders, now = Date.now()) {
  return orders.filter((o) => {
    if (o.completed || o.cancelled || o.acceptedAt || o.missedAlertAt) return false;
    const created = o.createdAt?.toMillis ? o.createdAt.toMillis() : null;
    if (!created || now - created < ALERT_AFTER_MIN * 60000) return false;
    if (o.orderTiming !== "later") return true;
    const due = o.pickupTime?.toMillis ? o.pickupTime.toMillis() : null;
    return due != null && due - now <= SCHEDULED_WINDOW_MIN * 60000;
  });
}

function alertEmail(list, now) {
  const lines = list.map((o) => {
    const mins = Math.round((now - o.createdAt.toMillis()) / 60000);
    const when =
      o.orderTiming === "later"
        ? `scheduled for ${formatScheduleText(o.schedule?.date, o.schedule?.time) || "later"}`
        : `placed ${mins} min ago${o.pickupTime ? `, promised for ${clockText(o.pickupTime)}` : ""}`;
    return {
      head: `Order #${orderRef(o.id)}: ${o.serviceMethod || "Order"}, ${formatMoney(o.totalCents || 0)}`,
      sub: `${o.contact?.name || "No name"}, ${o.contact?.phone || "no phone"}, ${when}`,
    };
  });
  const n = list.length;
  const subject =
    n === 1 ? `Order #${orderRef(list[0].id)} hasn't been accepted` : `${n} orders haven't been accepted`;
  const tip =
    "Check the kitchen tablet: is it on, awake, online and logged in? Accept the order there, or call the customer.";
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a;">
  <p style="font-size:20px;font-weight:600;margin:0 0 12px;">${esc(subject)}</p>
  ${lines
    .map(
      (l) =>
        `<p style="margin:0 0 10px;"><strong>${esc(l.head)}</strong><br><span style="color:#555;">${esc(l.sub)}</span></p>`
    )
    .join("")}
  <p style="margin:14px 0 0;color:#555;">${esc(tip)}</p>
</div>`;
  const text = [subject, "", ...lines.map((l) => `${l.head}\n${l.sub}`), "", tip].join("\n");
  return { subject, html, text };
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, reason: "unauthorized" });
  }
  const setup = adminSetupProblem();
  if (setup) return res.status(500).json({ ok: false, reason: setup });
  const to = String(process.env.ALERT_EMAILS || "").trim();
  if (!to) return res.status(200).json({ ok: true, skipped: "no ALERT_EMAILS set" });

  try {
    const now = Date.now();
    const snap = await adminDb.collection("orders").where("completed", "==", false).get();
    const open = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const late = ordersToAlert(open, now);
    if (!late.length) return res.status(200).json({ ok: true, alerted: 0 });

    const { subject, html, text } = alertEmail(late, now);
    const sent = await sendEmail({
      to,
      subject,
      html,
      text,
      idempotencyKey: `missed-${late.map((o) => o.id).sort().join("-")}`.slice(0, 250),
    });
    if (sent.status === "sent") {
      const batch = adminDb.batch();
      late.forEach((o) => batch.update(adminDb.collection("orders").doc(o.id), { missedAlertAt: FieldValue.serverTimestamp() }));
      await batch.commit();
    } else {
      console.error("missedOrders: alert email not sent", sent);
    }
    return res.status(200).json({ ok: true, alerted: late.length, email: sent.status });
  } catch (e) {
    console.error("missedOrders: check failed", e);
    return res.status(500).json({ ok: false, reason: String(e?.message || e).slice(0, 140) });
  }
}
