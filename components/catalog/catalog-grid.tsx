"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, Mountain, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

function ProductCard({
  product,
  dateQuery,
  categoryLabel,
  index,
}: {
  product: any;
  dateQuery: string;
  categoryLabel: string;
  index: number;
}) {
  const price = Number(product.price || product.price_per_night || 0);
  const rating = Number(product.average_rating || product.rating || 0);
  const soldCount = Number(product.sold_count || product.rental_count || 0);
  const hasDiscount = product.discount && product.discount > 0;
  const stockQty = product.stock ?? product.stock_quantity ?? 0;
  const stockStatus = stockQty > 0 ? "tersedia" : "habis";
  const isShop = product.price !== undefined && product.price_per_night === undefined;

  const images = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
  const [imgIndex, setImgIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSlide = () => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % images.length);
    }, 1200);
  };

  const stopSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setImgIndex(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopSlide();
    setImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopSlide();
    setImgIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <Link
        href={`/product/${product.id}${dateQuery}`}
        className="group block h-full"
      >
        <Card className="group flex flex-col h-full rounded-none bg-white border border-stone-300 shadow-none transition-colors duration-200 hover:border-stone-950 overflow-hidden cursor-pointer">
          {/* Image Section */}
          <div
            className="relative aspect-[4/3] bg-stone-100 border-b border-stone-200 overflow-hidden"
            onMouseEnter={startSlide}
            onMouseLeave={stopSlide}
          >
            {images.length > 0 ? (
              <>
                {images.map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
                    className={`object-cover transition-all duration-300 ${
                      i === imgIndex
                        ? "opacity-100 scale-100 group-hover:scale-[1.03]"
                        : "opacity-0 scale-100"
                    }`}
                    priority={index < 6}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23f5f5f4'/%3E%3C/svg%3E"
                  />
                ))}

                {/* Nav Arrows (muncul di hover) */}
                {images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      type="button"
                      onClick={prevImg}
                      aria-label="Foto sebelumnya"
                      className="w-7 h-7 bg-white/95 border border-stone-300 hover:border-stone-950 hover:bg-white flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-stone-900" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImg}
                      aria-label="Foto berikutnya"
                      className="w-7 h-7 bg-white/95 border border-stone-300 hover:border-stone-950 hover:bg-white flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-stone-900" />
                    </button>
                  </div>
                )}

                {/* Dots Indicator */}
                {images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-stone-950/40 px-1.5 py-1">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 transition-all ${
                          i === imgIndex ? "bg-white w-3.5" : "bg-white/50 w-1.5"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-stone-100 text-stone-400">
                <Mountain className="mb-1.5 h-8 w-8 opacity-40" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  No Image
                </span>
              </div>
            )}

            {/* Badge Diskon */}
            {hasDiscount && (
              <Badge className="absolute top-2.5 left-2.5 rounded-none bg-[#C85A17] text-white border border-[#C85A17] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-none">
                -{product.discount}%
              </Badge>
            )}

            {/* Badge Stok */}
            <Badge
              className={`absolute top-2.5 right-2.5 rounded-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-none border ${
                stockStatus === "tersedia"
                  ? "bg-white/95 text-[#183028] border-stone-300"
                  : "bg-stone-100 text-stone-500 border-stone-300"
              }`}
            >
              {stockStatus === "tersedia" ? "Tersedia" : "Habis"}
            </Badge>
          </div>

          {/* Content Section */}
          <div className="flex flex-col flex-1 p-3.5">
            <h5 className="text-sm sm:text-[15px] font-bold font-sans text-stone-900 line-clamp-1 mb-2 group-hover:text-[#183028] transition-colors">
              {product.name}
            </h5>

            {/* Rating & Stats */}
            <div className="flex items-center justify-between gap-2 text-xs text-stone-500 font-medium mb-3">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => {
                    const filled = i < Math.floor(rating);
                    const partial = i === Math.floor(rating) && rating % 1 >= 0.5;
                    return (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          filled
                            ? "fill-[#C85A17] text-[#C85A17]"
                            : partial
                              ? "fill-[#C85A17]/50 text-[#C85A17]/50"
                              : "fill-stone-200 text-stone-200"
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="font-semibold text-stone-800 tabular-nums ml-0.5">
                  {rating.toFixed(1)}
                </span>
              </div>
              <span className="text-stone-500 md:text-nowrap text-[11px] tabular-nums">
                {isShop ? `Terjual ${soldCount}x` : `Tersewa ${soldCount}x`}
              </span>
            </div>

            {/* Harga (Footer Card) */}
            <div className="mt-auto pt-2.5 border-t border-stone-200 flex items-baseline justify-between gap-1">
              <div>
                <span className="text-sm sm:text-base font-bold text-stone-950 tabular-nums">
                  Rp{price.toLocaleString("id-ID")}
                </span>
                {!isShop && (
                  <span className="text-[11px] text-stone-500 ml-1">/hari</span>
                )}
              </div>
              <span className="text-xs font-bold text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-950">
                →
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function CatalogGrid({
  equipment,
  dateQuery = "",
  dbCategories = [],
}: {
  equipment: any[];
  dateQuery?: string;
  dbCategories?: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
      {equipment.map((product, index) => {
        const categoryLabel = dbCategories.find(cat => cat.value === product.category_id)?.label || product.category || "Uncategorized";
        return (
          <ProductCard
            key={product.id}
            product={product}
            dateQuery={dateQuery}
            categoryLabel={categoryLabel}
            index={index}
          />
        );
      })}
    </div>
  );
}
