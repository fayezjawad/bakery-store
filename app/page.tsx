"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { addToCart, bindCartToUser, cartCount } from "@/lib/cart";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700"] });

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  currency: string | null;
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
    bindCartToUser(null);
    setEmail(null);
    setRole(null);
    router.refresh();
  };

  const pill =
    "px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition";

  return (
    <div className="min-h-screen text-neutral-100">
      {/* Header ONLY on Home */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(10,6,5,.65)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(255,255,255,.10)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className={`${cinzel.className} uppercase tracking-[0.22em] text-[18px] font-bold text-neutral-100`}
          >
            Smart Bakery
          </Link>

          <nav className="flex items-center gap-3 flex-wrap text-sm">
            <Link href="/cart" className={pill}>
              Cart ({count})
            </Link>


            <Link href="/track" className={pill}>
              Track Order
            </Link>

            <Link href="/custom-cake" className={pill}>
              Cake Builder
            </Link>

            {email ? (
              <>
                <Link href="/checkout" className={pill}>
                  Checkout
                </Link>

                <Link href="/my-orders" className={pill}>
                  My Orders
                </Link>

                {role === "admin" && (
                  <Link href="/admin" className={pill}>
                    Admin
                  </Link>
                )}

                <button onClick={logout} className={pill}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={pill}>
                  Login
                </Link>
                <Link href="/signup" className={pill}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="border border-white/10 rounded-3xl p-6 md:p-8 bg-black/30 backdrop-blur">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Smart Bakery
          </h1>
          <p className="mt-2 text-sm md:text-base text-neutral-200/80 max-w-2xl">
            Pick your favorites or build a custom cake — clean, premium, and dark.
          </p>
        </div>
      </section>

      {/* Products */}
      <main className="max-w-6xl mx-auto px-6 pb-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold">Products</h2>
          <div className="text-xs text-neutral-200/60">
            {products.length ? `${products.length} items` : ""}
          </div>
        </div>

        {!products.length ? (
          <div className="border border-white/10 rounded-2xl p-5 text-sm text-neutral-200/80 bg-black/25 backdrop-blur">
            No products yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl overflow-hidden border border-white/10 bg-black/25 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-white/5" />
                )}

                <div className="p-4">
                  <div className="font-semibold truncate">{p.name}</div>

                  <div className="text-sm text-neutral-200/75 mt-1 min-h-[40px]">
                    {p.description}
                  </div>

                  <div className="mt-3 font-bold">
                    ${Number(p.price).toFixed(2)} {p.currency ?? "USD"}
                  </div>

                  <button
                    onClick={() => {
                      addToCart({
                        product_id: p.id,
                        name: p.name,
                        unit_price: Number(p.price),
                        currency: p.currency ?? "USD",
                        image_url: p.image_url,
                      });
                      refreshCount();
                    }}
                    className="mt-3 w-full rounded-xl py-2.5 font-semibold text-neutral-100 border border-white/10 bg-white/5 hover:bg-white/10 transition"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
