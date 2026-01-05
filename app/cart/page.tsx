"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { CartItem, clearCart, getCart, setQty } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  const refresh = () => setItems(getCart());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      if (!user) {
        window.location.assign("/login?next=/cart");
        return;
      }

      refresh();
    })();

    const onUpdate = () => refresh();
    window.addEventListener("cart_updated", onUpdate);
    return () => window.removeEventListener("cart_updated", onUpdate);
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, x) => sum + x.unit_price * x.qty, 0);
  }, [items]);

  const inc = (id: number, qty: number) => setQty(id, Math.min(999, qty + 1));
  const dec = (id: number, qty: number) => setQty(id, Math.max(0, qty - 1));
  const remove = (id: number) => setQty(id, 0);

  return (
    <Shell title="Your Cart" subtitle="Review items before checkout." max="max-w-6xl">
      {/* Background glow like your screenshot */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-140px] top-[-120px] h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute right-[-140px] top-[-40px] h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[130px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40" />
        </div>

        {/* Main card */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="p-6 sm:p-8">
            {!items.length ? (
              <div className="text-sm text-white/70">
                Your cart is empty.
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
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1.6fr_.7fr_.8fr_.7fr_.7fr] items-center gap-4 border-b border-white/10 pb-4 text-white/70">
                  <div className="font-semibold">Item</div>
                  <div className="font-semibold">Price</div>
                  <div className="font-semibold">Quantity</div>
                  <div className="font-semibold">Total</div>
                  <div />
                </div>

                {/* Items */}
                <div className="divide-y divide-white/10">
                  {items.map((it) => {
                    const line = it.unit_price * it.qty;
                    return (
                      <div
                        key={it.product_id}
                        className="grid grid-cols-1 sm:grid-cols-[1.6fr_.7fr_.8fr_.7fr_.7fr] items-center gap-4 py-6"
                      >
                        {/* Item */}
                        <div className="flex items-center gap-4 min-w-0">
                          {it.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={it.image_url}
                              alt={it.name}
                              className="h-14 w-14 rounded-2xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10" />
                          )}

                          <div className="min-w-0">
                            <div className="truncate text-lg font-semibold text-white">
                              {it.name}
                            </div>
                            <div className="text-sm text-white/60">
                              {it.currency ?? "USD"}
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-white/90 font-semibold">
                          ${Number(it.unit_price).toFixed(2)}
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => dec(it.product_id, it.qty)}
                            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <div className="min-w-[34px] text-center text-white font-semibold">
                            {it.qty}
                          </div>

                          <button
                            onClick={() => inc(it.product_id, it.qty)}
                            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Total */}
                        <div className="text-white font-bold">
                          ${Number(line).toFixed(2)}
                        </div>

                        {/* Remove */}
                        <div className="sm:text-right">
                          <button
                            onClick={() => remove(it.product_id)}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <button
                      onClick={() => clearCart()}
                      className="inline-flex w-fit items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
                    >
                      Clear Cart
                    </button>

                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-white">
                        Grand Total: ${total.toFixed(2)}
                      </div>
                      <div className="text-sm text-white/60">USD</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/checkout"
                      className="inline-flex items-center justify-center rounded-full bg-violet-500/90 px-6 py-3 text-base font-extrabold text-white hover:bg-violet-500"
                    >
                      Proceed to Checkout
                    </Link>

                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white hover:bg-white/10"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
