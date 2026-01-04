"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push("/");
    })();
  }, [router]);

  const submit = async () => {
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setMsg("✅ تم إنشاء الحساب. الآن سجّل دخول.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-neutral-900 text-white grid place-items-center font-bold">
              B
            </div>
            <h1 className="text-2xl font-semibold">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {mode === "login"
                ? "Login to continue to the bakery app."
                : "Sign up to place and track your orders."}
            </p>
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Full name
                </label>
                <input
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jamal"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Minimum 6 characters.
              </p>
            </div>

            <button
              onClick={submit}
              disabled={loading || !email || !password || (mode === "signup" && !fullName)}
              className="w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>

            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setMsg(null);
              }}
              className="w-full rounded-xl border border-neutral-300 py-2.5 font-medium hover:bg-neutral-50 transition"
            >
              {mode === "login" ? "Create new account" : "I already have an account"}
            </button>

            {msg && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                {msg}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-4">
          Bakery App • USD Pricing • Order Tracking
        </p>
      </div>
    </div>
  );
}
