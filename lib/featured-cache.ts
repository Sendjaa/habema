"use client";

import { optimizedFetch } from "@/lib/optimized-fetch";

/**
 * GET /api/products/featured-products punya dua lapis cache: memori server
 * (TTL 10 menit, dibersihkan lewat POST handler route-nya) dan memori browser
 * lewat optimizedFetch singleton. Tempat lain yang menyimpan produk serupa
 * dan tidak melalui kedua lapis itu akan masuk conflict saat menampilkan item terbaru.
 */
export function invalidateFeaturedProducts(): void {
  optimizedFetch.invalidateCache("/api/products/featured-products");
  fetch("/api/products/featured-products", { method: "POST" }).catch(() => {});
}
