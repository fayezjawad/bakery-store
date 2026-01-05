"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";

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
  const [rush, setRush] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Optional image upload
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const u = s.session?.user;

      // Redirect unauthenticated users to login (preserve return path)
      if (!u) {
        window.location.assign("/login?next=/custom-cake");
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

      // Preselect first options (if any)
      setSizeId(sList[0]?.id ?? null);
      setFlavorId(fList[0]?.id ?? null);
      setFillingId(fiList[0]?.id ?? null);
      setToppingId(tList[0]?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    // Build a local preview URL when a file is selected
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const find = (list: Opt[], id: number | null) => list.find((x) => x.id === id);

  const selectedSize = useMemo(() => find(sizes, sizeId), [sizes, sizeId]);
  const selectedFlavor = useMemo(() => find(flavors, flavorId), [flavors, flavorId]);
  const selectedFilling = useMemo(() => find(fillings, fillingId), [fillings, fillingId]);
  const selectedTopping = useMemo(() => find(toppings, toppingId), [toppings, toppingId]);

  const unitPrice = useMemo(() => {
    const s = Number(selectedSize?.price ?? 0);
    const f = Number(selectedFlavor?.price ?? 0);
    const fi = Number(selectedFilling?.price ?? 0);
    const t = Number(selectedTopping?.price ?? 0);

    // Example rush fee (customize as needed)
    const rushFee = rush ? 5 : 0;

    return s + f + fi + t + rushFee;
  }, [selectedSize, selectedFlavor, selectedFilling, selectedTopping, rush]);

  const estimated = useMemo(() => unitPrice * Math.max(1, qty), [unitPrice, qty]);

  const title = useMemo(() => {
    const s = selectedSize?.name ?? "—";
    const f = selectedFlavor?.name ?? "—";
    const fi = selectedFilling?.name ?? "—";
    const t = selectedTopping?.name ?? "—";
    const msg = message.trim() ? ` | Msg: "${message.trim()}"` : "";
    const rushTxt = rush ? " | Rush" : "";
    return `Custom Cake: ${s} / ${f} / ${fi} / ${t}${rushTxt}${msg}`;
  }, [selectedSize, selectedFlavor, selectedFilling, selectedTopping, message, rush]);

  const uploadImage = async () => {
    // No file selected
    if (!file) return null;

    // Validate mime type
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      throw new Error("Please upload a JPG, PNG, or WEBP image.");
    }

    // Validate size (2MB max)
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error("Image is too large. Max size is 2MB.");
    }

    // Create a stable unique filename
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const id =
      (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // Organize files under a user folder to reduce collisions
    const folder = userId ? `${userId}` : "anonymous";
    const path = `${folder}/${id}.${ext}`;

    const { error: upErr } = await supabase.storage.from("custom-cake-images").upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (upErr) throw upErr;

    // Return a public URL (make sure bucket policy allows it)
    const { data } = supabase.storage.from("custom-cake-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const add = async () => {
    if (!userId) return;

    setSaving(true);
    setErr(null);

    try {
      const imageUrl = await uploadImage();

      const { error } = await supabase.from("custom_cakes").insert({
        user_id: userId,
        size_id: sizeId,
        flavor_id: flavorId,
        filling_id: fillingId,
        topping_id: toppingId,
        message,
        qty: Math.max(1, qty),
        unit_price: unitPrice,
        currency: "USD",
        image_url: imageUrl,
        rush,
      });

      if (error) throw error;

      // Client-side cart item id (negative to avoid collisions with real product IDs)
      const clientId = -Date.now();

      addToCart({
        product_id: clientId,
        name: title,
        unit_price: unitPrice,
        currency: "USD",
        image_url: imageUrl,
        qty: Math.max(1, qty),
      });

      // Go to cart after adding
      window.location.assign("/cart");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl px-4 py-3 bg-white/5 border border-white/10 outline-none focus:border-white/20";
  const selectCls =
    "w-full rounded-2xl px-4 py-3 bg-white/5 border border-white/10 outline-none focus:border-white/20";

  return (
    <Shell title="Build Your Cake" subtitle="Customize your cake and see live pricing." max="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: FORM */}
        <div className="dc-card p-6">
          {err && (
            <div className="dc-card-strong p-4 mb-4 text-sm">
              ❌ {err}
            </div>
          )}

          <div className="space-y-4">
            <Field label="Size">
              <select
                className={selectCls}
                value={sizeId ?? ""}
                onChange={(e) => setSizeId(Number(e.target.value))}
              >
                {sizes.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {Number(x.price) ? ` (+$${Number(x.price).toFixed(2)})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Flavor">
              <select
                className={selectCls}
                value={flavorId ?? ""}
                onChange={(e) => setFlavorId(Number(e.target.value))}
              >
                {flavors.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {Number(x.price) ? ` (+$${Number(x.price).toFixed(2)})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Filling">
              <select
                className={selectCls}
                value={fillingId ?? ""}
                onChange={(e) => setFillingId(Number(e.target.value))}
              >
                {fillings.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {Number(x.price) ? ` (+$${Number(x.price).toFixed(2)})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Frosting">
              <select
                className={selectCls}
                value={toppingId ?? ""}
                onChange={(e) => setToppingId(Number(e.target.value))}
              >
                {toppings.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {Number(x.price) ? ` (+$${Number(x.price).toFixed(2)})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cake Message (optional)">
              <input
                className={inputCls}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., Happy Graduation!"
              />
            </Field>

            <div className="flex items-center gap-3">
              <input
                id="rush"
                type="checkbox"
                checked={rush}
                onChange={(e) => setRush(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5"
              />
              <label htmlFor="rush" className="text-sm">
                Rush order (ready in 2 hours) <span className="dc-muted">(+ $5)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Quantity">
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </Field>

              {/* Styled file picker (avoids the browser default "Choose File / No file chosen" UI) */}
              <Field label="Upload image (optional)">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-white/85 truncate">
                      {file ? file.name : "No file selected"}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">
                      JPG, PNG, WEBP • Max 2MB
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {file && (
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          // Reset input value so selecting the same file again triggers onChange
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
                      >
                        Remove
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 transition text-sm"
                    >
                      Choose
                    </button>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </Field>
            </div>

            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                className="h-44 w-full object-cover rounded-2xl border border-white/10"
              />
            )}

            {/* Primary action button styled like your theme */}
            <button
              onClick={add}
              disabled={saving}
              className="w-full rounded-2xl py-3 font-semibold text-black disabled:opacity-60 transition hover:brightness-110 active:scale-[0.99]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,170,90,0.95), rgba(245,120,35,0.95))",
                boxShadow: "0 10px 30px rgba(245,120,35,0.22)",
              }}
            >
              {saving ? "Saving..." : "Add Custom Cake to Cart"}
            </button>
          </div>
        </div>

        {/* RIGHT: SUMMARY */}
        <div className="dc-card p-6">
          <div className="text-xl font-semibold mb-4">Summary</div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div
              className="dc-muted text-sm"
              style={{
                borderStyle: "dashed",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,.15)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div className="space-y-1">
                <Row label="Size" value={selectedSize?.name ?? "—"} />
                <Row label="Flavor" value={selectedFlavor?.name ?? "—"} />
                <Row label="Filling" value={selectedFilling?.name ?? "—"} />
                <Row label="Frosting" value={selectedTopping?.name ?? "—"} />
                <Row label="Message" value={message.trim() ? message.trim() : "No message"} />
                <Row label="Rush" value={rush ? "Yes" : "No"} />
                <Row label="Qty" value={String(Math.max(1, qty))} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-lg font-semibold">Estimated Price</div>
            <div className="mt-3 text-5xl font-extrabold tracking-tight">
              ${estimated.toFixed(2)}
            </div>
            <div className="dc-muted mt-3">Price updates based on selected options.</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <div className="min-w-[90px] font-semibold text-white/80">{label}:</div>
      <div className="text-white/85">{value}</div>
    </div>
  );
}
