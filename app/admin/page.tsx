"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  order_code: string;
  status: string | null;
  created_at: string;
  total_amount: number | null;
  currency: string | null;
  payment_status: string | null; // paid | unpaid
  user_id: string | null;
};

function statusBucket(s?: string | null) {
  const v = (s ?? "pending").toLowerCase();

  if (v.includes("complete") || v === "done") return "completed";
  if (v.includes("ready")) return "ready";
  return "pending";
}

function badgeClasses(bucket: "pending" | "ready" | "completed") {
  if (bucket === "pending")
    return "bg-amber-500/10 text-amber-300 border-amber-500/30";
  if (bucket === "ready")
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  return "bg-sky-500/10 text-sky-300 border-sky-500/30";
}

export default function AdminHome() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    (async () => {
      setChecking(true);
      setErr(null);

      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      if (!user) {
        router.replace("/login?next=/admin");
        return;
      }

      const { data: pr, error: prErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (prErr) {
        setErr(prErr.message);
        setChecking(false);
        return;
      }

      if (pr?.role !== "admin") {
        router.replace("/");
        return;
      }

      setChecking(false);

      // Load recent orders
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_code,status,created_at,total_amount,currency,payment_status,user_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        setErr(error.message);
        setLoadingOrders(false);
        return;
      }

      setOrders((data ?? []) as any);
      setLoadingOrders(false);
    })();
  }, [router]);

  const counts = useMemo(() => {
    const c = { pending: 0, ready: 0, completed: 0 };
    for (const o of orders) c[statusBucket(o.status)]++;
    return c;
  }, [orders]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-white/70">Checking admin access...</div>
      </div>
    );
  }

  return (
    <Shell title="Admin Dashboard" subtitle="Monitor orders and manage the store." max="max-w-6xl">
      {err && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-red-200">
          ❌ {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Link
          href="/admin/products"
          className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-5"
        >
          <div className="text-sm text-white/60">Admin</div>
          <div className="mt-1 text-lg font-semibold">Manage Products</div>
          <div className="mt-2 text-sm text-white/60">Create, edit, and activate products.</div>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-5"
        >
          <div className="text-sm text-white/60">Admin</div>
          <div className="mt-1 text-lg font-semibold">Manage Orders</div>
          <div className="mt-2 text-sm text-white/60">Update order statuses and review items.</div>
        </Link>

        <Link
          href="/my-orders"
          className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-5"
        >
          <div className="text-sm text-white/60">User</div>
          <div className="mt-1 text-lg font-semibold">My Orders</div>
          <div className="mt-2 text-sm text-white/60">See the experience from the customer side.</div>
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Recent Orders</div>
            <div className="text-sm text-white/60 mt-1">
              Latest {orders.length} orders (most recent first).
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full border text-sm ${badgeClasses("pending")}`}>
              Pending: {counts.pending}
            </span>
            <span className={`px-3 py-1 rounded-full border text-sm ${badgeClasses("ready")}`}>
              Ready: {counts.ready}
            </span>
            <span className={`px-3 py-1 rounded-full border text-sm ${badgeClasses("completed")}`}>
              Completed: {counts.completed}
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-sm text-white/60 bg-white/5">
            <div className="col-span-3">Order ID</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2 text-right">Details</div>
          </div>

          {loadingOrders ? (
            <div className="px-4 py-6 text-sm text-white/60">Loading orders...</div>
          ) : !orders.length ? (
            <div className="px-4 py-6 text-sm text-white/60">No orders yet.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {orders.map((o) => {
                const bucket = statusBucket(o.status);
                const unpaid = (o.payment_status ?? "unpaid") !== "paid";

                return (
                  <div key={o.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                    <div className="col-span-3 min-w-0">
                      <div className="font-semibold truncate">{o.order_code}</div>
                      <div className="text-xs text-white/50 truncate">{o.id}</div>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${badgeClasses(bucket)}`}>
                        {bucket.toUpperCase()}
                      </span>
                      {unpaid && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full border text-xs bg-white/5 border-white/15 text-white/70">
                          UNPAID
                        </span>
                      )}
                    </div>

                    <div className="col-span-3 text-sm text-white/70 truncate">
                      {o.user_id ? `User: ${o.user_id.slice(0, 8)}…` : "—"}
                      <div className="text-xs text-white/50">
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="col-span-2 text-sm font-semibold">
                      ${Number(o.total_amount ?? 0).toFixed(2)} {o.currency ?? "USD"}
                    </div>

                    <div className="col-span-2 text-right">
                      <Link
                        href={`/admin/orders?orderId=${encodeURIComponent(o.id)}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-white/50">
          Tip: If you want a real “Pickup” column later, add columns like <b>pickup_date</b> and <b>pickup_time</b> to the <b>orders</b> table.
        </div>
      </div>
    </Shell>
  );
}
