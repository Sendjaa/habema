"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Check } from "lucide-react";
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
      <section className="py-8 md:py-12 lg:py-16 bg-[#F7F5F0]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="space-y-4 flex flex-col">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sans text-stone-900 tracking-tighter leading-[0.9]">
                Promo Setiap Hari
              </h2>
              <p className="text-slate-500 mt-2 text-sm md:text-base">
                Klaim voucher dan hemat belanja Anda
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-72 sm:w-80 md:w-96 flex-shrink-0 p-3 rounded-2xl border border-stone-200 bg-white animate-pulse space-y-3"
                >
                  <div className="h-3 w-28 bg-stone-200 rounded" />
                  <div className="h-2.5 w-3/4 bg-stone-200 rounded" />
                  <div className="pt-2 border-t border-stone-100">
                    <div className="h-5 w-32 bg-stone-200 rounded" />
                  </div>
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
    <section className="py-8 md:py-12 lg:py-16 bg-[#F7F5F0]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="space-y-6 flex flex-col">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sans text-stone-900 tracking-tighter leading-[0.9]">
              Promo Setiap Hari
            </h2>
            <p className="text-slate-500 mt-2 text-sm md:text-base">
              Klaim voucher dan hemat belanja Anda
            </p>
          </div>

          {/* Horizontal scroll slider */}
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
            {vouchers.map((voucher) => {
              const isClaimed = claimedDiscount?.code === voucher.code;
              const discountText = getDiscountText(voucher);
              const typeLabel = getVoucherTypeLabel(voucher.voucher_type);

              return (
<Card
              key={voucher.id}
              className={`relative overflow-hidden rounded-2xl border transition-all flex-shrink-0 w-72 sm:w-80 md:w-96 max-w-none ${
                isClaimed
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-stone-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1"
              }`}
            >
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-forest uppercase tracking-wide">
                        {voucher.code}
                      </p>
                      {typeLabel && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-medium">
                          {typeLabel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-600 line-clamp-2">
                      {voucher.description || "Voucher belanja"}
                    </p>
                  </div>
                  {isClaimed && (
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="pt-1.5 border-t border-stone-100">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                      <p className="text-lg font-bold text-[#FF6B35]">
                        {discountText}
                      </p>
                    </div>
                    {isClaimed ? (
                      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClaimVoucher(voucher)}
                        disabled={claimingVoucher === voucher.code}
                        className="shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg bg-forest text-white hover:bg-forest/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-[10px] font-bold"
                      >
                        {claimingVoucher === voucher.code ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Klaim</span>
                        )}
                      </button>
                    )}
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
                              <Tag className="w-2.5 h-2.5" />
                              Khusus pembeli pertama
                            </p>
                          )}
                          {voucher.conditions.must_invite_friends && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              Wajib undang teman
                            </p>
                          )}
                          {voucher.conditions.requires_identity_verified && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              Wajib verifikasi KTP
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {isClaimed && (
                      <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
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
      </div>
    </section>
  );
}