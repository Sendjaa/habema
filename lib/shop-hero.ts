/**
 * Konten hero section ShopProducts di homepage — sekarang diambil dari DB (tabel shop_hero)
 * dengan fallback ke statis. Admin mengelola via /admin/shop-hero.
 * Image berukuran 1080x1350 (crop via param Unsplash). Untuk video, cukup
 * tambahkan URL berakhiran .mp4/.webm/.mov ke media dan carousel otomatis
 * merendernya sebagai <video>.
 */

import { cache } from "react";
import { getDb } from "@/lib/db";
import { shopHero } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ShopHeroMedia, ShopHeroContent, ShopHeroStats, isHeroVideo, shopHeroContent as fallbackHeroContent } from "@/lib/shop-hero-types";

export { isHeroVideo };
export type { ShopHeroMedia, ShopHeroContent, ShopHeroStats };

/** Fallback statis jika DB kosong / error */
export const shopHeroContent: ShopHeroContent = fallbackHeroContent;

/** Ambil hero aktif dari DB (server-only, dicache per request) */
export const getShopHero = cache(async (): Promise<ShopHeroContent> => {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(shopHero)
      .where(eq(shopHero.isActive, true))
      .limit(1)

    if (rows.length === 0) return shopHeroContent

    const row = rows[0]
    return {
      kicker: row.kicker ?? shopHeroContent.kicker,
      heading: row.heading ?? shopHeroContent.heading,
      description: row.description ?? shopHeroContent.description,
      stats: (row.stats as ShopHeroContent["stats"]) ?? shopHeroContent.stats,
      ctaLabel: row.ctaLabel ?? shopHeroContent.ctaLabel,
      ctaHref: row.ctaHref ?? shopHeroContent.ctaHref,
      secondaryCtaLabel: row.secondaryCtaLabel ?? shopHeroContent.secondaryCtaLabel,
      secondaryCtaHref: row.secondaryCtaHref ?? shopHeroContent.secondaryCtaHref,
      note: row.note ?? shopHeroContent.note,
      media: (row.media as ShopHeroContent["media"]) ?? shopHeroContent.media,
    }
  } catch (e) {
    return shopHeroContent
  }
});