import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// shop_orders / shop_order_items / shop_products belum ada di jenis Database,
// pakai any seperti route checkout/webhook.
const db = supabaseAdmin as any;

async function getServerUser(request: NextRequest) {
  try {
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    return user ?? null;
  } catch (error) {
    console.error("[shop-orders/cancel] auth getUser failed:", error);
    return null;
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { order_id, cancel_reason, cancel_note } = body;
    if (!order_id) {
      return NextResponse.json({ error: "order_id diperlukan" }, { status: 400 });
    }
    if (!cancel_reason || !String(cancel_reason).trim()) {
      return NextResponse.json({ error: "Alasan pembatalan diperlukan" }, { status: 400 });
    }

    // Ambil order dan pastikan milik user ini
    const { data: order, error: fetchError } = await db
      .from("shop_orders")
      .select("id, user_id, status, payment_status")
      .eq("id", order_id)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Order bukan milik Anda" }, { status: 403 });
    }

    // Hanya boleh batalkan jika belum final / belum lunas diproses
    const finalStates = ["cancelled", "delivered", "refunded", "expired"];
    if (finalStates.includes(order.status) || finalStates.includes(order.payment_status)) {
      return NextResponse.json({ error: "Order sudah tidak dapat dibatalkan" }, { status: 400 });
    }
    if (order.payment_status === "paid" && ["shipped", "delivered"].includes(order.status)) {
      return NextResponse.json({ error: "Order sudah diproses, hubungi admin" }, { status: 400 });
    }

    const wasPaid = order.payment_status === "paid";

    // Update status order
    const { error: updateError } = await db
      .from("shop_orders")
      .update({
        status: "cancelled",
        payment_status: wasPaid ? "refunded" : "cancelled",
        cancel_reason: String(cancel_reason).trim(),
        cancel_note: cancel_note && String(cancel_note).trim() ? String(cancel_note).trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Jika sudah pernah dibayar, kembalikan stok & kurangi sold_count
    if (wasPaid) {
      const { data: items } = await db
        .from("shop_order_items")
        .select("product_id, quantity")
        .eq("order_id", order.id);

      for (const it of items || []) {
        const { data: prod } = await db
          .from("shop_products")
          .select("stock, sold_count")
          .eq("id", it.product_id)
          .maybeSingle();
        if (!prod) continue;
        await db
          .from("shop_products")
          .update({
            stock: (Number(prod.stock) || 0) + Number(it.quantity),
            sold_count: Math.max(0, (Number(prod.sold_count) || 0) - Number(it.quantity)),
          })
          .eq("id", it.product_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: wasPaid ? "Order dibatalkan dan akan direfund" : "Order dibatalkan",
    });
  } catch (error) {
    console.error("[shop-orders/cancel] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
