"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { bindCartToUser, clearCart, getCart, CartItem } from "@/lib/cart";

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
        setErr("السلة فاضية. روح للمنتجات واضف 👍");
        return;
      }

      const order_code = genCode8();
      const pin = genPin4();

      // ✅ ملاحظة: هذا يفترض إن جدول orders عندك فيه (order_code, pin, total_amount, currency, status, user_id)
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

      // ✅ لو عندك جدول order_items (اختياري)
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
      router.replace(`/track?order=${order.order_code}&pin=${order.pin}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
      setItems(getCart());
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="font-bold">Checkout</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/">Home</Link>
            <Link className="hover:underline" href="/cart">Cart</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-5">
          {!items.length ? (
            <div className="text-sm text-neutral-600">
              السلة فاضية. روح للمنتجات واضف 👍
              <div className="mt-3">
                <Link className="hover:underline" href="/">رجوع للمنتجات</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.product_id} className="flex items-center justify-between border rounded-xl p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-sm text-neutral-600">
                      {it.qty} × ${it.unit_price.toFixed(2)} = ${(it.qty * it.unit_price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="font-bold">Total</div>
                <div className="font-bold">${total.toFixed(2)} USD</div>
              </div>

              {err && <div className="text-sm border rounded-xl p-3 bg-neutral-50">❌ {err}</div>}

              <button
                onClick={placeOrder}
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800 disabled:opacity-60"
              >
                {loading ? "Placing order..." : "Place order"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
