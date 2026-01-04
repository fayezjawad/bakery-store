"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const STATUSES = ["new", "preparing", "ready", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_code, customer_name, phone_last4, tracking_pin, total_price, currency, status, payment_status, created_at")
      .order("created_at", { ascending: false });

    if (error) setMsg(`❌ ${error.message}`);
    setOrders(data ?? []);
  };

  // ✅ Guard
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: pr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (pr?.role !== "admin") {
        router.replace("/");
        return;
      }

      setChecking(false);
      await load();
    })();
  }, [router]);

  const setStatus = async (orderId: string, status: string) => {
    setMsg(null);
    try {
      const { error: uErr } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (uErr) throw uErr;

      const { error: eErr } = await supabase.from("order_status_events").insert({ order_id: orderId, status });
      if (eErr) throw eErr;

      await load();
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-sm text-neutral-600">Checking admin access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-bold">Admin • Orders</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/admin">
              Admin
            </Link>
            <Link className="hover:underline" href="/">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {msg && <div className="mb-4 text-sm bg-neutral-50 border rounded-xl p-3">{msg}</div>}

        <div className="grid gap-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border rounded-2xl p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="font-semibold">Order {o.order_code}</div>
                  <div className="text-sm text-neutral-600">
                    {o.customer_name || "—"} • Last4: <b>{o.phone_last4}</b> • PIN: <b>{o.tracking_pin}</b>
                  </div>
                  <div className="text-sm text-neutral-600">
                    Payment: <b>{o.payment_status}</b>
                  </div>
                </div>
                <div className="font-bold">${Number(o.total_price).toFixed(2)} {o.currency}</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(o.id, s)}
                    className={`px-3 py-1.5 rounded-lg border text-sm hover:bg-neutral-50 ${
                      o.status === s ? "bg-neutral-900 text-white border-neutral-900" : ""
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!orders.length && <div className="text-sm text-neutral-600">No orders yet.</div>}
        </div>
      </main>
    </div>
  );
}
