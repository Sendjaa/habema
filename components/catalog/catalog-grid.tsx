"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, Mountain } from "lucide-react";
import { useState, useEffect } from "react";
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:p-2">
      {equipment.map((product) => {
        const price = Number(product.price_per_night || 0);
        const rating = Number(product.average_rating || 0);
        const rentalCount = Number(product.rental_count || 0);
        const categoryLabel = dbCategories.find(cat => cat.value === product.category_id)?.label || "Uncategorized";

        return (
          <Link
            key={product.id}
            href={`/product/${product.id}${dateQuery}`}
            className="group"
          >
            <Card
              className="group flex flex-col h-full rounded-xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
            >
              {/* Image Section */}
              <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden rounded-t-xl">
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
                    <Mountain className="mb-2 h-10 w-10 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                      No Image Available
                    </span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-4">
                {/* Category Badge */}
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                  {categoryLabel}
                </p>

                {/* Name */}
                <h3 className="font-bold text-stone-900 line-clamp-2 mb-2 group-hover:text-forest transition-colors">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-lg font-black text-forest">
                    Rp{price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-stone-500 ml-1">/hari</span>
                </div>

                {/* Rating & Rental Count */}
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-stone-700">{rating.toFixed(1)}</span>
                  </div>
                  <span className="text-stone-400">|</span>
                  <span className="text-stone-500">Tersewa {rentalCount}x</span>
                </div>
              </div>
            </Card>
          </Link>
      )})}
    </div>
  );
}
