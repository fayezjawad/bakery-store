"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CartItem, bindCartToUser, clearCart, getCart, setQty } from "@/lib/cart";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const refresh = () => setItems(getCart());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!user) {
        router.replace("/login?next=/cart");
        return;
      }
      bindCartToUser(user.id);
      refresh();
    })();

    const onUpdate = () => refresh();
    window.addEventListener("cart_updated", onUpdate);
    return () => window.removeEventListener("cart_updated", onUpdate);
  }, [router]);

  const total = useMemo(
    () => items.reduce((sum, x) => sum + x.unit_price * x.qty, 0),
    [items]
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="font-bold">Cart</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/">Home</Link>
            <Link className="hover:underline" href="/checkout">Checkout</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-5">
          {!items.length ? (
            <div className="text-sm text-neutral-600">
              السلة فاضية. روح للمنتجات واضف 👍
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.product_id} className="flex items-center justify-between gap-4 border rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} className="h-14 w-14 rounded-xl object-cover border" alt={it.name} />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-neutral-100 border" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-sm text-neutral-600">
                        ${it.unit_price.toFixed(2)} {it.currency}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      value={it.qty}
                      onChange={(e) => setQty(it.product_id, Number(e.target.value))}
                      className="w-20 border rounded-lg px-2 py-1"
                    />
                    <div className="font-semibold w-28 text-right">
                      ${(it.unit_price * it.qty).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="font-bold">Total</div>
                <div className="font-bold">${total.toFixed(2)} USD</div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => clearCart()} className="px-4 py-2 rounded-xl border hover:bg-neutral-50">
                  Clear cart
                </button>

                <Link href="/checkout" className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800">
                  Continue to checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
