"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getInventoryStatus } from "@/lib/catalog-context";
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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";

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
  // const [likedReviews, setLikedReviews] = useState<number[]>([]);
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("Semua");

  const [helpfulCount, setHelpfulCount] = useState([12, 8, 5, 2, 1]);
  const [isLiked, setIsLiked] = useState([false, false, false, false, false]);
  const addToCart = useCartStore((state) => state.addToCart);
  const unsplashLoader = ({src, width, quality, }: any ) => {
    return `${src}?auto=format&fit=crop&w=${width}&q=${quality || 75}`;
  }

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

  const reviewFilters = ["Semua", "Dengan Foto", "Bintang 5", "Bintang 4"];

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
        setProduct({ ...data, specs: data.specifications || {} });
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
    });

    toast.success(`${product.name} masuk keranjang!`, {
      style: {
        background: "#1B4332",
        color: "#fff",
        borderRadius: "12px",
      },
    });
  };

  const inventory = getInventoryStatus(product.id);
  const isAvailable = inventory.availableUnits > 0;
  const pricePerNight = Number(product.price_per_night || 0);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 md:pb-16">
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
      <div className="md:hidden bg-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm border-b">
        <button
          onClick={() => router.push("/catalog")}
          className="text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="..."> {product.name} </h1>
        <div className="flex gap-4">
          {/* Ubah ini */}
          <button onClick={() => setShowShare(true)}>
            <Share2 className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={true}
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
              variant="outline"
              className="flex-1 border-slate-200 text-slate-600 font-bold h-12 rounded-lg"
            >
              <MessageCircle className="w-5 h-5 mr-1" /> Chat
            </Button>

            {!showSelection ? (
              <Button
                onClick={() => setShowSelection(true)}
                className="flex-[2] bg-[#1B4332] hover:bg-[#143326] font-bold h-12 rounded-lg text-white"
              >
                Sewa Sekarang
              </Button>
            ) : (
              <Button
                asChild
                className="flex-[2] bg-[#1B4332] hover:bg-[#143326] font-bold h-12 rounded-lg text-white shadow-lg"
              >
                <Link href={`/booking?id=${id}&quantity=${quantity}`}>
                  Konfirmasi Sewa
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* MODAL SHARE */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60]">
          {/* OVERLAY GELAP */}
          {showShare && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setShowShare(false)}
            />
          )}

          {/* PANEL SHARE */}
          <div
            className={`relative bg-white border-t rounded-t-2xl shadow-[0_-10px_15px_rgba(0,0,0,0.1)] transition-all duration-300 transform ${showShare ? "translate-y-0" : "translate-y-full"}`}
          >
            {showShare && (
              <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
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

                {/* GRID ICON MEDIA SOSIAL */}
                <div className="grid grid-cols-4 gap-y-6">
                  <ShareOption
                    icon="WhatsApp"
                    label="WhatsApp"
                    color="bg-green-500"
                  />
                  <ShareOption
                    icon="Instagram"
                    label="Instagram"
                    color="bg-pink-600"
                  />
                  <ShareOption
                    icon="Facebook"
                    label="Facebook"
                    color="bg-blue-600"
                  />
                  <ShareOption
                    icon="Messenger"
                    label="Messenger"
                    color="bg-blue-500"
                  />
                  <ShareOption
                    icon="Telegram"
                    label="Telegram"
                    color="bg-sky-500"
                  />
                  <ShareOption icon="Line" label="Line" color="bg-green-400" />
                  <ShareOption
                    icon="Copy"
                    label="Salin Link"
                    color="bg-slate-500"
                  />
                  <ShareOption
                    icon="More"
                    label="Lainnya"
                    color="bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ketika click keranjang ada pop up dimasukkan ke keranjang! */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60]">
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
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 hidden md:flex gap-2 border-t">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 border rounded-lg overflow-hidden cursor-pointer hover:border-[#1B4332] transition-all"
                  >
                    <Image
                      src={product.image_url}
                      alt="thumbnail"
                      width={80}
                      height={80}
                      className="object-cover opacity-50 hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-5/12 px-4 md:px-0 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[#FF6B35] font-bold text-2xl">
                  Rp{pricePerNight.toLocaleString("id-ID")}
                </span>
                <span className="text-slate-400 text-sm">/ hari</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 capitalize leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" /> 4.9
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Tersewa 50+ kali</span>
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
                  asChild
                  className="w-full bg-[#1B4332] hover:bg-[#143326] font-bold py-6 rounded-xl shadow-lg transition-all"
                >
                  <Link href={`/booking?id=${id}&quantity=${quantity}`}>
                    Sewa Langsung
                  </Link>
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
                <button className="flex flex-col items-center gap-1 group">
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
                4.9
                <span className="text-lg text-slate-400 font-normal">/5.0</span>
              </div>
              <div className="flex gap-1 my-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                98% penyewa puas dengan alat ini
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-6">
                    <span className="font-bold text-slate-600">{star}</span>
                    <Star className="w-3 h-3 fill-slate-400 text-slate-400" />
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{
                        width: star === 5 ? "85%" : star === 4 ? "10%" : "2%",
                      }}
                    />
                  </div>
                  <span className="text-slate-400 w-8 text-right">
                    {star === 5 ? "42" : star === 4 ? "5" : "1"}
                  </span>
                </div>
              ))}
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
            {[0, 1].map((index) => (
              <div key={index} className="space-y-3 group">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden relative">
                      {/* Placeholder avatar */}
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">
                        B
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Budi Santoso {index + 1}
                      </p>
                      <div className="flex gap-0.5 my-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-3 h-3 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {index === 0
                          ? "2 hari yang lalu"
                          : "1 minggu yang lalu"}{" "}
                        • Variasi: Hijau Army
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-300 hover:text-slate-600"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Barangnya sangat terawat, bersih, dan wanginya enak.
                  Pengirimannya juga cepat banget. Sangat recommended buat yang
                  mau naik gunung tapi males beli alat mahal.
                </p>

                {/* FOTO DARI USER */}
                <div className="flex gap-2">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border group-hover:border-[#1B4332] transition-colors cursor-zoom-in">
                    <Image
                      src={product.image_url}
                      alt="user review"
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                      isLiked[index]
                        ? "text-[#1B4332]"
                        : "text-slate-500 hover:text-[#1B4332]"
                    }`}
                    onClick={() => handleHelpfulClick(index)}
                  >
                    <TrendingUp
                      className={`w-4 h-4 ${isLiked[index] ? "animate-bounce" : ""}`}
                    />
                    Membantu ({helpfulCount[index]})
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1B4332] transition-colors"
                    onClick={() => alert("Fitur balas akan segera hadir!")}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Balas
                  </button>
                </div>
                {index === 0 && <Separator className="mt-6 opacity-50" />}
              </div>
            ))}
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
    </div>
  );
}

function ShareOption({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <button className="flex flex-col items-center gap-2 group">
      <div
        className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform`}
      >
        {icon === "WhatsApp" && <MessageCircle className="w-6 h-6" />}
        {icon === "Copy" && <Share2 className="w-6 h-6" />}
        {icon !== "WhatsApp" && icon !== "Copy" && (
          <div className="font-bold text-xs">{icon[0]}</div>
        )}
      </div>
      <span className="text-[10px] font-bold text-slate-600">{label}</span>
    </button>
  );
}

function ProductCard({ item }: { item: any }) {
  const imageSrc =
    item.image_url && item.image_url.trim() !== "" ? item.image_url : null;
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
              4.9 | 50+ Tersewa
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
