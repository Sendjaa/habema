import { NextResponse } from 'next/server'
import { verifyTurnstile } from '@/lib/turnstile'
import { generateOTP, storeOTP, invalidatePreviousOTPs } from '@/lib/otp'
import { deliverOtpEmail } from '@/lib/otp-delivery'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'
import {
  GENERIC_LOGIN_ERROR,
  isPasswordTooLong,
  isPasswordTooShort,
  isValidEmail,
} from '@/lib/auth-validation'

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

  // Validasi email — selalu pesan generik untuk mencegah enumeration.
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
  }

  // Cloudflare tidak menyelesaikan challenge di localhost, jadi di dev
  // pembayaran pagar ini dilewati — sisanya tetap berjalan sama.
  if (!DEV_LOCAL_AUTH && !(await verifyTurnstile(turnstileToken))) {
    return NextResponse.json({ error: 'Verifikasi keamanan belum selesai. Silakan coba lagi.' }, { status: 400 })
  }

  // Validasi panjang password (boleh kosong untuk akun tanpa password).
  if (isPasswordTooShort(password) || isPasswordTooLong(password)) {
    return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
  }

  try {
    // Password selalu cek terlebih dahulu: kalau ada dan cocok, baru lanjut ke OTP.
    // Tanpa password dan tidak ada device trust, langsung ke OTP.
    if (password) {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

      if (error || !data?.user) {
        return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
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
        return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
      }
    }

    // MFA/2FA ketat: perangkat terpercaya tidak dibypass — OTP email selalu
    // diminta sebagai lapis kedua, untuk setiap login dari perangkat baru.
    await invalidatePreviousOTPs(email, 'login')
    const otp = generateOTP()
    await storeOTP(email, otp, 'login')

    const delivery = await deliverOtpEmail(email, otp, 'login')
    if (!delivery.delivered && !delivery.devOtp) {
      return NextResponse.json(
        { error: 'Gagal mengirim kode OTP ke email. Coba lagi beberapa saat lagi.' },
        { status: 502 },
      )
    }

    // Di dev kodenya tidak lewat email, dan terminal dev server belum tentu
    // terlihat oleh yang menguji — jadi kodenya ikut dikembalikan.
    const devOtp = delivery.devOtp ?? (DEV_LOCAL_AUTH ? otp : undefined)
    return NextResponse.json({
      otpRequired: true,
      ...(devOtp ? { devOtp } : {}),
    })
  } catch (error) {
    console.error('[auth/admin-login] POST gagal:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
