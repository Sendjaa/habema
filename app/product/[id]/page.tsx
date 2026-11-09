"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInventoryStatus } from "@/lib/catalog-context";
import { Markdown } from "@/components/ui/markdown";
import {
  Heart,
  Share2,
  CheckCircle,
  Settings2,
  ShieldCheck,
  Zap,
  ChevronRight,
  Star,
  MessageCircle,
  Store,
  ArrowLeft,
  Flame,
  TrendingUp,
  X,
  MessageSquare,
  Package,
  Tag,
  Gift,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { LoginModal } from "@/components/auth/login-modal";
import { ReviewForm } from "@/components/product/review-form";
import { ProductReviewsSection } from "@/components/product/ProductReviewsSection";
import { useRouter } from "next/navigation";
import { useCartStore, type ClaimedDiscount } from "@/lib/store";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

function formatWeight(kg: number): string {
  const whole = Math.floor(kg);
  const grams = Math.round((kg - whole) * 1000);
  if (whole > 0 && grams > 0) return `${whole} kg ${grams} g`;
  if (whole > 0) return `${whole} kg`;
  return `${grams} g`;
}

const WISHLIST_STORAGE_KEY = "habema_wishlist";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // --- SEMUA HOOKS HARUS DI ATAS ---
  const [product, setProduct] = useState<any>(null);
  const [isShop, setIsShop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [shopVouchers, setShopVouchers] = useState<any[]>([]);
  const [claimingVoucher, setClaimingVoucher] = useState(false);
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("Semua");
  const [canReview, setCanReview] = useState(false);
  const [reviewEligibilityReason, setReviewEligibilityReason] = useState("");

  // Tanggal sewa yang dibawa dari katalog (via query string). Diteruskan ke
  // halaman booking agar pengguna tidak perlu memilih tanggal ulang.
  const [dateQuery, setDateQuery] = useState("");
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("startDate");
    const e = sp.get("endDate");
    const q = new URLSearchParams();
    if (s) q.set("startDate", s);
    if (e) q.set("endDate", e);
    const str = q.toString();
    setDateQuery(str ? `&${str}` : "");
  }, []);

  // Status wishlist disimpan di localStorage supaya tetap terlihat saat
  // pengguna kembali ke halaman produk yang sama.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setIsWishlisted(ids.includes(id));
    } catch {
      setIsWishlisted(false);
    }
  }, [id]);

  const toggleWishlist = () => {
    const next = !isWishlisted;
    setIsWishlisted(next);
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const merged = next
        ? Array.from(new Set([...ids, id]))
        : ids.filter((existing) => existing !== id);
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  };

  // Fetch nomor telepon cabang
  useEffect(() => {
    const fetchBranchPhone = async () => {
      try {
        const res = await fetch('/api/branches');
        const result = await res.json();
        if (result.success && result.data?.length > 0 && result.data[0].phone) {
          const cleaned = result.data[0].phone.replace(/[^0-9]/g, '');
          const waNumber = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned.startsWith('62') ? cleaned : '62' + cleaned;
          setBranchPhone(waNumber);
        }
      } catch {}
    };
    fetchBranchPhone();
  }, []);

  const [helpfulCount, setHelpfulCount] = useState([12, 8, 5, 2, 1]);
  const [isLiked, setIsLiked] = useState([false, false, false, false, false]);
  const [branchPhone, setBranchPhone] = useState("6283898749357");
  const addToCart = useCartStore((state) => state.addToCart);
  const setTransaction = useCartStore((state) => state.setTransaction);
  const claimedDiscount = useCartStore((state) => state.claimedDiscount);
  const setClaimedDiscount = useCartStore((state) => state.setClaimedDiscount);
  const unsplashLoader = ({ src, width, quality }: any) => {
    return `${src}?auto=format&fit=crop&w=${width}&q=${quality || 75}`;
  };

  const handleHelpfulClick = (index: number) => {
    const newLikedStatus = [...isLiked];
    const newHelpfulCount = [...helpfulCount];

    if (newLikedStatus[index]) {
      newHelpfulCount[index] -= 1;
    } else {
      newHelpfulCount[index] += 1;
    }
    newLikedStatus[index] = !newLikedStatus[index];
    setIsLiked(newLikedStatus);
    setHelpfulCount(newHelpfulCount);
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (replyText.trim().length < 5) {
      toast.error("Balasan harus minimal 5 karakter");
      return;
    }

    setSubmittingReply(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setShowLoginModal(true);
        return;
      }

      // Check if user exists in users table
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (userError || !userRecord) {
        // Create user record if it doesn't exist
        const { error: insertError } = await (supabase as any)
          .from("users")
          .insert({
            id: user.id,
            email: user.email || "",
            full_name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "User",
          });

        if (insertError) {
          console.error("Error creating user record:", insertError);
          toast.error("Gagal membuat user record. Silakan coba lagi.");
          return;
        }
      }

      // Find the original review to get the author's name
      const originalReview = reviews.find((r) => r.id === reviewId);
      const authorName = originalReview?.users?.full_name || "User";

      // Insert reply (using reviews table with special prefix in comment)
      const replyTarget = isShop
        ? { shop_product_id: id }
        : { equipment_id: id };
      const replyData = {
        ...replyTarget,
        user_id: user.id,
        rating: 5, // Use valid rating (1-5) to satisfy check constraint
        comment: `@${authorName}: ${replyText.trim()}`, // Prefix with @mention
        created_at: new Date().toISOString(), // Add created_at if required
      };

      console.log("Inserting reply data:", replyData);

      const { data, error } = await (supabase as any)
        .from("reviews")
        .insert(replyData)
        .select();

      if (error) {
        console.error("Reply insertion error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        throw new Error(
          `Gagal menyimpan balasan: ${error.message || "Unknown error"}`,
        );
      }

      console.log("Reply inserted successfully:", data);

      toast.success("Balasan berhasil dikirim!");
      setReplyText("");
      setReplyingTo(null);

      // Refresh reviews
      const { data: refreshedReviews } = await supabase
        .from("reviews")
        .select("*, users(full_name)")
        .eq(isShop ? "shop_product_id" : "equipment_id", id)
        .order("created_at", { ascending: false });

      setReviews(refreshedReviews || []);
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast.error(error.message || "Gagal mengirim balasan");
    } finally {
      setSubmittingReply(false);
    }
  };

  const reviewFilters = ["Semua", "Dengan Foto", "Bintang 5", "Bintang 4"];

  // Calculate rating statistics from reviews (exclude replies)
  const ratingStats = useMemo(() => {
    const validReviews = reviews.filter(
      (review) => !(review.comment || "").startsWith("@"),
    );

    if (validReviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        satisfaction: 0,
      };
    }

    const total = validReviews.length;
    const sum = validReviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    validReviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    const satisfaction = Math.round(
      ((distribution[5] + distribution[4]) / total) * 100,
    );

    return { average, total, distribution, satisfaction };
  }, [reviews]);

  const handleReviewSubmitted = () => {
    // Refetch reviews after submission
    if (product) {
      supabase
        .from("reviews")
        .select("*, users(full_name)")
        .eq(isShop ? "shop_product_id" : "equipment_id", product.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setReviews(data || []));
    }
    setShowReviewForm(false);
  };

  useEffect(() => {
    const fetchProduct = async (attempt = 1) => {
      setLoading(true);
      try {
        // Fetch from API (real-time)
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();

        if (!res.ok || !data) {
          // Fallback: coba produk jual, lalu produk sewa (equipment)
          const { data: shopData } = await supabase
            .from("shop_products")
            .select("*")
            .eq("id", id)
            .single();

          if (shopData) {
            setIsShop(true);
            setProduct({
              ...shopData,
              average_rating: 0,
              review_count: 0,
            });
            // Cek eligibility ulasan untuk produk toko
            try {
              const eligRes = await fetch(`/api/reviews?shopProductId=${id}`, { credentials: "include" });
              if (eligRes.ok) {
                const eligData = await eligRes.json();
                setCanReview(eligData.canReview ?? false);
                setReviewEligibilityReason(eligData.reason ?? "");
              }
            } catch {
              setCanReview(false);
              setReviewEligibilityReason("Gagal memeriksa eligibility");
            }
          } else {
            const { data: rentalData } = await supabase
              .from("equipment")
              .select("*, equipment_categories(name)")
              .eq("id", id)
              .single();

            if (rentalData) {
              setIsShop(false);
              setProduct(rentalData);
              // Cek eligibility ulasan untuk rental
              try {
                const eligRes = await fetch(`/api/reviews?equipmentId=${id}`, { credentials: "include" });
                if (eligRes.ok) {
                  const eligData = await eligRes.json();
                  setCanReview(eligData.canReview ?? false);
                  setReviewEligibilityReason(eligData.reason ?? "");
                }
              } catch {
                setCanReview(false);
                setReviewEligibilityReason("Gagal memeriksa eligibility");
              }
            } else {
              setProduct(null);
            }
          }
          return;
        }

        setIsShop(data.type !== "rental");
        setProduct(data);

        // Cek eligibility ulasan
        try {
          const param = isShop ? `shopProductId=${id}` : `equipmentId=${id}`;
          const eligRes = await fetch(`/api/reviews?${param}`, { credentials: "include" });
          if (eligRes.ok) {
            const eligData = await eligRes.json();
            setCanReview(eligData.canReview ?? false);
            setReviewEligibilityReason(eligData.reason ?? "");
          }
        } catch {
          setCanReview(false);
          setReviewEligibilityReason("Gagal memeriksa eligibility");
        }
      } catch (err) {
        if (attempt < 2) {
          setTimeout(() => fetchProduct(attempt + 1), 1200);
          return;
        }
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!isShop || !product) return;
    let cancelled = false;
    const loadVouchers = async () => {
      try {
        const { data } = await supabase
          .from("discounts")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        const applicable = (data || []).filter((d: any) => {
          // Filter by applies_to (produk/kategori tertentu)
          if (d.applies_to === "all") return true;
          if (d.applies_to === "category")
            return d.target_id === product.category;
          if (d.applies_to === "equipment") return d.target_id === product.id;
          
          // Filter by voucher_type (rental/shop/opentrip)
          const voucherType = d.voucher_type || 'all';
          if (voucherType === 'shop') return true; // Ini produk shop, jadi voucher shop bisa dipakai
          if (voucherType === 'all') return true; // Voucher all bisa dipakai untuk semua
          
          // Voucher rental/opentrip tidak bisa dipakai untuk shop
          return false;
        });
        setShopVouchers(applicable);
      } catch {
        if (!cancelled) setShopVouchers([]);
      }
    };
    loadVouchers();
    return () => {
      cancelled = true;
    };
  }, [isShop, product]);

  const handleClaimVoucher = async (voucher: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setClaimingVoucher(true);
    try {
      const res = await fetch("/api/discounts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucher.code, userId: user.id }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Gagal mengklaim voucher");
        return;
      }
      const d = result.discount;
      const claimed: ClaimedDiscount = {
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
      toast.success("Voucher toko berhasil diklaim!");
    } catch {
      toast.error("Gagal mengklaim voucher. Silakan coba lagi.");
    } finally {
      setClaimingVoucher(false);
    }
  };

  useEffect(() => {
    if (isShop || !product) return;

    if (product) {
      supabase
        .from("equipment")
        .select(`*, equipment_categories(name)`)
        .neq("id", product.id)
        .eq("category_id", product.category_id)
        .limit(4)
        .then(({ data }) => setRelatedProducts(data || []));
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;

    if (!isShop) {
      supabase
        .from("equipment")
        .select(`*, equipment_categories(name)`)
        .neq("id", product.id)
        .limit(8)
        .then(({ data }) => setPopularProducts(data || []));
    }

    // Ulasan: rental memakai equipment_id, produk toko memakai shop_product_id.
    supabase
      .from("reviews")
      .select("*, users(full_name)")
      .eq(isShop ? "shop_product_id" : "equipment_id", product.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data || []));
  }, [product, isShop]);

  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-8 lg:pt-12">
          {/* Breadcrumb skeleton */}
          <div className="hidden md:flex items-center gap-2 mb-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-2" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Image skeleton */}
            <div className="lg:col-span-1">
              <Skeleton className="aspect-square w-full rounded-xl" />
            </div>
            
            {/* Info skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-2" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  if (!product)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-black text-stone-900 mb-2">
          Produk Tidak Ditemukan
        </h1>
        <p className="text-stone-500 font-medium mb-6 max-w-md">
          Produk yang Anda cari mungkin sudah tidak tersedia atau tautannya
          sudah tidak berlaku.
        </p>
        <Button
          variant="outline"
          className="font-bold"
          onClick={() => router.push("/catalog_rental")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Katalog
        </Button>
      </div>
    );

  // ===== Produk BELI (shop_products), bukan rental =====
  const shopPrice = Number(product.price || 0);
  const shopOriginalPrice = Number(product.original_price || 0);
  const shopDiscount =
    shopOriginalPrice > shopPrice && shopPrice > 0
      ? Math.round((1 - shopPrice / shopOriginalPrice) * 100)
      : null;
  const shopStock = Number(product.stock ?? 0);
  const shopImages = [
    product.image_url,
    ...(product.gallery_urls || []),
  ].filter(Boolean);
  const shopSpecs =
    product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications).filter(([, v]) => v)
      : [];

  const handleShopAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: shopPrice,
      image_url: product.image_url,
      quantity: Math.max(1, Number(quantity)),
      category: product.category || "Produk",
      description: product.description,
      brand: product.brand,
    });
    toast.success(`${product.name} masuk keranjang!`, {
      style: { background: "#1B4332", color: "#fff", borderRadius: "12px" },
    });
  };

  const handleShopBuyNow = () => {
    handleShopAddToCart();
    router.push("/checkout");
  };

const filteredReviews = getFilteredReviews(reviews, activeFilter);

  if (isShop)
    return (
      <div className="min-h-screen bg-white pb-15 md:pb-16">
        <nav className="bg-white py-3 px-4 md:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-500 capitalize">
            <Link
              href="/catalog_shop"
              className="hover:text-[#1B4332] transition-colors"
            >
              Katalog
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-400">{product.category || "Beli"}</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-[#1B4332] truncate font-bold">
              {product.name}
            </span>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto md:px-4 pt-4 md:pt-8 lg:pt-12">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image gallery */}
            <div className="lg:w-1/3 px-4 md:px-0">
              <div className="bg-white md:rounded-xl overflow-hidden sticky md:top-24 shadow-sm border border-slate-100">
                <div className="relative aspect-square">
                  {shopImages.length > 0 ? (
                    <Image
                      src={shopImages[selectedImage]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100">
                      <Package className="w-16 h-16 text-stone-300" />
                    </div>
                  )}
                </div>
                {shopImages.length > 1 && (
                  <div className="p-4 hidden md:flex gap-2 border-t flex-wrap">
                    {shopImages.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImage(i)}
                        className={`w-20 h-20 border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          selectedImage === i
                            ? "border-[#1B4332] opacity-100"
                            : "border-transparent opacity-50 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`${product.name} ${i + 1}`}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info column */}
            <div className="lg:w-5/12 px-4 md:px-0 space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-3 border border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-sans font-bold text-slate-800 capitalize leading-tight">
                    {product.name}
                  </h1>
                  <span className="text-[#FF6B35] font-bold text-2xl">
                    Rp{shopPrice.toLocaleString("id-ID")}
                  </span>
                  {/* <span className="text-slate-400 text-sm">/ unit</span> */}
                  {shopDiscount && (
                    <Badge className="bg-gold text-[#FF6B35] rounded-full text-xs font-bold px-2 py-1 bg-amber-400/10">
                      -{shopDiscount}%
                    </Badge>
                  )}
                </div>
                {shopOriginalPrice > shopPrice && (
                  <p className="text-slate-400 line-through text-sm">
                    Rp{shopOriginalPrice.toLocaleString("id-ID")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
                  {ratingStats.total > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="w-4 h-4 fill-current" />
                      {ratingStats.average.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-slate-500">Belum ada ulasan</span>
                  )}
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    Terjual {Number(product.sold_count || 0)}x
                  </span>
                  {ratingStats.total > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">
                        {ratingStats.total} Ulasan
                      </span>
                    </>
                  )}
                  {product.rating_label && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {product.rating_label}
                      </span>
                    </>
                  )}
                  {product.brand && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500 capitalize">
                        {product.brand}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {shopVouchers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-800">
                      <Tag className="w-3.5 h-3.5" />
                      Voucher Toko
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">
                      {shopVouchers.filter((v) => claimedDiscount?.code !== v.code).length} tersedia
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shopVouchers.map((voucher) => {
                      const isClaimed = claimedDiscount?.code === voucher.code;
                      const discountText =
                        voucher.discount_type === "fixed"
                          ? `Potongan Rp${Number(voucher.discount_value).toLocaleString("id-ID")}`
                          : `Diskon ${voucher.discount_value}%`;
                      return (
                        <div
                          key={voucher.id}
                          className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                            isClaimed
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-dashed border-emerald-400 bg-white hover:border-emerald-500"
                          }`}
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                                  {voucher.code}
                                </p>
                                <p className="text-xs font-semibold text-slate-700 mt-1 line-clamp-2">
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
                                  disabled={claimingVoucher}
                                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white hover:bg-[#143326] transition-colors disabled:opacity-60"
                                >
                                  {claimingVoucher ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Gift className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>

                            <div className="pt-2 border-t border-dashed border-emerald-200">
                              <p className="text-xs font-bold text-[#FF6B35]">
                                {discountText}
                              </p>
                              {voucher.min_purchase > 0 && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Min. belanja Rp
                                  {Number(voucher.min_purchase).toLocaleString("id-ID")}
                                </p>
                              )}
                              {voucher.max_discount > 0 && (
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Max. potongan Rp
                                  {Number(voucher.max_discount).toLocaleString("id-ID")}
                                </p>
                              )}
                              {voucher.voucher_type && voucher.voucher_type !== 'all' && (
                                <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                                  {voucher.voucher_type === 'rental' ? 'Khusus rental' : voucher.voucher_type === 'shop' ? 'Khusus belanja' : voucher.voucher_type === 'opentrip' ? 'Khusus open trip' : ''}
                                </p>
                              )}
                              {voucher.conditions && Object.keys(voucher.conditions).length > 0 && (
                                <div className="space-y-0.5 mt-1">
                                  {voucher.conditions.first_time_only && (
                                    <p className="text-[10px] text-amber-600 font-medium">• Khusus pembeli pertama</p>
                                  )}
                                  {voucher.conditions.must_invite_friends && (
                                    <p className="text-[10px] text-amber-600 font-medium">• Wajib undang {voucher.conditions.min_friends || 'teman'}</p>
                                  )}
                                  {voucher.conditions.requires_identity_verified && (
                                    <p className="text-[10px] text-amber-600 font-medium">• Wajib verifikasi KTP</p>
                                  )}
                                </div>
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
                                    toast.info("Voucher dibatalkan");
                                  }}
                                  className="text-[10px] text-red-600 hover:text-red-700 font-medium underline"
                                >
                                  Batal
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Purchase card */}
            <div className="lg:w-1/4 px-4 md:px-0">
              <Card className="p-5 sticky top-24 rounded-xl shadow-md border-none">
                <h3 className="font-bolder mb-1 text-slate-800 text-sm">
                  Atur Jumlah
                </h3>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-4 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100 w-30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-emerald-50/hover:text-[#1B4332]"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="flex-1 text-center font-bold text-sm">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-emerald-50/hover:text-[#1B4332]"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs mb-3 py-0 rounded-lg ">
                    {/* <CheckCircle className="w-4 h-4" /> */}
                    {/* <span className="text-slate-300">|</span> */}
                    {shopStock > 0 ? (
                      <span className="text-slate-500">
                        {" "}
                        Tersedia {shopStock}{" "}
                      </span>
                    ) : (
                      "Stok Habis"
                    )}
                  </div>
                </div>

                {/* <div
                  className={`flex items-center gap-2 text-sm font-bold mb-4 px-3 py-2 rounded-lg ${
                    shopStock > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {shopStock > 0
                    ? `Stok Tersedia (${shopStock})`
                    : "Stok Habis"}
                </div> */}

                <div className="flex justify-between mb-6">
                  <span className="text-sm text-slate-500 font-medium">
                    Subtotal
                  </span>
                  <span className="font-bold text-lg text-[#FF6B35]">
                    Rp{(shopPrice * quantity).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleShopAddToCart}
                    variant="outline"
                    disabled={shopStock <= 0}
                    className="w-full font-bold py-6 rounded-xl text-[#1B4332] border-[#1B4332] hover:bg-emerald-50 hover:text-[#1B4332] transition-all"
                  >
                    Masuk Keranjang
                  </Button>
                  <Button
                    onClick={handleShopBuyNow}
                    disabled={shopStock <= 0}
                    className="w-full bg-[#1B4332] hover:bg-[#143326] font-bold py-6 rounded-xl shadow-lg transition-all"
                  >
                    Beli Sekarang
                  </Button>
                </div>

                <div className="mt-6 pt-4 border-t flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#1B4332] shrink-0" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Produk original berkualitas. Pembayaran aman.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Detail Produk */}
          <div className="mt-6 px-4 md:px-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 sticky top-0">
                <span className="w-1 h-4 rounded-full bg-[#1B4332]" />
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Detail Produk
                </h2>
              </div>
              <div className="p-6">
                <Markdown>{product.description}</Markdown>

                <div className="flex flex-wrap gap-2 pt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {product.category || "Produk"}
                  </span>
                  {product.brand && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {product.brand}
                    </span>
                  )}
                  {product.material && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {product.material}
                    </span>
                  )}
                  {product.weight_kg != null && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {formatWeight(product.weight_kg)}
                    </span>
                  )}
                  {product.dimensions && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {product.dimensions}
                    </span>
                  )}
                </div>

                {shopSpecs.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {shopSpecs.map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400 capitalize shrink-0">
                            {String(key).replace(/_/g, " ")}
                          </span>
                          <span className="text-slate-300">-</span>
                          <span className="font-medium text-slate-800 truncate">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ProductReviewsSection
              id={id}
              isShop={isShop}
              reviews={reviews}
              ratingStats={ratingStats}
              filteredReviews={filteredReviews}
              reviewFilters={reviewFilters}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              showReviewForm={showReviewForm}
              setShowReviewForm={setShowReviewForm}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              submittingReply={submittingReply}
              handleReplySubmit={handleReplySubmit}
              getRepliesForReview={getRepliesForReview}
              canReview={canReview}
              onReviewSubmitted={handleReviewSubmitted}
            />
        </div>
      </div>
    );

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price_per_night,
      image_url: product.image_url,
      quantity: 1,
      category: product.equipment_categories?.name,
      description: product.description,
      specifications: product.specifications,
      weight_kg: product.weight_kg,
      dimensions: product.dimensions,
      capacity: product.capacity,
      material: product.material,
      weather_rating: product.weather_rating,
      brand: product.brand,
    });

    toast.success(`${product.name} masuk keranjang!`, {
      style: {
        background: "#1B4332",
        color: "#fff",
        borderRadius: "12px",
      },
    });
  };

  // Sewa Langsung: tulis item ke transaction sebelum menuju booking agar ringkasan
  // selalu menampilkan produk yang diklik (bukan sisa transaction dari sesi lama).
  const handleDirectBooking = () => {
    setTransaction({
      items: [
        {
          id: product.id,
          name: product.name,
          price: Number(product.price_per_night),
          quantity: Math.max(1, Number(quantity)),
          category: product.equipment_categories?.name || "Equipment",
          image_url: product.image_url,
        },
      ],
      duration: 0,
      days: 0,
      totalPrice: Number(pricePerNight) * Math.max(1, Number(quantity)),
      payment: { method: "" },
    });
    router.push(`/booking?id=${id}&quantity=${quantity}${dateQuery}`);
  };

  const inventory = getInventoryStatus(product.id);
  const isAvailable = inventory.availableUnits > 0;
  const pricePerNight = Number(product.price_per_night || 0);
  const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(
    Boolean,
  );

  return (
    <div className="min-h-screen bg-white pb-15 md:pb-16">
      <nav className="bg-white hidden border-b border-slate-200 py-3 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-500 capitalize">
          <Link
            href="/catalog"
            className="hover:text-[#1B4332] transition-colors"
          >
            Katalog
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-400">
            {product.equipment_categories?.name}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-[#1B4332] truncate font-bold">
            {product.name}
          </span>
        </div>
      </nav>

      {/* Top nav: tombol kembali + breadcrumb. Bilahnya tetap full-bleed,
          tapi isinya duduk di kontainer yang sama dengan konten di bawahnya
          (`max-w-7xl mx-auto px-4`, sama seperti `md:px-4` pada blok produk).
          Sebelumnya `ps-55` — 220px tetap, yang cuma kebetulan benar di satu
          lebar layar dan meleset di semua yang lain. */}
      <div className="hidden md:block bg-white top-0 md:z-0 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="group flex items-center justify-center w-10 h-5 shrink-0"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-gray-900 group-hover:text-forest transition-colors" />
          </button>

          <Breadcrumb>
            <BreadcrumbList className="text-[10px] md:text-xs font-bold tracking-[0.1em] text-gray-900">
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="hover:text-[#FF6B35] text-gray-900 transition-colors"
                >
                  Beranda /
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* <BreadcrumbSeparator className="text-white/40" /> */}
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/catalog_rental"
                  className="hover:text-[#FF6B35] text-gray-900 transition-colors"
                >
                  Rental /
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <BreadcrumbPage className="text-[#FF6B35] font-extrabold">
                    {product.name}
                  </BreadcrumbPage>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-1">
        {/* OVERLAY GELAP (Klik luar untuk menutup) */}
        {showSelection && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowSelection(false)}
          />
        )}

        {/* PANEL SELEKSI & TOMBOL */}
        <div className="relative bg-white border-t shadow-[0_-10px_15px_rgba(0,0,0,0.1)]">
          {showSelection && (
            <div className="p-4 border-b bg-slate-50/50 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Atur Durasi Sewa
                </h3>
              </div>

              {/* INFO PRODUK DENGAN FOTO */}
              <div className="flex gap-4 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm mb-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border shrink-0">
                  <Image
                    loader={unsplashLoader}
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
                    className="object-contain"
                    priority={true}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-800 truncate capitalize">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Rp{pricePerNight.toLocaleString("id-ID")} / hari
                  </p>
                </div>
              </div>

              {/* INPUT DURASI & TOTAL */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Total Biaya
                  </span>
                  <span className="text-lg font-extrabold text-[#FF6B35]">
                    Rp{(pricePerNight * quantity).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex items-center gap-3 border rounded-lg p-1 bg-slate-50">
                  <button
                    className="text-[#1B4332] font-black px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah klik tembus ke overlay
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-12 text-center text-slate-700">
                    {quantity} Hari
                  </span>
                  <button
                    className="text-[#1B4332] font-black px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah klik tembus ke overlay
                      setQuantity(quantity + 1);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TOMBOL AKSI UTAMA */}
          <div className="p-3 flex gap-3">
            <Button
              asChild
              variant="outline"
              className="flex-1 border-slate-200 text-slate-600 font-bold h-12 rounded-lg"
            >
              <a
                href={`https://wa.me/${branchPhone}?text=${encodeURIComponent(
                  `Halo Habema Outdoor, saya mau tanya soal produk *${product.name}* (${id}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-1" /> Chat
              </a>
            </Button>

            {!showSelection ? (
              <Button
                onClick={() => setShowSelection(true)}
                className="flex-2 bg-[#1B4332] hover:bg-[#143326] font-bold h-12 rounded-lg text-white"
              >
                Sewa Sekarang
              </Button>
            ) : (
              <Button
                onClick={handleDirectBooking}
                className="flex-2 bg-[#1B4332] hover:bg-[#143326] font-bold h-12 rounded-lg text-white shadow-lg"
              >
                Konfirmasi Sewa
              </Button>
            )}
          </div>
        </div>

        {/* ketika click keranjang ada pop up dimasukkan ke keranjang! */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-1">
          {/* OVERLAY GELAP */}
          {showCart && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setShowCart(false)}
            />
          )}

          {/* PANEL CART */}
          <div
            className={`relative bg-white border-t rounded-t-2xl shadow-[0_-10px_15px_rgba(0,0,0,0.1)] transition-all duration-300 transform ${showCart ? "translate-y-0" : "translate-y-full"}`}
          >
            {showCart && (
              <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    Produk Ditambahkan ke Keranjang!
                  </h3>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-1 bg-slate-100 rounded-full text-slate-400"
                  >
                    <X className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                <Button
                  asChild
                  className="w-full bg-[#1B4332] hover:bg-[#143326] font-bold h-12 rounded-lg text-white shadow-lg"
                >
                  <Link href="/cart">Lihat Keranjang</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

        <div className="max-w-7xl mx-auto md:px-4 pt-4 md:pt-8 lg:pt-12">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3">
            <div className="bg-white md:rounded-xl overflow-hidden sticky md:top-24 shadow-sm border border-slate-100">
              <div className="relative aspect-square">
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[selectedImage]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100">
                    <Package className="w-16 h-16 text-stone-300" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="p-4 hidden md:flex gap-2 border-t flex-wrap">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedImage === i
                          ? "border-[#1B4332] opacity-100"
                          : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${product.name} ${i + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-5/12 px-4 md:px-0 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#FF6B35] font-bold text-2xl">
                    Rp{pricePerNight.toLocaleString("id-ID")}
                  </span>
                  <span className="text-slate-400 text-sm">/ hari</span>
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-800 capitalize leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
                {ratingStats.total > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="w-4 h-4 fill-current" />
                      {ratingStats.average.toFixed(1)}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">
                      {ratingStats.total} Review
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">
                    Tersewa {product.rental_count || "50"}+ kali
                  </span>
                )}
              </div>
              {/* Aksi versi non-desktop-large: panel kanan (lg:w-1/4) baru muncul di lg, jadi wishlist/bagikan perlu versi sendiri di bawahnya. */}
              <div className="mt-1 pt-3 border-t flex gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={toggleWishlist}
                  aria-pressed={isWishlisted}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold transition-colors ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {isWishlisted ? "Tersimpan" : "Wishlist"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShare(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Share2 className="w-4 h-4" />
                  Bagikan
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="font-bold mb-3 text-sm uppercase tracking-wide">
                Detail & Spesifikasi
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {product.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Kategori</span>
                  <span className="text-slate-300">-</span>
                  <span className="font-medium text-slate-800">
                    {product.equipment_categories?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Kondisi</span>
                  <span className="text-slate-300">-</span>
                  <span className="font-medium text-slate-800">
                    Sangat Layak (QC Passed)
                  </span>
                </div>
                {product.specs &&
                  Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-slate-400 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-300">-</span>
                      <span className="font-medium text-slate-800">
                        {String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="lg:w-1/4 hidden lg:block">
            <Card className="p-5 sticky top-24 rounded-xl shadow-md border-none">
              <h3 className="font-bold mb-4 text-slate-800 text-sm">
                Atur Durasi Sewa
              </h3>

              <div className="flex items-center gap-4 mb-6 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-white"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="flex-1 text-center font-bold text-sm">
                  {quantity} Hari
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-white"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-sm text-slate-500 font-medium">
                  Subtotal
                </span>
                <span className="font-bold text-lg text-[#FF6B35]">
                  Rp{(pricePerNight * quantity).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="w-full font-bold py-6 rounded-xl text-[#1B4332] border-[#1B4332] hover:bg-emerald-50 hover:text-[#1B4332] transition-all"
                >
                  Masuk Keranjang
                </Button>
                <Button
                  onClick={handleDirectBooking}
                  className="w-full bg-[#1B4332] hover:bg-[#143326] font-bold py-6 rounded-xl shadow-lg transition-all"
                >
                  Sewa Langsung
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-around">
                <button
                  className="flex flex-col items-center gap-1 group"
                  onClick={toggleWishlist}
                  type="button"
                  aria-pressed={isWishlisted}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400 group-hover:text-slate-600"}`}
                  />
                  <span className="text-[10px] font-bold text-slate-500">
                    Wishlist
                  </span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  onClick={() => setShowShare(true)}
                  type="button"
                >
                  <Share2 className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  <span className="text-[10px] font-bold text-slate-500">
                    Bagikan
                  </span>
                </button>
              </div>
            </Card>
          </div>
        </div>

        <ProductReviewsSection
            id={id}
            isShop={isShop}
            reviews={reviews}
            ratingStats={ratingStats}
            filteredReviews={filteredReviews}
            reviewFilters={reviewFilters}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            showReviewForm={showReviewForm}
            setShowReviewForm={setShowReviewForm}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyText={replyText}
            setReplyText={setReplyText}
            submittingReply={submittingReply}
            handleReplySubmit={handleReplySubmit}
            getRepliesForReview={getRepliesForReview}
            canReview={canReview}
            onReviewSubmitted={handleReviewSubmitted}
          />

        <div className="mt-16 px-4 md:px-0">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-emerald-100 rounded-md">
              <TrendingUp className="w-4 h-4 text-[#1B4332]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Pilihan Serupa di {product.equipment_categories?.name}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="mt-20 px-4 md:px-0">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-orange-100 rounded-md">
              <Flame className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Sering Disewa Bareng
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {popularProducts.length > 0
              ? popularProducts.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))
              : [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
          </div>
        </div>
      </div>
      {/* MODAL SHARE */}
      {showShare && (
        <>
          {/* OVERLAY GELAP */}
          <div
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowShare(false)}
          />

          {/* PANEL SHARE - Desktop Center */}
          <div className="fixed inset-0 z-[70] items-center justify-center hidden md:flex">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">
                      Bagikan Produk
                    </h3>
                    <p className="text-sm text-slate-500">
                      Share ke teman dan keluargamu!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShare(false)}
                    className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* GRID ICON MEDIA SOSIAL - Desktop */}
                <div className="grid grid-cols-4 gap-4">
                  <ShareOption
                    icon="WhatsApp"
                    label="WhatsApp"
                    color="bg-green-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Instagram"
                    label="Instagram"
                    color="bg-pink-600"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Facebook"
                    label="Facebook"
                    color="bg-blue-600"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Messenger"
                    label="Messenger"
                    color="bg-blue-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Telegram"
                    label="Telegram"
                    color="bg-sky-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Line"
                    label="Line"
                    color="bg-green-400"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Copy"
                    label="Salin Link"
                    color="bg-slate-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="More"
                    label="Lainnya"
                    color="bg-slate-800"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PANEL SHARE - Mobile Bottom */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70]">
            <div className="relative bg-white border-t rounded-t-2xl shadow-[0_-10px_15px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-300">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">
                      Bagikan Produk
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Share ke teman dan keluargamu!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShare(false)}
                    className="p-1 bg-slate-100 rounded-full text-slate-400"
                  >
                    <X className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                {/* GRID ICON MEDIA SOSIAL - Mobile */}
                <div className="grid grid-cols-4 gap-y-6">
                  <ShareOption
                    icon="WhatsApp"
                    label="WhatsApp"
                    color="bg-green-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Instagram"
                    label="Instagram"
                    color="bg-pink-600"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Facebook"
                    label="Facebook"
                    color="bg-blue-600"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Messenger"
                    label="Messenger"
                    color="bg-blue-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Telegram"
                    label="Telegram"
                    color="bg-sky-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Line"
                    label="Line"
                    color="bg-green-400"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="Copy"
                    label="Salin Link"
                    color="bg-slate-500"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                  <ShareOption
                    icon="More"
                    label="Lainnya"
                    color="bg-slate-800"
                    productUrl={product?.id ? `/product/${product.id}` : ""}
                    productName={product?.name || "Produk"}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />

    </div>
  );
}

function ShareOption({
  icon,
  label,
  color,
  productUrl,
  productName,
}: {
  icon: string;
  label: string;
  color: string;
  productUrl: string;
  productName: string;
}) {
  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const shareText = `Lihat produk ini: ${productName}`;
    const fullUrl =
      typeof window !== "undefined"
        ? window.location.origin + productUrl
        : productUrl;

    switch (icon) {
      case "WhatsApp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + " " + fullUrl)}`,
          "_blank",
        );
        break;

      case "Facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
          "_blank",
        );
        break;

      case "Instagram":
        // Instagram doesn't support direct URL sharing, so we copy to clipboard
        if (navigator.share) {
          try {
            await navigator.share({
              title: productName,
              text: shareText,
              url: fullUrl,
            });
          } catch (err) {
            // Fallback to copy
            copyToClipboard(fullUrl, e.currentTarget);
          }
        } else {
          copyToClipboard(fullUrl, e.currentTarget);
        }
        break;

      case "Messenger":
        window.open(
          `https://www.facebook.com/dialog/send?link=${encodeURIComponent(fullUrl)}&app_id=YOUR_APP_ID`,
          "_blank",
        );
        break;

      case "Telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
          "_blank",
        );
        break;

      case "Line":
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
          "_blank",
        );
        break;

      case "Copy":
        copyToClipboard(fullUrl, e.currentTarget);
        break;

      case "More":
        if (navigator.share) {
          try {
            await navigator.share({
              title: productName,
              text: shareText,
              url: fullUrl,
            });
          } catch (err) {
            console.log("Share cancelled or failed:", err);
            copyToClipboard(fullUrl, e.currentTarget);
          }
        } else {
          copyToClipboard(fullUrl, e.currentTarget);
        }
        break;

      default:
        copyToClipboard(fullUrl, e.currentTarget);
    }
  };

  const copyToClipboard = async (text: string, buttonElement?: HTMLElement) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success feedback
      if (buttonElement) {
        const originalContent = buttonElement.innerHTML;
        buttonElement.innerHTML = '<div class="font-bold text-xs">✓</div>';
        setTimeout(() => {
          buttonElement.innerHTML = originalContent;
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getIcon = () => {
    switch (icon) {
      case "WhatsApp":
        return <MessageCircle className="w-6 h-6" />;
      case "Copy":
        return <Share2 className="w-6 h-6" />;
      case "Facebook":
        return <div className="font-bold text-xs">f</div>;
      case "Instagram":
        return <div className="font-bold text-xs">📷</div>;
      case "Messenger":
        return <MessageSquare className="w-6 h-6" />;
      case "Telegram":
        return <div className="font-bold text-xs">✈️</div>;
      case "Line":
        return <div className="font-bold text-xs">LINE</div>;
      case "More":
        return <div className="font-bold text-xs">⋯</div>;
      default:
        return <div className="font-bold text-xs">{icon[0]}</div>;
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform`}
      >
        {getIcon()}
      </div>
      <span className="text-[10px] font-bold text-slate-600">{label}</span>
    </button>
  );
}

// Function to calculate rating from reviews (excluding replies)
const calculateRatingFromReviews = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) {
    return { average: 4.9, count: 0 };
  }

  // Only count reviews that are not replies (exclude @mention replies)
  const validReviews = reviews.filter(
    (review) => !review.comment.startsWith("@"),
  );
  const totalRating = validReviews.reduce(
    (sum, review) => sum + review.rating,
    0,
  );
  const averageRating =
    validReviews.length > 0 ? totalRating / validReviews.length : 4.9;

  return {
    average: averageRating,
    count: validReviews.length,
  };
};

// Function to get replies for a specific review
const getRepliesForReview = (reviewId: number, allReviews: any[]) => {
  const review = allReviews.find((r) => r.id === reviewId);
  if (!review) return [];

  // Find replies that mention the review author (replies start with @mention)
  const mentionName = review.users?.full_name || "User";
  return allReviews.filter(
    (r) => r.comment.startsWith(`@${mentionName}:`) && r.id !== reviewId,
  );
};

// Function to filter reviews based on active filter
const getFilteredReviews = (allReviews: any[], activeFilter: string) => {
  // Exclude replies from main review list
  const mainReviews = allReviews.filter(
    (review) => !review.comment.startsWith("@"),
  );

  switch (activeFilter) {
    case "Dengan Foto":
      // For now, return all since we don't have image data in reviews
      // TODO: Add image filtering logic when review images are implemented
      return mainReviews;
    case "Bintang 5":
      return mainReviews.filter((review) => review.rating === 5);
    case "Bintang 4":
      return mainReviews.filter((review) => review.rating === 4);
    default:
      return mainReviews;
  }
};

function ProductCard({ item }: { item: any }) {
  const imageSrc =
    item.image_url && item.image_url.trim() !== "" ? item.image_url : null;

  // Calculate rating from reviews if available
  const rating = item.reviews
    ? calculateRatingFromReviews(item.reviews)
    : { average: item.average_rating || 4.9, count: 0 };

  return (
    <Link href={`/product/${item.id}`} className="group">
      <Card className="h-full border-none shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden bg-white">
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
              <span className="text-2xl mb-1">🏕️</span>
              <span className="text-[10px] font-medium">No Image</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {item.equipment_categories?.name || "Outdoor"}
          </p>
          <h3 className="text-sm font-medium text-slate-800 line-clamp-2 min-h-[40px] leading-snug">
            {item.name}
          </h3>
          <p className="text-[#FF6B35] font-bold text-base">
            Rp{Number(item.price_per_night || 0).toLocaleString("id-ID")}
          </p>
          <div className="flex items-center gap-1 pt-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="text-[10px] text-slate-400 font-medium">
              {rating.average.toFixed(1)} |{" "}
              {rating.count > 0
                ? `${rating.count} Review`
                : `${item.rental_count || "50"}+ Tersewa`}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
