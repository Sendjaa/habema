import { NextResponse } from 'next/server'
import { and, asc, desc, eq, gt, isNull, lte, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  activityTiles,
  clientOrganizations,
  equipment,
  promoBanners,
} from '@/lib/db/schema'
import { activities as activityCatalog, fallbackActivityImage } from '@/lib/activities'
import { getCachedHome, setCachedHome, type HomePayload } from '@/lib/home-data'

/**
 * Satu endpoint untuk tiga section homepage (LogoCloud, ActivityCategories,
 * PromoBanners). Digabung karena ketiganya dibaca bersamaan saat halaman
 * pertama kali dibuka; useOptimizedFetch men-dedupe pemanggilannya.
 *
 * Tiap blok punya try/catch sendiri. equipment.activities dan tabel
 * client_organizations baru ada setelah migrasi 20261104000000 dijalankan, jadi
 * homepage harus tetap utuh (section menyembunyikan dirinya) ketika kolom atau
 * tabelnya belum ada — bukan 500 untuk seluruh halaman.
 */

export async function GET() {
  const hit = getCachedHome()
  if (hit) {
    return NextResponse.json({ success: true, data: hit })
  }

  let db: ReturnType<typeof getDb>
  try {
    db = getDb()
  } catch (e: any) {
    console.error('[home] Database init failed:', e.message)
    return NextResponse.json(
      { success: false, error: 'Database not configured.' },
      { status: 503 },
    )
  }

  const payload: HomePayload = {
    activities: [],
    organizations: [],
    banners: [],
  }

  // Hasil "belum ada kolom/tabel" tidak boleh masuk cache: cache-nya berusia 5
  // menit dan akan membuat homepage tetap kosong setelah migrasi dijalankan.
  let schemaBelumSiap = false

  // ── Kegiatan: jumlah alat dari katalog, foto dari activity_tiles ──────
  try {
    const rows = await db
      .select({ activities: equipment.activities })
      .from(equipment)
      .where(eq(equipment.isAvailable, true))

    const counts = new Map<string, number>()
    for (const row of rows) {
      for (const slug of row.activities ?? []) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1)
      }
    }
    console.error('[home] debug: rows=', rows.length, 'counts=', Object.fromEntries(counts))

    // Foto tile bukan turunan katalog: kalau ikut equipment.imageUrl, tile
    // berubah setiap kali foto alat populer berganti. Kurasi fotonya hidup di
    // tabel activity_tiles, dikelola lewat /admin/activities.
    const tiles = await db
      .select({
        slug: activityTiles.slug,
        imageUrl: activityTiles.imageUrl,
        imageAlt: activityTiles.imageAlt,
      })
      .from(activityTiles)
      .where(eq(activityTiles.isActive, true))
    const images = new Map(tiles.map((t) => [t.slug, t]))

    payload.activities = activityCatalog
      .map((a) => {
        const tile = images.get(a.slug)
        return {
          slug: a.slug,
          label: a.label,
          blurb: a.blurb,
          count: counts.get(a.slug) ?? 0,
          imageUrl: a.image ?? tile?.imageUrl ?? fallbackActivityImage,
          imageAlt: tile?.imageAlt ?? null,
        }
      })
      .filter((a) => a.count > 0)
  } catch (e: any) {
    schemaBelumSiap = true
    console.error(
      '[home] error query kegiatan:',
      e?.message ?? e,
      e?.stack ?? '',
    )
    console.warn(
      '[home] kolom equipment.activities atau tabel activity_tiles belum ada, section kegiatan disembunyikan. Jalankan migrasi 20261104000000 dan 20261106000000.',
    )
  }

  // ── Instansi untuk logo cloud ─────────────────────────────────────────
  try {
    payload.organizations = await db
      .select({
        id: clientOrganizations.id,
        name: clientOrganizations.name,
        logoUrl: clientOrganizations.logoUrl,
        sector: clientOrganizations.sector,
        documentationSlug: clientOrganizations.documentationSlug,
      })
      .from(clientOrganizations)
      .where(eq(clientOrganizations.isActive, true))
      .orderBy(asc(clientOrganizations.displayOrder), clientOrganizations.name)
  } catch (e: any) {
    schemaBelumSiap = true
    console.warn(
      '[home] tabel client_organizations belum ada, logo cloud disembunyikan. Jalankan supabase/migrations/20261104000000_activities_and_client_organizations.sql.',
      e?.message ?? e,
    )
  }

  // ── Banner promo: gambar kampanye dari /admin/promo-banners ──────────
  // Bukan turunan equipment.is_promo: section ini tidak boleh jadi daftar
  // produk kedua. Baris yang lewat jadwal atau dinonaktifkan hilang sendiri.
  try {
    const rows = await db
      .select({
        id: promoBanners.id,
        title: promoBanners.title,
        imageUrl: promoBanners.imageUrl,
        linkUrl: promoBanners.linkUrl,
      })
      .from(promoBanners)
      .where(
        and(
          eq(promoBanners.isActive, true),
          or(isNull(promoBanners.startsAt), lte(promoBanners.startsAt, new Date())),
          or(isNull(promoBanners.endsAt), gt(promoBanners.endsAt, new Date())),
        ),
      )
      .orderBy(asc(promoBanners.displayOrder), desc(promoBanners.createdAt))

    payload.banners = rows
  } catch (e: any) {
    schemaBelumSiap = true
    console.warn(
      '[home] tabel promo_banners belum ada, section promo disembunyikan. Jalankan supabase/migrations/20261106000002_promo_banners.sql.',
      e?.message ?? e,
    )
  }

  if (!schemaBelumSiap) setCachedHome(payload)
  return NextResponse.json({ success: true, data: payload })
}
