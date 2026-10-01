/**
 * Salin data dari database PRODUCTION ke file .sql, untuk dipakai sebagai
 * isi database lokal.
 *
 * Kenapa script ini ada, padahal DATABASE_ENV_SETUP.md sudah memakai
 * `supabase db dump`:
 *
 *   1. `supabase db dump` tidak dipakai di sini — Docker sengaja tidak
 *      dipakai di mesin ini. (Apakah perintah itu benar-benar butuh
 *      container Docker belum pernah diverifikasi; yang pasti, jalur
 *      `pg_dump` di bawah tidak butuh sama sekali.) Script ini memakai
 *      `pg_dump` dari instalasi PostgreSQL lokal.
 *   2. Perintah ini MEMBACA database pelanggan asli. Menaruh kredensial
 *      production di riwayat terminal mudah menjadi kebiasaan buruk, jadi
 *      connection string dibaca dari file yang ter-gitignore, bukan dari
 *      argumen yang terlihat di `ps`.
 *
 * CATATAN: script ini belum pernah dijalankan sampai berhasil. Perintahnya
 * sudah disusun dari dokumentasi pg_dump, tapi belum ada bukti uji. Kalau
 * gagal, baca pesan error dari pg_dump di atas pesan ringkas di bawah.
 *
 * Batas jangkauan — baca sebelum mengandalkannya:
 *   - Script ini hanya menyalin. Ia tidak menyentuh database lokal Anda.
 *     Restore tetap dilakukan lewat pgAdmin4 atau `psql` (lihat cetakan
 *     di akhir).
 *   - Hasil dump berisi DATA PELANGGAN ASLI: email, nomor HP, alamat.
 *     Simpan di folder `dumps/` (sudah ter-gitignore) dan jangan pernah
 *     di-commit.
 *   - Schema `auth` dan `storage` TIDAK ikut. Keduanya hanya ada di
 *     Supabase, dan tanpa Supabase tidak ada yang membacanya. Yang
 *     disalin hanya schema `public`.
 *   - RLS tidak ikut (dijalankan dengan --no-policies). Koneksi `pg`
 *     sebagai superuser memang melewati RLS, jadi policy yang tersalin
 *     hanya akan jadi beban mati. Otorisasi ditegakkan di kode.
 *
 * Pemakaian:
 *     npm run db:dump:prod -- --catalog     data katalog saja (default)
 *     npm run db:dump:prod -- --schema      DDL tabel public saja
 *     npm run db:dump:prod -- --full        schema + data, semua tabel public
 *     npm run db:dump:prod -- --db-url "postgresql://..."   lewati file kredensial
 *
 * URUTAN RESTORE ke database lokal yang masih kosong:
 *     1. scripts/local-db-shim.sql   (wajib lebih dulu, lihat komentar file)
 *     2. hasil --schema              (membuat tabel)
 *     3. hasil --catalog             (mengisi tabel katalog)
 * Langkah 1 wajib: dump schema membawa trigger pada `auth.users`, tabel
 * yang hanya ada di Supabase. Tanpa shim, restore berhenti di baris itu.
 *
 * Alternatif satu langkah: --full (schema + SELURUH data, termasuk
 * booking & data pelanggan). Pakai hanya kalau memang itu yang dimau.
 *
 * Kredensial dibaca berurutan dari:
 *     1. argumen --db-url
 *     2. environment PROD_DB_URL
 *     3. file .env.dump.local  (PROD_DB_URL=postgresql://...)
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Sama dengan PRODUCTION_PROJECT_REF di next.config.mjs dan db-guard.mjs.
// Kalau project production berpindah, ubah di KETIGA tempat.
const PRODUCTION_PROJECT_REF = 'ypbdqkfxtmkbllhezmqz'

// Tabel katalog — sama dengan daftar di DATABASE_ENV_SETUP.md §6. Ini yang
// cukup untuk membuat katalog lokal terisi tanpa menyeret transaksi
// pelanggan (bookings, shop_orders, payments).
const CATALOG_TABLES = [
  'public.equipment_categories',
  'public.equipment',
  'public.bundles',
  'public.bundle_items',
  'public.branches',
  'public.discounts',
  'public.shop_products',
]

const args = process.argv.slice(2)

function argValue(name) {
  const i = args.indexOf(name)
  return i !== -1 ? args[i + 1] ?? null : null
}

function fail(lines) {
  console.error(['', ...lines, ''].join('\n'))
  process.exit(1)
}

// ── 1. Cari pg_dump ───────────────────────────────────────────────
// PostgreSQL di Windows tidak menambahkan bin/ ke PATH secara default,
// jadi "tidak ada di PATH" belum berarti "tidak terpasang".
function findPgDump() {
  const fromPath = process.env.PATH.split(process.platform === 'win32' ? ';' : ':')
    .map((dir) => join(dir, process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump'))
    .find((p) => p && existsSync(p))
  if (fromPath) return fromPath

  for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']]) {
    if (!base) continue
    const pgDir = join(base, 'PostgreSQL')
    if (!existsSync(pgDir)) continue
    // Ambil versi tertinggi yang ada, mis. PostgreSQL\17\bin\pg_dump.exe
    const versions = readdirSync(pgDir).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    )
    for (const v of versions) {
      const candidate = join(pgDir, v, 'bin', process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump')
      if (existsSync(candidate)) return candidate
    }
  }
  return null
}

const pgDump = findPgDump()

if (!pgDump) {
  fail([
    '  ⛔ pg_dump tidak ditemukan',
    '',
    '  PostgreSQL belum terpasang di mesin ini, atau letaknya tidak standar.',
    '  Pasang PostgreSQL for Windows — installer-nya sekaligus memasang',
    '  pgAdmin4, jadi satu unduhan cukup:',
    '',
    '      https://www.postgresql.org/download/windows/',
    '',
    '  Pilih versi mayor 15 supaya cocok dengan supabase/config.toml dan',
    '  database production. Setelah terpasang, jalankan ulang perintah ini.',
  ])
}

// ── 2. Baca connection string ─────────────────────────────────────
function readCredentialFile() {
  const file = join(ROOT, '.env.dump.local')
  if (!existsSync(file)) return null
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*PROD_DB_URL\s*=\s*(.+?)\s*$/.exec(line)
    if (match) return match[1].replace(/^["']|["']$/g, '')
  }
  return null
}

const dbUrl = argValue('--db-url') ?? process.env.PROD_DB_URL ?? readCredentialFile()

if (!dbUrl) {
  fail([
    '  ⛔ Connection string production belum ada',
    '',
    '  Buat file .env.dump.local (sudah ter-gitignore) berisi:',
    '',
    '      PROD_DB_URL=postgresql://postgres:<password>@db.' +
      `${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
    '',
    '  Ambil dari Supabase Dashboard -> Project Settings -> Database ->',
    '  Connection string -> URI. Pakai koneksi langsung (port 5432), BUKAN',
    '  transaction pooler (6543) — pg_dump butuh koneksi session.',
    '',
    '  Kalau jaringan Anda tidak punya IPv6, host langsung di atas tidak akan',
    '  tersambung. Pakai Session pooler sebagai gantinya:',
    '      aws-0-<region>.pooler.supabase.com:5432',
    '      user: postgres.<project-ref>',
    '',
    '  Jangan tempel connection string ini ke chat atau ke dalam repo.',
  ])
}

// ── 3. Pastikan yang disasar memang production ────────────────────
// Script ini hanya membaca, tapi menyalin data pelanggan asli tetap
// tindakan yang harus disengaja. Sama seperti ALLOW_PRODUCTION_DB di
// db-guard.mjs: jangan pernah lolos diam-diam.
const targetsProduction = dbUrl.includes(PRODUCTION_PROJECT_REF)
const confirmed = args.includes('--yes') || process.env.ALLOW_PRODUCTION_DB === 'true'

if (!targetsProduction) {
  console.warn(
    '\n  ⚠️  Connection string tidak menyebut ref project production.\n' +
      `      Yang diharapkan: ${PRODUCTION_PROJECT_REF}\n` +
      '      Pastikan Anda menyalin dari database yang benar.\n'
  )
} else if (!confirmed) {
  fail([
    '  ⛔ DIBATALKAN — membaca database PRODUCTION',
    '',
    `  Target: ${PRODUCTION_PROJECT_REF} ("habamaOutdoor") — data pelanggan asli.`,
    '',
    '  Perintah ini akan menulis isi database production ke file .sql di',
    '  komputer ini. Tidak ada yang diubah di sisi production, tapi hasilnya',
    '  berisi email, nomor HP, dan alamat pelanggan.',
    '',
    '  Kalau memang itu tujuannya, tambahkan --yes:',
    '      npm run db:dump:prod -- --catalog --yes',
  ])
}

// ── 4. Jalankan dump ──────────────────────────────────────────────
const full = args.includes('--full')
const schemaOnly = args.includes('--schema')
const outDir = join(ROOT, 'dumps')
mkdirSync(outDir, { recursive: true })

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-')
const scope = full ? 'full' : schemaOnly ? 'schema' : 'katalog'
const outFile = join(outDir, `habema-prod-${scope}-${stamp}.sql`)

// --no-policies bukan sekadar merapikan: policy Supabase memanggil
// auth.uid(), dan fungsi itu tidak ada di PostgreSQL biasa. Tanpa opsi ini
// restore gagal di CREATE POLICY pertama. RLS memang dilewati koneksi
// superuser, jadi tidak ada yang hilang.
const pgArgs = [
  dbUrl,
  '--no-owner',
  '--no-privileges',
  '--no-policies',
  '--schema=public',
]

if (full) {
  // Schema + data seluruh tabel public. Ikut menyeret bookings, shop_orders,
  // dan data pelanggan lain — pakai hanya kalau memang itu tujuannya.
  pgArgs.push('--clean', '--if-exists')
} else if (schemaOnly) {
  // DDL saja. Dipakai untuk membuat tabel di database lokal yang masih
  // kosong, tanpa menyalin satu baris data pun.
  pgArgs.push('--schema-only')
} else {
  // Hanya isi tabel katalog — tanpa DDL. Database tujuan harus SUDAH punya
  // tabelnya (jalankan --schema lebih dulu).
  pgArgs.push('--data-only')
  for (const table of CATALOG_TABLES) pgArgs.push('-t', table)
}

pgArgs.push('-f', outFile)

console.log(`\n  → Menyalin dari production (${scope})…`)
console.log(`    ${pgDump}`)

try {
  execFileSync(pgDump, pgArgs, { stdio: ['ignore', 'inherit', 'inherit'] })
} catch {
  fail([
    '  ⛔ pg_dump gagal',
    '',
    '  Penyebab yang paling sering:',
    '    - password di .env.dump.local salah',
    '    - host langsung (db.<ref>.supabase.co) butuh IPv6 dan jaringan Anda',
    '      tidak punya — coba Session pooler',
    '    - project production sedang ter-pause',
  ])
}

const SHIM = 'scripts/local-db-shim.sql'

const steps = schemaOnly
  ? [
      '  Langkah berikutnya — restore ke database lokal yang masih kosong:',
      '',
      '    Lewat pgAdmin4 (Query Tool, jalankan berurutan):',
      `      1. buka ${SHIM}  lalu F5`,
      `      2. buka ${outFile}`,
      '         lalu F5',
      '',
      '    Lewat psql (dari root repo):',
      `      psql -h localhost -U postgres -d habema_local -f ${SHIM}`,
      `      psql -h localhost -U postgres -d habema_local -f "${outFile}"`,
      '',
      '    Shim WAJIB dijalankan lebih dulu — lihat alasan di dalam file itu.',
      '',
      '    Setelah tabel jadi, isi katalognya:',
      '      npm run db:dump:prod -- --catalog --yes',
    ]
  : [
      '  Langkah berikutnya — restore ke PostgreSQL lokal:',
      '',
      '    Lewat pgAdmin4:',
      '      1. Klik kanan database tujuan -> Restore…',
      '      2. Format: Plain, lalu pilih file .sql di atas',
      '',
      '    Lewat psql:',
      `      psql -h localhost -U postgres -d habema_local -f "${outFile}"`,
      '',
      full
        ? '  ⚠️  Mode --full: file ini berisi data pelanggan asli. Jangan di-commit.'
        : '  File ini hanya berisi tabel katalog, tanpa data pelanggan.',
    ]

console.log([
  '',
  `  ✅ Selesai: ${outFile}`,
  '',
  ...steps,
  '',
].join('\n'))
