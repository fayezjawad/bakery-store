"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthBackground from "@/components/AuthBackground";

export default function ResetPasswordClient() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // لما المستخدم يجي من ايميل Supabase، غالبًا رح يكون عنده session على نفس الصفحة
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setReady(true);
    })();
  }, []);

  const update = async () => {
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) return setErr(error.message);

    setMsg("Password updated successfully. Please login again.");

    // يفضل sign out ثم تحويل لـ login
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <AuthBackground image="/login-bg.png">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-black/30 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-sm text-white/80">Smart Bakery</span>
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-orange-300">
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-white/70">Set a new password</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/45 backdrop-blur-xl shadow-2xl p-6">
          {!ready ? (
            <div className="text-sm text-white/70">Loading...</div>
          ) : !hasSession ? (
            <div className="space-y-3">
              <div className="text-sm rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                ❌ Invalid or expired reset link. Please request a new one.
              </div>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-orange-300"
              >
                Request new reset link
              </Link>
              <div className="text-center text-sm">
                <Link href="/" className="text-white/70 hover:text-white">
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70">New Password</label>
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
                onClick={update}
                disabled={loading}
                className="w-full rounded-2xl py-3 font-semibold text-black
                           bg-gradient-to-r from-orange-500 to-amber-400
                           hover:from-orange-400 hover:to-amber-300
                           disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
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
          )}
        </div>

        <div className="text-center text-xs text-white/35 mt-6">
          © 2026 Smart Bakery
        </div>
      </div>
    </AuthBackground>
  );
}
