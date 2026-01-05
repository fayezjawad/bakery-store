"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  order_code: string;
  created_at: string;
  total_amount: number | null;
  currency: string | null;
  payment_status: string | null;
  customer_name: string | null;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default function SuccessClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setOrder(null);

      const orderId = String(id || "").trim();

      if (!orderId || orderId === "undefined" || orderId === "null" || !isUuid(orderId)) {
        setErr("Invalid order id.");
        setLoading(false);
        return;
      }

      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      if (!user) {
        window.location.assign(`/login?next=/success/${orderId}`);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id,order_code,created_at,total_amount,currency,payment_status,customer_name")
        .eq("id", orderId)
        .maybeSingle();

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setErr("Order not found.");
        setLoading(false);
        return;
      }

      setOrder(data as any);
      setLoading(false);
    })();
  }, [id]);

  return (
    <Shell title="Payment Completed" subtitle="Your payment was successful." max="max-w-3xl">
      <div className="dc-card p-6">
        {loading ? (
          <div className="text-sm text-white/70">Loading...</div>
        ) : err ? (
          <div className="dc-card-strong p-4 text-sm">❌ {err}</div>
        ) : order ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-lg font-semibold text-white/90">✅ Payment Successful</div>
              <div className="mt-2 text-sm text-white/70">
                Thank you! Here are your order details:
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <Row label="Order Code" value={order.order_code} />
                <Row label="Order ID" value={order.id} />
                <Row label="Date" value={new Date(order.created_at).toLocaleString()} />
                <Row label="Customer" value={order.customer_name || "—"} />
                <Row
                  label="Payment"
                  value={(order.payment_status ?? "unpaid").toUpperCase()}
                />
                <Row
                  label="Total"
                  value={`$${Number(order.total_amount ?? 0).toFixed(2)} ${order.currency ?? "USD"}`}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="w-full text-center rounded-2xl py-3 font-semibold text-black transition hover:brightness-110 active:scale-[0.99]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,170,90,0.95), rgba(245,120,35,0.95))",
                  boxShadow: "0 10px 30px rgba(245,120,35,0.22)",
                }}
              >
                Back to Home
              </Link>

              <Link
                href="/my-orders"
                className="w-full text-center rounded-2xl py-3 font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                View My Orders
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <div className="min-w-[110px] font-semibold text-white/80">{label}:</div>
      <div className="text-white/85 break-all">{value}</div>
    </div>
  );
}
