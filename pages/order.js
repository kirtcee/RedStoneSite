// pages/order.js
import { useRouter } from "next/router";
import ServiceSelector from "../components/ServiceSelector";

export default function OrderPage() {
  const router = useRouter();
  const next = router.query.next?.toString() || "/menu";
  const method = router.query.method?.toString() || null;
  return (
    <ServiceSelector
      initialChoice={method === "delivery" || method === "carryout" ? method : null}
      onConfirmed={() => router.push(next)}
    />
  );
}
