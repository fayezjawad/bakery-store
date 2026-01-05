"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Shell from "@/components/Shell";

type OrderRow = {
  id: string;
  order_code: string;
  pin: string | null;
  status: string | null;
  created_at: string;
  total_amount: number | null;
  currency: string | null;
  payment_status: string | null; // unpaid | paid
};

function formatMoney(n: number, cur: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)} ${cur}`;
  }
}

function fmtDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString();
}

export default function MyOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setErr(null);

    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user ?? null;

    if (!user) {
      window.location.assign("/login?next=/my-orders");
      return;
    }

    // ✅ removed pickup_date/pickup_time
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_code,pin,status,created_at,total_amount,currency,payment_status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;

    return orders.filter((o) => {
      const orderId = (o.pin ? `${o.order_code}-${o.pin}` : o.order_code).toLowerCase();
      const status = (o.status ?? "").toLowerCase();
      const pay = (o.payment_status ?? "").toLowerCase();
      return orderId.includes(needle) || status.includes(needle) || pay.includes(needle);
    });
  }, [orders, q]);

  return (
    <Shell title="My Orders" subtitle="Track your orders and complete payment if needed." max="max-w-6xl">
      <div className="py-2">
        {err && (
          <div className="dc-card p-4 mb-4 text-sm">
            <span className="font-semibold">Error:</span> {err}
          </div>
        )}

        <div className="dc-card p-5">
          {/* Search */}
          <div className="mb-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by Order ID, status, payment..."
              className="w-full rounded-2xl px-4 py-3 bg-white/5 border border-white/10 outline-none focus:border-white/20"
            />
          </div>

          {loading ? (
            <div className="dc-muted text-sm">Loading...</div>
          ) : !filtered.length ? (
            <div className="dc-muted text-sm">
              No orders yet.
              <div className="mt-3">
                <Link className="dc-link inline-block" href="/">
                  Go to products
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <div className="grid grid-cols-12 px-4 pb-3 text-sm font-semibold dc-muted">
                  <div className="col-span-5">Order ID</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Total</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-white/10">
                  {filtered.map((o) => {
                    const unpaid = (o.payment_status ?? "unpaid") !== "paid";
                    const orderId = o.pin ? `${o.order_code}-${o.pin}` : o.order_code;

                    return (
                      <div key={o.id} className="grid grid-cols-12 items-center px-4 py-4">
                        <div className="col-span-5 min-w-0">
                          <div className="font-semibold truncate">{orderId}</div>
                          <div className="text-xs dc-muted mt-1">Placed: {fmtDate(o.created_at)}</div>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                unpaid
                                  ? "border-amber-300/30 text-amber-200"
                                  : "border-emerald-300/30 text-emerald-200"
                              }`}
                            >
                              {unpaid ? "UNPAID" : "PAID"}
                            </span>

                            {unpaid && (
                              <Link href={`/pay/${o.id}`} className="dc-btn dc-btn-primary !py-1.5 !px-3 text-xs">
                                Go to payment
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="text-sm">{o.status ?? "created"}</span>
                        </div>

                        <div className="col-span-3 text-right font-bold">
                          {formatMoney(Number(o.total_amount ?? 0), o.currency ?? "USD")}
                        </div>

                        <div className="col-span-2 text-right">
                          <Link
                            className="dc-btn dc-btn-ghost !py-2 !px-3 text-xs"
                            href={`/track?orderId=${encodeURIComponent(orderId)}`}
                          >
                            Track
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((o) => {
                  const unpaid = (o.payment_status ?? "unpaid") !== "paid";
                  const orderId = o.pin ? `${o.order_code}-${o.pin}` : o.order_code;

                  return (
                    <div key={o.id} className="dc-card-strong p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{orderId}</div>
                          <div className="text-xs dc-muted mt-1">Placed: {fmtDate(o.created_at)}</div>
                        </div>

                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            unpaid
                              ? "border-amber-300/30 text-amber-200"
                              : "border-emerald-300/30 text-emerald-200"
                          }`}
                        >
                          {unpaid ? "UNPAID" : "PAID"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="dc-muted text-xs">Status</div>
                          <div>{o.status ?? "created"}</div>
                        </div>
                        <div className="text-right">
                          <div className="dc-muted text-xs">Total</div>
                          <div className="font-bold">
                            {formatMoney(Number(o.total_amount ?? 0), o.currency ?? "USD")}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          className="dc-btn dc-btn-ghost flex-1 text-center"
                          href={`/track?orderId=${encodeURIComponent(orderId)}`}
                        >
                          Track
                        </Link>

                        {unpaid && (
                          <Link className="dc-btn dc-btn-primary flex-1 text-center" href={`/pay/${o.id}`}>
                            Go to payment
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
