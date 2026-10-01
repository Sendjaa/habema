/**
 * Konfigurasi drizzle-kit — hanya untuk `db:pull` (introspeksi) dan `db:studio`.
 *
 * `db:push` dan `db:migrate` SENGAJA tidak dipakai di proyek ini. Skema
 * database tetap dikelola oleh `supabase/migrations/` dan hasil dump
 * production; Drizzle di sini hanya untuk query dan tipe. Menjalankan
 * `drizzle-kit push` akan menulis ulang skema dari file ini dan menghapus
 * kolom yang belum sempat ditulis di schema.ts.
 *
 * drizzle-kit tidak memuat .env.local sendiri (itu fitur Next.js, bukan Node),
 * jadi POSTGRES_URL dibaca manual di bawah — supaya tidak perlu menambah
 * dependensi dotenv hanya untuk ini.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'drizzle-kit'

const ROOT = dirname(fileURLToPath(import.meta.url))

/** Baca satu variabel dari .env.local apa adanya — tanpa memuat seluruh berkas. */
function fromEnvLocal(key: string): string | undefined {
  try {
    const contents = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`).exec(line)
      if (match) return match[1].replace(/^["']|["']$/g, '')
    }
  } catch {
    // .env.local belum ada — jatuh ke process.env di bawah.
  }
  return undefined
}

const url = process.env.POSTGRES_URL ?? fromEnvLocal('POSTGRES_URL')

if (!url) {
  throw new Error(
    'POSTGRES_URL tidak ditemukan di .env.local maupun environment.\n' +
      'Tambahkan ke .env.local:\n' +
      '    POSTGRES_URL=postgresql://postgres:<password>@localhost:5432/<nama-database>'
  )
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dbCredentials: { url },
  // Jangan sentuh schema milik Supabase — kita hanya membaca schema public.
  schemaFilter: ['public'],
})
