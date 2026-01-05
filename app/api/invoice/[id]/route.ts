import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Buffer } from "buffer";

export const runtime = "nodejs"; // Required for PDF generation libraries

type Ctx = { params: Promise<{ id: string }> };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function GET(req: Request, { params }: Ctx) {
  try {
    // Next.js 16: params is a Promise
    const { id } = await params;
    const orderId = String(id || "").trim();

    if (!orderId || orderId === "undefined" || orderId === "null" || !isUuid(orderId)) {
      return NextResponse.json({ error: "Invalid invoice id." }, { status: 400 });
    }

    // Read env variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!url || !anon || !service) {
      return NextResponse.json(
        { error: "Server is missing Supabase env variables." },
        { status: 500 }
      );
    }

    // Extract Bearer token
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    // Validate token (anon client)
    const supaAuth = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: u, error: uErr } = await supaAuth.auth.getUser(token);
    if (uErr || !u?.user) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    // Service role client for DB (bypasses RLS); enforce access manually
    const db = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Optional: check admin role
    const { data: pr } = await db
      .from("profiles")
      .select("role")
      .eq("id", u.user.id)
      .maybeSingle();

    const isAdmin = (pr?.role ?? "") === "admin";

    // Load invoice/order
    const { data: order, error: oErr } = await db
      .from("orders")
      .select("id,order_code,created_at,total_amount,currency,user_id,customer_name,payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 400 });
    if (!order) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    // Only owner or admin can access
    if (!isAdmin && order.user_id && order.user_id !== u.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // Decide response format
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();

    // JSON format
    if (format === "json") {
      return NextResponse.json(
        {
          id: order.id,
          order_code: order.order_code,
          created_at: order.created_at,
          total_amount: Number(order.total_amount ?? 0),
          currency: order.currency ?? "USD",
          customer_name: order.customer_name ?? null,
          payment_status: order.payment_status ?? "unpaid",
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // PDF format
    if (format === "pdf") {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.28, 841.89]); // A4
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

      const marginX = 50;
      let y = 780;

      const draw = (text: string, size = 12, isBold = false) => {
        page.drawText(text, {
          x: marginX,
          y,
          size,
          font: isBold ? bold : font,
        });
        y -= size + 10;
      };

      draw("Smart Bakery", 22, true);
      draw("Invoice", 16, true);
      y -= 8;

      draw(`Invoice ID: ${order.id}`, 11);
      draw(`Order Code: ${order.order_code}`, 11);
      draw(`Date: ${new Date(order.created_at).toLocaleString()}`, 11);
      draw(`Customer: ${order.customer_name || "—"}`, 11);
      draw(`Payment: ${(order.payment_status ?? "unpaid").toUpperCase()}`, 11);

      y -= 12;

      const total = Number(order.total_amount ?? 0).toFixed(2);
      draw(`Total: $${total} ${order.currency ?? "USD"}`, 14, true);

      y -= 20;
      draw("Thank you for your order.", 11);

      const bytes = await pdf.save();

      // IMPORTANT: Use Node Buffer + native Response (avoids TS Blob/NextResponse typing issues)
      const body = Buffer.from(bytes);

      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="invoice-${order.order_code}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use format=json or format=pdf" },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
