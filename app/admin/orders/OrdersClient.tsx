// app/admin/orders/OrdersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";

const STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

type OrderRow = {
  id: string;
  order_code: string;
  status: string | null;
  created_at: string;
  total_amount: number | null;
  currency: string | null;
  payment_status: string | null; // paid | unpaid
  user_id?: string | null;
};

function statusBucket(s?: string | null): "pending" | "ready" | "completed" {
  const v = (s ?? "pending").toLowerCase();
  if (v.includes("complete") || v === "done") return "completed";
  if (v.includes("ready")) return "ready";
  return "pending";
}

function pillClass(kind: "pending" | "ready" | "completed") {
  if (kind === "pending") return "bg-amber-500/10 text-amber-300 border-amber-500/30";
  if (kind === "ready") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  return "bg-sky-500/10 text-sky-300 border-sky-500/30";
}

function statusBtn(active: boolean) {
  return active
    ? "bg-violet-500 text-black border-violet-400"
    : "bg-white/5 hover:bg-white/10 border-white/10 text-white/80";
}

export default function OrdersClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedId = sp.get("orderId");

  const load = async () => {
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from("orders")
      .select("id,order_code,status,created_at,total_amount,currency,payment_status,user_id")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(`❌ ${error.message}`);
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as any);
    setLoading(false);
  };

  // Admin guard
  useEffect(() => {
    (async () => {
      setChecking(true);

      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      if (!user) {
        router.replace("/login?next=/admin/orders");
        return;
      }

      const { data: pr, error: prErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (prErr) {
        setMsg(`❌ ${prErr.message}`);
        setChecking(false);
        return;
      }

      if (pr?.role !== "admin") {
        router.replace("/");
        return;
      }

      setChecking(false);
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const counts = useMemo(() => {
    const c = { pending: 0, ready: 0, completed: 0 };
    for (const o of orders) c[statusBucket(o.status)]++;
    return c;
  }, [orders]);

  const setStatus = async (orderId: string, status: Status) => {
    setMsg(null);
    try {
      const { error: uErr } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (uErr) throw uErr;

      const { error: eErr } = await supabase
        .from("order_status_events")
        .insert({ order_id: orderId, status });

      if (eErr) {
        console.warn("order_status_events insert failed:", eErr.message);
      }

      await load();
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-white/70">Checking admin access...</div>
      </div>
    );
  }

  return (
    <Shell title="Manage Orders" subtitle="Update statuses and review recent orders." max="max-w-6xl">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/admin" className="dc-btn dc-btn-ghost">
          ← Admin Home
        </Link>
        <Link href="/" className="dc-btn dc-btn-ghost">
          Home
        </Link>

        <div className="ml-auto flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full border text-sm ${pillClass("pending")}`}>
            Pending: {counts.pending}
          </span>
          <span className={`px-3 py-1 rounded-full border text-sm ${pillClass("ready")}`}>
            Ready: {counts.ready}
          </span>
          <span className={`px-3 py-1 rounded-full border text-sm ${pillClass("completed")}`}>
            Completed: {counts.completed}
          </span>
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          {msg}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-sm text-white/60 bg-white/5">
          <div className="col-span-3">Order</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-2">Total</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-white/60">Loading...</div>
        ) : !orders.length ? (
          <div className="px-4 py-6 text-sm text-white/60">No orders yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {orders.map((o) => {
              const isSelected = selectedId === o.id;
              const unpaid = (o.payment_status ?? "unpaid") !== "paid";

              return (
                <div key={o.id} className={`px-4 py-4 ${isSelected ? "bg-violet-500/10" : ""}`}>
                  <div className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-3 min-w-0">
                      <div className="font-semibold truncate">{o.order_code}</div>
                      <div className="text-xs text-white/50 truncate">{o.id}</div>
                      {unpaid && (
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-xs text-white/70">
                          UNPAID
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm font-semibold">{(o.status ?? "pending").toUpperCase()}</div>
                      <div className="text-xs text-white/50 mt-1">Bucket: {statusBucket(o.status)}</div>
                    </div>

                    <div className="col-span-3 text-sm text-white/70">
                      {new Date(o.created_at).toLocaleString()}
                      {o.user_id ? (
                        <div className="text-xs text-white/50 mt-1">User: {o.user_id.slice(0, 8)}…</div>
                      ) : null}
                    </div>

                    <div className="col-span-2 text-sm font-semibold">
                      ${Number(o.total_amount ?? 0).toFixed(2)} {o.currency ?? "USD"}
                    </div>

                    <div className="col-span-2 text-right">
                      <Link
                        href={`/admin/orders?orderId=${encodeURIComponent(o.id)}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                      >
                        Details
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(o.id, s)}
                        className={`px-3 py-1.5 rounded-xl border text-sm transition ${statusBtn(
                          (o.status ?? "pending") === s
                        )}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
