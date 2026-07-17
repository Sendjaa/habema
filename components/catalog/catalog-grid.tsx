"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, Mountain } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export function CatalogGrid({
  equipment,
  dateQuery = "",
  dbCategories = [],
}: {
  equipment: any[];
  /** Query string tanggal sewa (mis. "?startDate=...&endDate=...") untuk diteruskan ke halaman produk */
  dateQuery?: string;
  /** Kategori data untuk mapping label */
  dbCategories?: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {equipment.map((product, index) => {
        const price = Number(product.price_per_night || product.price || 0);
        const rating = Number(product.average_rating || product.rating || 0);
        const rentalCount = Number(product.rental_count || 0);
        const categoryLabel = dbCategories.find(cat => cat.value === product.category_id)?.label || "Uncategorized";
        const hasDiscount = product.discount && product.discount > 0;
        const stockStatus = product.stock && product.stock > 0 ? "tersedia" : "habis";

        return (
          <motion.div
            key={product.id}
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
              <Card
                className="group flex flex-col h-full rounded-xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Image Section */}
                <div className="relative aspect-square bg-stone-100 overflow-hidden rounded-t-xl">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 text-stone-500">
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
                    className={`absolute top-3 right-3 rounded-full text-xs font-bold px-2 py-1 drop-shadow-md ${
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
                  {/* Category Badge */}
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    {categoryLabel}
                  </p>

                  {/* Name */}
                  <h3 className="font-bold text-stone-900 line-clamp-2 mb-2 group-hover:text-forest transition-colors flex-1">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-3">
                    <span className="text-lg font-black text-forest">
                      Rp{price.toLocaleString("id-ID")}
                    </span>
                    {product.price_per_night && (
                      <span className="text-xs text-stone-500 ml-1">/hari</span>
                    )}
                  </div>

                  {/* Rating & Rental Count */}
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
                    <span className="text-stone-400 text-[10px]">Tersewa {rentalCount}x</span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
      )})}
    </div>
  );
}
