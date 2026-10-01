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

// ── Relasi ────────────────────────────────────────────────────────────
// Dibutuhkan agar `db.query.equipment.findMany({ with: { category: true } })`
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
