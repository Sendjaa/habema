/**
 * Pengaman perintah Supabase CLI.
 *
 * `next.config.mjs` sudah menghentikan `npm run dev` kalau
 * NEXT_PUBLIC_SUPABASE_URL menunjuk project production. Script ini menutup
 * lubang berikutnya: Supabase CLI di mesin ini ter-link ke project
 * PRODUCTION (supabase/.temp/linked-project.json → ypbdqkfxtmkbllhezmqz
 * "habamaOutdoor"). Selama tautan itu belum dipindah ke project dev,
 * `supabase db push` berjalan terhadap database pelanggan asli tanpa
 * peringatan apa pun.
 *
 * Batas jangkauan — baca ini sebelum mengandalkannya:
 *   - Hanya perintah yang dijalankan lewat npm script di package.json yang
 *     melewati script ini. `supabase db push` langsung dari terminal TIDAK
 *     dijaga. Kebiasaan yang aman: pakai `npm run db:push`.
 *   - `supabase db dump` sengaja TIDAK dijaga — perintah itu hanya membaca,
 *     dan DATABASE_ENV_SETUP.md memang memakainya untuk menyalin katalog
 *     dari production.
 *
 * Pemakaian:
 *     npm run db:status                      cetak project yang ter-link
 *     npm run db:link -- --project-ref <ref> tautkan ke project dev
 *     npm run db:push:dry                    lihat migrasi, tanpa mengubah
 *     npm run db:push                        jalankan migrasi
 *     npm run supabase:types:dev             generate tipe dari project ter-link
 *
 * Untuk sengaja menyasar production: ALLOW_PRODUCTION_DB=true
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Sama dengan PRODUCTION_PROJECT_REF di next.config.mjs. Kalau project
// production berpindah, ubah di KEDUA tempat — tidak ada yang menyamakan
// keduanya otomatis.
const PRODUCTION_PROJECT_REF = 'ypbdqkfxtmkbllhezmqz'
const PRODUCTION_PROJECT_NAME = 'habamaOutdoor'

const LINK_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'supabase',
  '.temp',
  'linked-project.json'
)

// Nama pendek di package.json → nama yang terbaca manusia di pesan error.
const LABELS = {
  'db-push': 'supabase db push',
  'db-link': 'supabase link',
  'gen-types-dev': 'supabase gen types (dev)',
}

function readLink() {
  try {
    const parsed = JSON.parse(readFileSync(LINK_FILE, 'utf8'))
    return typeof parsed?.ref === 'string' && parsed.ref ? parsed : null
  } catch {
    return null
  }
}

function fail(lines) {
  console.error(['', ...lines, ''].join('\n'))
  process.exit(1)
}

const args = process.argv.slice(2)
const labelKey = args[0] && !args[0].startsWith('--') ? args[0] : null
const action = LABELS[labelKey] ?? labelKey ?? 'perintah ini'
const allowProduction = process.env.ALLOW_PRODUCTION_DB === 'true'

const refFlag = args.indexOf('--project-ref')
const requestedRef = refFlag !== -1 ? args[refFlag + 1] ?? null : null

const link = readLink()

// ── Mode laporan: tidak pernah memblokir, hanya memberi tahu ──────
if (args.includes('--status')) {
  if (!link) {
    console.log('\n  ℹ️  Supabase CLI belum ter-link ke project mana pun.\n')
    process.exit(0)
  }
  const isProduction = link.ref === PRODUCTION_PROJECT_REF
  console.log(
    `\n  ${isProduction ? '⛔' : '✅'} Supabase CLI ter-link ke: ` +
      `${link.ref}${link.name ? ` ("${link.name}")` : ''}` +
      `${isProduction ? ' — PRODUCTION' : ''}\n`
  )
  process.exit(0)
}

// ── 1. Menautkan ulang ke production tanpa sengaja ────────────────
// Ref tujuan dibaca dari argumen, bukan dari linked-project.json, karena
// file itu masih berisi tautan yang lama sampai perintah ini selesai.
if (requestedRef === PRODUCTION_PROJECT_REF && !allowProduction) {
  fail([
    '  ⛔ DILARANG MEN-LINK KE PROJECT PRODUCTION',
    '',
    `  Perintah ini menyasar ${PRODUCTION_PROJECT_REF} ("${PRODUCTION_PROJECT_NAME}").`,
    '  Setelah ter-link ke sana, `npm run db:push` berikutnya berjalan',
    '  terhadap database pelanggan asli.',
    '',
    '  Kalau tujuan Anda project dev, pakai ref project dev.',
    '  Kalau memang perlu production, set ALLOW_PRODUCTION_DB=true.',
  ])
}

// `supabase link` memang perintah yang memindahkan tautan — keadaan
// "belum ter-link" dan "masih ter-link ke production" wajar di situ,
// jadi dua pemeriksaan di bawah tidak berlaku untuknya.
const isLinkCommand = labelKey === 'db-link'

if (!isLinkCommand && !link) {
  fail([
    `  ⛔ DIBATALKAN — ${action}`,
    '',
    '  Supabase CLI belum ter-link ke project mana pun, jadi tidak jelas',
    '  database mana yang jadi sasaran.',
    '',
    '  Link dulu ke project DEV:',
    '      npm run db:link -- --project-ref <ref-project-dev>',
    '      npm run db:status      # pastikan ref-nya sudah dev',
  ])
}

if (!isLinkCommand && link.ref === PRODUCTION_PROJECT_REF && !allowProduction) {
  fail([
    `  ⛔ DIBATALKAN — ${action}`,
    '',
    '  Supabase CLI sedang ter-link ke project PRODUCTION:',
    `      ${link.ref}${link.name ? ` ("${link.name}")` : ''}`,
    '',
    '  Perintah ini berjalan terhadap database pelanggan asli.',
    '',
    '  Pindahkan tautan ke project dev dulu:',
    '      npm run db:link -- --project-ref <ref-project-dev>',
    '      npm run db:status      # pastikan ref-nya sudah dev',
    '',
    '  Terpaksa harus production? Set ALLOW_PRODUCTION_DB=true.',
  ])
}

// ── Lolos ─────────────────────────────────────────────────────────
// `link?.ref` — bukan `link.ref`: `db:link` tanpa --project-ref pada repo
// yang belum pernah ter-link membuat `link` bernilai null sampai di sini.
const targetRef = requestedRef ?? link?.ref ?? null
const targetIsProduction = targetRef === PRODUCTION_PROJECT_REF

if (isLinkCommand && !requestedRef) {
  console.log(
    '  ✅ supabase link: ref tujuan belum ditentukan di sini.\n' +
      '     Ikuti prompt CLI, lalu WAJIB verifikasi dengan `npm run db:status`.'
  )
} else if (targetIsProduction) {
  // Dua pemeriksaan di atas dilewati karena ALLOW_PRODUCTION_DB=true.
  // Jangan pernah mencetak ✅ di sini — targetnya memang production, dan
  // satu-satunya alasan sampai di sini adalah variabel yang mudah terlupakan.
  console.warn(
    `\n  ⚠️  ${action}: target PRODUCTION (${targetRef}) — diizinkan lewat\n` +
      '      ALLOW_PRODUCTION_DB=true. Perubahan mengenai data pelanggan asli.\n'
  )
} else {
  console.log(`  ✅ ${action}: target ${targetRef} (bukan production)`)
}
