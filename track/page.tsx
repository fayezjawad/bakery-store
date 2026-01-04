"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function TrackPage() {
  const sp = useSearchParams();
  const [code, setCode] = useState(sp.get("code") ?? "");
  const [last4, setLast4] = useState("");
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = sp.get("code");
    if (c) setCode(c);
  }, [sp]);

  const submit = async () => {
    setMsg(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_code: code, last4, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="font-bold">Track Order</div>
          <Link className="text-sm hover:underline" href="/">Home</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-5 space-y-3">
          <div>
            <label className="text-sm font-medium">Order Code</label>
            <input className="w-full border rounded-xl px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Last 4 digits</label>
              <input className="w-full border rounded-xl px-3 py-2" value={last4} onChange={(e) => setLast4(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">PIN</label>
              <input className="w-full border rounded-xl px-3 py-2" value={pin} onChange={(e) => setPin(e.target.value)} />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800"
          >
            {loading ? "Checking..." : "Track"}
          </button>

          {msg && <div className="text-sm bg-neutral-50 border rounded-xl p-3">{msg}</div>}

          {result && (
            <div className="border rounded-2xl p-4">
              <div className="font-semibold mb-2">Status</div>
              <div className="text-sm">
                <div><b>Status:</b> {result.order.status}</div>
                <div><b>Payment:</b> {result.order.payment_status}</div>
                <div><b>Total:</b> ${Number(result.order.total_price).toFixed(2)} {result.order.currency}</div>
              </div>

              <div className="mt-3">
                <div className="font-semibold mb-1 text-sm">Timeline</div>
                <ul className="text-sm list-disc pl-5">
                  {(result.events ?? []).map((e: any, idx: number) => (
                    <li key={idx}>{e.status} — {new Date(e.created_at).toLocaleString()}</li>
                  ))}
                  {!result.events?.length && <li>new</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
