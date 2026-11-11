// pages/order.js
import { useRouter } from "next/router";
import ServiceSelector from "../components/ServiceSelector";

export default function OrderPage() {
  const router = useRouter();
  const rawNext = router.query.next?.toString() || "";
  // Only allow same-site relative paths — a bare "/" prefix, not "//" (which
  // browsers treat as protocol-relative, i.e. an off-site redirect).
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/menu";
  const method = router.query.method?.toString() || null;
  return (
    <ServiceSelector
      initialChoice={method === "delivery" || method === "carryout" ? method : null}
      onConfirmed={() => router.push(next)}
    />
  );
}
