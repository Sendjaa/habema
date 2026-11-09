import { NextResponse } from 'next/server'
import { verifyTurnstile } from '@/lib/turnstile'
import { generateOTP, storeOTP, invalidatePreviousOTPs } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/otp-email'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hasAdminDeviceTrust } from '@/lib/admin-trust'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'

/**
 * Login admin — satu rute untuk semua keputusan, supaya token Turnstile hanya
 * dipakai satu kali. Kalau keputusan "perlu OTP" diambil di sini tapi
 * pengirimannya dilakukan /api/auth/send-otp, rute itu akan mencoba
 * memverifikasi token yang sama untuk kedua kalinya dan Cloudflare akan
 * menolaknya.
 *
 * Langkah:
 *   1. Turnstile harus lolos — pagar sebelum ada email yang dikirim.
 *   2. Password dicek dan akun harus is_vendor. Cek vendor sebelumnya hanya
 *      ada di komponen, jadi siapa pun yang tahu endpoint bisa meminta OTP
 *      atas nama akun biasa.
 *   3. Perangkat yang pernah menyelesaikan OTP (cookie habema_admin_trust,
 *      30 hari) masuk dengan password saja; selain itu kode dikirim ke email.
 *
 * Password boleh kosong: akun admin yang dibuat lewat Supabase Invite tidak
 * punya password, dan untuk mereka OTP adalah satu-satunya bukti identitas —
 * jadi tidak pernah ada jalur "perangkat terpercaya" tanpa password.
 *
 * OTP tetap diminta untuk setiap perangkat baru: bagi admin, kode itu
 * satu-satunya lapis kedua yang aplikasi ini punya.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''

  if (!email) {
    return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
  }

  // Cloudflare tidak menyelesaikan challenge di localhost, jadi di dev
  // pembayaran pagar ini dilewati — sisanya tetap berjalan sama.
  if (!DEV_LOCAL_AUTH && !(await verifyTurnstile(turnstileToken))) {
    return NextResponse.json({ error: 'Verifikasi keamanan belum selesai. Silakan coba lagi.' }, { status: 400 })
  }

  try {
    if (password) {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

      if (error || !data?.user) {
        return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('is_vendor')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[auth/admin-login] gagal membaca profil:', profileError.message)
        return NextResponse.json({ error: 'Gagal verifikasi akses admin' }, { status: 500 })
      }

      if (!profile?.is_vendor) {
        return NextResponse.json({ error: 'Akses ditolak. Hanya admin yang bisa masuk.' }, { status: 403 })
      }

      if (await hasAdminDeviceTrust(data.user.id, email)) {
        return NextResponse.json({
          success: true,
          session: {
            access_token: data.session!.access_token,
            refresh_token: data.session!.refresh_token,
            expires_in: data.session!.expires_in,
          },
        })
      }
    }

    await invalidatePreviousOTPs(email, 'login')
    const otp = generateOTP()
    await storeOTP(email, otp, 'login')
    await sendOtpEmail(email, otp, 'login')

    // Di dev kodenya tidak lewat email, dan terminal dev server belum tentu
    // terlihat oleh yang menguji — jadi kodenya ikut dikembalikan.
    return NextResponse.json({
      otpRequired: true,
      ...(DEV_LOCAL_AUTH ? { devOtp: otp } : {}),
    })
  } catch (error) {
    console.error('[auth/admin-login] POST gagal:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
