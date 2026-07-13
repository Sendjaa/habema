"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getInventoryStatus } from "@/lib/catalog-context";
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
  const [inventoryStatus, setInventoryStatus] = useState<Record<string, any>>(
    {}
  );

  useEffect(() => {
    const newStatus = {} as Record<string, any>;
    equipment.forEach((item) => {
      newStatus[item.id] = getInventoryStatus(item.id);
    });
    setInventoryStatus(newStatus);
  }, [equipment]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:p-2">
      {equipment.map((product) => {
        const inventory = inventoryStatus[product.id];
        const isAvailable = inventory && inventory.availableUnits > 0;
        const price = Number(product.price_per_night || 0);
        const categoryLabel = dbCategories.find(cat => cat.value === product.category_id)?.label || "Uncategorized";

        return (
          <Link
            key={product.id}
            href={`/product/${product.id}${dateQuery}`}
            className={!isAvailable ? "pointer-events-allowed" : ""}
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
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 102420px) 33vw, (max-width: 1280px) 25vw"
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
                
                {/* Discount Badge */}
                {product.discount && product.discount > 0 && (
                  <div className="absolute top-3 right-3 bg-gold text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{product.discount}%
                  </div>
                )}

                {/* Stock Status */}
                {product.stock !== undefined && (
                  <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold ${
                    product.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    {product.stock > 0 ? `${product.stock} Tersedia` : "Habis"}
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
                  {product.original_price && product.discount ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-forest">
                        Rp{Number(product.dailyPrice).toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-stone-400 line-through">
                        Rp{Number(product.original_price).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-black text-forest">
                      Rp{Number(product.dailyPrice).toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                {/* Rating (if available) */}
                {product.rating && (
                  <div className="flex items-center gap-1 mb-3 text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-stone-700">{product.rating.toFixed(1)}</span>
                    <span className="text-stone-500">({product.review_count || 0})</span>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  className={`w-full rounded-xl font-bold text-sm transition-all ${
                    product.stock === 0
                      ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                      : "bg-forest hover:bg-forest-dark text-white"
                  }`}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? "Habis" : "Tambah ke Keranjang"}
                </button>
              </div>
            </Card>
          </Link>
      )})}
    </div>
  );
}