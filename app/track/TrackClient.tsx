"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function TrackClient() {
  const sp = useSearchParams();
  const orderFromUrl = useMemo(() => (sp.get("order") || "").trim(), [sp]);
  const pinFromUrl = useMemo(() => (sp.get("pin") || "").trim(), [sp]);

  const [orderCode, setOrderCode] = useState(orderFromUrl);
  const [pin, setPin] = useState(pinFromUrl);

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const normalize = (oc: string, p: string) => {
    const v = oc.trim().toUpperCase();
    if (v.includes("-") && !p.trim()) {
      const [a, b] = v.split("-", 2);
      return { oc: (a || "").trim().toUpperCase(), p: (b || "").trim() };
    }
    return { oc: v, p: p.trim() };
  };

  const lookup = async () => {
    const { oc, p } = normalize(orderCode, pin);

    if (!oc || !p) {
      setErr("أدخل Order Code و PIN (أو الصق CODE-PIN في خانة Order Code).");
      return;
    }

    setLoading(true);
    setErr(null);
    setRow(null);

    try {
      const { data, error } = await supabase.rpc("track_order", {
        p_order_code: oc,
        p_pin: p,
      });

      if (error) throw error;

      const r = Array.isArray(data) ? data[0] : null;
      if (!r) {
        setErr("Order not found. تأكد من Order Code و PIN.");
        return;
      }

      setRow(r);
    } catch (e: any) {
      setErr(e.message ?? "Unknown error");
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
            <Link className="hover:underline" href="/">Home</Link>
            <Link className="hover:underline" href="/cart">Cart</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-medium mb-1">Order Code</div>
              <input
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="مثال: 49D5BCF8 أو 49D5BCF8-5733"
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">PIN</div>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="مثال: 5733"
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={lookup}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
            disabled={loading}
          >
            {loading ? "Searching..." : "Track"}
          </button>

          {err && (
            <div className="text-sm border rounded-xl p-3 bg-neutral-50">
              ❌ {err}
            </div>
          )}

          {row && (
            <div className="border rounded-xl p-4 space-y-1">
              <div className="font-semibold">Order Code: {row.order_code}</div>
              <div className="text-sm text-neutral-600">Status: {row.status}</div>
              <div className="text-sm text-neutral-600">Last4: {row.last4}</div>
              <div className="text-sm text-neutral-600">
                Total: ${Number(row.total_amount ?? 0).toFixed(2)} {row.currency ?? "USD"}
              </div>
              <div className="text-xs text-neutral-500">
                Created: {new Date(row.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
