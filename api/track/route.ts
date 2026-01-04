import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { order_code, last4, pin } = await req.json();

  if (!order_code || !last4 || !pin) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const code = String(order_code).toUpperCase().trim();

  const { data: order, error } = await supabaseServer
    .from("orders")
    .select("id, order_code, phone_last4, tracking_pin, status, payment_status, total_price, currency, created_at")
    .eq("order_code", code)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (String(order.phone_last4 ?? "") !== String(last4) || String(order.tracking_pin ?? "") !== String(pin)) {
    return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
  }

  const { data: events } = await supabaseServer
    .from("order_status_events")
    .select("status, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ order, events: events ?? [] });
}
