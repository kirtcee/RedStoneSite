// pages/order.js
import { useRouter } from "next/router";
import ServiceSelector from "../components/ServiceSelector";

export default function OrderPage() {
  const router = useRouter();
  const next = router.query.next?.toString() || "/menu";
  return <ServiceSelector onConfirmed={() => router.push(next)} />;
}
