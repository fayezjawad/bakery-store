"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: string;
  currency: string;
};

type CartItem = { product: Product; qty: number };

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [created, setCreated] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        location.href = "/login";
        return;
      }

      const { data } = await supabase
        .from("products")
        .select("id,name,price,currency")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setProducts((data ?? []) as any);
    })();
  }, []);

  const total = useMemo(() => {
    return cart.reduce((sum, it) => sum + Number(it.product.price) * it.qty, 0);
  }, [cart]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const setQty = (id: number, qty: number) => {
    setCart((prev) => prev
      .map((x) => (x.product.id === id ? { ...x, qty } : x))
      .filter((x) => x.qty > 0)
    );
  };

  const submitOrder = async () => {
    setMsg(null);
    setCreated(null);

    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) {
      setMsg("❌ لازم تسجل دخول");
      return;
    }
    if (!cart.length) {
      setMsg("❌ السلة فاضية");
      return;
    }

    try {
      // 1) Create order
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: customerName,
          phone,
          total_price: total,
          currency: "USD",
          status: "new",
          payment_status: "unpaid",
          notes,
        })
        .select("id, order_code, tracking_pin, phone_last4, total_price, currency, status, created_at")
        .single();

      if (oErr) throw oErr;

      // 2) Create items
      const itemsPayload = cart.map((it) => ({
        order_id: order.id,
        item_type: "product",
        product_id: it.product.id,
        qty: it.qty,
        unit_price: Number(it.product.price),
      }));

      const { error: iErr } = await supabase.from("order_items").insert(itemsPayload);
      if (iErr) throw iErr;

      setCreated(order);
      setMsg("✅ Order created!");

    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    }
  };

  const waLink = useMemo(() => {
    if (!created) return null;
    const wa = process.env.NEXT_PUBLIC_BAKERY_WHATSAPP || "";
    const base = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
    const text =
      `New Order ✅\n` +
      `Order Code: ${created.order_code}\n` +
      `PIN: ${created.tracking_pin}\n` +
      `Last4: ${created.phone_last4}\n` +
      `Total: $${Number(created.total_price).toFixed(2)} ${created.currency}\n\n` +
      `Track:\n${base}/track?code=${created.order_code}`;

    return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  }, [created]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-bold">Checkout</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/">Home</Link>
            <Link className="hover:underline" href="/my-orders">My Orders</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Choose products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="text-left border rounded-xl p-3 hover:bg-neutral-50"
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-neutral-600">
                  ${Number(p.price).toFixed(2)} {p.currency}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Click to add</div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Your cart</h3>

          <div className="space-y-3">
            {cart.map((it) => (
              <div key={it.product.id} className="flex items-center justify-between border rounded-xl p-3">
                <div>
                  <div className="font-medium">{it.product.name}</div>
                  <div className="text-sm text-neutral-600">
                    ${Number(it.product.price).toFixed(2)} USD
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  value={it.qty}
                  onChange={(e) => setQty(it.product.id, Number(e.target.value))}
                  className="w-20 border rounded-lg px-2 py-1"
                />
              </div>
            ))}
            {!cart.length && <div className="text-sm text-neutral-600">Cart is empty.</div>}
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="font-bold">Total: ${total.toFixed(2)} USD</div>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-sm font-medium">Customer name</label>
                <input className="w-full border rounded-xl px-3 py-2" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input className="w-full border rounded-xl px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665..." />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea className="w-full border rounded-xl px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <button
                onClick={submitOrder}
                className="w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800"
              >
                Create Order
              </button>

              {msg && <div className="text-sm bg-neutral-50 border rounded-xl p-3">{msg}</div>}

              {created && (
                <div className="bg-white border rounded-2xl p-4">
                  <div className="font-semibold mb-2">Order created ✅</div>
                  <div className="text-sm space-y-1">
                    <div><b>Order Code:</b> {created.order_code}</div>
                    <div><b>PIN:</b> {created.tracking_pin}</div>
                    <div><b>Last4:</b> {created.phone_last4}</div>
                  </div>

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      className="mt-3 inline-block w-full text-center rounded-xl bg-green-600 text-white py-2.5 font-medium hover:bg-green-700"
                    >
                      Send summary on WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
