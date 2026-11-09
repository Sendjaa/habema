/**
 * Shim GoTrue (endpoint /auth/v1) untuk dev lokal.
 *
 * KENAPA ADA
 * ----------
 * Produksi memakai Supabase Auth. Dev tidak boleh menyentuh Supabase, tapi
 * kode yang sama memanggil `supabase.auth.*` di 34 berkas. Daripada mengubah
 * keempat puluh panggilan itu — dan membuat jalur dev berbeda dari produksi —
 * shim ini meniru HTTP API GoTrue secukupnya sehingga `supabase-js` tidak
 * perlu tahu bedanya.
 *
 * Sumber kebenaran bentuk respons adalah kode asli di
 * node_modules/@supabase/auth-js/dist/main/. Tiga yang menentukan:
 *
 *   - lib/fetch.js:150  _userResponse          → `data.user ?? data`
 *   - lib/fetch.js:158  _generateLinkResponse  → baca field FLAT, bukan nested
 *   - GoTrueAdminApi.js:438  listUsers         → `{ users: [...] }` + header
 *                                                `x-total-count`
 *
 * Kalau versi @supabase/supabase-js dinaikkan dan endpoint auth mulai
 * membalas "unexpected response", periksa ketiga tempat itu lebih dulu.
 *
 * PENYIMPANAN
 * -----------
 * Pengguna disimpan di tabel `auth.users` — stub yang dibuat
 * scripts/local-db-shim.sql. Shim ini menambahkan kolom yang dibutuhkan
 * GoTrue (encrypted_password, email_confirmed_at, dst) saat pertama jalan.
 *
 * Insert ke auth.users memicu trigger `on_auth_user_created` dari migrasi
 * production, yang menyalin baris ke `public.users`. Jadi baris public.users
 * tetap dibuat oleh jalur yang sama seperti di Supabase.
 *
 * YANG SENGAJA DISEDERHANAKAN — semua aman untuk dev, tidak untuk produksi:
 *   - Token adalah JWT tanpa tanda tangan yang diverifikasi ulang; rahasianya
 *     konstanta di berkas ini. Siapa pun yang bisa membuka localhost bisa
 *     memalsukan identitas. Itu sebabnya PostgREST juga mencabut RLS.
 *   - Logout tidak mencabut token (tidak ada tabel sesi). Token tetap sah
 *     sampai kedaluwarsa sendiri. ponytail: tabel sesi kalau suatu saat dev
 *     perlu menguji pencabutan.
 *   - Google OAuth tidak ada; /authorize membalas error yang jelas.
 */

import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { Pool } from 'pg'

// Hanya memberi tanda tangan pada token yang dibaca shim ini sendiri.
const JWT_SECRET = process.env.DEV_AUTH_JWT_SECRET ?? 'dev-habema-auth-shim-not-for-production'
const ACCESS_TTL_SECONDS = 3600
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30

// ── Utilitas ─────────────────────────────────────────────────────────

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function signJwt(payload, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds, iss: 'habema-dev-auth' })
  )
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

/** Baca payload JWT tanpa verifikasi. Cukup untuk dev: token dibuat shim ini. */
function readJwtPayload(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`
}

function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored ?? '').split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// ── Bentuk data yang dikenal supabase-js ─────────────────────────────

/** Kolom-kolom yang dibutuhkan GoTrue, ditambahkan ke stub auth.users. */
const AUTH_COLUMNS = `
  alter table auth.users add column if not exists encrypted_password text;
  alter table auth.users add column if not exists email_confirmed_at timestamptz;
  alter table auth.users add column if not exists updated_at timestamptz default now();
  alter table auth.users add column if not exists raw_app_meta_data jsonb default '{}'::jsonb;
  alter table auth.users add column if not exists aud text default 'authenticated';
  alter table auth.users add column if not exists role text default 'authenticated';
  create unique index if not exists auth_users_email_key on auth.users (lower(email));
`

function toUser(row) {
  const email = row.email ?? null
  const meta = row.raw_user_meta_data ?? {}
  return {
    id: row.id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: row.email_confirmed_at ?? null,
    phone: '',
    confirmed_at: row.email_confirmed_at ?? null,
    last_sign_in_at: row.last_sign_in_at ?? null,
    app_metadata: { provider: 'email', providers: ['email'], ...(row.raw_app_meta_data ?? {}) },
    user_metadata: meta,
    identities: email
      ? [
          {
            identity_id: row.id,
            id: row.id,
            user_id: row.id,
            identity_data: { email, email_verified: true, sub: row.id },
            provider: 'email',
            last_sign_in_at: row.last_sign_in_at ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at ?? row.created_at,
          },
        ]
      : [],
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    is_anonymous: false,
  }
}

function sessionFor(row) {
  const user = toUser(row)
  const access_token = signJwt({ sub: row.id, email: user.email, role: 'authenticated' }, ACCESS_TTL_SECONDS)
  const refresh_token = signJwt({ sub: row.id, type: 'refresh' }, REFRESH_TTL_SECONDS)
  // Field flat di atas adalah bentuk asli GoTrue. `session` tambahan disertakan
  // karena beberapa versi supabase-js membaca data.session lebih dulu; isinya
  // salinan yang sama, jadi salah satu yang dipakai tetap benar.
  const flat = {
    access_token,
    token_type: 'bearer',
    expires_in: ACCESS_TTL_SECONDS,
    expires_at: Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS,
    refresh_token,
    user,
  }
  return { ...flat, session: { ...flat } }
}

// ── Handler ──────────────────────────────────────────────────────────

export function createAuthHandler(connectionString) {
  const pool = new Pool({ connectionString })

  let schemaReady = null
  function ensureSchema() {
    schemaReady ??= pool.query(AUTH_COLUMNS)
    return schemaReady
  }

  const json = (res, status, body, headers = {}) => {
    const payload = JSON.stringify(body)
    res.writeHead(status, {
      'content-type': 'application/json',
      // Supabase mulai 2024 membaca `code` dari body hanya kalau header versi
      // ini ada; tanpa itu ia jatuh ke `error_code`. Keduanya dikirim.
      'x-supabase-api-version': '2024-01-01',
      'content-length': Buffer.byteLength(payload),
      ...headers,
    })
    res.end(payload)
  }

  // Bentuk error yang dibaca _getErrorMessage + handleError di fetch.js.
  const fail = (res, status, code, msg) =>
    json(res, status, { code, error_code: code, msg, message: msg, error: code, error_description: msg })

  const findById = (id) =>
    pool.query('select * from auth.users where id = $1', [id]).then((r) => r.rows[0] ?? null)
  const findByEmail = (email) =>
    pool
      .query('select * from auth.users where lower(email) = lower($1)', [email])
      .then((r) => r.rows[0] ?? null)

  /** Ambil pengguna dari header Authorization. null kalau token tidak sah. */
  async function currentUser(req) {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
    if (!token) return null
    const payload = readJwtPayload(token)
    if (!payload?.sub || payload.exp * 1000 < Date.now()) return null
    return findById(payload.sub)
  }

  async function readBody(req) {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    if (!chunks.length) return {}
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      return {}
    }
  }

  function insertUser({ email, password, emailConfirm, userMetadata }) {
    return pool
      .query(
        `insert into auth.users
           (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, last_sign_in_at, created_at, updated_at)
         values ($1, $2, $3, $4, $5::jsonb, null, now(), now())
         returning *`,
        [
          randomUUID(),
          email,
          password ? hashPassword(password) : null,
          emailConfirm ? new Date() : null,
          JSON.stringify(userMetadata ?? {}),
        ]
      )
      .then((r) => r.rows[0])
  }

  return async function handleAuth(req, res, url) {
    // url.pathname selalu diawali /auth/v1 (dipotong oleh pemanggil).
    const path = url.pathname.replace(/^\/auth\/v1/, '') || '/'
    const method = req.method ?? 'GET'
    const query = url.searchParams

    // Aplikasi memanggil shim ini dari http://localhost:3000 sedangkan shim
    // duduk di http://127.0.0.1:54321 — beda origin, jadi browser menuntut
    // izin CORS. PostgREST sudah mengirimnya sendiri; hanya rumpun /auth/v1
    // yang harus diberi di sini. Dipasang di sini supaya semua jalur
    // keluaran (json, writeHead langsung) ikut ter-cover.
    res.setHeader('access-control-allow-origin', req.headers.origin ?? '*')
    res.setHeader('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.setHeader(
      'access-control-allow-headers',
      'apikey, authorization, content-type, x-client-info, x-supabase-api-version, range'
    )
    res.setHeader('access-control-max-age', '86400')
    res.setHeader('vary', 'origin')

    if (method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    try {
      await ensureSchema()

      // ── Token: login, refresh, tukar kode PKCE ──────────────────────
      if (path === '/token' && method === 'POST') {
        const body = await readBody(req)
        // grant_type dikirim di body oleh supabase-js (signInWithPassword),
        // bukan di query string. Baca dulu dari query, jatuh ke body.
        const grant = query.get('grant_type') ?? body.grant_type

        if (grant === 'refresh_token') {
          const payload = readJwtPayload(body.refresh_token ?? '')
          const row = payload?.sub && payload.type === 'refresh' ? await findById(payload.sub) : null
          if (!row) return fail(res, 400, 'refresh_token_not_found', 'Refresh token tidak sah')
          return json(res, 200, sessionFor(row))
        }

        if (grant === 'password') {
          const row = await findByEmail(body.email ?? '')
          if (!row || !verifyPassword(body.password ?? '', row.encrypted_password)) {
            return fail(res, 400, 'invalid_credentials', 'Email atau password salah')
          }
          if (!row.email_confirmed_at) {
            return fail(res, 400, 'email_not_confirmed', 'Email belum dikonfirmasi')
          }
          const updated = await pool
            .query('update auth.users set last_sign_in_at = now() where id = $1 returning *', [row.id])
            .then((r) => r.rows[0])
          return json(res, 200, sessionFor(updated))
        }

        if (grant === 'pkce') {
          // exchangeCodeForSession. Kode yang dikeluarkan /authorize tidak
          // pernah dipakai di dev (Google OAuth mati), jadi ini hanya jaring
          // pengaman supaya callback tidak meledak dengan error yang aneh.
          return fail(res, 400, 'invalid_grant', 'Kode OAuth tidak dikenali di dev lokal')
        }

        return fail(res, 400, 'unsupported_grant_type', `grant_type tidak didukung: ${grant}`)
      }

      // ── Pengguna yang sedang login ──────────────────────────────────
      if (path === '/user' && method === 'GET') {
        const row = await currentUser(req)
        if (!row) return fail(res, 401, 'session_not_found', 'Sesi tidak ditemukan')
        return json(res, 200, toUser(row))
      }

      // ── updateUser: ganti password dan/atau metadata ────────────────
      if (path === '/user' && method === 'PUT') {
        const row = await currentUser(req)
        if (!row) return fail(res, 401, 'session_not_found', 'Sesi tidak ditemukan')
        const body = await readBody(req)

        const sets = []
        const values = []
        if (typeof body.password === 'string' && body.password) {
          values.push(hashPassword(body.password))
          sets.push(`encrypted_password = $${values.length}`)
        }
        if (body.data && typeof body.data === 'object') {
          // GoTrue menggabungkan metadata baru ke yang lama, tidak menimpanya.
          values.push(JSON.stringify({ ...(row.raw_user_meta_data ?? {}), ...body.data }))
          sets.push(`raw_user_meta_data = $${values.length}::jsonb`)
        }
        if (typeof body.email === 'string' && body.email && body.email !== row.email) {
          values.push(body.email)
          sets.push(`email = $${values.length}`)
        }

        if (!sets.length) return json(res, 200, toUser(row))

        values.push(row.id)
        const updated = await pool
          .query(
            `update auth.users set ${sets.join(', ')}, updated_at = now()
             where id = $${values.length} returning *`,
            values
          )
          .then((r) => r.rows[0])
        return json(res, 200, toUser(updated))
      }

      // ── Logout ──────────────────────────────────────────────────────
      if (path === '/logout' && method === 'POST') {
        res.writeHead(204).end()
        return
      }

      // ── Lupa password ───────────────────────────────────────────────
      if (path === '/recover' && method === 'POST') {
        const body = await readBody(req)
        const row = await findByEmail(body.email ?? '')
        if (!row) {
          // GoTrue tidak membocorkan apakah email terdaftar; balas sukses juga.
          return json(res, 200, {})
        }
        // Tidak ada email yang dikirim di dev. Tautan reset dicetak ke
        // terminal dev:db supaya alurnya tetap bisa diuji tanpa Resend.
        console.log(`\n  🔑 Reset password untuk ${row.email}:`)
        console.log(`     http://localhost:3000/login?reset=${row.id}\n`)
        return json(res, 200, {})
      }

      // ── verifyOtp ───────────────────────────────────────────────────
      if (path === '/verify' && method === 'POST') {
        const body = await readBody(req)
        const row = await findByEmail(body.email ?? '')
        if (!row) return fail(res, 403, 'user_not_found', 'Pengguna tidak ditemukan')
        // Token yang sah hanya yang dibuat /admin/generate_link di bawah.
        if (body.token !== magicTokenFor(row.email)) {
          return fail(res, 403, 'otp_expired', 'Token tidak sah atau kedaluwarsa')
        }
        const updated = await pool
          .query(
            `update auth.users set last_sign_in_at = now(), email_confirmed_at = coalesce(email_confirmed_at, now())
             where id = $1 returning *`,
            [row.id]
          )
          .then((r) => r.rows[0])
        return json(res, 200, sessionFor(updated))
      }

      // ── Google OAuth: tidak ada di dev ──────────────────────────────
      if (path === '/authorize') {
        return fail(
          res,
          400,
          'provider_disabled',
          'Google OAuth tidak tersedia di dev lokal. Pakai email + password.'
        )
      }

      // ── API admin (dipakai alur OTP lewat service role) ─────────────
      if (path === '/admin/users' && method === 'GET') {
        const page = Number(query.get('page') ?? 1) || 1
        const perPage = Number(query.get('per_page') ?? 50) || 50
        const { rows } = await pool.query(
          'select * from auth.users order by created_at desc limit $1 offset $2',
          [perPage, (page - 1) * perPage]
        )
        const { rows: total } = await pool.query('select count(*)::int as n from auth.users')
        return json(
          res,
          200,
          { users: rows.map(toUser), aud: 'authenticated' },
          { 'x-total-count': String(total[0].n) }
        )
      }

      if (path === '/admin/users' && method === 'POST') {
        const body = await readBody(req)
        const email = String(body.email ?? '').toLowerCase().trim()
        if (!email) return fail(res, 422, 'validation_failed', 'Email wajib diisi')
        if (await findByEmail(email)) {
          // Pesan ini yang dicocokkan app/api/auth/send-otp/route.ts:58
          return fail(
            res,
            422,
            'email_exists',
            'A user with this email address has already been registered'
          )
        }
        const row = await insertUser({
          email,
          password: body.password,
          emailConfirm: body.email_confirm === true,
          userMetadata: body.user_metadata,
        })
        return json(res, 200, toUser(row))
      }

      const adminUser = /^\/admin\/users\/([0-9a-f-]{36})$/.exec(path)
      if (adminUser) {
        const id = adminUser[1]
        const row = await findById(id)
        if (!row) return fail(res, 404, 'user_not_found', 'Pengguna tidak ditemukan')

        if (method === 'GET') return json(res, 200, toUser(row))

        if (method === 'PUT') {
          const body = await readBody(req)
          const sets = []
          const values = []
          if (body.email_confirm === true) sets.push('email_confirmed_at = coalesce(email_confirmed_at, now())')
          if (typeof body.password === 'string' && body.password) {
            values.push(hashPassword(body.password))
            sets.push(`encrypted_password = $${values.length}`)
          }
          if (body.user_metadata && typeof body.user_metadata === 'object') {
            values.push(JSON.stringify({ ...(row.raw_user_meta_data ?? {}), ...body.user_metadata }))
            sets.push(`raw_user_meta_data = $${values.length}::jsonb`)
          }
          if (!sets.length) return json(res, 200, toUser(row))
          values.push(id)
          const updated = await pool
            .query(
              `update auth.users set ${sets.join(', ')}, updated_at = now()
               where id = $${values.length} returning *`,
              values
            )
            .then((r) => r.rows[0])
          return json(res, 200, toUser(updated))
        }

        if (method === 'DELETE') {
          await pool.query('delete from auth.users where id = $1', [id])
          return json(res, 200, {})
        }
      }

      // ── Admin: buat magic link ──────────────────────────────────────
      if (path === '/admin/generate_link' && method === 'POST') {
        const body = await readBody(req)
        const email = String(body.email ?? '').toLowerCase().trim()
        const row = await findByEmail(email)
        if (!row) return fail(res, 404, 'user_not_found', 'Pengguna tidak ditemukan')

        const token = magicTokenFor(email)
        // _generateLinkResponse membaca field FLAT, bukan { properties: {...} }.
        return json(res, 200, {
          action_link: `http://localhost:3000/auth/callback?token=${token}&type=${body.type ?? 'magiclink'}`,
          email_otp: token.slice(0, 6),
          hashed_token: token,
          redirect_to: body.options?.redirectTo ?? null,
          verification_type: body.type ?? 'magiclink',
          ...toUser(row),
        })
      }

      return fail(res, 404, 'not_found', `Endpoint auth belum ada di shim dev: ${method} ${path}`)
    } catch (error) {
      console.error('auth shim error:', error)
      return fail(res, 500, 'unexpected_failure', error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * Token magic link. Diturunkan dari email, bukan disimpan di tabel: alur yang
 * memakainya (verify-otp passwordless) membuat token lalu langsung menukarnya
 * dalam satu request, jadi tidak ada yang perlu bertahan lama.
 */
function magicTokenFor(email) {
  return createHmac('sha256', JWT_SECRET).update(`magiclink:${String(email).toLowerCase()}`).digest('hex')
}
