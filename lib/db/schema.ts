/**
 * Skema Drizzle — hanya tabel yang sudah dimigrasi dari Supabase.
 *
 * Skema ini ditulis tangan dari `supabase/migrations/`, bukan di-introspeksi,
 * karena database lokal belum tentu sudah terisi saat file ini dibuat.
 * Keduanya harus menghasilkan hal yang sama; kalau ragu, `supabase/migrations`
 * yang benar. Setelah database lokal terisi hasil dump, jalankan
 * `npm run db:pull` untuk memverifikasi dan menambah tabel sisanya.
 *
 * Catatan penting soal tipe `numeric`:
 * driver `pg` mengembalikan kolom numeric sebagai STRING, bukan number, agar
 * presisi desimal tidak hilang. Jadi `price_per_night` bertipe string di sini
 * dan harus di-Number() sebelum dipakai berhitung — persis seperti yang sudah
 * dilakukan route lama.
 */

import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// ── equipment_categories ──────────────────────────────────────────────
// supabase/migrations/20260710000000_init_mvp_schema.sql:32-39
export const equipmentCategories = pgTable('equipment_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  description: text('description'),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── equipment ─────────────────────────────────────────────────────────
// Gabungan tiga migrasi:
//   20260710000000_init_mvp_schema.sql:44-73        (dasar)
//   20260724000000_add_promo_fields_to_equipment.sql:12-16  (promo)
//   20260727000100_add_equipment_detail_columns.sql:10-20   (detail)
export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  description: text('description'),
  pricePerDay: numeric('price_per_day', { precision: 12, scale: 2 }).notNull().default('0'),
  pricePerNight: numeric('price_per_night', { precision: 12, scale: 2 }).notNull().default('0'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  category: text('category'),
  categoryId: uuid('category_id').references(() => equipmentCategories.id, {
    onDelete: 'set null',
  }),
  // Slug kegiatan dari lib/activities.ts — 20261104000000_activities_and_client_organizations.sql
  activities: text('activities').array().notNull().default(sql`array[]::text[]`),
  brand: text('brand'),
  capacity: text('capacity'),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Promo
  isPromo: boolean('is_promo').notNull().default(false),
  discountPercentage: numeric('discount_percentage', { precision: 5, scale: 2 }),
  promoPricePerNight: numeric('promo_price_per_night', { precision: 12, scale: 2 }),
  promoStartDate: timestamp('promo_start_date', { withTimezone: true }),
  promoEndDate: timestamp('promo_end_date', { withTimezone: true }),

  // Detail
  detailedDescription: text('detailed_description'),
  galleryUrls: text('gallery_urls').array().notNull().default(sql`array[]::text[]`),
  specifications: jsonb('specifications'),
  // FK ke public.users(id) — tabel users belum dimigrasi, jadi sengaja tidak
  // dideklarasikan sebagai referensi Drizzle dulu. Kolomnya tetap bisa dibaca.
  vendorId: uuid('vendor_id'),
  weightKg: numeric('weight_kg', { precision: 8, scale: 2 }),
  dimensions: text('dimensions'),
  material: text('material'),
  weatherRating: text('weather_rating'),
  rentalCount: integer('rental_count').notNull().default(0),
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
})

// ── bundles ───────────────────────────────────────────────────────────
//   20260710000000_init_mvp_schema.sql:78-89                 (dasar)
//   20260912000000_group_rental_bundles.sql:17-21            (includes, excludes, discount_percentage, pax_min, pax_max)
export const bundles = pgTable('bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  description: text('description').notNull().default(''),
  targetAudience: text('target_audience'),
  bundlePrice: numeric('bundle_price', { precision: 12, scale: 2 }),
  originalPrice: numeric('original_price', { precision: 12, scale: 2 }),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  includes: jsonb('includes').notNull().default(sql`'[]'::jsonb`),
  excludes: jsonb('excludes').notNull().default(sql`'[]'::jsonb`),
  discountPercentage: numeric('discount_percentage', { precision: 5, scale: 2 }),
  paxMin: integer('pax_min'),
  paxMax: integer('pax_max'),
})

// ── branches ──────────────────────────────────────────────────────────
// supabase/migrations/20260807_create_branches.sql:14-24
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  operationalHours: text('operational_hours'),
  mapUrl: text('map_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── branch_inventory ──────────────────────────────────────────────────
// supabase/migrations/20260807_create_branches.sql:35-42
// Stok per cabang per equipment. equipment_id memakai RESTRICT seperti
// migrasinya (menghapus equipment yang masih punya stok ditolak database).
export const branchInventory = pgTable('branch_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'cascade' }),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id),
  quantity: integer('quantity').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── bundle_items ──────────────────────────────────────────────────────
// supabase/migrations/20260912000000_group_rental_bundles.sql:28-36
// Komposisi paket → equipment. Sama seperti branch_inventory, equipment_id
// memakai RESTRICT (tanpa onDelete cascade).
export const bundleItems = pgTable('bundle_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  bundleId: uuid('bundle_id')
    .notNull()
    .references(() => bundles.id, { onDelete: 'cascade' }),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── bookings / booking_items (MINIMAL) ────────────────────────────────
// Hanya kolom yang dipakai query overlap /api/branches/availability.
// Tabel aslinya jauh lebih lebar (lihat 20260710000000_init_mvp_schema.sql
// + 20260807_create_branches.sql untuk pickup_branch_id); kolom lain tetap
// ada di database, hanya belum dipetakan karena belum ada route Drizzle
// yang membutuhkannya. Tambahkan kolomnya di sini saat dibutuhkan.
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull().default('pending'),
  pickupBranchId: uuid('pickup_branch_id'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
})

export const bookingItems = pgTable('booking_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id, {
    onDelete: 'cascade',
  }),
  equipmentId: uuid('equipment_id'),
  quantity: integer('quantity').notNull().default(1),
})

// ── client_organizations ──────────────────────────────────────────────
// Instansi/lembaga/organisasi yang pernah menyewa, untuk logo cloud.
// is_active default false: publikasi nama butuh izin tertulis (consent_note).
// 20261104000000_activities_and_client_organizations.sql
export const clientOrganizations = pgTable('client_organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  sector: text('sector'),
  documentationSlug: text('documentation_slug'),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(false),
  consentNote: text('consent_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Penanda "perangkat ini sudah menyelesaikan OTP untuk akun admin ini".
// Cookie berisi token acak; yang disimpan hanya sha256-nya. Lihat
// lib/admin-trust.ts dan migrasi 20261105000000.
export const adminDeviceTrust = pgTable('admin_device_trust', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// ── activity_tiles ────────────────────────────────────────────────────
// Foto tile kegiatan di homepage. Satu baris per slug dari lib/activities.ts.
// Dulu fotunya diturunkan dari equipment.imageUrl (alat paling sering disewa);
// sekarang dikurasi lewat /admin/activities supaya katalog bisa berubah tanpa
// mengubah tampilan homepage. 20261106000000_activity_tiles.sql
export const activityTiles = pgTable('activity_tiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  imageUrl: text('image_url').notNull(),
  imageAlt: text('image_alt'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── promo_banners ─────────────────────────────────────────────────────
// Banner promo homepage: gambar kampanye, bukan produk. Dikelola dari
// /admin/promo-banners. 20261106000002_promo_banners.sql
export const promoBanners = pgTable('promo_banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── shop_hero ──────────────────────────────────────────────────────────
// Hero section "ShopProducts" di homepage: carousel media (image/video),
// judul, deskripsi, stats, CTA. Hanya SATU baris aktif (single row).
// Dikelola dari /admin/shop-hero. 20261108000000_shop_hero.sql
export const shopHero = pgTable('shop_hero', {
  id: uuid('id').primaryKey().defaultRandom(),
  kicker: text('kicker').notNull().default('Habema Official Store'),
  heading: text('heading').notNull(),
  description: text('description').notNull(),
  stats: jsonb('stats').notNull().default(sql`'[]'::jsonb`),
  ctaLabel: text('cta_label').notNull().default('Mulai Belanja'),
  ctaHref: text('cta_href').notNull().default('/catalog_shop'),
  secondaryCtaLabel: text('secondary_cta_label').notNull().default('Bundling Hemat'),
  secondaryCtaHref: text('secondary_cta_href').notNull().default('/bundles'),
  note: text('note').notNull().default('Produk original dengan garansi tukar 7 hari. Pembayaran aman via Midtrans.'),
  media: jsonb('media').notNull().default(sql`'[]'::jsonb`),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── shop_products ─────────────────────────────────────────────────────
// Produk jual (beli, bukan sewa). Cerminan drizzle-nya sengaja sempit:
// hanya kolom yang dibutuhkan halaman /kegiatan/[slug]. Tulisannya tetap
// lewat /api/admin/catalog-shop (PostgREST), jadi jangan pakai mirror ini
// untuk insert/update.
//   20260727000300_create_shop_products.sql
//   20261106000001_shop_products_activities.sql
export const shopProducts = pgTable('shop_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  originalPrice: numeric('original_price', { precision: 12, scale: 2 }),
  stock: integer('stock').notNull().default(0),
  category: text('category'),
  // Slug kegiatan dari lib/activities.ts — sama seperti equipment.activities
  activities: text('activities').array().notNull().default(sql`array[]::text[]`),
  imageUrl: text('image_url'),
  brand: text('brand'),
  isAvailable: boolean('is_available').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  soldCount: integer('sold_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Relasi ────────────────────────────────────────────────────────────// Dibutuhkan agar `db.query.equipment.findMany({ with: { category: true } })`
// bisa dipakai — bentuk ini yang paling dekat dengan embed PostgREST
// `equipment_categories ( name )` yang digantikan.
export const equipmentCategoriesRelations = relations(equipmentCategories, ({ many }) => ({
  equipment: many(equipment),
}))

export const equipmentRelations = relations(equipment, ({ one }) => ({
  category: one(equipmentCategories, {
    fields: [equipment.categoryId],
    references: [equipmentCategories.id],
  }),
}))

export const bundlesRelations = relations(bundles, ({ many }) => ({
  items: many(bundleItems),
}))

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleItems.bundleId],
    references: [bundles.id],
  }),
  equipment: one(equipment, {
    fields: [bundleItems.equipmentId],
    references: [equipment.id],
  }),
}))

export const branchesRelations = relations(branches, ({ many }) => ({
  inventory: many(branchInventory),
}))

export const branchInventoryRelations = relations(branchInventory, ({ one }) => ({
  branch: one(branches, {
    fields: [branchInventory.branchId],
    references: [branches.id],
  }),
  equipment: one(equipment, {
    fields: [branchInventory.equipmentId],
    references: [equipment.id],
  }),
}))

export const bookingsRelations = relations(bookings, ({ many }) => ({
  items: many(bookingItems),
}))

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
}))
