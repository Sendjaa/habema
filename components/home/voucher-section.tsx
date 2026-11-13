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
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="space-y-4 flex flex-col">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-sans text-stone-900 tracking-tighter leading-[0.9]">
                Promo Setiap Hari
              </h2>
              <p className="text-slate-500 mt-2 text-lg">
                Klaim voucher dan hemat belanja Anda
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-48 h-32 rounded-xl bg-stone-100 animate-pulse flex items-center justify-center flex-col gap-2">
                  <div className="w-16 h-16 rounded-full bg-stone-200 animate-pulse" />
                  <div className="w-3/4 h-4 bg-stone-200 rounded animate-pulse" />
                  <div className="w-1/2 h-3 bg-stone-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (vouchers.length === 0) return null;

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-[#F7F5F0]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="space-y-8 flex flex-col">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-sans text-stone-900 tracking-tighter leading-[0.9]">
              Promo Setiap Hari
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              Klaim voucher dan hemat belanja Anda
            </p>
          </div>

          {/* Flex layout: stacking on mobile, side-by-side on larger screens */}
          <div className="flex flex-col lg:flex-row gap-6">
            {vouchers.map((voucher) => {
              const isClaimed = claimedDiscount?.code === voucher.code;
              const discountText = getDiscountText(voucher);
              const typeLabel = getVoucherTypeLabel(voucher.voucher_type);

              return (
                <Card
                  key={voucher.id}
                  className={`relative overflow-hidden rounded-2xl border transition-all ${
                    isClaimed
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-stone-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1"
                  } flex-1 min-w-[280px] max-w-lg`}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-bold text-forest uppercase tracking-wide">
                            {voucher.code}
                          </p>
                          {typeLabel && (
                            <Badge
                              className="bg-emerald-100 text-emerald-700 text-[10px] font-medium"
                            >
                              {typeLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-600 line-clamp-2">
                          {voucher.description || "Voucher belanja"}
                        </p>
                      </div>
                      {isClaimed ? (
                        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white shadow-md">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleClaimVoucher(voucher)}
                          disabled={claimingVoucher === voucher.code}
                          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-forest text-white hover:bg-forest/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {claimingVoucher === voucher.code ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Gift className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-[#FF6B35]">
                          {discountText}
                        </p>
                      </div>
                      {voucher.min_purchase && voucher.min_purchase > 0 && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Min. belanja Rp{Number(voucher.min_purchase).toLocaleString("id-ID")}
                        </p>
                      )}
                      {voucher.max_discount && voucher.max_discount > 0 && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Maks. potongan Rp{Number(voucher.max_discount).toLocaleString("id-ID")}
                        </p>
                      )}
                      {voucher.conditions && (
                        <div className="space-y-1 mt-3 pt-2 border-t border-stone-100">
                          {voucher.conditions.first_time_only && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Khusus pembeli pertama
                            </p>
                          )}
                          {voucher.conditions.must_invite_friends && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Wajib undang teman
                            </p>
                          )}
                          {voucher.conditions.requires_identity_verified && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Wajib verifikasi KTP
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {isClaimed && (
                      <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Sudah diklaim - tersedia di cart
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setClaimedDiscount(null);
                            toast.info("Voucher dibatalkan");
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium underline"
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
      </div>
    </section>
  );
}
