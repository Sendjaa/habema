"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { ShopGrid } from "@/components/catalog/shop-grid";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, ShoppingBag, Mountain } from "lucide-react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import { useParallax } from "./use-parallax";

export function ShopContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high" | "rating" | "newest">("name");
  const scrollY = useParallax();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: prodData } = await supabase.from("shop_products").select("*");
        if (prodData) {
          setProducts(
            prodData.map((item: any) => ({
              ...item,
              dailyPrice: item.price || 0,
              category_id: item.category || null,
              stock: item.stock ?? 0,
              original_price: item.original_price ?? null,
              discount: null,
              rating: item.rating ?? null,
              review_count: item.review_count ?? 0,
            })),
          );
          const cats = [...new Set(prodData.map((p: any) => p.category).filter(Boolean))];
          setDbCategories(cats.map((c: string) => ({ value: c, label: c })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category_id === selectedCategory);
    }
    result = result.filter(
      (item) => item.dailyPrice >= priceRange[0] && item.dailyPrice <= priceRange[1],
    );
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.dailyPrice - b.dailyPrice);
        break;
      case "price-high":
        result.sort((a, b) => b.dailyPrice - a.dailyPrice);
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime(),
        );
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  return (
    <>
      {/* STICKY BREADCRUMB BAR (desktop) — modern dengan transparansi */}
      <div className="hidden mx-auto md:flex bg-white/80 backdrop-blur-lg items-center p-2 ps-36 sticky top-0 z-30 shadow-sm border-b border-stone-200/50">
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
                className="hover:text-gold text-gray-900 transition-colors"
              >
                Beranda /
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gold font-extrabold">Toko</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* HERO BANNER — modern dengan gradient halus dan animasi */}
      <section className="relative overflow-hidden bg-forest py-12 md:py-20">
        <div className="absolute inset-0 bg-linear-to-br from-forest/90 via-forest-light/60 to-gold/20" />
        <div
          className="absolute inset-0 w-full h-full scale-100 pointer-events-none will-change-transform"
          style={{ transform: `translate3d(0, ${scrollY * 0.2}px, 0)` }}
        >
          <NextImage
            src="/images/background_catalog_shop.jpeg"
            fill
            priority
            alt="Shop Banner" 
            className="object-cover object-bottom"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          {/* Mobile back + breadcrumb */}
          <div className="flex items-center gap-2 mb-4 md:hidden">
            <button
              onClick={() => router.back()}
              className="group flex items-center justify-center w-10 h-5"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4 text-white group-hover:text-gold transition-colors" />
            </button>
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] font-bold tracking-0.1em text-white">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-gold text-white transition-colors">
                    Beranda /
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gold font-extrabold">Toko</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 mb-6">
              <ShoppingBag className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                Toko Outdoor
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
              Siapkan Gear, <span className="text-gold">Taklukkan Alam.</span>
            </h1>
            <p className="mt-3 max-w-xl mx-auto text-sm md:text-base text-white/70">
              Beli perlengkapan outdoor berkualitas untuk petualanganmu — dari tenda hingga alat masak.
            </p>
            <Button
              onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
              className="mt-6 bg-gold hover:bg-gold-light text-forest font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Jelajahi Koleksi
            </Button>
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT — modern dengan sidebar transparan */}
      <div className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filter — modern dengan backdrop blur */}
            {/* <aside className="lg:w-64 shrink-0">
              <div className="sticky top-31">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white/60 backdrop-blur-lg rounded-2xl border border-stone-200/50 shadow-sm p-4"
                >
                  <CatalogFilters
                    dbCategories={dbCategories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    priceRange={priceRange}
                    onPriceRangeChange={setPriceRange}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                </motion.div>
              </div>
            </aside> */}

            {/* Grid — modern dengan animasi */}
            <main className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-stone-600">
                  Menampilkan{" "}
                  <span className="font-bold text-forest">{filteredProducts.length}</span>{" "}
                  produk
                </p>
              </div>

              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Skeleton className="aspect-3/4 w-full rounded-none animate-pulse" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-3 w-1/3 animate-pulse" />
                        <Skeleton className="h-4 w-3/4 animate-pulse" />
                        <Skeleton className="h-5 w-1/2 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : filteredProducts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ShopGrid products={filteredProducts} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200"
                >
                  <Mountain className="w-16 h-16 mx-auto mb-4 text-stone-400" />
                  <h3 className="font-bold text-stone-800 text-lg">Produk Tidak Ditemukan</h3>
                  <p className="text-sm text-stone-500 mb-6">
                    Coba gunakan kata kunci lain atau bersihkan filter.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full border-forest text-forest hover:bg-forest hover:text-white transition-all group"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setPriceRange([0, 5000000]);
                    }}
                  >
                    Reset Semua Filter
                  </Button>
                </motion.div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CatalogShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center text-sm text-stone-500">
          Memuat Toko Habema...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
