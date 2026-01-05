"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: string;
  currency: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);

  const [list, setList] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const counts = useMemo(() => {
    let active = 0;
    let hidden = 0;
    for (const p of list) p.is_active ? active++ : hidden++;
    return { active, hidden, total: list.length };
  }, [list]);

  const load = async () => {
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,currency,image_url,is_active,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(`❌ ${error.message}`);
      setList([]);
      setLoading(false);
      return;
    }

    setList((data ?? []) as any);
    setLoading(false);
  };

  // ✅ Guard
  useEffect(() => {
    (async () => {
      setChecking(true);

      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user ?? null;

      if (!user) {
        router.replace("/login?next=/admin/products");
        return;
      }

      const { data: pr, error: prErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (prErr) {
        setMsg(`❌ ${prErr.message}`);
        setChecking(false);
        return;
      }

      if (pr?.role !== "admin") {
        router.replace("/");
        return;
      }

      setChecking(false);
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const uploadImage = async () => {
    if (!file) return null;

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const add = async () => {
    setMsg(null);

    if (!name.trim()) {
      setMsg("❌ Please enter a product name.");
      return;
    }
    if (!Number(price) || Number(price) <= 0) {
      setMsg("❌ Please enter a valid price.");
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadImage();

      const { error } = await supabase.from("products").insert({
        name: name.trim(),
        description: desc.trim() || null,
        price,
        currency: "USD",
        image_url: imageUrl,
        is_active: true,
      });

      if (error) throw error;

      setName("");
      setDesc("");
      setPrice(0);
      setFile(null);

      setMsg("✅ Product added.");
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Product) => {
    setMsg(null);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !p.is_active })
        .eq("id", p.id);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-white/70">Checking admin access...</div>
      </div>
    );
  }

  return (
    <Shell
      title="Manage Products"
      subtitle="Add products, upload images, and toggle visibility."
      max="max-w-6xl"
    >
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/admin" className="dc-btn dc-btn-ghost">
          ← Admin Home
        </Link>
        <Link href="/" className="dc-btn dc-btn-ghost">
          Home
        </Link>

        <div className="ml-auto flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full border text-sm bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            Active: {counts.active}
          </span>
          <span className="px-3 py-1 rounded-full border text-sm bg-amber-500/10 text-amber-300 border-amber-500/30">
            Hidden: {counts.hidden}
          </span>
          <span className="px-3 py-1 rounded-full border text-sm bg-sky-500/10 text-sky-300 border-sky-500/30">
            Total: {counts.total}
          </span>
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Add Product */}
        <section className="lg:col-span-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Product</h3>
              <span className="text-xs text-white/50">USD</span>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="text-sm text-white/70">Name</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-violet-500/40"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Butter Croissant"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Description</label>
                <textarea
                  className="mt-1 min-h-[96px] w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-violet-500/40"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Short description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/70">Price</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-violet-500/40"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:px-3 file:py-2 file:text-white/80 hover:file:bg-white/10"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <button
                onClick={add}
                disabled={saving}
                className="mt-2 w-full rounded-2xl bg-violet-500 px-4 py-3 font-semibold text-black hover:opacity-95 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Product"}
              </button>

              <p className="text-xs text-white/50">
                Tip: keep images under 1MB for faster loading.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT: Products table */}
        <section className="lg:col-span-7">
          <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 bg-white/5">
              <div>
                <h3 className="text-lg font-semibold">All Products</h3>
                <p className="text-sm text-white/60">
                  Toggle visibility (active/hidden).
                </p>
              </div>
              <button
                onClick={load}
                className="dc-btn dc-btn-ghost"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {/* header row */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-sm text-white/60 bg-white/5">
              <div className="col-span-6">Product</div>
              <div className="col-span-3">Price</div>
              <div className="col-span-3 text-right">Action</div>
            </div>

            {loading ? (
              <div className="px-4 py-6 text-sm text-white/60">Loading...</div>
            ) : !list.length ? (
              <div className="px-4 py-6 text-sm text-white/60">No products.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {list.map((p) => (
                  <div key={p.id} className="px-4 py-4">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-6 min-w-0 flex items-center gap-3">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-12 w-12 rounded-2xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10" />
                        )}

                        <div className="min-w-0">
                          <div className="font-semibold truncate">{p.name}</div>
                          <div className="text-xs text-white/50">
                            {p.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
                                Hidden
                              </span>
                            )}
                            <span className="ml-2">
                              • {new Date(p.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 font-semibold text-white/90">
                        ${Number(p.price).toFixed(2)} {p.currency}
                      </div>

                      <div className="col-span-3 flex justify-end">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`px-3 py-1.5 rounded-xl border text-sm transition ${
                            p.is_active
                              ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/80"
                              : "bg-violet-500/10 hover:bg-violet-500/15 border-violet-400/30 text-violet-200"
                          }`}
                        >
                          {p.is_active ? "Hide" : "Activate"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Shell>
  );
}
