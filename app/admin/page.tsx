"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: pr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (pr?.role !== "admin") {
        router.replace("/");
        return;
      }

      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-sm text-neutral-600">Checking admin access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="font-bold">Admin</div>
          <Link className="text-sm hover:underline" href="/">
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <div className="mt-4 grid gap-3">
          <Link className="bg-white border rounded-2xl p-4 hover:bg-neutral-50" href="/admin/products">
            Manage Products
          </Link>
          <Link className="bg-white border rounded-2xl p-4 hover:bg-neutral-50" href="/admin/orders">
            Manage Orders
          </Link>
        </div>

        <p className="text-xs text-neutral-500 mt-6">
          Access restricted to admins only.
        </p>
      </main>
    </div>
  );
}
