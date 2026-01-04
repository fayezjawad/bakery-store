"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { addToCart } from "../../lib/cart";


type Opt = {
  id: number;
  type: "size" | "flavor" | "filling" | "topping";
  name: string;
  price: string;
  sort: number;
};

export default function CustomCakePage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [sizes, setSizes] = useState<Opt[]>([]);
  const [flavors, setFlavors] = useState<Opt[]>([]);
  const [fillings, setFillings] = useState<Opt[]>([]);
  const [toppings, setToppings] = useState<Opt[]>([]);

  const [sizeId, setSizeId] = useState<number | null>(null);
  const [flavorId, setFlavorId] = useState<number | null>(null);
  const [fillingId, setFillingId] = useState<number | null>(null);
  const [toppingId, setToppingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);

  // ✅ image upload
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const u = s.session?.user;
      if (!u) {
        window.location.assign("/login");
        return;
      }
      setUserId(u.id);

      const { data, error } = await supabase
        .from("cake_options")
        .select("id,type,name,price,sort")
        .eq("is_active", true)
        .order("sort", { ascending: true });

      if (error) {
        setErr(error.message);
        return;
      }

      const all = (data ?? []) as Opt[];
      const sList = all.filter((x) => x.type === "size");
      const fList = all.filter((x) => x.type === "flavor");
      const fiList = all.filter((x) => x.type === "filling");
      const tList = all.filter((x) => x.type === "topping");

      setSizes(sList);
      setFlavors(fList);
      setFillings(fiList);
      setToppings(tList);

      setSizeId(sList[0]?.id ?? null);
      setFlavorId(fList[0]?.id ?? null);
      setFillingId(fiList[0]?.id ?? null);
      setToppingId(tList[0]?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const find = (list: Opt[], id: number | null) => list.find((x) => x.id === id);

  const unitPrice = useMemo(() => {
    const s = Number(find(sizes, sizeId)?.price ?? 0);
    const f = Number(find(flavors, flavorId)?.price ?? 0);
    const fi = Number(find(fillings, fillingId)?.price ?? 0);
    const t = Number(find(toppings, toppingId)?.price ?? 0);
    return s + f + fi + t;
  }, [sizes, flavors, fillings, toppings, sizeId, flavorId, fillingId, toppingId]);

  const title = useMemo(() => {
    const s = find(sizes, sizeId)?.name ?? "—";
    const f = find(flavors, flavorId)?.name ?? "—";
    const fi = find(fillings, fillingId)?.name ?? "—";
    const t = find(toppings, toppingId)?.name ?? "—";
    const msg = message.trim() ? ` | Msg: "${message.trim()}"` : "";
    return `Custom Cake: ${s} / ${f} / ${fi} / ${t}${msg}`;
  }, [sizes, flavors, fillings, toppings, sizeId, flavorId, fillingId, toppingId, message]);

  const uploadImage = async () => {
    if (!file) return null;

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("custom-cake-images")
      .upload(path, file, { upsert: false });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from("custom-cake-images").getPublicUrl(path);
    return data.publicUrl; // ✅ public URL
  };

  const add = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const imageUrl = await uploadImage();

      // Save full selections in DB
      const { error } = await supabase.from("custom_cakes").insert({
        user_id: userId,
        size_id: sizeId,
        flavor_id: flavorId,
        filling_id: fillingId,
        topping_id: toppingId,
        message,
        qty,
        unit_price: unitPrice,
        currency: "USD",
        image_url: imageUrl,
      });

      if (error) throw error;

      // Add to cart as special item (negative id)
      const fakeId = -Date.now();

      addToCart(
        {
          product_id: fakeId,
          name: title,
          unit_price: unitPrice,
          currency: "USD",
          image_url: imageUrl, // ✅ تظهر في السلة
        },
        Math.max(1, qty),
        userId
      );

      window.location.assign("/cart");
    } catch (e: any) {
      alert(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (err) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white border rounded-xl p-4 text-sm">❌ {err}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="font-bold">Customize Cake</div>
          <div className="flex gap-3 text-sm">
            <Link className="hover:underline" href="/">Home</Link>
            <Link className="hover:underline" href="/cart">Cart</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <Field label="Size">
            <Select value={sizeId ?? ""} onChange={(v) => setSizeId(Number(v))} options={sizes} />
          </Field>

          <Field label="Flavor">
            <Select value={flavorId ?? ""} onChange={(v) => setFlavorId(Number(v))} options={flavors} />
          </Field>

          <Field label="Filling">
            <Select value={fillingId ?? ""} onChange={(v) => setFillingId(Number(v))} options={fillings} />
          </Field>

          <Field label="Topping">
            <Select value={toppingId ?? ""} onChange={(v) => setToppingId(Number(v))} options={toppings} />
          </Field>

          <Field label="Cake message (optional)">
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>

          <Field label="Upload image (optional)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="mt-3 h-40 w-full object-cover rounded-xl border" />
            )}
          </Field>

          <Field label="Quantity">
            <input
              type="number"
              min={1}
              className="w-full border rounded-xl px-3 py-2"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </Field>

          <div className="border-t pt-4 flex items-center justify-between">
            <div className="font-semibold">Unit Price</div>
            <div className="font-bold">${unitPrice.toFixed(2)} USD</div>
          </div>

          <button
            onClick={add}
            disabled={saving}
            className="w-full rounded-xl bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add custom cake to cart"}
          </button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: any;
  onChange: (v: string) => void;
  options: Opt[];
}) {
  return (
    <select
      className="w-full border rounded-xl px-3 py-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
          {Number(x.price) ? ` (+$${Number(x.price).toFixed(2)})` : ""}
        </option>
      ))}
    </select>
  );
}
