// pages/deals.js
import Link from "next/link";

export default function DealsPage() {
  return (
    <main className="container" style={{ padding: "32px 0" }}>
      <h1 className="page-title" style={{ textTransform: "uppercase", marginBottom: 12 }}>
        Deals
      </h1>
      <div className="card" style={{ padding: 24 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700 }}>Under Construction</p>
        <p style={{ margin: "0 0 16px", color: "#555" }}>
          We're putting together deals and limited-time offers — check back soon.
        </p>
        <Link href="/menu" style={{ color: "#0b61d6", textDecoration: "none", fontWeight: 700 }}>
          Back to Menu
        </Link>
      </div>
    </main>
  );
}
