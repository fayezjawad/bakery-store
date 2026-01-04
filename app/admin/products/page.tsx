"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

  const [list, setList] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("products")
      .select("id,name,price,currency,image_url,is_active,created_at")
      .order("created_at", { ascending: false });

    setList((data ?? []) as any);
  };

  // ✅ Guard
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

      setChecking(false);
      await load();
    })();
  }, [router]);

  const uploadImage = async () => {
    if (!file) return null;

    const ext = file.name.split(".").pop();
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
    try {
      const imageUrl = await uploadImage();

      const { error } = await supabase.from("products").insert({
        name,
        description: desc,
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

      setMsg("✅ Product added");
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    }
  };

  const toggleActive = async (p: Product) => {
    setMsg(null);
    const { error } = await supabase
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);

    if (error) setMsg(`❌ ${error.message}`);
    await load();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-sm text-neutral-600">Checking admin access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-bold">Admin • Products</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/admin">
              Admin
            </Link>
            <Link className="hover:underline" href="/">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Add product</h3>

          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full border rounded-xl px-3 py-2"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Price (USD)</label>
              <input
                type="number"
                className="w-full border rounded-xl px-3 py-2"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <button
              onClick={add}
              className="w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800"
            >
              Save
            </button>

            {msg && <div className="text-sm bg-neutral-50 border rounded-xl p-3">{msg}</div>}
          </div>
        </section>

        <section className="bg-white border rounded-2xl p-5">
          <h3 className="font-semibold mb-3">All products</h3>

          <div className="space-y-3">
            {list.map((p) => (
              <div
                key={p.id}
                className="border rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-sm text-neutral-600">
                    ${Number(p.price).toFixed(2)} {p.currency} • {p.is_active ? "Active" : "Hidden"}
                  </div>
                </div>

                <button
                  onClick={() => toggleActive(p)}
                  className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
                >
                  {p.is_active ? "Hide" : "Activate"}
                </button>
              </div>
            ))}

            {!list.length && <div className="text-sm text-neutral-600">No products.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
