// pages/stats.js
//
// Staff-only sales dashboard, built from the orders already saved in
// Firestore (no outside service). Same login as the kitchen screen.
// All times are Toronto time (utils/storeHours.js).
//
// Shows, for the chosen period: sales, orders, average order, sales by day,
// by hour and by weekday, the order mix (carryout/delivery, payment, timing),
// top items, combos and deals, delivery fees, and returning customers
// (matched by phone number within the period).
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { db, auth } from "../utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query, where, Timestamp } from "firebase/firestore";
import { STAFF_EMAIL } from "../utils/kitchenAuth";
import { comboNameFor } from "../utils/comboCatalog";
import { torontoParts, torontoToDate, addDays, formatClock } from "../utils/storeHours";

const RANGES = [
  { key: "today", label: "Today", days: 0 },
  { key: "7", label: "Last 7 Days", days: 6 },
  { key: "30", label: "Last 30 Days", days: 29 },
  { key: "90", label: "Last 90 Days", days: 89 },
  { key: "365", label: "Last 12 Months", days: 364 },
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SIZE = { "10": "Small", "12": "Medium", "14": "Large", "16": "X-Large" };

const money = (c) => `$${((c || 0) / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const moneyShort = (c) => `$${Math.round((c || 0) / 100).toLocaleString("en-CA")}`;
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "0%");
const digits = (s) => String(s || "").replace(/\D/g, "");
const phoneText = (s) => {
  const d = digits(s);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s || "N/A";
};

// One name per thing sold, so the same item adds up across orders.
function itemNames(item) {
  const t = item?.type;
  if (t === "pizza-byo") return [`Build Your Own (${SIZE[String(item.size)] || item.size})`];
  if (t === "pizza-specialty") return [`${item.pizzaName || item.name || "Specialty Pizza"} (${SIZE[String(item.size)] || item.size || ""})`.replace(" ()", "")];
  if (t === "wings") return [`${item.count} Wings`];
  if (t === "side") return [item.name || item.side || "Side"];
  if (t === "special") return [item.name || "Special"];
  if (t === "combo") return [comboNameFor(item.comboId)];
  if (t === "drinks-dips") return (item.items || []).map((d) => `${d.label} (${item.categoryLabel || "Drink"})`);
  return [item?.summary || "Other"];
}

// ---------- a simple single-series bar chart with hover tooltips ----------
function BarChart({ title, rows, valueLabel = (v) => v, height = 180, note }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const n = rows.length || 1;
  const W = 100; // viewBox width in %
  const gap = n > 40 ? 0.15 : 0.6;
  const bw = W / n - gap;
  const showEvery = Math.ceil(n / 12);
  return (
    <section className="st-card">
      <div className="st-card__head">
        <h2>{title}</h2>
        {note && <span className="st-note">{note}</span>}
      </div>
      <div className="st-chart" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={height - f * (height - 8)} y2={height - f * (height - 8)} className="st-grid" />
          ))}
          {rows.map((r, i) => {
            const h = (r.value / max) * (height - 8);
            const x = i * (W / n) + gap / 2;
            return (
              <g key={r.key} onMouseEnter={() => setHover(i)}>
                {/* wide invisible hit area */}
                <rect x={i * (W / n)} y="0" width={W / n} height={height} fill="transparent" />
                <rect
                  x={x}
                  y={height - Math.max(h, r.value ? 1 : 0)}
                  width={Math.max(bw, 0.3)}
                  height={Math.max(h, r.value ? 1 : 0)}
                  rx="0.6"
                  className={`st-bar${hover === i ? " is-on" : ""}`}
                />
              </g>
            );
          })}
        </svg>
        <div className="st-axis">
          {rows.map((r, i) => (
            <span key={r.key} style={{ width: `${100 / n}%` }}>
              {i % showEvery === 0 ? r.short || r.label : ""}
            </span>
          ))}
        </div>
        {hover != null && rows[hover] && (
          <div className="st-tip" style={{ left: `${((hover + 0.5) / n) * 100}%` }}>
            <strong>{rows[hover].label}</strong>
            <span>{valueLabel(rows[hover].value)}</span>
            {rows[hover].extra && <span>{rows[hover].extra}</span>}
          </div>
        )}
      </div>
      <details className="st-table">
        <summary>Show as table</summary>
        <table>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>{valueLabel(r.value)}</td>
                {r.extra && <td>{r.extra}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

// a ranked list with a thin bar showing each row's share
function RankList({ title, rows, valueLabel, sub, empty = "Nothing yet." }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="st-card">
      <div className="st-card__head">
        <h2>{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="st-empty">{empty}</p>
      ) : (
        <ol className="st-rank">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="st-rank__row">
                <span className="st-rank__name">{r.label}</span>
                <span className="st-rank__val">{valueLabel(r.value)}</span>
              </div>
              {sub && <div className="st-rank__sub">{sub(r)}</div>}
              <div className="st-rank__bar">
                <span style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// share split like "Carryout 64% / Delivery 36%"
function Split({ title, parts, total }) {
  return (
    <section className="st-card">
      <div className="st-card__head">
        <h2>{title}</h2>
      </div>
      {parts.map((p) => (
        <div key={p.label} className="st-split">
          <div className="st-rank__row">
            <span className="st-rank__name">{p.label}</span>
            <span className="st-rank__val">
              {pct(p.count, total)} <small>({p.count} orders, {moneyShort(p.cents)})</small>
            </span>
          </div>
          <div className="st-rank__bar">
            <span style={{ width: pct(p.count, total) }} />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const [isStaff, setIsStaff] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [rangeKey, setRangeKey] = useState("30");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        const staff = !!user && user.email === STAFF_EMAIL;
        setIsStaff(staff);
        setAuthChecked(true);
        if (!staff) router.replace("/kitchen-login");
      }),
    [router]
  );

  const range = RANGES.find((r) => r.key === rangeKey) || RANGES[2];
  const today = torontoParts().date;
  const firstDay = addDays(today, -range.days);

  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const start = Timestamp.fromDate(torontoToDate(firstDay, "00:00"));
    getDocs(query(collection(db, "orders"), where("createdAt", ">=", start), orderBy("createdAt", "asc")))
      .then((snap) => {
        if (!cancelled) setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch((err) => {
        console.warn("stats load failed", err?.code);
        if (!cancelled) setError("Couldn't load orders. Check the connection and reload.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isStaff, firstDay]);

  const s = useMemo(() => {
    const list = orders.filter((o) => o.createdAt?.toDate);
    const total = list.reduce((n, o) => n + (o.totalCents || 0), 0);
    const food = list.reduce((n, o) => n + (o.subtotalCents || 0), 0);
    const discount = list.reduce((n, o) => n + (o.discountCents || 0), 0);
    const tax = list.reduce((n, o) => n + (o.fees?.taxCents || 0), 0);

    // by day
    const days = [];
    for (let d = firstDay; d <= today; d = addDays(d, 1)) days.push(d);
    const byDay = Object.fromEntries(days.map((d) => [d, { cents: 0, count: 0 }]));
    const byHour = Array.from({ length: 24 }, () => ({ cents: 0, count: 0 }));
    const byWeekday = Array.from({ length: 7 }, () => ({ cents: 0, count: 0 }));
    const items = {};
    const combos = {};
    const deals = {};
    const phones = {};
    const split = (keyFn) => {
      const out = {};
      for (const o of list) {
        const k = keyFn(o);
        out[k] = out[k] || { label: k, count: 0, cents: 0 };
        out[k].count += 1;
        out[k].cents += o.totalCents || 0;
      }
      return Object.values(out).sort((a, b) => b.count - a.count);
    };
    let delFees = 0;
    let delCount = 0;
    let delMinutes = 0;
    let delMinutesN = 0;

    for (const o of list) {
      const p = torontoParts(o.createdAt.toDate().getTime());
      if (byDay[p.date]) {
        byDay[p.date].cents += o.totalCents || 0;
        byDay[p.date].count += 1;
      }
      byHour[Math.floor(p.minutes / 60)].cents += o.totalCents || 0;
      byHour[Math.floor(p.minutes / 60)].count += 1;
      byWeekday[p.weekday].cents += o.totalCents || 0;
      byWeekday[p.weekday].count += 1;

      for (const it of o.items || []) {
        const qty = Number(it.qty) || 1;
        const names = itemNames(it);
        names.forEach((name) => {
          const unitQty = it.type === "drinks-dips" ? Number((it.items || []).find((d) => name.startsWith(d.label))?.qty) || 1 : 1;
          items[name] = items[name] || { label: name, qty: 0, cents: 0 };
          items[name].qty += qty * unitQty;
          items[name].cents += Math.round((it.lineCents || 0) / names.length);
        });
        if (it.type === "combo") {
          const k = comboNameFor(it.comboId);
          combos[k] = combos[k] || { label: k, qty: 0, cents: 0 };
          combos[k].qty += qty;
          combos[k].cents += it.lineCents || 0;
        }
      }
      for (const d of o.appliedDeals || []) {
        if (!d.active) continue;
        const k = d.name || d.dealId;
        deals[k] = deals[k] || { label: k, count: 0, saved: 0 };
        deals[k].count += 1;
        deals[k].saved += d.savingsCents || 0;
      }
      const ph = digits(o.contact?.phone);
      if (ph) {
        phones[ph] = phones[ph] || { name: o.contact?.name || ph, phone: o.contact?.phone, count: 0, cents: 0 };
        phones[ph].count += 1;
        phones[ph].cents += o.totalCents || 0;
      }
      if (o.serviceMethod === "Delivery") {
        delCount += 1;
        delFees += o.fees?.deliveryCents || 0;
        if (o.delivery?.minutes != null) {
          delMinutes += Number(o.delivery.minutes) || 0;
          delMinutesN += 1;
        }
      }
    }
    const customers = Object.values(phones);
    const repeat = customers.filter((c) => c.count > 1);

    return {
      count: list.length,
      total,
      food,
      discount,
      tax,
      avg: list.length ? Math.round(total / list.length) : 0,
      dayRows: days.map((d) => {
        const [, m, dd] = d.split("-");
        return {
          key: d,
          label: new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
          short: `${Number(m)}/${Number(dd)}`,
          value: byDay[d].cents,
          extra: `${byDay[d].count} order${byDay[d].count === 1 ? "" : "s"}`,
        };
      }),
      hourRows: byHour
        .map((h, i) => ({ key: String(i), label: `${formatClock(i * 60)} to ${formatClock(((i + 1) % 24) * 60)}`, short: formatClock(i * 60).replace(":00 ", ""), value: h.count, extra: moneyShort(h.cents) }))
        .filter((r, i) => i >= 10 && i <= 22),
      weekdayRows: [1, 2, 3, 4, 5, 6, 0].map((i) => ({ key: String(i), label: WEEKDAYS[i], value: byWeekday[i].cents, extra: `${byWeekday[i].count} orders` })),
      service: split((o) => o.serviceMethod || "N/A"),
      payment: split((o) => (o.paymentMethod === "card" ? "Paid online" : o.serviceMethod === "Delivery" ? "Pay at door" : "Pay at store")),
      timing: split((o) => (o.orderTiming === "later" ? "Scheduled" : "ASAP")),
      topItems: Object.values(items)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 12)
        .map((r) => ({ key: r.label, label: r.label, value: r.qty, cents: r.cents })),
      topCombos: Object.values(combos)
        .sort((a, b) => b.qty - a.qty)
        .map((r) => ({ key: r.label, label: r.label, value: r.qty, cents: r.cents })),
      topDeals: Object.values(deals)
        .sort((a, b) => b.count - a.count)
        .map((r) => ({ key: r.label, label: r.label, value: r.count, saved: r.saved })),
      customers: customers.length,
      repeat: repeat.length,
      topCustomers: customers
        .sort((a, b) => b.count - a.count || b.cents - a.cents)
        .slice(0, 8)
        .map((c) => ({ key: c.phone, label: `${c.name}`, value: c.count, cents: c.cents, phone: c.phone })),
      delCount,
      delFees,
      delAvgFee: delCount ? Math.round(delFees / delCount) : 0,
      delAvgMin: delMinutesN ? Math.round(delMinutes / delMinutesN) : null,
    };
  }, [orders, firstDay, today]);

  if (!authChecked || !isStaff) {
    return <p style={{ padding: 24, fontFamily: "var(--font-plain)" }}>Checking staff login...</p>;
  }

  return (
    <main className="st">
      <Head>
        <title>Red Stone Pizza | Sales Stats</title>
      </Head>
      <div className="st-top">
        <h1>Sales Stats</h1>
        <div className="st-ranges" role="radiogroup" aria-label="Time period">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={r.key === rangeKey}
              className={r.key === rangeKey ? "is-on" : ""}
              onClick={() => setRangeKey(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="st-sub">
        {loading ? "Loading..." : error || `Online orders from ${firstDay} to ${today} (Toronto time). Includes open and completed orders.`}
      </p>

      <div className="st-tiles">
        <div className="st-tile">
          <span>Sales</span>
          <strong>{money(s.total)}</strong>
          <small>incl. tax and delivery</small>
        </div>
        <div className="st-tile">
          <span>Orders</span>
          <strong>{s.count}</strong>
          <small>{s.customers} customers</small>
        </div>
        <div className="st-tile">
          <span>Average Order</span>
          <strong>{money(s.avg)}</strong>
          <small>per order, all in</small>
        </div>
        <div className="st-tile">
          <span>Returning</span>
          <strong>{pct(s.repeat, s.customers)}</strong>
          <small>{s.repeat} customers ordered 2+ times</small>
        </div>
      </div>

      <div className="st-grid2">
        <BarChart title="Sales by Day" rows={s.dayRows} valueLabel={money} note="hover a bar for details" />
        <BarChart title="Orders by Hour" rows={s.hourRows} valueLabel={(v) => `${v} order${v === 1 ? "" : "s"}`} note="busiest times" />
      </div>

      <div className="st-grid3">
        <Split title="Carryout vs Delivery" parts={s.service} total={s.count} />
        <Split title="How They Paid" parts={s.payment} total={s.count} />
        <Split title="ASAP vs Scheduled" parts={s.timing} total={s.count} />
      </div>

      <div className="st-grid2">
        <RankList
          title="Top Items"
          rows={s.topItems}
          valueLabel={(v) => `${v} sold`}
          sub={(r) => `${money(r.cents)} in sales`}
        />
        <div>
          <RankList
            title="Combos"
            rows={s.topCombos}
            valueLabel={(v) => `${v} sold`}
            sub={(r) => `${money(r.cents)} in sales`}
            empty="No combos in this period."
          />
          <RankList
            title="Coupons Used"
            rows={s.topDeals}
            valueLabel={(v) => `${v} time${v === 1 ? "" : "s"}`}
            sub={(r) => `${money(r.saved)} saved by customers`}
            empty="No coupons in this period."
          />
        </div>
      </div>

      <div className="st-grid2">
        <BarChart title="Sales by Weekday" rows={s.weekdayRows} valueLabel={money} height={140} />
        <section className="st-card">
          <div className="st-card__head">
            <h2>Money Breakdown</h2>
          </div>
          <table className="st-money">
            <tbody>
              <tr><td>Food and drinks (after coupons)</td><td>{money(s.food)}</td></tr>
              <tr><td>Coupon savings given</td><td>{money(s.discount)}</td></tr>
              <tr><td>Delivery fees ({s.delCount} deliveries)</td><td>{money(s.delFees)}</td></tr>
              <tr><td>Average delivery fee</td><td>{money(s.delAvgFee)}{s.delAvgMin != null ? `, ${s.delAvgMin} min drive` : ""}</td></tr>
              <tr><td>HST collected</td><td>{money(s.tax)}</td></tr>
              <tr className="st-money__total"><td>Total</td><td>{money(s.total)}</td></tr>
            </tbody>
          </table>
        </section>
      </div>

      <RankList
        title="Top Customers"
        rows={s.topCustomers}
        valueLabel={(v) => `${v} order${v === 1 ? "" : "s"}`}
        sub={(r) => `${phoneText(r.phone)}, ${money(r.cents)} spent`}
      />

      <style jsx global>{`
        .st {
          --st-ink: #1f1f1f;
          --st-muted: #6b6b6b;
          --st-line: #e3e3e3;
          --st-surface: #ffffff;
          --st-bg: #f4f4f4;
          --st-bar: #b3261e;
          --st-bar-hi: #7f1d16;
          --st-track: #f1e3e2;
          max-width: 1180px;
          margin: 0 auto;
          padding: 20px 16px 48px;
          font-family: var(--font-plain);
          color: var(--st-ink);
        }
        .st-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
        .st h1 { margin: 0; font-size: 28px; font-family: var(--font-plain); text-transform: none; }
        .st-ranges { display: flex; flex-wrap: wrap; gap: 6px; }
        .st-ranges button {
          padding: 8px 14px; border: 1px solid #ccc; border-radius: 999px; background: #fff;
          font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; color: var(--st-ink);
        }
        .st-ranges button.is-on { background: var(--st-ink); border-color: var(--st-ink); color: #fff; }
        .st-sub { margin: 8px 0 16px; color: var(--st-muted); font-size: 15px; }
        .st-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .st-tile { padding: 14px 16px; background: var(--st-surface); border: 1px solid var(--st-line); border-radius: 10px; display: flex; flex-direction: column; gap: 2px; }
        .st-tile span { font-size: 15px; color: var(--st-muted); font-weight: 600; }
        .st-tile strong { font-size: 30px; line-height: 1.15; }
        .st-tile small { font-size: 15px; color: var(--st-muted); }
        .st-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .st-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .st-card { background: var(--st-surface); border: 1px solid var(--st-line); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }
        .st-grid2 > .st-card, .st-grid3 > .st-card { margin-bottom: 0; }
        .st-grid2 > div > .st-card:last-child { margin-bottom: 0; }
        .st-card__head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 10px; }
        .st-card h2 { margin: 0; font-size: 18px; font-family: var(--font-plain); text-transform: none; color: var(--st-ink); }
        .st-note { font-size: 15px; color: var(--st-muted); }
        .st-chart { position: relative; }
        .st-chart svg { display: block; width: 100%; height: 180px; overflow: visible; }
        .st-grid { stroke: var(--st-line); stroke-width: 1; vector-effect: non-scaling-stroke; }
        .st-bar { fill: var(--st-bar); }
        .st-bar.is-on { fill: var(--st-bar-hi); }
        .st-axis { display: flex; margin-top: 4px; font-size: 15px; color: var(--st-muted); }
        .st-axis span { text-align: center; white-space: nowrap; overflow: visible; }
        .st-tip {
          position: absolute; top: -6px; transform: translate(-50%, -100%); pointer-events: none;
          display: flex; flex-direction: column; padding: 6px 10px; border-radius: 6px;
          background: var(--st-ink); color: #fff; font-size: 15px; white-space: nowrap; z-index: 2;
        }
        .st-table { margin-top: 8px; font-size: 15px; }
        .st-table summary { cursor: pointer; color: var(--st-muted); }
        .st-table table, .st-money { width: 100%; border-collapse: collapse; margin-top: 6px; }
        .st-table td, .st-money td { padding: 5px 0; border-top: 1px solid var(--st-line); }
        .st-table td:not(:first-child), .st-money td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
        .st-money { font-size: 16px; }
        .st-money__total td { font-weight: 800; border-top: 2px solid var(--st-ink); }
        .st-rank, .st-split { list-style: none; margin: 0; padding: 0; }
        .st-rank li, .st-split { margin-bottom: 10px; }
        .st-rank__row { display: flex; justify-content: space-between; gap: 10px; font-size: 16px; }
        .st-rank__name { font-weight: 600; }
        .st-rank__val { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .st-rank__val small { color: var(--st-muted); font-size: 15px; }
        .st-rank__sub { font-size: 15px; color: var(--st-muted); }
        .st-rank__bar { height: 6px; margin-top: 4px; border-radius: 3px; background: var(--st-track); overflow: hidden; }
        .st-rank__bar span { display: block; height: 100%; border-radius: 3px; background: var(--st-bar); }
        .st-empty { margin: 0; color: var(--st-muted); }
        @media (max-width: 900px) {
          .st-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .st-grid2, .st-grid3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
