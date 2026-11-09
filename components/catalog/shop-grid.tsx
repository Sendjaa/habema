"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

function discountPercent(price: number, original: number) {
  if (price > 0 && original > price) return Math.round((1 - price / original) * 100);
  return 0;
}

function ShopCard({ product, index }: { product: any; index: number }) {
  const price = Number(product.price || 0);
  const originalPrice = Number(product.original_price || 0);
  const discount = discountPercent(price, originalPrice);
  const rating = Number(product.rating || 0);
  const soldCount = Number(product.sold_count || 0);
  const stock = Number(product.stock ?? 0);
  const image = product.image_url || (product.gallery_urls || [])[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="h-full"
    >
      <Link href={`/product/${product.id}`} className="group block h-full">
        <div className="flex flex-col h-full overflow-hidden bg-white   transition-all duration-300 lg:w-60">
          {/* Image */}
          <div className="relative aspect-square bg-stone-100 overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={index < 6}
                placeholder="blur"
                blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-300">
                <span className="text-xs font-semibold uppercase tracking-widest">
                  No Image
                </span>
              </div>
            )}

            {discount > 0 && (
              <span className="absolute top-2.5 left-2.5 text-[11px] font-bold text-white bg-gold px-2 py-0.5 rounded-md">
                -{discount}%
              </span>
            )}

            {stock <= 0 && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-xs font-bold text-stone-500">Stok Habis</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-3.5 md:p-0 md:pt-1 lg:p-0 lg:pt-2 gap-1">

            <h5 className="font-medium text-sm font-sans text-stone-900 leading-tight line-clamp-2" title={product.name}>
              {product.name}
            </h5>

            <div className="mt-1">
              <span className="text-base text-[#FF6B35] font-bold">
                Rp{price.toLocaleString("id-ID")}
              </span>
              {originalPrice > price && (
                <span className="ml-1.5 text-xs text-stone-400 line-through">
                  Rp{originalPrice.toLocaleString("id-ID")}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ShopGrid({ products }: { products: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {products.map((product, index) => (
        <ShopCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
