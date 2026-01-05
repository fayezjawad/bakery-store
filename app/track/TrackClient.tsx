"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase"; // ✅ عدّلها إذا مسارك مختلف

type OrderRow = {
  order_code: string;
  pin: string | null;
  last4: string | null;
  status: string | null;
  created_at: string;
};

export default function TrackClient() {
  const sp = useSearchParams();

  // ✅ يدعم query مثل: /track?order=E4CDD7B8&pin=7828
  const qOrder = useMemo(() => (sp.get("order") || "").trim(), [sp]);
  const qPin = useMemo(() => (sp.get("pin") || "").trim(), [sp]);

  const [orderCode, setOrderCode] = useState(qOrder);
  const [pin, setPin] = useState(qPin);

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<OrderRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ✅ لو المستخدم دخل CODE-PIN في خانة واحدة
  useEffect(() => {
    if (!orderCode && qOrder) setOrderCode(qOrder);
    if (!pin && qPin) setPin(qPin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeInput = (code: string, p: string) => {
    const v = (code || "").trim().toUpperCase();

    // إذا المستخدم كتب مثل: E4CDD7B8-7828
    if (v.includes("-") && !p) {
      const parts = v.split("-").map((x) => x.trim());
      const c = (parts[0] || "").toUpperCase();
      const pn = (parts[1] || "").trim();
      return { c, pn };
    }

    return { c: v, pn: (p || "").trim() };
  };

  const lookup = async () => {
    const { c, pn } = normalizeInput(orderCode, pin);

    if (!c || !pn) {
      setErr("أدخل Order Code و PIN.");
      setRow(null);
      return;
    }

    setLoading(true);
    setErr(null);
    setRow(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("order_code,pin,last4,status,created_at")
        .eq("order_code", c)
        .eq("pin", pn)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErr("Order not found. تأكد من Order Code و PIN.");
        return;
      }

      setRow(data as OrderRow);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="font-bold">Track Order</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/">
              Home
            </Link>
            <Link className="hover:underline" href="/cart">
              Cart
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Order Code</div>
              <input
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="مثال: E4CDD7B8"
                className="w-full border rounded-xl px-3 py-2"
              />
              <div className="text-xs text-neutral-500 mt-1">
                تقدر تكتب كمان: <b>E4CDD7B8-7828</b> (كود + PIN)
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">PIN</div>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="مثال: 7828"
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>

            <button
              onClick={lookup}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
              disabled={loading}
            >
              {loading ? "Searching..." : "Track"}
            </button>
          </div>

          {err && (
            <div className="text-sm border rounded-xl p-3 bg-neutral-50">
              ❌ {err}
            </div>
          )}

          {row && (
            <div className="border rounded-xl p-4">
              <div className="font-semibold">{row.order_code}</div>
              <div className="text-sm text-neutral-600 mt-1">
                Status: {row.status ?? "created"}
              </div>
              <div className="text-sm text-neutral-600">
                Last4: {row.last4 ?? "----"}
              </div>
              <div className="text-xs text-neutral-500 mt-2">
                Created: {new Date(row.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
