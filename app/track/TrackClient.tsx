"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TrackClient() {
  const sp = useSearchParams();
  const defaultCode = useMemo(() => (sp.get("order") || "").trim(), [sp]);
  const defaultPin = useMemo(() => (sp.get("pin") || "").trim(), [sp]);

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const lookup = async (code: string, pin: string) => {
    const c = code.trim();
    const p = pin.trim();
    if (!c || !p) return;

    setLoading(true);
    setErr(null);
    setRow(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("order_code,pin,status,created_at,total_amount,currency")
        .eq("order_code", c)
        .eq("pin", p)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setErr("Order not found. تأكد من Order Code و PIN.");
      } else {
        setRow(data);
      }
    } catch (e: any) {
      setErr(e.message);
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
                id="order_code"
                defaultValue={defaultCode}
                placeholder="مثال: E4CDD7B8"
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">PIN</div>
              <input
                id="pin"
                defaultValue={defaultPin}
                placeholder="مثال: 7828"
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={() => {
              const code = document.querySelector<HTMLInputElement>("#order_code")?.value ?? "";
              const pin = document.querySelector<HTMLInputElement>("#pin")?.value ?? "";
              lookup(code, pin);
            }}
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
            <div className="border rounded-xl p-4">
              <div className="font-semibold">{row.order_code}</div>
              <div className="text-sm text-neutral-600 mt-1">Status: {row.status}</div>
              <div className="text-sm text-neutral-600">
                Total: ${Number(row.total_amount).toFixed(2)} {row.currency}
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
