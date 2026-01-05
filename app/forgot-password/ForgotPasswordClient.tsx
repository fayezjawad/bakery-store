"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthBackground from "@/components/AuthBackground";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    setErr(null);
    setMsg(null);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    setLoading(false);

    if (error) return setErr(error.message);

    setMsg("If this email exists, a reset link has been sent.");
  };

  return (
    <AuthBackground image="/login-bg.png">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-black/30 backdrop-blur">
            
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-orange-300">
            Forgot Password
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Enter your email to receive a reset link
          </p>
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
              onClick={send}
              disabled={loading}
              className="w-full rounded-2xl py-3 font-semibold text-black
                         bg-gradient-to-r from-orange-500 to-amber-400
                         hover:from-orange-400 hover:to-amber-300
                         disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-white/70 hover:text-white">
                Back to Login
              </Link>
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
