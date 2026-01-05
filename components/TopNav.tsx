"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { bindCartToUser, cartCount } from "@/lib/cart";

export default function TopNav({ brandClassName = "" }: { brandClassName?: string }) {
  const router = useRouter();

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
    })();
  }, []);

  const goLogin = (nextPath: string) => {
    const next = encodeURIComponent(nextPath);
    router.push(`/login?next=${next}`);
  };

  const requireAuth =
    (nextPath: string) =>
    (e: React.MouseEvent) => {
      
      if (!email) {
        e.preventDefault();
        goLogin(nextPath);
      }
    };

  const logout = async () => {
    await supabase.auth.signOut();
    bindCartToUser(null);
    setEmail(null);
    setRole(null);

   
    router.replace("/");
    router.refresh();
  };

  const pill =
    "px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition";

  return (
   <header
  className="sticky top-0 z-50 border-b"
  style={{
    background: "rgba(10,6,5,.65)",
    backdropFilter: "blur(10px)",
    borderColor: "rgba(255,255,255,.10)",
  }}
>

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href="/"
          className={`${brandClassName} uppercase tracking-[0.22em] text-[18px] font-bold text-neutral-100`}
        >
          Smart Bakery
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-3 flex-wrap text-sm">
          <Link href="/" className={pill}>
           Shopping
          </Link>

          <Link href="/cart" className={pill} onClick={requireAuth("/cart")}>
            Cart ({count})
          </Link>

          <Link href="/track" className={pill} onClick={requireAuth("/track")}>
            Track Order
          </Link>

          <Link
            href="/custom-cake"
            className={pill}
            onClick={requireAuth("/custom-cake")}
          >
            Cake Builder
          </Link>

          {email ? (
            <>
              <Link
                href="/checkout"
                className={pill}
                onClick={requireAuth("/checkout")}
              >
                Checkout
              </Link>

              <Link
                href="/my-orders"
                className={pill}
                onClick={requireAuth("/my-orders")}
              >
                My Orders
              </Link>

              {role === "admin" && (
                <Link
                  href="/admin"
                  className={pill}
                  onClick={requireAuth("/admin")}
                >
                  Admin
                </Link>
              )}

              <button onClick={logout} className={pill} type="button">
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Login / Signup */}
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
  );
}
