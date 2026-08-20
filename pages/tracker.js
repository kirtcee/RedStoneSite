// pages/tracker.js
import Link from "next/link";

export default function TrackerPage() {
  return (
    <main className="container" style={{ padding: "32px 0" }}>
      <h1 className="page-title" style={{ textTransform: "uppercase", marginBottom: 12 }}>
        Order Tracker
      </h1>
      <div className="card" style={{ padding: 24 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700 }}>Coming Soon</p>
        <p style={{ margin: "0 0 16px", color: "#555" }}>
          Live order tracking is on its way. Just placed an order? You'll find your order
          summary on the confirmation page.
        </p>
        <Link href="/menu" style={{ color: "#0b61d6", textDecoration: "none", fontWeight: 700 }}>
          Back to Menu
        </Link>
      </div>
    </main>
  );
}
