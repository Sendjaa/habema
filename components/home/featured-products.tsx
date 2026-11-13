"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { useOptimizedFetch } from "@/lib/optimized-fetch";

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
  //
  // Sebelumnya ada fallback yang memanggil Supabase langsung dari browser kalau
  // API gagal. Itu dihapus saat migrasi ke PostgreSQL lokal: `pg` tidak bisa
  // jalan di browser, jadi API route adalah satu-satunya sumber data katalog.
  // const featured = featuredResponse?.success ? featuredResponse.data : null
  const products = Array.isArray(featuredResponse?.data)
    ? featuredResponse.data
    :
    (featuredResponse?.success && Array.isArray(featuredResponse.data))
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
    const gap = 16;
    const step = card ? card.offsetWidth + gap : el.clientWidth * 0.8;

    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (loading)
    return (
      <section className="relative py-4 md:py-24 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 gap-6">
            <div className="space-y-3 md:space-y-4 max-w-2xl">
              {/* <div className="flex items-center gap-2 text-gold font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em]">
                <Flame size={14} fill="currentColor" /> Paling Sering Di-rental
              </div> */}
              <h2 className="text-4xl md:text-5xl font-sans lg:text-6xl font-black text-stone-900 tracking-tighter leading-[0.9]">
                Gear Terfavorit
              </h2>
            </div>
            <div className="px-6 md:px-8 py-3 md:py-4 bg-white border border-black/10 rounded-xl md:rounded-2xl font-bold text-black text-xs text-center w-[140px]">
              <a
                href="/catalog_rental"
                className="flex items-center justify-center gap-3 text-black"
              >
                Semua Gear
              </a>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-full w-40 sm:w-56 shrink-0 rounded-xl border border-stone-200 bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-stone-200 rounded-t-xl" />
                <div className="p-2.5 space-y-2">
                  <div className="h-8 w-3/4 bg-stone-200 rounded" />
                  <div className="h-6 w-1/2 bg-stone-200 rounded" />
                  <div className="mt-auto pt-1.5 h-4 w-full bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );

  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-background">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-forest/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 gap-6">
          <div className="space-y-3 md:space-y-4 max-w-2xl">
            {/* <div className="flex items-center gap-2 text-gold font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em]">
              <Flame size={14} fill="currentColor" /> Paling Sering Di-rental
            </div> */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-sans text-stone-900 tracking-tighter leading-[0.9]">
              Gear Terfavorit
            </h2>
          </div>
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCards(-1)}
                disabled={!canPrev}
                aria-label="Lihat gear sebelumnya"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-colors hover:border-forest/30 hover:bg-forest-soft hover:text-forest disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCards(1)}
                disabled={!canNext}
                aria-label="Lihat gear berikutnya"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-colors hover:border-forest/30 hover:bg-forest-soft hover:text-forest disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <Link
              href="/catalog_rental"
              className="group relative px-6 md:px-8 py-3 md:py-4 bg-white border border-forest/10 rounded-xl md:rounded-2xl font-bold text-black text-xs md:text-sm lg:text-md overflow-hidden transition-all
              text-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Semua Gear{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {/* Satu baris flex yang memenuhi lebar, scroll horizontal bila lebih */}
        <div
          ref={scrollerRef}
          role="region"
          aria-label="Daftar gear terfavorit"
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-0 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 [&::-webkit-scrollbar]:hidden"
        >
          {Array.isArray(products) && products.length > 0 ? (
            products.map((product, index) => {
              const price = Number(product.price_per_night || 0);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  data-featured-card
                  className="w-40 shrink-0 snap-start sm:w-56"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="group block relative h-full"
                  >
                    <div className="group flex flex-col h-full rounded-xl bg-white transition-all overflow-hidden cursor-pointer">
                      {/* Image Section */}
                      <div className="relative aspect-square bg-stone-100 overflow-hidden rounded-t-xl">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            priority={false}
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-stone-200 text-stone-400">
                            <div className="mb-2 w-10 h-10 opacity-20 rounded-full bg-stone-300"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                              No Image Available
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-2.5 md:p-1.5 lg:p-1.5 md:pt-2 lg:pt-2 ">
                        {/* Nama Produk */}
                        <h3 className="text-base font-medium truncate font-sans text-stone-700 line-clamp-1 mb-1 group-hover:text-stone-900 transition-colors">
                          {product.name}
                        </h3>

                        {/* Harga */}
                        <div>
                          <span className="text-base font-bold text-gold">
                            Rp{price.toLocaleString("id-ID")}
                          </span>
                          <span className="text-sm text-stone-400 ml-1">
                            /hari
                          </span>
                        </div>

                        {/* Rating & Stats (Footer Card) */}
                        <div className="mt-auto pt-1 flex  items-center gap-1 text-sm text-stone-500 font-medium border-t border-stone-50">
                          <Star className="w-3 h-3 fill-gold text-gold" />
                          <span>{product.average_rating || 4.9}</span>
                          <span className="text-stone-300">|</span>
                          <span>Tersewa {product.rental_count || 0}x</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <div className="w-full text-center py-12">
              <p className="text-forest/60">
                {error ? (
                  <>
                    <AlertCircle className="mx-auto mb-2 w-6 h-6 text-error" />
                    Gagal memuat produk. Silakan coba lagi nanti.
                  </>
                ) : (
                  <>
                    <Sparkles className="mx-auto mb-2 w-6 h-6 text-gold" />
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
