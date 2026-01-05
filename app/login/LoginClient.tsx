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
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) return setErr(error.message);

    router.replace(next);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-sm text-neutral-600 mt-1">Sign in to continue</p>

        <div className="mt-5 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full border rounded-xl px-3 py-2"
              placeholder="••••••••"
            />
          </div>

          {err && (
            <div className="text-sm border rounded-xl p-3 bg-neutral-50">
              ❌ {err}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <Link className="block text-center text-sm hover:underline" href="/">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
