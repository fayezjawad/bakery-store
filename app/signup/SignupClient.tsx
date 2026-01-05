"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthBackground from "@/components/AuthBackground";

export default function SignupClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/", [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) return setErr(error.message);

    // إذا عندك Email Confirmation مفعّل: المستخدم يحتاج يفتح الإيميل
    setMsg("Account created. If email confirmation is enabled, check your inbox.");
    router.replace(next);
  };

  return (
    <AuthBackground image="/login-bg.png">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-black/30 backdrop-blur">
            
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-orange-300">
            Create Account
          </h1>
          <p className="mt-1 text-sm text-white/70">Sign up to get started</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/45 backdrop-blur-xl shadow-2xl p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none text-white placeholder-white/40 focus:border-orange-400/60"
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Password</label>
              <div className="mt-2 relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={show ? "text" : "password"}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 pr-24 outline-none text-white placeholder-white/40 focus:border-orange-400/60"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white/80"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {err && (
              <div className="text-sm rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                ❌ {err}
              </div>
            )}

            {msg && (
              <div className="text-sm rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                ✅ {msg}
              </div>
            )}

            <button
              onClick={signup}
              disabled={loading}
              className="w-full rounded-2xl py-3 font-semibold text-black
                         bg-gradient-to-r from-orange-500 to-amber-400
                         hover:from-orange-400 hover:to-amber-300
                         disabled:opacity-60"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <div className="text-center text-sm text-white/60">
              Already have an account?
              <div className="mt-2">
                <Link
                  href={`/login?next=${encodeURIComponent(next)}`}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-orange-300"
                >
                  Login
                </Link>
              </div>
            </div>

            <div className="text-center text-sm">
              <Link href="/" className="text-white/70 hover:text-white">
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-white/35 mt-6">
          © 2026 Smart Bakery
        </div>
      </div>
    </AuthBackground>
  );
}
