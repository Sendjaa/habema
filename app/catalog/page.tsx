"use client";

import { useState, useMemo, useEffect } from "react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { supabase } from "@/lib/supabaseClient";
import { Equipment } from "@/lib/types";
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
import { ArrowLeft, Trees } from "lucide-react";
import router from "next/router";

export default function CatalogPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [dbCategories, setDbCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]); // Range dinaikkan agar lebih fleksibel
  const [sortBy, setSortBy] = useState<
    "name" | "price-low" | "price-high" | "rating"
  >("name");
 
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const { data: catData, error: catError } = await supabase
          .from("equipment_categories")
          .select("id, name");

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

        // 2. Fetch Equipment
        const { data: eqData, error: eqError } = await supabase
          .from("equipment")
          .select("*");

        if (eqError) {
          console.error("Gagal ambil produk:", eqError.message);
        } else if (eqData) {
          setEquipment(
            eqData.map((item: any) => ({
              ...item,
              dailyPrice: item.price_per_night || 0,
              category_id: item.category_id ? String(item.category_id) : null,
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

  // Logika Filter & Sortir yang sudah dioptimasi
  const filteredEquipment = useMemo(() => {
    let result = [...equipment];

    // 1. Filter Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)),
      );
    }

    // 2. Filter Kategori (Strict String Comparison)
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
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [equipment, selectedCategory, searchQuery, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <main className="bg-[#FDFCFB] pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Top Navigation Row */}
        <div className="flex items-center gap-6 mb-6">
          {/* Back Button - Premium Forest Style */}
          <button 
            onClick={() => router.back()}
            className="group flex items-center justify-center w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-forest group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Breadcrumb - Clean & Modern */}
          <div className="flex flex-col gap-1">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] uppercase font-bold tracking-[0.15em]">
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="/" 
                    className="flex items-center gap-1.5 hover:text-gold transition-colors"
                  >
                    Beranda
                  </BreadcrumbLink>
                </BreadcrumbItem>
                
                <BreadcrumbSeparator className="text-forest/20" />
                
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2 text-forest font-black italic">
                    {/* Small Forest Decor */}
                    <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                    Katalog Peralatan
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Page Title Section */}
        <div className="flex items-center gap-4">
           <div className="p-3 bg-forest rounded-2xl text-gold hidden md:block">
              <Trees size={32} />
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-forest tracking-tighter uppercase italic leading-none">
             Eksplorasi <span className="text-gold not-italic">Gear.</span>
           </h1>
        </div>

      </div>
    </main>
      
      {/* Banner Header */}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
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

          {/* Main Grid */}
          <main className="flex-1">
            {/* Toolbar Info */}

            {/* Content Area */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-2 border border-slate-100 space-y-3"
                  >
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredEquipment.length > 0 ? (
              <CatalogGrid equipment={filteredEquipment} />
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-4">⛺</div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Produk Tidak Ditemukan
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Coba gunakan kata kunci lain atau bersihkan filter.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white transition-all"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setPriceRange([0, 1000000]);
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
