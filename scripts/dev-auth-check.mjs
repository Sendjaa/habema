/**
 * Uji asap untuk shim GoTrue dev (scripts/dev-auth.mjs).
 *
 * Bukan test suite — satu berkas, tanpa framework, tanpa fixture. Tujuannya
 * menjawab satu pertanyaan: "apakah supabase-js masih mengenali balasan shim
 * ini?" Kalau bentuk respons melenceng, uji ini gagal di langkah yang tepat,
 * bukan menunggu sampai halaman login diam-diam tidak jalan.
 *
 * Jalankan sambil `npm run dev:db` menyala:
 *     node scripts/dev-auth-check.mjs
 *
 * Memakai satu akun uji (email berpola dev-check-<acak>@habema.test) dan
 * membiarkannya di database lokal. Hapus lewat pgAdmin kalau mengganggu.
 */

import assert from 'node:assert/strict'

const BASE = process.env.DEV_AUTH_BASE ?? 'http://127.0.0.1:54321/auth/v1'
const email = `dev-check-${Date.now()}@habema.test`
const password = 'rahasia123'

let step = ''

async function call(method, path, { body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      apikey: 'dev-anon-key',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // Biarkan null — assert di bawah yang akan melaporkan.
  }
  return { status: res.status, body: json, raw: text }
}

try {
  step = 'admin createUser'
  const created = await call('POST', '/admin/users', {
    body: { email, password, email_confirm: true, user_metadata: { full_name: 'Dev Check' } },
  })
  assert.equal(created.status, 200, `createUser HTTP ${created.status}: ${created.raw}`)
  assert.ok(created.body?.id, 'createUser tidak mengembalikan id')
  assert.equal(created.body.email, email)

  const userId = created.body.id

  step = 'admin createUser duplikat harus 422'
  const dup = await call('POST', '/admin/users', { body: { email, password } })
  assert.equal(dup.status, 422, `duplikat HTTP ${dup.status}`)
  // String ini yang dicocokkan app/api/auth/send-otp/route.ts:58.
  assert.match(dup.body?.msg ?? '', /already been registered/)

  step = 'signInWithPassword'
  const login = await call('POST', '/token?grant_type=password', { body: { email, password } })
  assert.equal(login.status, 200, `login HTTP ${login.status}: ${login.raw}`)
  assert.ok(login.body?.access_token, 'balasan token tidak punya access_token')
  assert.ok(login.body?.refresh_token, 'balasan token tidak punya refresh_token')
  assert.equal(login.body?.user?.id, userId)
  const accessToken = login.body.access_token

  step = 'password salah harus ditolak'
  const bad = await call('POST', '/token?grant_type=password', {
    body: { email, password: 'salah-sekali' },
  })
  assert.equal(bad.status, 400, `password salah HTTP ${bad.status}`)

  step = 'getUser'
  const me = await call('GET', '/user', { token: accessToken })
  assert.equal(me.status, 200, `getUser HTTP ${me.status}: ${me.raw}`)
  assert.equal(me.body?.id, userId)

  step = 'updateUser (metadata)'
  const updated = await call('PUT', '/user', {
    token: accessToken,
    body: { data: { full_name: 'Nama Baru' } },
  })
  assert.equal(updated.status, 200, `updateUser HTTP ${updated.status}: ${updated.raw}`)
  assert.equal(updated.body?.user_metadata?.full_name, 'Nama Baru')

  step = 'admin listUsers'
  const list = await call('GET', '/admin/users?page=1&per_page=1000')
  assert.equal(list.status, 200, `listUsers HTTP ${list.status}`)
  assert.ok(Array.isArray(list.body?.users), 'listUsers tidak mengembalikan array users')
  assert.ok(
    list.body.users.some((u) => u.id === userId),
    'pengguna baru tidak muncul di listUsers'
  )

  step = 'admin generate_link'
  const link = await call('POST', '/admin/generate_link', { body: { type: 'magiclink', email } })
  assert.equal(link.status, 200, `generateLink HTTP ${link.status}`)
  // _generateLinkResponse membaca field flat, jadi hashed_token harus di akar.
  assert.ok(link.body?.hashed_token, 'hashed_token tidak ada di akar balasan')
  assert.ok(link.body?.properties === undefined, 'balasan generate_link seharusnya tidak nested')

  step = 'verifyOtp magiclink'
  const verified = await call('POST', '/verify', {
    body: { email, token: link.body.hashed_token, type: 'magiclink' },
  })
  assert.equal(verified.status, 200, `verify HTTP ${verified.status}: ${verified.raw}`)
  assert.ok(verified.body?.access_token, 'verify tidak mengembalikan sesi')

  step = 'token verify bisa dipakai getUser'
  const afterVerify = await call('GET', '/user', { token: verified.body.access_token })
  assert.equal(afterVerify.status, 200, `getUser pasca-verify HTTP ${afterVerify.status}`)

  step = 'token sampah harus 401'
  const junk = await call('GET', '/user', { token: 'bukan.token.sah' })
  assert.equal(junk.status, 401, `token sampah HTTP ${junk.status}`)

  step = 'logout'
  const out = await call('POST', '/logout', { token: accessToken })
  assert.equal(out.status, 204, `logout HTTP ${out.status}`)

  console.log(`\n  ✅ Shim auth lolos semua langkah. Akun uji: ${email}\n`)
} catch (error) {
  console.error(`\n  ⛔ Gagal di langkah "${step}"`)
  console.error(`     ${error.message}\n`)
  process.exit(1)
}
