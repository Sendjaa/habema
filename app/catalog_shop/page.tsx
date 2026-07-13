"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
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
import { ArrowLeft, ShoppingBag } from "lucide-react";

function ShopContent() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high" | "rating" | "newest">("name");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: catData } = await supabase.from("equipment_categories").select("id, name");
        if (catData) {
          setDbCategories(catData.map((c: any) => ({ value: String(c.id), label: c.name })));
        }

        const { data: prodData } = await supabase.from("equipment").select("*");
        if (prodData) {
          setProducts(
            prodData.map((item: any) => ({
              ...item,
              dailyPrice: item.price_per_night || item.price || 0,
              category_id: item.category_id ? String(item.category_id) : null,
              stock: item.stock ?? 0,
              original_price: item.original_price ?? null,
              discount: item.discount ?? null,
              rating: item.rating ?? null,
              review_count: item.review_count ?? 0,
            })),
          );
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
          (item.description?.toLowerCase().includes(query)),
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category_id === selectedCategory);
    }
    result = result.filter((item) => item.dailyPrice >= priceRange[0] && item.dailyPrice <= priceRange[1]);
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
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        );
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  return (
    <>
      {/* ========================================================================= */}
      {/* STICKY BREADCRUMB BAR (desktop) — konsisten dengan katalog rental        */}
      {/* ========================================================================= */}
      <div className="hidden md:flex bg-white items-center p-2 sticky top-0 z-30 shadow-sm border-b">
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

      {/* ========================================================================= */}
      {/* HERO BANNER                                                                */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-forest">
        <div className="absolute inset-0 bg-gradient-to-br from-forest via-forest-light/90 to-gold/30" />
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
              <BreadcrumbList className="text-[10px] font-bold tracking-0.1em text-white/80">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-gold text-white/80 transition-colors">
                    Beranda /
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gold font-extrabold">Toko</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 mb-4 backdrop-blur-sm">
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Toko Outdoor
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
            Siapkan Gear, <span className="text-gold">Taklukkan Alam.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm md:text-base text-white/80">
            Beli perlengkapan outdoor berkualitas untuk petualanganmu — dari tenda
            hingga alat masak, langsung kirim ke tanganmu.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MAIN CONTENT                                                               */}
      {/* ========================================================================= */}
      <div className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filter */}
            <aside className="lg:w-64 shrink-0">
              <div className="sticky top-24">
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
              </div>
            </aside>

            {/* Grid */}
            <main className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-stone-600">
                  Menampilkan{" "}
                  <span className="font-bold text-forest">{filteredProducts.length}</span> produk
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
                    >
                      <Skeleton className="aspect-[3/4] w-full rounded-none" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <CatalogGrid equipment={filteredProducts} dbCategories={dbCategories} />
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200">
                  <div className="text-4xl mb-4">🛍️</div>
                  <h3 className="font-bold text-stone-800 text-lg">Produk Tidak Ditemukan</h3>
                  <p className="text-sm text-stone-500 mb-6">
                    Coba gunakan kata kunci lain atau bersihkan filter.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full border-forest text-forest hover:bg-forest hover:text-white transition-all"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setPriceRange([0, 5000000]);
                    }}
                  >
                    Reset Semua Filter
                  </Button>
                </div>
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
