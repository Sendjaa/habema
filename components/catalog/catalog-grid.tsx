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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        href={`/product/${product.id}${dateQuery}`}
        className="group block h-full"
      >
        <Card className="group flex flex-col h-full rounded-xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer">
          {/* Image Section */}
          <div
            className="relative aspect-square bg-stone-100 overflow-hidden rounded-t-xl"
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
                    className={`object-cover transition-all duration-500 ${
                      i === imgIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                    priority={index < 6}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
                  />
                ))}

                {/* Nav Arrows (muncul di hover) */}
                {images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={prevImg}
                      className="w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-stone-700" />
                    </button>
                    <button
                      onClick={nextImg}
                      className="w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-stone-700" />
                    </button>
                  </div>
                )}

                {/* Dots Indicator */}
                {images.length > 1 && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === imgIndex ? "bg-white w-3" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-stone-200 to-stone-300 text-stone-500">
                <Mountain className="mb-2 h-12 w-12 opacity-30" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  No Image
                </span>
              </div>
            )}

            {/* Badge Diskon */}
            {hasDiscount && (
              <Badge className="absolute top-3 left-3 bg-gold text-white rounded-full text-xs font-bold px-2 py-1 drop-shadow-md">
                -{product.discount}%
              </Badge>
            )}

            {/* Badge Stok */}
            <Badge
              className={`absolute top-3 right-0 rounded-l-full text-xs font-bold px-2 py-1 drop-shadow-md ${
                stockStatus === "tersedia"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {stockStatus === "tersedia" ? "Tersedia" : "Habis"}
            </Badge>
          </div>

          {/* Content Section */}
          <div className="flex flex-col flex-1 p-4">
            <span className="text-xs font-light text-stone-500 tracking-wider mb-1">
              {categoryLabel}
            </span>
            <h5 className="font-bolder truncate text-stone-900 line-clamp-2 mb-1 group-hover:text-forest transition-colors flex-1">
              {product.name}
            </h5>
            <div className="mb-3">
              <span className="text-lg font-black text-forest">
                Rp{price.toLocaleString("id-ID")}
              </span>
              {!isShop && (
                <span className="text-xs text-stone-500 ml-1">/hari</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mb-1 text-xs">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => {
                    const filled = i < Math.floor(rating);
                    const partial = i === Math.floor(rating) && rating % 1 >= 0.5;
                    return (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${filled ? 'fill-yellow-400 text-yellow-400' : partial ? 'fill-yellow-400/50 text-yellow-400/50' : 'fill-stone-300 text-stone-300'}`}
                      />
                    );
                  })}
                </div>
                <span className="font-semibold text-stone-700">{rating.toFixed(1)}</span>
              </div>
              <span className="text-stone-400 md:text-nowrap text-[10px]">{isShop ? `Terjual ${soldCount}x` : `Tersewa ${soldCount}x`}</span>
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
