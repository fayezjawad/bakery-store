"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (loading) return;

    setLoading(true);
    setErr(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErr(error.message);
        return;
      }

      // تأكيد إن السيشن انحفظ قبل الانتقال (يفيد لو في تأخير بسيط)
      await supabase.auth.getSession();

      router.replace(next);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.55)] p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-sm text-neutral-200/70 mt-1">Sign in to continue</p>

        <div className="mt-5 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/40"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/40"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {err && (
            <div className="text-sm border border-white/10 rounded-2xl p-3 bg-black/30">
              ❌ {err}
            </div>
          )}

          <button
            type="button"
            onClick={login}
            disabled={loading}
            className="w-full rounded-2xl py-3 font-semibold text-black disabled:opacity-60"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,170,90,0.95), rgba(245,120,35,0.95))",
              boxShadow: "0 10px 30px rgba(245,120,35,0.22)",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link className="hover:underline text-neutral-200/80" href="/forgot-password">
              Forgot Password?
            </Link>
            <Link className="hover:underline text-neutral-200/80" href="/signup">
              Sign Up
            </Link>
          </div>

          <Link className="block text-center text-sm hover:underline text-neutral-200/70" href="/">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
