// pages/contact.js
import { hoursSummary } from "../utils/storeHours";

export default function ContactPage() {
  return (
    <main className="container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>
      <h1 className="page-title" style={{ textTransform: "uppercase", marginBottom: 12 }}>
        Contact Us
      </h1>
      <div className="card" style={{ padding: 24, display: "grid", gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Address</div>
          <div style={{ color: "#555" }}>576 Concession Street, Hamilton, Ontario</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Phone</div>
          <a href="tel:+1-905-385-9888" style={{ color: "#0b61d6", textDecoration: "none" }}>
            905-385-9888
          </a>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Hours</div>
          <div style={{ color: "#555" }}>
            {/* from utils/storeHours.js, the same hours online ordering uses */}
            {hoursSummary().map((r) => (
              <div key={r.days}>
                {r.days}: {r.hours}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
