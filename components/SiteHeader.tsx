"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { bindCartToUser, cartCount } from "@/lib/cart";
import { Cinzel, Inter } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function SiteHeader() {
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

    // لو صار login/logout بدون refresh
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
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
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    bindCartToUser(null);
    setEmail(null);
    setRole(null);
    router.refresh();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50">
      <div
        className="border-b"
        style={{
          background: "rgba(10,6,5,.72)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(255,255,255,.10)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className={`${cinzel.className} tracking-[0.35em] text-sm md:text-base text-neutral-100/95`}
          >
            SMART BAKERY
          </Link>

          <nav className={`${inter.className} flex items-center justify-end gap-2 flex-wrap text-sm`}>
            <PillLink href="/cart">Cart ({count})</PillLink>
            <PillLink href="/track">Track Order</PillLink>
            <PillLink href="/custom-cake">Cake Builder</PillLink>

            {email ? (
              <>
                <PillLink href="/checkout">Checkout</PillLink>
                <PillLink href="/my-orders">My Orders</PillLink>

                {role === "admin" && <PillLink href="/admin">Admin</PillLink>}

                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-full border bg-white/5 hover:bg-white/10 transition"
                  style={{ borderColor: "rgba(255,255,255,.14)" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <PillLink href="/login">Login</PillLink>
                <PillLink href="/signup">Sign Up</PillLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function PillLink({ href, children }: { href: string; children: any }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-full border bg-white/5 hover:bg-white/10 transition"
      style={{ borderColor: "rgba(255,255,255,.14)" }}
    >
      {children}
    </Link>
  );
}
