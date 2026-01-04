"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { addToCart, cartCount } from "../lib/cart";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  image_url: string | null;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [count, setCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const refreshCount = (uid?: string | null) => setCount(cartCount(uid ?? null));

  useEffect(() => {
    const onUpdate = () => refreshCount(userId);
    window.addEventListener("cart_updated", onUpdate);
    return () => window.removeEventListener("cart_updated", onUpdate);
  }, [userId]);

  useEffect(() => {
    (async () => {
      setErr(null);

      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      setEmail(user?.email ?? null);
      setUserId(user?.id ?? null);

      if (user) {
        const { data: pr, error: prErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (prErr) console.log("profiles error:", prErr);
        setRole(pr?.role ?? null);
      } else {
        setRole(null);
      }

      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,currency,image_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("products error:", error);
        setErr(error.message);
        setProducts([]);
      } else {
        setProducts((data ?? []) as any);
      }

      refreshCount(user?.id ?? null);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setRole(null);
    setUserId(null);
    setCount(0);
    window.location.assign("/");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-bold text-xl">Bakery</div>

          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:underline" href="/cart">
              Cart ({count})
            </Link>

            {/* ✅ الرابط الجديد */}
            <Link className="hover:underline" href="/custom-cake">
              Customize Cake
            </Link>

            <Link className="hover:underline" href="/track">
              Track
            </Link>

            {email ? (
              <>
                <Link className="hover:underline" href="/checkout">
                  Checkout
                </Link>

                <Link className="hover:underline" href="/my-orders">
                  My Orders
                </Link>

                {role === "admin" && (
                  <Link className="hover:underline" href="/admin">
                    Admin
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white"
                href="/login"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>

        {err && (
          <div className="mb-4 text-sm bg-white border rounded-xl p-3">
            ❌ {err}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white border rounded-2xl overflow-hidden shadow-sm"
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-neutral-100" />
              )}

              <div className="p-4">
                <div className="font-semibold">{p.name}</div>

                <div className="text-sm text-neutral-600 mt-1 min-h-[40px]">
                  {p.description}
                </div>

                <div className="mt-3 font-bold">
                  ${Number(p.price).toFixed(2)} {p.currency}
                </div>

                <button
                  onClick={() => {
                    if (!userId) {
                      window.location.assign("/login");
                      return;
                    }

                    addToCart(
                      {
                        product_id: p.id,
                        name: p.name,
                        unit_price: Number(p.price),
                        currency: "USD",
                        image_url: p.image_url,
                      },
                      1,
                      userId
                    );
                    refreshCount(userId);
                  }}
                  className="mt-3 w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800"
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}

          {!products.length && !err && (
            <div className="text-sm text-neutral-600">No products yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
