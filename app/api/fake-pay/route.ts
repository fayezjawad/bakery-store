export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const orderId = body?.orderId as string | undefined;
    const name = body?.name as string | undefined;
    const last4 = body?.last4 as string | undefined;

    if (!orderId || !name || !last4) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey);

   
    const { data: userRes, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = userRes.user.id;

    
    const { data: order, error: ordErr } = await admin
      .from("orders")
      .select("id,user_id,payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (ordErr) return NextResponse.json({ error: ordErr.message }, { status: 400 });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if ((order.payment_status ?? "unpaid") === "paid") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    
    const { error: upErr } = await admin
      .from("orders")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        paid_method: "fake",
        paid_last4: String(last4).slice(-4),
        paid_name: String(name).slice(0, 120),
      })
      .eq("id", orderId);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
