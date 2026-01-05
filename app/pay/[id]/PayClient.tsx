"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  order_code: string;
  total_amount: number;
  currency: string;
  payment_status: string | null;
};

function money(n: number) {
  return `$${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

export default function PayClient({ orderId }: { orderId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setOrder(null);

      // Guard invalid orderId
      if (!orderId || orderId === "undefined" || orderId === "null") {
        setErr("Invalid order id.");
        setLoading(false);
        return;
      }

      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      if (!user) {
        setLoading(false);
        window.location.assign(`/login?next=/pay/${orderId}`);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id,order_code,total_amount,currency,payment_status")
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

      // If already paid, go home
      if ((data.payment_status ?? "unpaid") === "paid") {
        window.location.assign("/");
        return;
      }

      setOrder(data as any);
      setLoading(false);
    })();
  }, [orderId]);

  const pay = async () => {
    setErr(null);

    if (!order) return;

    // If already paid, go home
    if ((order.payment_status ?? "unpaid") === "paid") {
      window.location.assign("/");
      return;
    }

    if (!name.trim()) {
      setErr("Please enter the cardholder name.");
      return;
    }

    const digits = card.replace(/\D/g, "");
    if (digits.length < 4) {
      setErr("Enter a card number that contains at least 4 digits.");
      return;
    }

    const last4 = digits.slice(-4);

    setSaving(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;

      if (!token) {
        setErr("Session expired. Please login again.");
        setSaving(false);
        window.location.assign(`/login?next=/pay/${orderId}`);
        return;
      }

      const res = await fetch("/api/fake-pay", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          name: name.trim(),
          last4,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Payment failed.");

      // Redirect to HOME after successful payment
      window.location.assign(`/success/${order.id}`);
    } catch (e: any) {
      setErr(e?.message || "Payment failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-6 pt-16 pb-16 text-neutral-100">
      <div className="w-full max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.55)] overflow-hidden">
          {/* Header row inside card */}
          <div className="px-8 py-7 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
              <p className="mt-1 text-sm text-neutral-200/70">
                Complete your payment.
              </p>
            </div>

            <Link
              href="/"
              className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition text-sm"
            >
              Back Home
            </Link>
          </div>

          <div className="h-px bg-white/10" />

          <div className="p-8">
            {loading ? (
              <div className="text-sm text-neutral-200/70">Loading...</div>
            ) : err ? (
              <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4 text-sm">
                <span className="text-red-400 font-semibold">✖</span>{" "}
                <span className="text-neutral-100">{err}</span>
              </div>
            ) : order ? (
              <div className="space-y-5">
                {/* Order summary */}
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <div className="font-semibold">{order.order_code}</div>
                  <div className="mt-1 text-sm text-neutral-200/70">
                    Total:{" "}
                    <span className="text-neutral-100 font-semibold">
                      {money(Number(order.total_amount))} {order.currency}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-200/70">
                    Status:{" "}
                    <span className="text-neutral-100 font-semibold">
                      {(order.payment_status ?? "unpaid").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2 text-neutral-100">
                      Cardholder Name
                    </div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-neutral-100 placeholder:text-neutral-200/40 outline-none focus:border-white/20"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2 text-neutral-100">
                      Card Number
                    </div>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-neutral-100 placeholder:text-neutral-200/40 outline-none focus:border-white/20"
                      value={card}
                      onChange={(e) => setCard(e.target.value)}
                      placeholder="1111 2222 3333 4444"
                      inputMode="numeric"
                    />
                    <div className="mt-2 text-xs text-neutral-200/60">
                      Only the last 4 digits will be stored.
                    </div>
                  </div>
                </div>

                {/* Pay button */}
                <button
                  onClick={pay}
                  disabled={saving}
                  className="w-full rounded-2xl py-3 font-semibold text-black disabled:opacity-60 transition"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,170,90,0.95), rgba(245,120,35,0.95))",
                    boxShadow: "0 10px 30px rgba(245,120,35,0.22)",
                  }}
                >
                  {saving ? "Processing..." : "Pay"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-neutral-200/60">
          © {new Date().getFullYear()} Smart Bakery
        </div>
      </div>
    </div>
  );
}
