"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { addToCart, bindCartToUser, cartCount } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  image_url: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const refreshCount = () => setCount(cartCount());

  useEffect(() => {
    refreshCount();
    const onUpdate = () => refreshCount();
    window.addEventListener("cart_updated", onUpdate);
    return () => window.removeEventListener("cart_updated", onUpdate);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      setEmail(user?.email ?? null);
      bindCartToUser(user?.id ?? null);

      if (user) {
        const { data: pr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setRole(pr?.role ?? null);
      } else {
        setRole(null);
      }

      const { data } = await supabase
        .from("products")
        .select("id,name,description,price,currency,image_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setProducts((data ?? []) as any);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setRole(null);
    router.refresh();
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

            <Link className="hover:underline" href="/track">
              Track
            </Link>

            <Link className="hover:underline" href="/custom-cake">
              Customize Cake
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
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
                    addToCart({
                      product_id: p.id,
                      name: p.name,
                      unit_price: Number(p.price),
                      currency: p.currency || "USD",
                      image_url: p.image_url,
                    });
                    refreshCount();
                  }}
                  className="mt-3 w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800"
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}

          {!products.length && (
            <div className="text-sm text-neutral-600">No products yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
