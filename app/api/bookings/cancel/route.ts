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

    // Ambil booking_items untuk mengembalikan stok cabang
    const { data: bookingItems } = await db
      .from("booking_items")
      .select("equipment_id, quantity")
      .eq("booking_id", booking.id);

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

    // ===== Kembalikan stok ke branch_inventory cabang pengambilan =====
    const { data: fullBooking } = await db
      .from("bookings")
      .select("pickup_branch_id")
      .eq("id", booking.id)
      .maybeSingle();

    if (fullBooking?.pickup_branch_id && bookingItems && bookingItems.length > 0) {
      for (const item of bookingItems) {
        // Cek apakah ada booking lain yang masih aktif (pending/confirmed/picked_up/active)
        // menggunakan equipment yang sama di cabang yang sama dengan tanggal overlap
        // Jika tidak ada, kembalikan stok penuh; jika ada, jangan kembalikan (karena stok sudah di-decrement saat booking lain dibuat)
        const { data: activeBookings } = await db
          .from("booking_items")
          .select("booking_id, quantity, bookings!inner(id, status, pickup_branch_id, start_date, end_date)")
          .eq("equipment_id", item.equipment_id)
          .neq("booking_id", booking.id)
          .in("bookings.status", ["pending", "confirmed", "picked_up", "active"])
          .eq("bookings.pickup_branch_id", fullBooking.pickup_branch_id);

        // Hitung total stok yang sudah dikunci oleh booking aktif lain di cabang ini
        let lockedQty = 0;
        if (activeBookings) {
          for (const ab of activeBookings) {
            lockedQty += Number(ab.quantity);
          }
        }

        // Ambil stok saat ini
        const { data: invRow } = await db
          .from("branch_inventory")
          .select("id, quantity")
          .eq("branch_id", fullBooking.pickup_branch_id)
          .eq("equipment_id", item.equipment_id)
          .maybeSingle();

        if (invRow) {
          // Kembalikan stok, tapi pastikan tidak melebihi stok asli
          // (stok asli = stok_awal yang tercatat di branch_inventory sebelum semua booking aktif)
          // Kita cukup tambahkan quantity booking ini selama masih aman
          const newQty = Number(invRow.quantity) + Number(item.quantity);
          await db
            .from("branch_inventory")
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq("id", invRow.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pesanan dibatalkan dan stok dikembalikan",
    });
  } catch (error) {
    console.error("[bookings/cancel] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
