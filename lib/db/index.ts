/**
 * Koneksi PostgreSQL lokal untuk Drizzle.
 *
 * HANYA UNTUK KODE SERVER. `pg` butuh `net`/`tls` yang tidak ada di browser —
 * mengimpornya dari komponen `'use client'` akan gagal saat build. Kalau butuh
 * data di komponen client, buat API route dan panggil lewat fetch.
 *
 * Sengaja tidak melempar error saat modul dimuat. Route yang memakainya
 * menangkap error dari getDb() dan membalas 503, meniru perilaku lama saat
 * klien Supabase gagal dibuat karena env belum diisi.
 *
 * Koneksi ini memakai user `postgres` — superuser — sehingga Row Level Security
 * DILEWATI SEPENUHNYA. Aturan yang dulu ditegakkan policy di
 * supabase/migrations/20260710000200_fix_rls_and_storage.sql sekarang harus
 * ditulis eksplisit di query. Lihat rencana migrasi, bagian "RLS hilang".
 */

import { Pool } from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export type Db = NodePgDatabase<typeof schema>

// Disimpan di globalThis supaya hot reload dev tidak membuat pool baru terus
// menerus sampai koneksi ke database lokal habis.
const globalForDb = globalThis as unknown as {
  __habemaPgPool?: Pool
  __habemaDb?: Db
}

export function getDb(): Db {
  if (globalForDb.__habemaDb) return globalForDb.__habemaDb

  const connectionString = process.env.POSTGRES_URL

  if (!connectionString) {
    throw new Error(
      'POSTGRES_URL belum diset. Tambahkan baris berikut ke .env.local, ' +
        'lalu restart dev server:\n' +
        '    POSTGRES_URL=postgresql://postgres:<password>@localhost:5432/<nama-database>'
    )
  }

  const pool =
    globalForDb.__habemaPgPool ??
    new Pool({
      connectionString,
      // Database lokal: koneksi berlebih hanya membebani tanpa manfaat.
      max: 10,
    })

  globalForDb.__habemaPgPool = pool

  const db = drizzle(pool, { schema })
  globalForDb.__habemaDb = db

  return db
}

export { schema }
