import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          error:
            "Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token" },
        { status: 401 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Invalid session. Please login again." },
        { status: 401 }
      );
    }

    const user = userData.user;

    const body = await req.json().catch(() => null);
    const orderId = body?.orderId as string | undefined;
    const name = (body?.name as string | undefined) ?? "";
    const last4 = (body?.last4 as string | undefined) ?? "";

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    if (!name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(last4)) {
      return NextResponse.json({ error: "Invalid last4" }, { status: 400 });
    }

    // Update ONLY the user's order
    const { data: updated, error: upErr } = await admin
      .from("orders")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        last4: last4,
        paid_name: name.trim(),
      })
      .eq("id", orderId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }
    if (!updated) {
      return NextResponse.json(
        { error: "Order not found (or not yours)" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
