/**
 * Penerjemah baris Drizzle → bentuk lama PostgREST.
 *
 * PostgREST mengembalikan nama kolom apa adanya (snake_case), sedangkan
 * Drizzle memakai nama properti camelCase dari schema.ts. Ratusan komponen
 * sudah mengonsumsi bentuk snake_case itu, jadi kontraknya dipertahankan:
 * migrasi lapisan data tidak boleh memaksa komponen ikut berubah.
 *
 * Peta camelCase → snake_case di bawah diturunkan dari skema, bukan ditulis
 * ulang dengan tangan. Jadi kalau ada kolom baru ditambahkan ke schema.ts,
 * penerjemah ini ikut mengetahuinya tanpa perlu disunting.
 */

import { getTableColumns } from 'drizzle-orm'
import { equipment } from './schema'

const EQUIPMENT_COLUMN_NAMES: Array<[camel: string, snake: string]> = Object.entries(
  getTableColumns(equipment)
).map(([camel, column]) => [camel, column.name])

/**
 * Ubah satu baris `equipment` (hasil query relasional Drizzle) menjadi bentuk
 * yang sama dengan hasil `supabase.from('equipment').select('*, equipment_categories(...)')`.
 *
 * Kolom `category` (dari `with: { category: … }`) dipindahkan ke kunci
 * `equipment_categories`, meniru nama tabel yang dipakai PostgREST saat embed.
 *
 * CATATAN: kolom `numeric` tetap berupa string, sama seperti perilaku `pg` dan
 * sama seperti PostgREST. Konversi ke Number dikerjakan pemanggil, karena tiap
 * route punya aturan fallback yang berbeda (mis. `average_rating` jatuh ke 4.9).
 */
export function toLegacyEquipmentRow(row: Record<string, unknown>): Record<string, unknown> {
  const { category, ...columns } = row
  const out: Record<string, unknown> = {}

  for (const [camel, snake] of EQUIPMENT_COLUMN_NAMES) {
    if (camel in columns) out[snake] = columns[camel]
  }

  if (category !== undefined) out.equipment_categories = category

  return out
}
