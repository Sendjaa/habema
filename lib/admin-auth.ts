import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Penjaga semua route /api/admin.
 *
 * Route admin memakai service-role, yang melewati RLS sepenuhnya. Tanpa
 * pemeriksaan di sini, siapa pun yang tahu URL-nya bisa membaca/mengubah/
 * menghapus booking, order, produk, dan pengguna. Karena itu setiap handler
 * memanggil requireAdmin() sebelum menyentuh database.
 *
 * Dua syarat, keduanya diperiksa di server:
 *   1. Ada sesi Supabase yang sah di cookie (dibaca lewat @supabase/ssr,
 *      sumber yang sama dengan yang ditulis halaman login admin).
 *   2. Profil pengguna itu punya is_vendor = true — peran admin, bukan hanya
 *      "punya akun". Dibaca lewat service-role karena RLS di tabel users tidak
 *      mengizinkan klien biasa membaca kolom ini.
 *
 * Semua jalur gagal menutup (fail closed): error jaringan, tabel tidak
 * terjangkau, atau profil tidak ditemukan berarti 401/500, bukan lolos.
 */

export type AdminSession = {
  userId: string
  email: string | null
}

export type AdminGuardResult =
  | { ok: true; admin: AdminSession }
  | { ok: false; response: NextResponse }

export async function requireAdmin(): Promise<AdminGuardResult> {
  let userId: string
  let email: string | null = null

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Sesi admin tidak ditemukan. Silakan masuk ulang.' },
          { status: 401 },
        ),
      }
    }

    userId = data.user.id
    email = data.user.email ?? null
  } catch (error) {
    console.error(
      '[admin-auth] gagal membaca sesi:',
      error instanceof Error ? error.message : error,
    )
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Gagal memverifikasi sesi admin' },
        { status: 401 },
      ),
    }
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('is_vendor')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('[admin-auth] gagal membaca profil:', profileError.message)
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Gagal memverifikasi akses admin' },
          { status: 500 },
        ),
      }
    }

    if (!profile?.is_vendor) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Akses ditolak. Hanya admin yang bisa membuka data ini.' },
          { status: 403 },
        ),
      }
    }
  } catch (error) {
    console.error(
      '[admin-auth] gagal memeriksa peran:',
      error instanceof Error ? error.message : error,
    )
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Gagal memverifikasi akses admin' },
        { status: 500 },
      ),
    }
  }

  return { ok: true, admin: { userId, email } }
}
