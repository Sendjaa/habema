"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Flame,
  Star,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_per_night: number;
  image_url: string;
  equipment_categories: {
    name: string;
  };
  rental_count: number;
  average_rating: number;
}

interface FetchOptions {
  cacheTime?: number;
  retryCount?: number;
  dedupe?: boolean;
}

// Adapter fetch teroptimasi mandiri yang tetap memanggil endpoint API database Anda
function useOptimizedFetch<T>(url: string, options?: FetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const retries = options?.retryCount ?? 2;

    async function fetchWithRetry(attempt: number) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as T;
        if (isMounted) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (attempt < retries && isMounted) {
          setTimeout(() => fetchWithRetry(attempt + 1), 400 * (attempt + 1));
        } else if (isMounted) {
          setError(err instanceof Error ? err : new Error("Fetch failed"));
          setLoading(false);
        }
      }
    }

    fetchWithRetry(0);

    return () => {
      isMounted = false;
    };
  }, [url, options?.retryCount]);

  return { data, loading, error };
}

export function FeaturedProducts() {
  const {
    data: featuredResponse,
    loading,
    error,
  } = useOptimizedFetch<{ success: boolean; data: Product[] }>(
    "/api/products/featured-products",
    {
      cacheTime: 10 * 60 * 1000, // 10 minutes cache
      retryCount: 2,
      dedupe: true,
    },
  );

  // Extract actual products data from response.
  const products = Array.isArray(featuredResponse?.data)
    ? featuredResponse.data
    : featuredResponse?.success && Array.isArray(featuredResponse.data)
      ? featuredResponse.data
      : [];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateScrollControls = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollControls();
    el.addEventListener("scroll", updateScrollControls, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollControls);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollControls);
      resizeObserver.disconnect();
    };
  }, [loading, products.length, updateScrollControls]);

  const scrollCards = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-featured-card]");
    const gap = 20;
    const step = card ? card.offsetWidth + gap : el.clientWidth * 0.8;

    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (loading)
    return (
      <section className="relative py-16 md:py-24 border-y border-stone-300/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-8 mb-8 md:mb-10 border-b border-stone-300 gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#183028]">
                Katalog Pilihan
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-stone-950 tracking-tight leading-[1.08]">
                Gear Terfavorit
              </h2>
            </div>
            <div className="px-5 py-3 bg-white border border-stone-900 font-bold text-stone-950 text-xs uppercase tracking-wider text-center w-[150px]">
              <a
                href="/catalog_rental"
                className="flex items-center justify-center gap-2 text-stone-950"
              >
                Semua Gear
              </a>
            </div>
          </div>
          <div className="flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-44 sm:w-56 md:w-60 shrink-0 border border-stone-300 bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-stone-200 border-b border-stone-200" />
                <div className="p-3.5 space-y-3">
                  <div className="h-3 w-1/3 bg-stone-200" />
                  <div className="h-4 w-4/5 bg-stone-200" />
                  <div className="pt-2.5 border-t border-stone-100 flex justify-between items-center">
                    <div className="h-4 w-1/2 bg-stone-200" />
                    <div className="h-3 w-1/4 bg-stone-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );

  return (
    <section className="relative py-16 md:py-24 border-y border-stone-300/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-8 mb-8 md:mb-10 border-b border-stone-300 gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#183028]">
              <Flame className="w-3.5 h-3.5 text-[#C85A17]" />
              Katalog Perlengkapan Lapangan
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans text-stone-950 tracking-tight leading-[1.08]">
              Gear Terfavorit
            </h2>
          </div>

          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCards(-1)}
                disabled={!canPrev}
                aria-label="Lihat gear sebelumnya"
                className="flex h-10 w-10 items-center justify-center border border-stone-900 bg-white text-stone-950 transition-colors hover:bg-stone-950 hover:text-white disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCards(1)}
                disabled={!canNext}
                aria-label="Lihat gear berikutnya"
                className="flex h-10 w-10 items-center justify-center border border-stone-900 bg-white text-stone-950 transition-colors hover:bg-stone-950 hover:text-white disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <a
              href="/catalog_rental"
              className="group inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-10 bg-[#C85A17] text-white font-bold text-xs uppercase tracking-wider transition-colors hover:bg-stone-950 hover:border-stone-950"
            >
              <span>Semua Gear</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* Satu baris flex yang memenuhi lebar, scroll horizontal bila lebih */}
        <div
          ref={scrollerRef}
          role="region"
          aria-label="Daftar gear terfavorit"
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#183028] focus-visible:ring-offset-2 [&::-webkit-scrollbar]:hidden"
        >
          {Array.isArray(products) && products.length > 0 ? (
            products.map((product, index) => {
              const price = Number(product.price_per_night || 0);
              const categoryName = product.equipment_categories?.name;

              return (
                <div
                  key={product.id}
                  data-featured-card
                  className="w-44 shrink-0 snap-start sm:w-56 md:w-60"
                >
                  <a
                    href={`/product/${product.id}`}
                    className="group block relative h-full"
                  >
                    <article className="flex flex-col h-full bg-white border border-stone-300 transition-colors duration-200 group-hover:border-stone-950 overflow-hidden">
                      {/* Image Section */}
                      <div className="relative aspect-[4/3] bg-stone-100 border-b border-stone-200 overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-stone-100 text-stone-400">
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              No Image
                            </span>
                          </div>
                        )}

                        {categoryName && (
                          <span className="absolute top-2.5 left-2.5 bg-white/95 border border-stone-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-800">
                            {categoryName}
                          </span>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex flex-col flex-1 p-3.5">
                        {/* Nama Produk */}
                        <h3 className="text-sm sm:text-[15px] font-bold font-sans text-stone-900 line-clamp-1 mb-2 group-hover:text-[#183028] transition-colors">
                          {product.name}
                        </h3>

                        {/* Rating & Stats */}
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-3">
                          <span className="inline-flex items-center gap-1 text-stone-800 font-semibold tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-[#C85A17] text-[#C85A17]" />
                            {product.average_rating || 4.9}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="tabular-nums">
                            {product.rental_count || 0}x disewa
                          </span>
                        </div>

                        {/* Harga (Footer Card) */}
                        <div className="mt-auto pt-2.5 border-t border-stone-200 flex items-baseline justify-between gap-1">
                          <div>
                            <span className="text-sm sm:text-base font-bold text-stone-950 tabular-nums">
                              Rp{price.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[11px] text-stone-500 ml-1">
                              /hari
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-950 shrink-0" />
                        </div>
                      </div>
                    </article>
                  </a>
                </div>
              );
            })
          ) : (
            <div className="w-full border border-stone-300 bg-white text-center py-12 px-4">
              <p className="text-sm text-stone-600 font-medium">
                {error ? (
                  <>
                    <AlertCircle className="mx-auto mb-2 w-5 h-5 text-red-600" />
                    Gagal memuat produk. Silakan coba lagi nanti.
                  </>
                ) : (
                  <>
                    <Sparkles className="mx-auto mb-2 w-5 h-5 text-[#183028]" />
                    Tidak ada produk yang tersedia saat ini.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;