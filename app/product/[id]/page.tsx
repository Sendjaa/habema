"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getInventoryStatus } from "@/lib/catalog-context";
import { ReviewForm } from "@/components/product/review-form";
import {
  ShoppingCart,
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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { LoginModal } from "@/components/auth/login-modal";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // --- SEMUA HOOKS HARUS DI ATAS ---
  const [product, setProduct] = useState<any>(null);
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
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("Semua");

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

  const [helpfulCount, setHelpfulCount] = useState([12, 8, 5, 2, 1]);
  const [isLiked, setIsLiked] = useState([false, false, false, false, false]);
  const addToCart = useCartStore((state) => state.addToCart);
  const setTransaction = useCartStore((state) => state.setTransaction);
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
      const replyData = {
        equipment_id: id,
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
        .eq("equipment_id", id)
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

  // Calculate rating statistics from reviews
  const ratingStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        satisfaction: 0,
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
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
        .eq("equipment_id", product.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setReviews(data || []));
    }
    setShowReviewForm(false);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("equipment")
        .select(`*, equipment_categories(name)`)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
      } else {
        setProduct({
          ...(data as any),
          specs: (data as any).specifications || {},
        });
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      supabase
        .from("equipment")
        .select(`*, equipment_categories(name)`)
        .neq("id", product.id)
        .eq("category_id", product.category_id)
        .limit(4)
        .then(({ data }) => setRelatedProducts(data || []));

      supabase
        .from("equipment")
        .select(`*, equipment_categories(name)`)
        .neq("id", product.id)
        .limit(8)
        .then(({ data }) => setPopularProducts(data || []));

      // Fetch reviews
      supabase
        .from("reviews")
        .select("*, users(full_name)")
        .eq("equipment_id", product.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setReviews(data || []));
    }
  }, [product]);

  if (loading)
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  if (!product)
    return (
      <div className="p-20 text-center font-bold text-slate-500">
        Produk tidak ditemukan
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
  const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-15 md:pb-16">
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

      {/* Mobile Top Nav */}
      <div className="hidden md:flex bg-white items-center p-2 top-0 md:z-0 shadow-sm border-b ps-55">
        <button
          onClick={() => router.back()}
          className="group flex items-center justify-center w-10 h-5"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4 text-gray-900 group-hover:text-forest transition-colors" />
        </button>

        <Breadcrumb>
          <BreadcrumbList className="text-[10px] md:text-xs font-bold tracking-0.1em text-gray-900">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="hover:text-[#D4AF37] text-gray-900 transition-colors"
              >
                Beranda /
              </BreadcrumbLink>
            </BreadcrumbItem>
            {/* <BreadcrumbSeparator className="text-white/40" /> */}
            <BreadcrumbItem>
               <BreadcrumbLink
                href="/"
                className="hover:text-[#D4AF37] text-gray-900 transition-colors"
              >
                Rental /
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <BreadcrumbPage className="text-[#D4AF37] font-extrabold">
                  {product.name}
                </BreadcrumbPage>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
                href={`https://wa.me/6283898749357?text=${encodeURIComponent(
                  `Halo Habema Outdoor, saya mau tanya soal produk *${product.name}* (${id}).`
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

        {/* MODAL SHARE */}
        {showShare && (
          <>
            {/* OVERLAY GELAP */}
            <div
              className="fixed inset-0 z-1 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setShowShare(false)}
            />

            {/* PANEL SHARE - Desktop Center */}
            <div className="fixed inset-0 z-1 items-center justify-center hidden md:flex">
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
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-1">
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

      <div className="max-w-7xl mx-auto md:px-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3">
            <div className="bg-white md:rounded-xl overflow-hidden sticky md:top-24 shadow-sm border border-slate-100">
              <div className="relative aspect-square">
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[selectedImage]}
                    alt={product.name}
                    fill
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
                          ? 'border-[#1B4332] opacity-100'
                          : 'border-transparent opacity-50 hover:opacity-100'
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
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" />{" "}
                  {calculateRatingFromReviews(reviews).average.toFixed(1)}
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  {reviews.length > 0
                    ? `${reviews.length} Review`
                    : `Tersewa ${product.rental_count || "50"}+ kali`}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="font-bold mb-3 border-b pb-2 text-sm uppercase tracking-wide">
                Detail Produk
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <p>{product.description}</p>
                <div className="grid grid-cols-2 gap-y-3 pt-2">
                  <div className="text-slate-400">Kategori</div>
                  <div className="text-[#1B4332] font-semibold">
                    {product.equipment_categories?.name}
                  </div>
                  <div className="text-slate-400">Kondisi</div>
                  <div className="text-slate-800 font-semibold">
                    Sangat Layak (QC Passed)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="font-bold mb-4 text-sm uppercase tracking-wide">
                Spesifikasi Teknis
              </h2>
              <div className="space-y-3">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between text-sm border-b border-dashed pb-2"
                  >
                    <span className="text-slate-400 capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
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
                  onClick={() => setIsWishlisted(!isWishlisted)}
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
                  onClick={() => {
                    console.log("Share button clicked - desktop sidebar");
                    console.log("Current showShare state:", showShare);
                    setShowShare(true);
                    console.log("Set showShare to true");
                  }}
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

        {/* SECTION ULASAN */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-4">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-sm uppercase tracking-wide text-slate-800">
              Ulasan Penyewa
            </h2>
            <Button
              variant="ghost"
              className="flex items-center gap-1 text-[#1B4332] font-bold text-sm p-0 hover:bg-transparent"
              onClick={() => router.push(`/product/${product.id}/reviews`)}
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* RATING SUMMARY */}
          <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-slate-50">
            <div className="flex flex-col items-center justify-center text-center px-4 border-r border-slate-100 pr-8">
              <div className="text-5xl font-black text-slate-800 flex items-baseline gap-1">
                {ratingStats.average.toFixed(1)}
                <span className="text-lg text-slate-400 font-normal">/5.0</span>
              </div>
              <div className="flex gap-1 my-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(ratingStats.average) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {ratingStats.satisfaction}% penyewa puas dengan alat ini (
                {ratingStats.total} review)
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  ratingStats.distribution[
                    star as keyof typeof ratingStats.distribution
                  ];
                const percentage =
                  ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 w-6">
                      <span className="font-bold text-slate-600">{star}</span>
                      <Star className="w-3 h-3 fill-slate-400 text-slate-400" />
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-slate-400 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FILTER ULASAN */}
          <div className="flex flex-wrap gap-2 mb-8">
            {reviewFilters.map((filter) => (
              <Badge
                key={filter}
                variant="outline"
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                  activeFilter === filter
                    ? "bg-[#1B4332] text-white border-[#1B4332]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#1B4332]"
                }`}
              >
                {filter}
              </Badge>
            ))}
          </div>

          {/* LIST KOMENTAR */}
          <div className="space-y-8">
            {(() => {
              const filteredReviews = getFilteredReviews(reviews, activeFilter);
              return filteredReviews.length > 0 ? (
                filteredReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="space-y-3 group">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden relative">
                          <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">
                            {review.users?.full_name?.charAt(0) || "U"}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {review.users?.full_name || "User"}
                          </p>
                          <div className="flex gap-0.5 my-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {new Date(review.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Reply Form */}
                    {replyingTo === review.id && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Tulis balasan Anda..."
                            className="w-full p-2 text-sm border border-slate-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            rows={3}
                            disabled={submittingReply}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              disabled={submittingReply}
                            >
                              Batal
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReplySubmit(review.id)}
                              disabled={
                                submittingReply || replyText.trim().length < 5
                              }
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {submittingReply
                                ? "Mengirim..."
                                : "Kirim Balasan"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display Replies */}
                    {(() => {
                      const replies = getRepliesForReview(review.id, reviews);
                      if (replies.length > 0) {
                        return (
                          <div className="mt-3 space-y-2">
                            {replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="ml-8 p-3 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-emerald-600">
                                      {(reply.users?.full_name ||
                                        "User")[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                      {reply.users?.full_name || "User"}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {new Date(
                                        reply.created_at,
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {reply.comment.replace(/^@\w+:\s*/, "")}{" "}
                                  {/* Remove @mention prefix */}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600"
                        onClick={() => setReplyingTo(review.id)}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Balas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Lapor
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">
                    {activeFilter === "Bintang 4"
                      ? "Belum ada ulasan bintang 4 untuk produk ini"
                      : activeFilter === "Bintang 5"
                        ? "Belum ada ulasan bintang 5 untuk produk ini"
                        : activeFilter === "Dengan Foto"
                          ? "Belum ada ulasan dengan foto untuk produk ini"
                          : "Belum ada ulasan untuk produk ini"}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* ADD REVIEW BUTTON */}
          <div className="mt-8 pt-8 border-t border-slate-50">
            {!showReviewForm ? (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="w-full"
              >
                Tulis Ulasan
              </Button>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                  className="w-full"
                >
                  Batal
                </Button>
                <ReviewForm
                  equipmentId={product.id}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              </div>
            )}
          </div>
        </div>

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
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
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
