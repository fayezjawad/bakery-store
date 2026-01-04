"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_code, tracking_pin, phone_last4, total_price, currency, status, payment_status, created_at")
        .order("created_at", { ascending: false });

      if (error) setMsg(error.message);
      setOrders(data ?? []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="font-bold">My Orders</div>
          <Link className="hover:underline text-sm" href="/">Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {msg && <div className="bg-white border rounded-xl p-3 mb-4 text-sm">❌ {msg}</div>}

        <div className="grid gap-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border rounded-2xl p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="font-semibold">Order {o.order_code}</div>
                  <div className="text-sm text-neutral-600">
                    Status: <b>{o.status}</b> • Payment: <b>{o.payment_status}</b>
                  </div>
                </div>
                <div className="font-bold">
                  ${Number(o.total_price).toFixed(2)} {o.currency}
                </div>
              </div>

              <div className="mt-3 text-sm text-neutral-700">
                PIN: <b>{o.tracking_pin}</b> • Last4: <b>{o.phone_last4}</b>
              </div>
            </div>
          ))}
          {!orders.length && <div className="text-sm text-neutral-600">No orders yet.</div>}
        </div>
      </main>
    </div>
  );
}
