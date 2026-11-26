import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server-user";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const user = await getServerUser(request as any);
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const db = supabaseAdmin as any;
    const [profileResult, vouchersResult, transactionsResult] = await Promise.all([
      db
        .from("users")
        .select("coin_balance, referral_code, referral_count")
        .eq("id", user.id)
        .maybeSingle(),
      db
        .from("redeemed_vouchers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      db
        .from("coin_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (vouchersResult.error) throw vouchersResult.error;
    if (transactionsResult.error) throw transactionsResult.error;

    return NextResponse.json({
      success: true,
      data: {
        coinBalance: Number(profileResult.data?.coin_balance ?? 0),
        referralCode: profileResult.data?.referral_code ?? null,
        referralCount: Number(profileResult.data?.referral_count ?? 0),
        vouchers: vouchersResult.data ?? [],
        transactions: transactionsResult.data ?? [],
      },
    });
  } catch (error: any) {
    console.error("[rewards/history] error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
