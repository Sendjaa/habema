"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Tag, Sparkles, Gift, LogIn, Star, Percent } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { LoginModal } from "@/components/auth/login-modal";
import { useCartStore } from "@/lib/store";
import type { ClaimedDiscount } from "@/lib/store";
import { toast } from "sonner";

/* ─── TYPES ─────────────────────────────────────── */
type DiscountRow = {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  min_purchase: number | null
  max_discount: number | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  applies_to: string
  target_id: string | null
  usage_limit: number | null
  usage_count: number
  created_at: string
  voucher_type: string
  conditions: any
}

type Promo = {
  id: string;
  code: string;
  title: string;
  desc: string;
  discount: string;
  terms: string[];
  expiry?: string;
  accent: string;
  accentLight: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number | null;
  max_discount: number | null;
  voucher_type: string;
  conditions: any;
}

type PromoProduct = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  gallery_urls: string[] | null;
  price_per_night: number;
  original_price_per_night: number;
  promo_price_per_night: number;
  discount_percentage: number;
  average_rating: number | null;
  rental_count: number | null;
  equipment_categories: { id: string; name: string } | null;
  brand: string | null;
  stock_quantity: number;
  category_id: string;
}

/* ─── HOOKS ──────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── PROMO PRODUCT CARD ─────────────────────────── */
function PromoProductCard({ product, index }: { product: PromoProduct; index: number }) {
  const { ref, visible } = useInView();
  const rating = Number(product.average_rating || 0);
  const rentalCount = Number(product.rental_count || 0);
  const images: string[] = [product.image_url, ...(product.gallery_urls || [])].filter((s): s is string => !!s);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${(index % 4) * 70}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionProperty: "opacity, transform",
        transitionDuration: "0.5s",
        transitionTimingFunction: "ease",
      }}
      className="group"
    >
      <Link href={`/product/${product.id}`} className="block h-full">
        <div className="relative rounded-2xl overflow-hidden bg-white border border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
            {images.length > 0 ? (
              <Image
                src={images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-stone-200 text-stone-400">
                <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
              </div>
            )}

            {/* Badge Diskon */}
            {product.discount_percentage > 0 && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                <Percent className="w-3 h-3" />
                {product.discount_percentage}%
              </span>
            )}

            {/* Badge Stok */}
            <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full shadow ${
              product.stock_quantity > 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}>
              {product.stock_quantity > 0 ? "Tersedia" : "Habis"}
            </span>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1 gap-2">
            {product.equipment_categories && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {product.equipment_categories.name}
              </span>
            )}

            <h3 className="font-bold text-stone-900 text-sm leading-snug line-clamp-2 flex-1">
              {product.name}
            </h3>

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => {
                    const filled = i < Math.floor(rating);
                    const partial = i === Math.floor(rating) && rating % 1 >= 0.5;
                    return (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${filled ? 'fill-yellow-400 text-yellow-400' : partial ? 'fill-yellow-400/50 text-yellow-400/50' : 'fill-stone-200 text-stone-200'}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-semibold text-stone-500">{rating.toFixed(1)}</span>
                {rentalCount > 0 && (
                  <span className="text-[10px] text-stone-400 ml-1">| {rentalCount}x Sewa</span>
                )}
              </div>
            )}

            {/* Price */}
            <div>
              {product.discount_percentage > 0 && product.original_price_per_night > 0 && (
                <p className="text-xs text-stone-400 line-through">
                  Rp{product.original_price_per_night.toLocaleString("id-ID")}
                </p>
              )}
              <p className="text-lg font-black text-red-600">
                Rp{product.promo_price_per_night.toLocaleString("id-ID")}
                <span className="text-xs text-stone-500 font-normal ml-1">/malam</span>
              </p>
            </div>

            <button className="mt-2 w-full py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-all duration-200 active:scale-[0.98]">
              Sewa Sekarang
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ─── KUPON CARD ─────────────────────────────────── */
function PromoCard({ promo, index }: { promo: Promo; index: number }) {
  const { ref, visible } = useInView();
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const claimedDiscount = useCartStore((s) => s.claimedDiscount);
  const setClaimedDiscount = useCartStore((s) => s.setClaimedDiscount);
  const isClaimed = claimedDiscount?.code === promo.code;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  const handleClaim = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    setUser(currentUser);
    setClaiming(true);
    try {
      const res = await fetch('/api/discounts/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promo.code, userId: currentUser.id }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Gagal mengklaim diskon');
        return;
      }
      const d = result.discount;
      const claimed: ClaimedDiscount = {
        id: d.id,
        code: d.code,
        description: d.description,
        discount_type: d.discount_type as 'percentage' | 'fixed',
        discount_value: Number(d.discount_value),
        min_purchase: d.min_purchase ? Number(d.min_purchase) : null,
        max_discount: d.max_discount ? Number(d.max_discount) : null,
        applies_to: d.applies_to as 'all' | 'category' | 'equipment',
        target_id: d.target_id,
        voucher_type: d.voucher_type as 'all' | 'rental' | 'shop' | 'opentrip',
        conditions: d.conditions || {},
        claimed_at: result.claim?.claimed_at || new Date().toISOString(),
      };
      setClaimedDiscount(claimed);
      toast.success(`${promo.discount} berhasil diklaim!`);
    } catch {
      toast.error('Gagal mengklaim diskon. Silakan coba lagi.');
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaim = () => {
    setClaimedDiscount(null);
    toast.info('Diskon dibatalkan');
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${(index % 3) * 90}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionProperty: "opacity, transform",
        transitionDuration: "0.65s",
        transitionTimingFunction: "ease",
      }}
      className="group"
    >
      <div className={`relative rounded-[28px] overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border flex flex-col h-full ${isClaimed ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-stone-100'}`}>
        <div
          className="relative px-5 pt-5 pb-4 flex items-start justify-between"
          style={{ background: promo.accentLight }}
        >
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: promo.accent }}
            >
              <Tag className="w-3 h-3" />
              Diskon Habema
            </span>
            <h3 className="text-lg font-black text-stone-900 leading-snug">{promo.title}</h3>
          </div>
          <div className="text-right shrink-0 pl-3" style={{ color: promo.accent }}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Hemat</p>
            <p className="text-2xl font-black leading-none">{promo.discount}</p>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-4">
          <p className="text-stone-500 text-sm leading-relaxed">{promo.desc}</p>

          <ul className="space-y-1 flex-1">
            {promo.terms.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-stone-600">
                <span style={{ color: promo.accent }} className="flex-shrink-0 mt-0.5 text-xs">✦</span>
                {t}
              </li>
            ))}
          </ul>

          {promo.expiry && (
            <p className="text-[11px] text-stone-400 font-medium">Berlaku: {promo.expiry}</p>
          )}

          <div className="flex items-stretch gap-2">
            <div
              className="flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed font-mono font-bold tracking-widest text-sm py-3 select-all"
              style={{
                borderColor: promo.accent,
                color: promo.accent,
                background: promo.accentLight,
              }}
            >
              {promo.code}
            </div>
            {isClaimed ? (
              <button
                onClick={handleUnclaim}
                className="flex items-center justify-center gap-1.5 px-4 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:opacity-85 active:scale-[0.98] shadow-sm bg-emerald-600"
                aria-label="Batalkan klaim diskon"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Diklaim</span>
              </button>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="flex items-center justify-center gap-1.5 px-4 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:opacity-85 active:scale-[0.98] shadow-sm disabled:opacity-60"
                style={{ background: promo.accent }}
                aria-label="Klaim diskon"
              >
                {claiming ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{claiming ? 'Memproses...' : 'Klaim'}</span>
              </button>
            )}
          </div>

          {isClaimed && (
            <p className="text-[11px] text-emerald-600 font-medium text-center">
              Diskon akan otomatis dipakai saat transaksi
            </p>
          )}
        </div>
        <LoginModal open={showLogin} onOpenChange={setShowLogin} />
      </div>
    </div>
  );
}

/* ─── KUPON CARD (COMPACT) ──────────────────────── */
function CompactPromoCard({ promo, index }: { promo: Promo; index: number }) {
  const [showLogin, setShowLogin] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const claimedDiscount = useCartStore((s) => s.claimedDiscount);
  const setClaimedDiscount = useCartStore((s) => s.setClaimedDiscount);
  const isClaimed = claimedDiscount?.code === promo.code;

  const handleClaim = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch('/api/discounts/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promo.code, userId: currentUser.id }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Gagal mengklaim diskon');
        return;
      }
      const d = result.discount;
      const claimed: ClaimedDiscount = {
        id: d.id,
        code: d.code,
        description: d.description,
        discount_type: d.discount_type as 'percentage' | 'fixed',
        discount_value: Number(d.discount_value),
        min_purchase: d.min_purchase ? Number(d.min_purchase) : null,
        max_discount: d.max_discount ? Number(d.max_discount) : null,
        applies_to: d.applies_to as 'all' | 'category' | 'equipment',
        target_id: d.target_id,
        voucher_type: d.voucher_type as 'all' | 'rental' | 'shop' | 'opentrip',
        conditions: d.conditions || {},
        claimed_at: result.claim?.claimed_at || new Date().toISOString(),
      };
      setClaimedDiscount(claimed);
      toast.success(`${promo.discount} berhasil diklaim!`);
    } catch {
      toast.error('Gagal mengklaim diskon. Silakan coba lagi.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl border-2 transition-all ${
          isClaimed
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-dashed border-emerald-400 bg-white hover:border-emerald-500'
        }`}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: promo.accent }}>
                {promo.code}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1 line-clamp-2">
                {promo.title}
              </p>
            </div>
            {isClaimed ? (
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full" style={{ background: promo.accent }}>
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-60"
                style={{ background: promo.accent }}
              >
                {claiming ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Gift className="w-4 h-4 text-white" />
                )}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-dashed" style={{ borderColor: promo.accent + '40' }}>
            <p className="text-xs font-bold" style={{ color: promo.accent }}>
              {promo.discount}
            </p>
            {promo.min_purchase && promo.min_purchase > 0 && (
              <p className="text-[10px] text-slate-500 mt-1">
                Min. belanja Rp{Number(promo.min_purchase).toLocaleString('id-ID')}
              </p>
            )}
            {promo.max_discount && promo.max_discount > 0 && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Max. potongan Rp{Number(promo.max_discount).toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {isClaimed && (
            <div className="pt-2 flex items-center justify-between">
              <p className="text-[10px] text-emerald-700 font-medium">
                Sudah diklaim
              </p>
              <button
                type="button"
                onClick={() => {
                  setClaimedDiscount(null);
                  toast.info('Diskon dibatalkan');
                }}
                className="text-[10px] text-red-600 hover:text-red-700 font-medium underline"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>
      <LoginModal open={showLogin} onOpenChange={setShowLogin} />
    </>
  );
}

/* ─── HELPERS ────────────────────────────────────── */
const palette = [
  { accent: '#16a34a', accentLight: '#dcfce7' },
  { accent: '#d97706', accentLight: '#fef3c7' },
  { accent: '#0284c7', accentLight: '#e0f2fe' },
  { accent: '#dc2626', accentLight: '#fee2e2' },
  { accent: '#7c3aed', accentLight: '#ede9fe' },
  { accent: '#059669', accentLight: '#d1fae5' },
  { accent: '#0891b2', accentLight: '#cffafe' },
  { accent: '#be123c', accentLight: '#ffe4e6' },
]

function discountDisplay(row: DiscountRow): string {
  if (row.discount_type === 'percentage') return `${row.discount_value}%`
  return `Rp${row.discount_value.toLocaleString('id-ID')}`
}

function buildTerms(row: DiscountRow): string[] {
  const terms: string[] = []
  if (row.min_purchase && row.min_purchase > 0) {
    terms.push(`Min. pembelian Rp${row.min_purchase.toLocaleString('id-ID')}`)
  }
  if (row.max_discount && row.max_discount > 0) {
    terms.push(`Maks. diskon Rp${row.max_discount.toLocaleString('id-ID')}`)
  }
  if (row.usage_limit && row.usage_limit > 0) {
    const left = row.usage_limit - row.usage_count
    terms.push(`Sisa ${Math.max(0, left)} dari ${row.usage_limit} pemakaian`)
  }
  if (row.applies_to !== 'all') {
    terms.push('Berlaku untuk produk spesifik')
  }
  // Tampilkan voucher_type jika bukan 'all'
  if (row.voucher_type && row.voucher_type !== 'all') {
    const typeLabels: Record<string, string> = {
      rental: 'Khusus rental alat',
      shop: 'Khusus belanja produk',
      opentrip: 'Khusus open trip',
    }
    terms.push(typeLabels[row.voucher_type] || `Khusus ${row.voucher_type}`)
  }
  // Tampilkan conditions khusus
  if (row.conditions) {
    if (row.conditions.first_time_only) {
      terms.push('Khusus pembeli pertama kali')
    }
    if (row.conditions.must_invite_friends && row.conditions.min_friends) {
      terms.push(`Wajib undang ${row.conditions.min_friends} teman`)
    }
    if (row.conditions.requires_identity_verified) {
      terms.push('Wajib verifikasi identitas (KTP)')
    }
  }
  if (terms.length === 0) {
    terms.push('Berlaku untuk semua produk')
  }
  return terms
}

function rowToPromo(row: DiscountRow, index: number): Promo {
  const colors = palette[index % palette.length]
  const code = row.code
  const names: Record<string, string> = {
    HABEMABARU: 'Diskon Pengguna Baru',
    WEEKENDSERU: 'Promo Akhir Pekan',
    TRIP5PERTAMA: 'Open Trip 5 Pendaftar Pertama',
    CAMPERVAN10: 'Campervan Akhir Pekan',
    KOMUNITASHEMA: 'Paket Komunitas & Sekolah',
    AJAKTEMAN: 'Ajak Teman Berpetualang',
  }
  const title = names[code] || `Promo ${code}`

  let expiry: string | undefined
  if (row.end_date) {
    expiry = new Date(row.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } else if (row.start_date) {
    expiry = `Mulai ${new Date(row.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }

  return {
    id: row.id,
    code,
    title,
    desc: row.description || `Nikmati diskon spesial dengan kode ${code}`,
    discount: discountDisplay(row),
    terms: buildTerms(row),
    expiry,
    ...colors,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    min_purchase: row.min_purchase,
    max_discount: row.max_discount,
    voucher_type: row.voucher_type || 'all',
    conditions: row.conditions || {},
  }
}

/* ─── PAGE ───────────────────────────────────────── */
export default function HabemaPromo() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'promo' | 'kupon'>('promo')
  const [branchPhone, setBranchPhone] = useState("6283898749357")

  const fetchDiscounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromos((data || []).map((row: any, i: number) => rowToPromo(row, i)))
    } catch (err) {
      console.error('Failed to fetch discounts:', err)
    }
  }, [])

  const fetchPromoProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products/promo')
      const json = await res.json()
      if (json.success) {
        setPromoProducts(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch promo products:', err)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchDiscounts(), fetchPromoProducts()]).finally(() => setLoading(false))

    const channel = supabase
      .channel('bundles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, () => {
        fetchDiscounts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDiscounts, fetchPromoProducts])

  // Fetch nomor telepon cabang
  useEffect(() => {
    const fetchBranchPhone = async () => {
      try {
        const res = await fetch('/api/branches')
        const result = await res.json()
        if (result.success && result.data?.length > 0 && result.data[0].phone) {
          const cleaned = result.data[0].phone.replace(/[^0-9]/g, '')
          const waNumber = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned.startsWith('62') ? cleaned : '62' + cleaned
          setBranchPhone(waNumber)
        }
      } catch {}
    }
    fetchBranchPhone()
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* HERO */}
      <section className="relative pt-28 pb-10 md:pt-32 md:pb-14 md:max-w-7xl mx-auto">
        <div className="absolute inset-0">
          <Image
            src="/images/discount-banner.png"
            alt="Promo Banner"
            fill
            className="object-cover"
            priority
          />
          {/* <div className="absolute inset-0 bg-black/50" /> */}
        </div>
        {/* <div className="max-w-6xl mx-auto px-4 md:px-8 relative text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-yellow-300 uppercase mb-4">
            <Sparkles className="w-4 h-4" />
            Promo Spesial
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            Promo & Diskon{" "}
            <span className="italic text-yellow-300">Habema</span>
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Dapatkan perlengkapan outdoor favoritmu dengan harga spesial.
            Promo berlaku untuk waktu terbatas!
          </p>
        </div> */}
      </section>

      {/* TAB BAR */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-5 relative z-10">
        <div className="inline-flex bg-white rounded-2xl shadow-lg border border-stone-100 p-1.5">
          <button
            onClick={() => setTab('promo')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
              tab === 'promo'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Percent className="w-4 h-4" />
            Promo
          </button>
          <button
            onClick={() => setTab('kupon')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
              tab === 'kupon'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Tag className="w-4 h-4" />
            Kupon
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-10 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── TAB: PRODUK PROMO ───────────────── */}
            {tab === 'promo' && (
              <section>
                {promoProducts.length === 0 ? (
                  <div className="text-center py-20 text-stone-400">
                    <Percent className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium text-stone-500">Belum ada produk promo</p>
                    <p className="text-sm mt-1">Cek kembali nanti untuk promo terbaru</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {promoProducts.map((product, i) => (
                      <PromoProductCard key={product.id} product={product} index={i} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ─── TAB: KUPON ──────────────────────── */}
            {tab === 'kupon' && (
              <section>
                {promos.length === 0 ? (
                  <div className="text-center py-20 text-stone-400">
                    <Tag className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium text-stone-500">Belum ada kode promo tersedia</p>
                    <p className="text-sm mt-1">Cek kembali nanti untuk promo terbaru</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">
                      Klaim kode promo untuk mendapatkan diskon tambahan
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {promos.map((promo, i) => (
                        <PromoCard key={promo.id} promo={promo} index={i} />
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* HELP STRIP */}
            <section className="relative overflow-hidden mt-16 py-12 md:py-16 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl" />
              </div>

              <div className="relative max-w-6xl mx-auto px-6 md:px-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <h2 className="text-2xl md:text-4xl font-black leading-tight">
                      Ada pertanyaan<br />
                      <span className="italic text-amber-300">soal promo?</span>
                    </h2>
                    <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-md">
                      Tim Habema siap membantu kamu mendapatkan penawaran terbaik.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/${branchPhone}?text=Halo%20Habema%2C%20saya%20mau%20tanya%20soal%20promo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-5 hover:bg-white/15 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">💬</span>
                        <div>
                          <h4 className="text-sm font-bold mb-0.5">Chat WhatsApp</h4>
                          <p className="text-xs text-white/70">+62 838 9874 9357</p>
                          <p className="text-[10px] text-white/50 mt-0.5">Respons cepat</p>
                        </div>
                      </div>
                    </a>

                    <a
                      href={`tel:${branchPhone}`}
                      className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-5 hover:bg-white/15 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">📞</span>
                        <div>
                          <h4 className="text-sm font-bold mb-0.5">Telepon</h4>
                          <p className="text-xs text-white/70">+62 838 9874 9357</p>
                          <p className="text-[10px] text-white/50 mt-0.5">Senin - Minggu</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}