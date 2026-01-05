"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";

type InvoiceDTO = {
  id: string;
  order_code: string;
  created_at: string;
  total_amount: number;
  currency: string;
  customer_name: string | null;
  payment_status: string;
};

function money(n: number, currency: string) {
  return `$${Number(n || 0).toFixed(2)} ${currency || "USD"}`;
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function pill(status: string) {
  const s = (status || "unpaid").toLowerCase();
  if (s === "paid") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const invoiceId = useMemo(() => String(params?.id || "").trim(), [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setInvoice(null);

      if (!invoiceId || invoiceId === "undefined" || invoiceId === "null" || !isUuid(invoiceId)) {
        setErr("Invalid invoice id.");
        setLoading(false);
        return;
      }

      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;

      if (!token) {
        setLoading(false);
        window.location.assign(`/login?next=/invoice/${encodeURIComponent(invoiceId)}`);
        return;
      }

      const res = await fetch(`/api/invoice/${encodeURIComponent(invoiceId)}?format=json`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(json?.error || "Failed to load invoice.");
        setLoading(false);
        return;
      }

      setInvoice(json as InvoiceDTO);
      setLoading(false);
    })();
  }, [invoiceId]);

  const downloadPdf = async () => {
    setErr(null);
    setDownloading(true);

    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;

      if (!token) {
        window.location.assign(`/login?next=/invoice/${encodeURIComponent(invoiceId)}`);
        return;
      }

      const res = await fetch(`/api/invoice/${encodeURIComponent(invoiceId)}?format=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Failed to download PDF.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = invoice?.order_code
        ? `invoice-${invoice.order_code}.pdf`
        : `invoice-${invoiceId}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Shell title="Invoice" subtitle="Review your invoice and download it as a PDF." max="max-w-3xl">
      <div className="dc-card p-6">
        {loading ? (
          <div className="text-sm text-white/70">Loading...</div>
        ) : err ? (
          <div className="dc-card-strong p-4 text-sm text-white/80">❌ {err}</div>
        ) : invoice ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-white/60">Order Code</div>
                <div className="text-xl font-semibold text-white/90">{invoice.order_code}</div>

                <div className="mt-3 text-sm text-white/60">Date</div>
                <div className="text-sm text-white/85">{new Date(invoice.created_at).toLocaleString()}</div>

                <div className="mt-3 text-sm text-white/60">Customer</div>
                <div className="text-sm text-white/85">{invoice.customer_name || "—"}</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-white/60">Payment</div>
                <div className={`inline-flex px-3 py-1 rounded-full border text-sm ${pill(invoice.payment_status)}`}>
                  {(invoice.payment_status || "unpaid").toUpperCase()}
                </div>

                <div className="mt-4 text-sm text-white/60">Total</div>
                <div className="text-2xl font-bold text-white">{money(invoice.total_amount, invoice.currency)}</div>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-white/10" />

            <div className="mt-6 space-y-3">
              <button
                onClick={downloadPdf}
                disabled={downloading}
                className="w-full rounded-2xl py-3 font-semibold text-black disabled:opacity-60 transition hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,170,90,0.95), rgba(245,120,35,0.95))",
                  boxShadow: "0 10px 30px rgba(245,120,35,0.22)",
                }}
              >
                {downloading ? "Downloading..." : "Download PDF"}
              </button>

              <Link
                href="/"
                className="block w-full text-center rounded-2xl py-3 font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                Back to Home
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
