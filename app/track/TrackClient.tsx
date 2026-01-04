"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function TrackClient() {
  const sp = useSearchParams();
  const orderNo = useMemo(() => (sp.get("order") || "").trim(), [sp]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const lookup = async (value?: string) => {
    const v = (value ?? orderNo).trim();
    if (!v) return;

    setLoading(true);
    setErr(null);
    setStatus(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("order_no,status,created_at,total_amount,currency")
        .eq("order_no", v)
        .single();

      if (error) throw error;
      setStatus(data);
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
          <div>
            <div className="text-sm font-medium mb-1">Order number</div>
            <input
              defaultValue={orderNo}
              onKeyDown={(e) => {
                if (e.key === "Enter") lookup((e.target as HTMLInputElement).value);
              }}
              placeholder="مثال: ORD-1234"
              className="w-full border rounded-xl px-3 py-2"
            />
            <button
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>("input");
                lookup(input?.value ?? "");
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
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

          {status && (
            <div className="border rounded-xl p-4">
              <div className="font-semibold">{status.order_no}</div>
              <div className="text-sm text-neutral-600 mt-1">Status: {status.status}</div>
              <div className="text-sm text-neutral-600">
                Total: ${Number(status.total_amount).toFixed(2)} {status.currency}
              </div>
              <div className="text-xs text-neutral-500 mt-2">
                Created: {new Date(status.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
