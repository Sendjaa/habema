/**
 * Penanda perangkat terpercaya untuk login admin.
 *
 * Aturan yang ditegakkan di sini: OTP lewat email tetap diminta setiap kali
 * ada yang masuk dari perangkat yang belum dikenal, dan tidak diminta lagi di
 * perangkat yang sudah pernah menyelesaikannya dalam TRUST_TTL_DAYS. Password
 * selalu tetap wajib — cookie ini tidak pernah dipakai sebagai pengganti
 * kredensial, hanya sebagai pengganti langkah kedua.
 *
 * Cookie berisi token acak 32 byte; database hanya menyimpan sha256-nya
 * (lihat tabel admin_device_trust), jadi isi tabel tidak bisa dipakai login
 * dan satu perangkat bisa dicabut tanpa menyentuh yang lain.
 *
 * Semua fungsi gagal ke arah "minta OTP" (fail closed): kalau database tidak
 * terjangkau, perlakuan sama dengan perangkat baru.
 */

import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { and, eq, gt, lt } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { adminDeviceTrust } from '@/lib/db/schema'

const COOKIE_NAME = 'habema_admin_trust'
const TRUST_TTL_DAYS = 30

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function trustExpiry(): Date {
  const date = new Date()
  date.setDate(date.getDate() + TRUST_TTL_DAYS)
  return date
}

// Path dibatasi ke /api/auth: cookie ini hanya boleh diketahui rute login,
// tidak ikut terkirim ke /api/admin/* atau /api/orders.
// Options-nya dipakai lagi saat menghapus — menghapus tanpa path yang sama
// meninggalkan cookie di browser (Next memakai '/' sebagai default), dan
// meskipun server tetap menolak cookie itu, peninggalan itu membingungkan.
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
  maxAge: TRUST_TTL_DAYS * 24 * 60 * 60,
}

async function rememberTokenOnBrowser(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

async function forgetTokenOnBrowser(): Promise<void> {
  const store = await cookies()
  store.delete({ name: COOKIE_NAME, path: COOKIE_OPTIONS.path, sameSite: COOKIE_OPTIONS.sameSite })
}

export async function issueAdminDeviceTrust(userId: string, email: string): Promise<void> {
  const token = randomBytes(32).toString('base64url')

  try {
    const db = getDb()
    // Baris kedaluwarsa dibersihkan saat menulis yang baru; tanpa ini tabel
    // tumbuh terus karena tiap login OTP menambah satu baris.
    await db.delete(adminDeviceTrust).where(lt(adminDeviceTrust.expiresAt, new Date()))
    await db.insert(adminDeviceTrust).values({
      userId,
      email: email.toLowerCase(),
      tokenHash: hashToken(token),
      expiresAt: trustExpiry(),
    })
    await rememberTokenOnBrowser(token)
  } catch (error) {
    console.error('[admin-trust] gagal mencatat perangkat:', error instanceof Error ? error.message : error)
  }
}

export async function hasAdminDeviceTrust(userId: string, email: string): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return false

  try {
    const db = getDb()
    const [row] = await db
      .select({ id: adminDeviceTrust.id })
      .from(adminDeviceTrust)
      .where(
        and(
          eq(adminDeviceTrust.tokenHash, hashToken(token)),
          eq(adminDeviceTrust.userId, userId),
          eq(adminDeviceTrust.email, email.toLowerCase()),
          gt(adminDeviceTrust.expiresAt, new Date()),
        ),
      )
      .limit(1)

    if (!row) {
      await forgetTokenOnBrowser()
      return false
    }

    await db
      .update(adminDeviceTrust)
      .set({ lastUsedAt: new Date() })
      .where(eq(adminDeviceTrust.id, row.id))

    return true
  } catch (error) {
    console.error('[admin-trust] gagal membaca kepercayaan perangkat:', error instanceof Error ? error.message : error)
    return false
  }
}

export async function revokeAdminDeviceTrust(): Promise<void> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  await forgetTokenOnBrowser()
  if (!token) return

  try {
    const db = getDb()
    await db.delete(adminDeviceTrust).where(eq(adminDeviceTrust.tokenHash, hashToken(token)))
  } catch (error) {
    console.error('[admin-trust] gagal mencabut perangkat:', error instanceof Error ? error.message : error)
  }
}
