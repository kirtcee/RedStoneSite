// utils/orderText.js
//
// Customer-facing wording for a placed order, shared by the order
// confirmation page and the confirmation email (utils/orderEmail.js), so
// both describe items, times and addresses the same way. Safe to use in the
// browser and on the server.
import { describePizzaFull, describeByoPizzaTitle } from "../components/Pricing";
import { comboNameFor } from "./comboCatalog";
import { formatClock, STORE_TZ } from "./storeHours";

// Short order number customers see ("Order #K3F9QA"): the first 6
// characters of the order's id. Staff can type it into Past Orders search.
export function orderRef(id) {
  return String(id || "").slice(0, 6).toUpperCase();
}

// "Sat, Dec 5 at 11:00 AM" from a Toronto date ("2026-12-05") and time ("11:00")
export function formatScheduleText(date, time) {
  if (!date || !time) return null;
  const [y, m, dd] = String(date).split("-").map(Number);
  const [hh, mm] = String(time).split(":").map(Number);
  if (!y || Number.isNaN(hh)) return null;
  const day = new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${day} at ${formatClock(hh * 60 + mm)}`;
}

// "6:45 PM" (Toronto time) from a Date or Firestore Timestamp
export function clockText(t) {
  const d = t?.toDate ? t.toDate() : t instanceof Date ? t : null;
  if (!d || isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: STORE_TZ });
}

// "123 Main St, Unit 4, Hamilton, L8N 1G3"
export function addressText(addr) {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  return [addr.street, addr.suite ? `Unit ${addr.suite}` : "", addr.city, addr.postal].filter(Boolean).join(", ");
}

// { name, subtitle } for one order line
export function getNameAndSubtitle(item) {
  if (item.type === "pizza-byo") {
    const name = item.pizzaName || describeByoPizzaTitle(item);
    return { name, subtitle: describePizzaFull(item) };
  }
  if (item.type === "pizza-specialty") {
    const sizeLabel =
      ({ "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" }[String(item.size)] ||
        `${item.size}"`);
    const name = item.name || "Specialty Pizza";
    const subtitle = `${sizeLabel}${item.crust ? `, ${item.crust}` : ""}`;
    return { name, subtitle };
  }
  if (item.type === "wings") {
    const dipBits = Object.entries(item.dips || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([k, v]) => `${k} × ${v}`);
    const subtitle = [
      [item.sauce, item.serveStyle].filter(Boolean).join(", "),
      dipBits.length ? `Dips: ${dipBits.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return { name: `${item.count} Wings`, subtitle };
  }
  if (item.type === "side") {
    // .name doubles as the priceSide() lookup key ("Onion Rings (Medium)",
    // an internal pricing label) — build the customer-facing name from the
    // raw .side/.size fields instead (see pages/cart.js's itemTitle).
    const name = item.side ? `${item.side}${item.size ? ` (${item.size})` : ""}` : item.name || "Side";
    return { name, subtitle: item.summary || "" };
  }
  if (item.type === "special") return { name: item.name || "Special", subtitle: item.summary || "" };
  if (item.type === "combo") return { name: comboNameFor(item.comboId), subtitle: "" };
  return { name: item.summary || "Item", subtitle: "" };
}
