"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";

type TrackRow = {
  order_code: string;
  status: string | null;
  created_at: string;
  total_amount: number | null;
  currency: string | null;
  payment_status: string | null; // paid | unpaid
  last4: string | null;
};

function parseOrderId(input: string): { code: string; pin: string } | null {
  const v = (input || "").trim();
  if (!v) return null;

  // Accept: CODE-PIN or CODE PIN
  let code = "";
  let pin = "";

  if (v.includes("-")) {
    const parts = v.split("-").map((x) => x.trim());
    code = (parts[0] || "").toUpperCase();
    pin = (parts[1] || "").replace(/\D/g, "");
  } else {
    const parts = v.split(/\s+/).filter(Boolean);
    code = (parts[0] || "").toUpperCase();
    pin = (parts[1] || "").replace(/\D/g, "");
  }

  if (!code || !pin) return null;
  return { code, pin };
}

export default function TrackClient() {
  const sp = useSearchParams();

  // Support old URLs: /track?order=CODE&pin=1234
  // Also support: /track?order=CODE-1234
  const presetOrderId = useMemo(() => {
    const o = (sp.get("order") || "").trim();
    const p = (sp.get("pin") || "").trim();
    if (o && p) return `${o}-${p}`;
    return o; // could already be CODE-PIN
  }, [sp]);

  const [orderId, setOrderId] = useState(presetOrderId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // auto-search if query params present
    if (presetOrderId) {
      void lookup(presetOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookup = async (value?: string) => {
    const raw = (value ?? orderId).trim();
    setSearched(true);
    setErr(null);
    setResult(null);

    const parsed = parseOrderId(raw);
    if (!parsed) {
      setErr('Please enter Order ID like "E4CDD7B8-7828".');
      return;
    }

    const { code, pin } = parsed;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("order_code,status,created_at,total_amount,currency,payment_status,last4")
        .eq("order_code", code)
        .eq("pin", pin)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErr("Order not found. Please check the Order ID.");
        return;
      }

      setResult(data as any);
    } catch (e: any) {
      setErr(e?.message || "Failed to track order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell
      title="Track Your Order"
      subtitle="Enter your Order ID to view the latest status."
      max="max-w-6xl"
    >
      {/* Glow background */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-140px] top-[-140px] h-[560px] w-[560px] rounded-full bg-violet-600/20 blur-[130px]" />
          <div className="absolute right-[-170px] top-[-80px] h-[560px] w-[560px] rounded-full bg-amber-500/12 blur-[150px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <div className="mb-2 text-sm font-semibold text-white/80">
                  Order ID
                </div>
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void lookup();
                  }}
                  placeholder="E4CDD7B8-7828"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/20"
                />
                <div className="mt-2 text-xs text-white/45">
                  Format: <span className="text-white/70">ORDER_CODE-PIN</span>
                </div>
              </div>

              <button
                onClick={() => lookup()}
                disabled={loading}
                className="mt-2 w-full rounded-full bg-violet-500/90 px-6 py-3 text-base font-extrabold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {loading ? "Tracking..." : "Track"}
              </button>

              {err && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-red-200">
                  ❌ {err}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="p-6 sm:p-8">
              <div className="text-xl font-extrabold text-white">Result</div>

              {!searched ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-white/65">
                  No order searched yet.
                </div>
              ) : loading ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-white/65">
                  Loading...
                </div>
              ) : result ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-white font-extrabold text-lg">
                      {result.order_code}
                    </div>

                    <span className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80">
                      {(result.payment_status ?? "unpaid").toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm text-white/70">
                    Status:{" "}
                    <span className="text-white/90">
                      {result.status ?? "created"}
                    </span>
                  </div>

                  <div className="text-sm text-white/70">
                    Total:{" "}
                    <span className="text-white/90 font-semibold">
                      ${Number(result.total_amount ?? 0).toFixed(2)}{" "}
                      {result.currency ?? "USD"}
                    </span>
                  </div>

                  <div className="text-sm text-white/70">
                    Created:{" "}
                    <span className="text-white/90">
                      {new Date(result.created_at).toLocaleString()}
                    </span>
                  </div>

                  {result.last4 ? (
                    <div className="text-sm text-white/70">
                      Card Last4:{" "}
                      <span className="text-white/90">{result.last4}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-white/65">
                  No result.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-white/55">
          © {new Date().getFullYear()} Smart Bakery
        </div>
      </div>
    </Shell>
  );
}
