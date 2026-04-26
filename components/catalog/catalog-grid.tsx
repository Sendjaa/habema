"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getInventoryStatus } from "@/lib/catalog-context";
import { Star, Mountain } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

export function CatalogGrid({ equipment }: { equipment: any[] }) {
  const [inventoryStatus, setInventoryStatus] = useState<Record<string, any>>(
    {},
  );

  useEffect(() => {
    const newStatus = {} as Record<string, any>;
    equipment.forEach((item) => {
      newStatus[item.id] = getInventoryStatus(item.id);
    });
    setInventoryStatus(newStatus);
  }, [equipment]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2">
      {equipment.map((product) => {
        const inventory = inventoryStatus[product.id];
        const isAvailable = inventory && inventory.availableUnits > 0;
        const price = Number(product.price_per_night || 0);

        return (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className={!isAvailable ? "pointer-events-allowed" : ""}
          >
            <Card className="group flex flex-col h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer">
              {/* Image Section */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden rounded-t-xl">
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
                  /* Placeholder jika gambar tidak ada */
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-200 text-slate-400">
                    <Mountain className="mb-2 h-10 w-10 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                      No Image Available
                    </span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-2.5 flex flex-col flex-grow">
                {/* Nama Produk */}
                <h3 className="text-[12px] font-medium text-slate-700 line-clamp-2 mb-1 min-h-[32px] group-hover:text-[#1B4332] transition-colors">
                  {product.name}
                </h3>

                {/* Harga */}
                <div className="mb-1.5">
                  <span className="text-sm font-bold text-[#FF6B35]">
                    Rp{price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[9px] text-slate-400 ml-1">/hari</span>
                </div>

                {/* Rating & Stats (Footer Card) */}
                <div className="mt-auto pt-1.5 flex items-center gap-1 text-[9px] text-slate-500 font-medium border-t border-slate-50">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>4.9</span>
                  <span className="text-slate-300">|</span>
                  <span>Terjual 100+</span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
