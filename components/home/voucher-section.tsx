"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Gift, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store";

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number | null;
  max_discount: number | null;
  voucher_type: "all" | "rental" | "shop" | "opentrip" | null;
  conditions: any;
}

export function VoucherSection() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingVoucher, setClaimingVoucher] = useState<string | null>(null);
  const claimedDiscount = useCartStore((state) => state.claimedDiscount);
  const setClaimedDiscount = useCartStore((state) => state.setClaimedDiscount);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const { data } = await supabase
          .from("discounts")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6);
        setVouchers((data as unknown as Voucher[]) || []);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const handleClaimVoucher = async (voucher: Voucher) => {
    if (claimedDiscount?.code === voucher.code) return;

    setClaimingVoucher(voucher.code);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Harus login untuk mengklaim voucher");
        return;
      }

      const res = await fetch("/api/discounts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucher.code, userId: user.id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      const d = result.discount;
      const claimed = {
        id: d.id,
        code: d.code,
        description: d.description,
        discount_type: d.discount_type as "percentage" | "fixed",
        discount_value: Number(d.discount_value),
        min_purchase: d.min_purchase ? Number(d.min_purchase) : null,
        max_discount: d.max_discount ? Number(d.max_discount) : null,
        applies_to: d.applies_to as "all" | "category" | "equipment",
        target_id: d.target_id,
        voucher_type: d.voucher_type as "all" | "rental" | "shop" | "opentrip",
        conditions: d.conditions || {},
        claimed_at: result.claim?.claimed_at || new Date().toISOString(),
      };

      setClaimedDiscount(claimed);
      toast.success(`Voucher ${voucher.code} berhasil diklaim!`);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengklaim voucher");
    } finally {
      setClaimingVoucher(null);
    }
  };

  const getDiscountText = (voucher: Voucher) => {
    if (voucher.discount_type === "fixed") {
      return `Potongan Rp${Number(voucher.discount_value).toLocaleString("id-ID")}`;
    }
    return `Diskon ${voucher.discount_value}%`;
  };

  const getVoucherTypeLabel = (type: string | null) => {
    if (!type || type === "all") return null;
    const labels: Record<string, string> = {
      rental: "Khusus rental",
      shop: "Khusus belanja",
      opentrip: "Khusus open trip",
    };
    return labels[type];
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 lg:py-16 bg-gradient-to-b from-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-left mb-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-sans text-stone-900 tracking-tighter leading-[0.9]">
            Promo Setiap Hari
          </h2>
          <p className="text-slate-500 mt-2">
            Klaim voucher dan hemat belanja Anda
          </p>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (vouchers.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-left mb-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-sans text-stone-900 tracking-tighter leading-[0.9]">
            Promo Setiap Hari
          </h2>
          <p className="text-slate-500 mt-2">
            Klaim voucher dan hemat belanja Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((voucher) => {
            const isClaimed = claimedDiscount?.code === voucher.code;
            const discountText = getDiscountText(voucher);

            return (
              <Card
                key={voucher.id}
                className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                  isClaimed
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-dashed border-emerald-400 bg-white hover:border-emerald-500 hover:shadow-md"
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
                          {voucher.code}
                        </p>
                        {getVoucherTypeLabel(voucher.voucher_type) && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                            {getVoucherTypeLabel(voucher.voucher_type)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mt-1 line-clamp-2">
                        {voucher.description || "Voucher belanja"}
                      </p>
                    </div>
                    {isClaimed ? (
                      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClaimVoucher(voucher)}
                        disabled={claimingVoucher === voucher.code}
                        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white hover:bg-[#143326] transition-colors disabled:opacity-60"
                      >
                        {claimingVoucher === voucher.code ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Gift className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-dashed border-emerald-200">
                    <p className="text-sm font-bold text-[#FF6B35]">
                      {discountText}
                    </p>
                    {voucher.min_purchase && voucher.min_purchase > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Min. belanja Rp{Number(voucher.min_purchase).toLocaleString("id-ID")}
                      </p>
                    )}
                    {voucher.max_discount && voucher.max_discount > 0 && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Max. potongan Rp{Number(voucher.max_discount).toLocaleString("id-ID")}
                      </p>
                    )}
                    {voucher.conditions && (
                      <div className="space-y-0.5 mt-2">
                        {voucher.conditions.first_time_only && (
                          <p className="text-[10px] text-amber-600 font-medium">
                            • Khusus pembeli pertama
                          </p>
                        )}
                        {voucher.conditions.must_invite_friends && (
                          <p className="text-[10px] text-amber-600 font-medium">
                            • Wajib undang teman
                          </p>
                        )}
                        {voucher.conditions.requires_identity_verified && (
                          <p className="text-[10px] text-amber-600 font-medium">
                            • Wajib verifikasi KTP
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {isClaimed && (
                    <div className="pt-2 flex items-center justify-between">
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Sudah diklaim - tersedia di cart
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setClaimedDiscount(null);
                          toast.info("Voucher dibatalkan");
                        }}
                        className="text-[10px] text-red-600 hover:text-red-700 font-medium underline"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
