import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server-user";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PROMO_CATALOG } from "@/lib/rewards-catalog";

export async function POST(request: Request) {
  try {
    const user = await getServerUser(request as any);
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const voucherId = String(body?.voucherId ?? "");
    const item = PROMO_CATALOG.find((entry) => entry.id === voucherId || entry.code === voucherId);

    if (!item) {
      return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 });
    }

    const db = supabaseAdmin as any;
    const { data, error } = await db.rpc("redeem_voucher", {
      p_user_id: user.id,
      p_voucher_id: item.id,
      p_promo_code: item.code,
      p_title: item.title,
      p_discount_text: item.discountText,
      p_coin_cost: item.coinCost,
      p_valid_days: item.validDays,
    });

    if (error) {
      console.error("[rewards/redeem] error:", error.message);
      return NextResponse.json({ error: "Gagal menukar koin" }, { status: 500 });
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.message || "Koin tidak mencukupi" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[rewards/redeem] error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
