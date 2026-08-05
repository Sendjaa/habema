import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Kolom cancel_reason/cancel_note belum ada di generated types → pakai any.
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
    console.error("[bookings/cancel] auth getUser failed:", error);
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
    const { booking_id, cancel_reason, cancel_note } = body;
    if (!booking_id) {
      return NextResponse.json({ error: "booking_id diperlukan" }, { status: 400 });
    }
    if (!cancel_reason || !String(cancel_reason).trim()) {
      return NextResponse.json({ error: "Alasan pembatalan diperlukan" }, { status: 400 });
    }

    // Ambil booking dan pastikan milik user ini
    const { data: booking, error: fetchError } = await db
      .from("bookings")
      .select("id, user_id, status, payment_status")
      .eq("id", booking_id)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Booking bukan milik Anda" }, { status: 403 });
    }

    // Hanya boleh batalkan jika belum final / belum diproses
    const finalStates = ["cancelled", "returned", "completed"];
    if (finalStates.includes(booking.status)) {
      return NextResponse.json({ error: "Booking sudah tidak dapat dibatalkan" }, { status: 400 });
    }
    if (booking.payment_status === "paid" && ["confirmed", "picked_up", "active"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking sudah diproses, hubungi admin" }, { status: 400 });
    }

    const { error: updateError } = await db
      .from("bookings")
      .update({
        status: "cancelled",
        cancel_reason: String(cancel_reason).trim(),
        cancel_note: cancel_note && String(cancel_note).trim() ? String(cancel_note).trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Pesanan dibatalkan",
    });
  } catch (error) {
    console.error("[bookings/cancel] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
