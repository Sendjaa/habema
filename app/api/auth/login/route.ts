import { NextResponse } from 'next/server'
import { verifyTurnstileDetailed } from '@/lib/turnstile'
import { generateOTP, storeOTP, invalidatePreviousOTPs } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/otp-email'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'

/**
 * Login pelanggan.
 *
 * Password + Turnstile yang lolos sudah cukup — OTP tidak diminta lagi di
 * setiap masuk. OTP tetap dipakai sebagai langkah tambahan kalau Cloudflare
 * menilai permintaannya berisiko (widget harus dikonfigurasi dengan
 * refreshRisk; tanpa itu field risk tidak dikirim dan dianggap normal).
 *
 * Keputusannya ada di satu rute ini, bukan di client, dan bukan di
 * /api/auth/send-otp: kalau dua rute menilai token yang sama dua kali,
 * token yang sudah dipakai tidak bisa dipakai lagi dan pengguna terjebak
 * meminta kode yang tidak pernah datang.
 *
 * Sesi tidak dikembalikan dari sini — client login sendiri lewat supabase-js
 * supaya cookie sesi ditulis jalur yang sama dengan seluruh aplikasi.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
  }

  // Pagar murah dulu: percobaan password tebak-tebak berhenti sebelum
  // menyentuh auth, dan tidak ada email yang dikirim untuk akun sembarang.
  // Di dev lokal tidak ada challenge yang bisa diselesaikan, jadi pagarnya
  // tidak berlaku — sama seperti /api/auth/send-otp.
  const verdict = DEV_LOCAL_AUTH
    ? { ok: true, risk: 'not assessed' as const, action: '' }
    : await verifyTurnstileDetailed(turnstileToken)

  if (!verdict.ok) {
    return NextResponse.json({ error: 'Verifikasi keamanan belum selesai. Silakan coba lagi.' }, { status: 400 })
  }

  try {
    const { error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Password sudah benar; risiko tinggi masih butuh bukti kepemilikan email.
    if (verdict.risk === 'high') {
      await invalidatePreviousOTPs(email, 'login')
      const otp = generateOTP()
      await storeOTP(email, otp, 'login')
      await sendOtpEmail(email, otp, 'login')

      return NextResponse.json({ otpRequired: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[auth/login] POST gagal:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
