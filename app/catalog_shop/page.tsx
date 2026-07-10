"use client";
import { useState, useMemo, useEffect } from "react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { supabase } from "@/lib/supabaseClient";
import { Equipment } from "@/lib/types";
import { OptimizedImage } from "@/components/optimized-image";
interface ProductCategory {
  id: number;
  name: string;
}

interface ShopProduct extends Equipment {
  image_url: string | Blob | undefined;
  stock?: number;
  original_price?: number;
  discount?: number;
}

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import router from "next/router";

export default function CatalogShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [dbCategories, setDbCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]); // Range lebih tinggi untuk produk retail
  const [sortBy, setSortBy] = useState<
    "name" | "price-low" | "price-high" | "rating" | "newest"
  >("name");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Categories untuk Shop/Products
        const { data: catData, error: catError } = (await supabase
          .from("equipment_categories")
          .select("id, name")) as {
          data: ProductCategory[] | null;
          error: any;
        };

        if (catError) {
          console.error("Gagal ambil kategori:", catError.message);
        } else if (catData) {
          setDbCategories(
            catData.map((c) => ({
              value: String(c.id),
              label: c.name,
            })),
          );
        }

        // 2. Fetch Shop Products
        const { data: prodData, error: prodError } = await supabase
          .from("equipment") // Atau ubah ke 'products' / 'shop_products' sesuai table Anda
          .select("*");

        if (prodError) {
          console.error("Gagal ambil produk shop:", prodError.message);
        } else if (prodData) {
          setProducts(
            prodData.map((item: any) => ({
              ...item,
              dailyPrice: item.price_per_night || item.price || 0, // Sesuaikan field nama harga
              category_id: item.category_id ? String(item.category_id) : null,
              stock: item.stock || 0,
              original_price: item.original_price || null,
              discount: item.discount || null,
            })),
          );
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Logika Filter & Sortir
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Filter Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)),
      );
    }

    // 2. Filter Kategori
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category_id === selectedCategory);
    }

    // 3. Filter Harga
    result = result.filter(
      (item) =>
        item.dailyPrice >= priceRange[0] && item.dailyPrice <= priceRange[1],
    );

    // 4. Sortir
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.dailyPrice - b.dailyPrice);
        break;
      case "price-high":
        result.sort((a, b) => b.dailyPrice - a.dailyPrice);
        break;
      case "rating":
        result.sort(
          (a, b) => ((b as any).rating || 0) - ((a as any).rating || 0),
        );
        break;
      case "newest":
        result.sort((a, b) => {
          const dateA = new Date((a as any).created_at || 0).getTime();
          const dateB = new Date((b as any).created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <main className="bg-[#FDFCFB] pt-2 pb-8 border">
        <div className="max-w-7xl mx-auto px-6 h-50">
          {/* Top Navigation Row */}
          <div className="flex items-center gap-6 mb-6">
            {/* Breadcrumb - Clean & Modern */}
            <div className="flex flex-col gap-1">
              <Breadcrumb>
                <BreadcrumbList className="text-[10px] uppercase font-bold tracking-[0.15em]">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/"
                      className="flex items-center gap-1.5 hover:text-gold transition-colors"
                    >
                      <button
                        onClick={() => router.back()}
                        className="group flex items-center justify-center w-12 h-12 transition-all duration-300"
                      >
                        <ArrowLeft className="w-5 h-5 text-forest group-hover:-translate-x-1 transition-transform" />
                      </button>
                      Beranda
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-forest/20" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-2 text-forest font-black italic">
                      Toko Perlengkapan
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Page Title Section */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-forest rounded-2xl text-gold hidden md:block">
              <ShoppingBag size={32} />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-forest tracking-tighter uppercase leading-none">
              Belanja <span className="text-gold italic">Gear.</span>
            </h1>
          </div>
        </div>
      </main>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Sidebar Filter */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-31">
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

          {/* Main Grid */}
          <main className="flex-1">
            {/* Results Info */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-600 font-medium">
                Menampilkan <span className="font-bold text-forest">{filteredProducts.length}</span> produk
                {selectedCategory !== "all" && " dalam kategori terpilih"}
              </p>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-3 border border-slate-100 space-y-3"
                  >
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div>
                {/* Grid Products */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-square bg-slate-100 overflow-hidden">
                        {product.image_url ? (
                          <OptimizedImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={400}
                            height={400}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                            <ShoppingBag className="w-12 h-12 text-slate-400" />
                          </div>
                        )}

                        {/* Discount Badge */}
                        {product.discount && product.discount > 0 && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{product.discount}%
                          </div>
                        )}

                        {/* Stock Status */}
                        {product.stock !== undefined && (
                          <div
                            className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold ${
                              product.stock > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.stock > 0
                              ? `${product.stock} Tersedia`
                              : "Habis"}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Category Badge */}
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {(() => {
                            const cat = dbCategories.find(
                              (c) => c.value === product.category_id
                            );
                            return cat?.label || "Uncategorized";
                          })()}
                        </p>

                        {/* Name */}
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-3 group-hover:text-forest transition-colors">
                          {product.name}
                        </h3>

                        {/* Price */}
                        <div className="mb-4">
                          {product.original_price && product.discount ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-forest">
                                Rp{Number(product.dailyPrice).toLocaleString("id-ID")}
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                Rp{Number(product.original_price).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-black text-forest">
                              Rp{Number(product.dailyPrice).toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>

                        {/* Rating (jika ada) */}
                        {(product as any).rating && (
                          <div className="flex items-center gap-1 mb-4 text-xs">
                            <span className="text-yellow-400">★</span>
                            <span className="font-semibold text-slate-700">
                              {(product as any).rating.toFixed(1)}
                            </span>
                            <span className="text-slate-500">
                              ({(product as any).review_count || 0})
                            </span>
                          </div>
                        )}

                        {/* Add to Cart Button */}
                        <Button
                          className={`w-full rounded-xl font-bold text-sm transition-all ${
                            product.stock === 0
                              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                              : "bg-forest hover:bg-forest/90 text-white"
                          }`}
                          disabled={product.stock === 0}
                          onClick={() => {
                            // TODO: Implement add to cart logic
                            console.log("Add to cart:", product.id);
                          }}
                        >
                          {product.stock === 0 ? "Habis" : "Tambah ke Keranjang"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-4">🛍️</div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Coba gunakan kata kunci lain atau bersihkan filter Anda.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white transition-all"
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
  );
}