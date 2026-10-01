/**
 * Gateway dev lokal — pengganti Supabase untuk `npm run dev`.
 *
 * KENAPA ADA
 * ----------
 * Produksi memakai Supabase. Dev tidak boleh menyentuh Supabase (data
 * pelanggan asli), tapi keduanya menjalankan kode yang sama. Kode itu
 * memanggil `supabase-js`, yang berbicara HTTP ke tiga rumpun endpoint:
 *
 *     /rest/v1/*     → PostgREST   (query tabel)
 *     /auth/v1/*     → GoTrue      (login, sesi, OTP)
 *     /storage/v1/*  → Storage     (foto, bukti bayar, dokumen)
 *
 * Script ini menyediakan rumpun pertama secara sungguhan, dengan
 * menjalankan PostgREST (satu berkas .exe, tanpa Docker) di depan
 * PostgreSQL lokal, dan rumpun kedua lewat shim GoTrue di
 * scripts/dev-auth.mjs. Jadi 236 pemanggilan `supabase.from(...)` dan 40-an
 * `supabase.auth.*` di repo ini TIDAK perlu diubah sama sekali — cukup
 * `.env.local` menunjuk ke http://127.0.0.1:54321, dan `next.config.mjs`
 * sudah mengenali alamat itu sebagai lokal sehingga `npm run dev` tidak
 * diblokir pengaman.
 *
 * Rumpun ketiga (storage) belum ada; permintaannya dibalas 501 dengan pesan
 * yang jelas. Selama itu, upload foto/bukti bayar belum jalan — itu tahap
 * berikutnya, bukan kerusakan.
 *
 * CATATAN KEAMANAN — baca sebelum mengandalkannya:
 *   - `authorization` dibuang dari setiap permintaan yang menuju PostgREST.
 *     PostgREST lalu memakai `db-anon-role`, yang diset ke `postgres` —
 *     superuser — sehingga Row Level Security dilewati sepenuhnya. Itu
 *     disengaja: dev berjalan sebagai satu pengguna, dan otorisasi per-user
 *     tetap dikerjakan kode aplikasi lewat `.eq('user_id', ...)`.
 *     JANGAN pakai cara ini untuk produksi.
 *   - Script ini hanya untuk mesin pengembang. Ia tidak pernah dijalankan
 *     di produksi dan tidak dijalankan oleh `npm run build` / `npm start`.
 *
 * PEMAKAIAN
 *     npm run dev:db      jalankan PostgREST + gateway (biarkan menyala)
 *     npm run dev         di terminal lain, seperti biasa
 *
 * Prasyarat: PostgreSQL lokal sudah jalan, dan `habema_local` sudah berisi
 * tabel (lihat supabase/migrations). PostgREST diunduh otomatis ke
 * tools/postgrest/ saat pertama dijalankan — tidak ada langkah manual.
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAuthHandler } from './dev-auth.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// 54321 = yang dilihat aplikasi (sama seperti port Supabase lokal).
// 54322 = PostgREST, hanya dijangkau lewat gateway.
const GATEWAY_PORT = 54321
const POSTGREST_PORT = 54322
const POSTGREST_BIN = join(ROOT, 'tools', 'postgrest', 'postgrest.exe')

function fail(lines) {
  console.error(['', ...lines, ''].join('\n'))
  process.exit(1)
}

/** Baca satu variabel dari .env.local apa adanya, sama seperti drizzle.config.ts. */
function fromEnvLocal(key) {
  try {
    const contents = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`).exec(line)
      if (match) return match[1].replace(/^["']|["']$/g, '')
    }
  } catch {
    // .env.local belum ada — jatuh ke process.env.
  }
  return undefined
}

const dbUri = process.env.POSTGRES_URL ?? fromEnvLocal('POSTGRES_URL')

if (!dbUri) {
  fail([
    '  ⛔ POSTGRES_URL tidak ditemukan',
    '',
    '  Tambahkan ke .env.local:',
    '      POSTGRES_URL=postgresql://postgres:<password>@localhost:5432/habema_local',
  ])
}

// ── Pengaman: tolak database non-lokal ───────────────────────────────
// PostgREST dan shim auth memakai koneksi superuser dan TIDAK menegakkan
// RLS. Kalau POSTGRES_URL sampai menunjuk database production, setiap
// langkah uji di dev lokal akan menulis ke data pelanggan asli. Sama
// semangatnya dengan pengaman di next.config.mjs, tapi di sini bukan
// sekadar peringatan: script berhenti.
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

let dbHost = null
try {
  dbHost = new URL(dbUri).hostname
} catch {
  fail([
    '  ⛔ POSTGRES_URL tidak bisa dibaca sebagai URL',
    '',
    '  Bentuk yang benar:',
    '      postgresql://postgres:<password>@localhost:5432/habema_local',
  ])
}

if (!ALLOWED_HOSTS.has(dbHost) && process.env.ALLOW_REMOTE_DB_IN_DEV !== 'true') {
  fail([
    '  ⛔ DIBATALKAN — database tujuan bukan lokal',
    '',
    `  Host: ${dbHost}`,
    '',
    '  Gateway dev berjalan sebagai superuser tanpa RLS. Menunjuknya ke',
    '  database production berarti setiap uji coba menulis ke data',
    '  pelanggan asli.',
    '',
    '  Perbaiki POSTGRES_URL di .env.local supaya menunjuk localhost.',
    '  Kalau memang disengaja, set ALLOW_REMOTE_DB_IN_DEV=true dan',
    '  sadari risikonya.',
  ])
}

// Rilis PostgREST yang dipakai. Dipatok supaya mesin kedua mendapat biner
// yang sama; naikkan kalau memang mau versi baru.
const POSTGREST_VERSION = 'v16.4'

/**
 * Unduh postgrest.exe kalau belum ada. Sekali saja per mesin — berkasnya
 * masuk tools/ yang ter-gitignore.
 *
 * Sengaja otomatis, bukan instruksi untuk disalin pengguna: perintah unduh
 * manual sudah dua kali gagal dijalankan (nama aset rilis memakai "x86-64",
 * bukan "x64", dan Invoke-WebRequest di PowerShell 5.1 kadang diam saja).
 * Satu jalur unduh di satu tempat lebih kecil daripada satu paragraf
 * petunjuk yang harus dibaca ulang tiap kali.
 */
async function ensurePostgrest() {
  if (existsSync(POSTGREST_BIN)) return

  const dir = dirname(POSTGREST_BIN)
  const zip = join(dir, 'postgrest.zip')
  const url =
    `https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}` +
    `/postgrest-${POSTGREST_VERSION}-windows-x86-64.zip`

  console.log(`\n  ↓ postgrest.exe belum ada — mengunduh ${POSTGREST_VERSION}…`)

  let res
  try {
    res = await fetch(url)
  } catch (error) {
    fail([
      '  ⛔ Gagal mengunduh PostgREST',
      `  ${error instanceof Error ? error.message : String(error)}`,
      '',
      `  Unduh manual: ${url}`,
      `  Taruh postgrest.exe hasil ekstrak di: ${dir}`,
    ])
  }

  if (!res.ok) {
    fail([
      `  ⛔ Gagal mengunduh PostgREST (HTTP ${res.status})`,
      '',
      `  ${url}`,
      '  Versi itu mungkin sudah tidak ada di GitHub. Ganti',
      '  POSTGREST_VERSION di scripts/dev-db.mjs dengan rilis terbaru.',
    ])
  }

  const buf = Buffer.from(await res.arrayBuffer())
  // Zip rilis ini ~5 MB. Kalau jauh lebih kecil, yang masuk halaman error
  // GitHub, bukan biner — tar akan gagal dengan pesan yang membingungkan.
  if (buf.length < 1_000_000) {
    fail([
      `  ⛔ Unduhan terlalu kecil (${buf.length} byte) — bukan berkas zip`,
      '',
      '  Biasanya karena jaringan memblokir GitHub. Coba lagi, atau unduh',
      `  manual dari ${url}`,
    ])
  }

  mkdirSync(dir, { recursive: true })
  writeFileSync(zip, buf)

  // tar.exe ada di setiap Windows 10 1803+ dan bisa membuka zip. Dipakai
  // supaya tidak perlu dependensi npm hanya untuk satu kali ekstrak.
  const tar = spawnSync('tar', ['-xf', zip, '-C', dir], { stdio: 'inherit' })

  if (tar.status !== 0 || !existsSync(POSTGREST_BIN)) {
    fail([
      '  ⛔ Ekstrak gagal',
      '',
      `  Zip ada di ${zip} — buka manual, taruh postgrest.exe di ${dir}.`,
    ])
  }

  unlinkSync(zip)
  console.log('  ✅ postgrest.exe siap\n')
}

await ensurePostgrest()

// ── PostgREST ────────────────────────────────────────────────────────
// Dikonfigurasi lewat environment, bukan berkas konfigurasi, supaya
// password database tidak perlu ditulis ulang di tempat kedua.
const postgrest = spawn(POSTGREST_BIN, [], {
  cwd: ROOT,
  stdio: ['ignore', 'inherit', 'inherit'],
  env: {
    ...process.env,
    PGRST_DB_URI: dbUri,
    // `auth` ikut dibuka karena app/api/auth/send-otp/route.ts:83 membaca
    // auth.users lewat PostgREST untuk memastikan email terdaftar.
    PGRST_DB_SCHEMAS: 'public,auth',
    PGRST_DB_ANON_ROLE: 'postgres',
    PGRST_SERVER_PORT: String(POSTGREST_PORT),
    // PostgREST hanya mendengarkan di localhost — jangan pernah dibuka ke LAN.
    PGRST_SERVER_HOST: '127.0.0.1',
  },
})

postgrest.on('exit', (code) => {
  console.error(`\n  ⛔ PostgREST berhenti (kode ${code}). Gateway ikut dimatikan.\n`)
  process.exit(1)
})

// ── Gateway ──────────────────────────────────────────────────────────
const handleAuth = createAuthHandler(dbUri)

const NOT_IMPLEMENTED = {
  message:
    'Endpoint ini belum ada di gateway dev. /rest/v1 dan /auth/v1 sudah ' +
    'jalan; /storage/v1 menyusul — lihat scripts/dev-db.mjs.',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${GATEWAY_PORT}`)

  if (url.pathname.startsWith('/auth/v1')) {
    return handleAuth(req, res, url)
  }

  if (!url.pathname.startsWith('/rest/v1')) {
    res.writeHead(501, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ...NOT_IMPLEMENTED, path: url.pathname }))
    return
  }

  // /rest/v1/equipment?select=*  →  /equipment?select=*
  const target =
    `http://127.0.0.1:${POSTGREST_PORT}` +
    url.pathname.slice('/rest/v1'.length) +
    url.search

  const headers = { ...req.headers }
  delete headers.host
  // Dijelaskan di komentar atas: RLS dilewati supaya dev berjalan sebagai
  // satu pengguna superuser. Ini yang membuat PostgREST memakai db-anon-role.
  delete headers.authorization

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req : undefined,
      duplex: hasBody ? 'half' : undefined,
    })

    res.writeHead(upstream.status, Object.fromEntries(upstream.headers))
    if (upstream.body) {
      for await (const chunk of upstream.body) res.write(chunk)
    }
    res.end()
  } catch (error) {
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(
      JSON.stringify({
        message: 'Gateway gagal meneruskan ke PostgREST.',
        detail: error instanceof Error ? error.message : String(error),
      })
    )
  }
})

server.listen(GATEWAY_PORT, '127.0.0.1', () => {
  console.log(
    [
      '',
      `  ✅ Gateway dev menyala di http://127.0.0.1:${GATEWAY_PORT}`,
      `     /rest/v1/*  → PostgREST http://127.0.0.1:${POSTGREST_PORT}`,
      '     /auth/v1/*  → shim GoTrue lokal (scripts/dev-auth.mjs)',
      '     /storage/v1/* → belum ada (501)',
      '',
      '  Jalankan `npm run dev` di terminal lain. Ctrl+C di sini untuk berhenti.',
      '',
    ].join('\n')
  )
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    postgrest.kill()
    server.close(() => process.exit(0))
  })
}
