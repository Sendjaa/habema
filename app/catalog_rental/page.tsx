"use client";

import { useState, useMemo, useEffect } from "react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { supabase } from "@/lib/supabaseClient";
import { Equipment } from "@/lib/types";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
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
import { ArrowLeft, CalendarDays } from "lucide-react";
import Image from "next/image";
import { useParallax } from "@/hooks/use-parallax";

interface EquipmentCategory {
  id: number;
  name: string;
}

export default function CatalogPage() {
  const useSearchParamsHook = useSearchParams();
  const pathname = usePathname();
  const router = useRouter(); // Menggunakan useRouter yang benar untuk App Router
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [dbCategories, setDbCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high" | "rating">("name");

  // mengambil tanggal mulai dan selesai sewa dari query params
  const urlStartDate = useSearchParamsHook.get("startDate") || "";
  const urlEndDate = useSearchParamsHook.get("endDate") || "";

  // jadikan state jika ingin menampilkan tanggal di filter
  const [startDate, setStartDate] = useState(urlStartDate);
  const [endDate, setEndDate] = useState(urlEndDate);

  // parallax scroll value
  const scrollY = useParallax();

  useEffect(() => {
    setStartDate(urlStartDate);
    setEndDate(urlEndDate);

    const fetchData = async () => {
      setLoading(true);

      try {
        const { data: catData, error: catError } = (await supabase
          .from("equipment_categories")
          .select("id, name")) as {
          data: EquipmentCategory[] | null;
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
  }, [urlStartDate, urlEndDate]);

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

  // mengubah tanggal dan klik update/cari katalog
  const handleUpdateFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert("Tanggal Tidak boleh kosong!");

    // memperbarui tanggal tanpa reload menggunakan instance hook yang benar
    const params = new URLSearchParams(useSearchParamsHook.toString());
    params.set("startDate", startDate);
    params.set("endDate", endDate);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <main className="bg-white pb-24 md:pb-28 border-b border-gray-100 overflow-hidden">
      
      {/* ========================================================================= */}
      {/* 1. HERO BANNER SECTION WITH INTEGRATED FORM */}
      {/* ========================================================================= */}
      <div className="relative w-full h-80 md:h-100 mb-6 overflow-visible">
        <div 
          className="absolute inset-0 w-full h-full md:h-110 scale-100 pointer-events-none will-change-transform"
          // style={{
          //   transform: `translate3d(0, ${scrollY * 0.2}px, 0)`,
          //   transition: "transform 0.2s ease-in-out",
          // }}
        >
          <Image
            src="/images/background_header_catalog_rental.png"
            fill
            priority
            alt="Catalog Banner"
            className="object-cover object-bottom-left"
          />
        </div>
        <div className="absolute md:inset-0 md:bg-linear-to-t md:from-#FDFCFB/100 md:via-transparent md:to-#FDFCFB/200" />
        
         <div className="absolute md:top-6 top-1 md:left-[4] left-1 right-4 md:top-8 md:left-35 md:right-12 flex items-center gap-0 z-10">
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
                  Beranda  /
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* <BreadcrumbSeparator className="text-white/40" /> */}
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[#D4AF37] font-extrabold">
                 Katalog Rental
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Text Title Tengah Banner */}
        <div className="absolute top-1/5 md:top-1/4 -translate-y-1/4 left-4 md:left-180 text-gray-900 z-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
            Eksplorasi <span className="text-gray-900 italic">Gear.</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-900 mt-1 font-medium tracking-wide">
            Pilih tanggal pendakian terbaik dan amankan perlengkapanmu.
          </p>
        </div>

        <div className="absolute bottom-0 translate-y-60 lg:-translate-y-25 lg:translate-x-70 left-4 right-4 max-w-2xl mx-auto z-20">
          <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <form
              onSubmit={handleUpdateFilter}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 items-end gap-4"
            >
              {/* Input Tanggal Mulai */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs md:font-bold text-gray-500 tracking-wider">
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none hidden" />
                  <input
                    type="date"
                    className="w-full pl-1 md:pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md md:rounded-xl text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Input Tanggal Akhir */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs md:font-bold text-gray-500 tracking-wider">
                  Tanggal Akhir
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none hidden" />
                  <input
                    type="date"
                    className="w-full pl-1 md:pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md md:rounded-xl text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Tombol Action Submit */}
              <div className="col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold md:text-sm text-xs py-3 px-6 rounded-xl shadow-md shadow-emerald-800/10 hover:shadow-emerald-900/20 active:scale-[0.98] transition-all duration-200"
                >
                  Update Ketersediaan Gear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:py-30 py-60">
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
            {/* Content Area */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
    </main>
  );
}