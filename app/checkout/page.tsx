"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { bindCartToUser, clearCart, getCart, CartItem } from "@/lib/cart";
import Shell from "@/components/Shell";

function genCode8() {
  const chars = "ABCDEF0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function genPin4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form fields (UI only for now)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");

  const total = useMemo(
    () => items.reduce((sum, x) => sum + x.unit_price * x.qty, 0),
    [items]
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      if (!user) {
        router.replace("/login?next=/checkout");
        return;
      }

      bindCartToUser(user.id);
      setItems(getCart());
    })();
  }, [router]);

  const placeOrder = async () => {
    setLoading(true);
    setErr(null);

    try {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      if (!user) {
        router.replace("/login?next=/checkout");
        return;
      }

      const cart = getCart();
      if (!cart.length) {
        setErr("Your cart is empty. Please add products first.");
        return;
      }

      // Basic validation (you can relax it if you want)
      if (!fullName.trim()) {
        setErr("Please enter your full name.");
        return;
      }
      if (!phone.trim()) {
        setErr("Please enter your phone number.");
        return;
      }

      const order_code = genCode8();
      const pin = genPin4();

      // Insert order (keep only columns you already have to avoid DB errors)
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_code,
          pin,
          total_amount: total,
          currency: "USD",
          status: "pending",
        })
        .select("id,order_code,pin,total_amount,currency,status,created_at")
        .single();

      if (orderErr) throw orderErr;

      // Optional: order_items
      await supabase.from("order_items").insert(
        cart.map((it) => ({
          order_id: order.id,
          product_id: it.product_id,
          name: it.name,
          unit_price: it.unit_price,
          qty: it.qty,
          currency: it.currency,
        }))
      );

      clearCart();
      router.replace(`/track?order=${encodeURIComponent(order.order_code)}&pin=${encodeURIComponent(order.pin)}`);
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setItems(getCart());
    }
  };

  return (
    <Shell title="Pre-Order" subtitle="Schedule your pickup and confirm your order." max="max-w-6xl">
      {/* Background glow like your screenshot */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-140px] top-[-140px] h-[560px] w-[560px] rounded-full bg-violet-600/20 blur-[130px]" />
          <div className="absolute right-[-170px] top-[-80px] h-[560px] w-[560px] rounded-full bg-amber-500/12 blur-[150px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Form */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="p-6 sm:p-8 space-y-4">
              <Field label="Full Name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                  placeholder="John Doe"
                />
              </Field>

              <Field label="Phone">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                  placeholder="+1 555 123 4567"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Pickup Date">
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/20"
                  />
                </Field>

                <Field label="Pickup Time">
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/20"
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                  placeholder="Allergies, packaging notes, etc."
                />
              </Field>

              {err && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-red-200">
                  ❌ {err}
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={loading}
                className="mt-2 w-full rounded-full bg-violet-500/90 px-6 py-3 text-base font-extrabold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>

              <div className="pt-1 text-sm text-white/60">
                <Link href="/cart" className="underline hover:opacity-90">
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Summary */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="p-6 sm:p-8">
              <div className="text-xl font-extrabold text-white">Order Summary</div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20">
                {!items.length ? (
                  <div className="p-4 text-sm text-white/70">
                    No items in your cart.
                    <div className="mt-3">
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-white/10">
                      {items.map((it) => (
                        <div key={it.product_id} className="p-4 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{it.name}</div>
                            <div className="text-sm text-white/60">
                              Qty: {it.qty} • ${it.unit_price.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-white font-bold">
                            ${(it.unit_price * it.qty).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 p-4 flex items-center justify-between">
                      <div className="text-white/70 font-semibold">Total</div>
                      <div className="text-white text-2xl font-extrabold">
                        ${total.toFixed(2)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Optional helper text to mimic the empty dashed line area */}
              <div className="mt-4 text-sm text-white/50">
                You will receive an order code & PIN for tracking after placing the order.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-white/80">{label}</div>
      {children}
    </div>
  );
}
