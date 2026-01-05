"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase"; // ✅ عدّلها إذا مسارك مختلف
import { clearCart, getCart, CartItem } from "../../lib/cart"; // ✅ عدّلها إذا مسارك مختلف

type CreatedOrder = {
  order_code: string;
  pin: string;
  last4: string | null;
  status: string | null;
  created_at: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [last4, setLast4] = useState("");
  const [loading, setLoading] = useState(false);

  const [created, setCreated] = useState<CreatedOrder | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const total = useMemo(
    () => items.reduce((s, x) => s + x.unit_price * x.qty, 0),
    [items]
  );

  // ✅ حماية: لازم يكون مسجل دخول
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login?next=/checkout");
        return;
      }
      setItems(getCart());
    })();
  }, [router]);

  const placeOrder = async () => {
    setLoading(true);
    setErr(null);
    setCreated(null);

    try {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) {
        router.replace("/login?next=/checkout");
        return;
      }

      // ✅ انتبه: أنا بحط حقول “مؤكدة” عندك (order_code/pin بتتولد من DB trigger)
      // لو عندك أعمدة إضافية (مثل user_id / total_amount / currency) تقدر تضيفها هنا
      const insertPayload: any = {
        // لو عندك user_id بالجدول:
        // user_id: user.id,

        status: "created",
        last4: last4.trim() ? last4.trim() : null,

        // إذا عندك أعمدة total_amount/currency (عندك سابقًا كانوا مش موجودين) خليهم معلقين:
        // total_amount: total,
        // currency: "USD",
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(insertPayload)
        .select("order_code,pin,last4,status,created_at")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Could not create order.");

      setCreated(data as CreatedOrder);

      // ✅ بعد إنشاء الطلب: فرّغ السلة
      clearCart();
      setItems([]);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="font-bold">Checkout</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/">
              Home
            </Link>
            <Link className="hover:underline" href="/cart">
              Cart
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <div className="bg-white border rounded-2xl p-5">
          {!items.length ? (
            <div className="text-sm text-neutral-600">
              السلة فاضية. روح للمنتجات واضف 👍
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it.product_id}
                    className="flex items-center justify-between text-sm border rounded-xl p-3"
                  >
                    <div className="font-medium">{it.name}</div>
                    <div className="text-neutral-600">
                      {it.qty} × ${it.unit_price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="font-bold">Total</div>
                <div className="font-bold">${total.toFixed(2)} USD</div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-1">Last 4 digits (اختياري)</div>
                <input
                  value={last4}
                  onChange={(e) => setLast4(e.target.value)}
                  placeholder="مثال: 3333"
                  className="w-full border rounded-xl px-3 py-2"
                />
              </div>

              <button
                onClick={placeOrder}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800"
              >
                {loading ? "Placing order..." : "Place order"}
              </button>
            </>
          )}
        </div>

        {err && (
          <div className="bg-white border rounded-2xl p-5 text-sm">
            ❌ {err}
          </div>
        )}

        {created && (
          <div className="bg-white border rounded-2xl p-5 space-y-2">
            <div className="font-bold">Order created ✅</div>
            <div className="text-sm">Order Code: <b>{created.order_code}</b></div>
            <div className="text-sm">PIN: <b>{created.pin}</b></div>
            <div className="text-sm">Last4: <b>{created.last4 ?? "----"}</b></div>

            <Link
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
              href={`/track?order=${created.order_code}&pin=${created.pin}`}
            >
              Track this order
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
