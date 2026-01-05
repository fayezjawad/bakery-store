// app/admin/orders/page.tsx
import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-white/70">Loading...</div>}>
      <OrdersClient />
    </Suspense>
  );
}
