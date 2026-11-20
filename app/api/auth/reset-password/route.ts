import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { resend } from '@/lib/resend'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'
import { GENERIC_LOGIN_ERROR, isValidEmail } from '@/lib/auth-validation'

const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
    }

    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ success: true })
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (error || !data?.properties?.hashed_token) {
      console.error('[reset-password] generateLink error:', error?.message ?? 'hashed_token kosong')
      return NextResponse.json({ success: true })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`

    if (DEV_LOCAL_AUTH) {
      console.log('\n  [dev] link reset password untuk ' + email + ': ' + resetUrl + '\n')
      return NextResponse.json({ success: true })
    }

    try {
      if (!resend) {
        console.warn('[reset-password] RESEND_API_KEY not configured')
        return NextResponse.json({ success: true })
      }

      const { error: sendError } = await resend.emails.send({
        from: process.env.OTP_EMAIL_FROM || 'Habema <noreply@habema.biz.id>',
        to: email,
        subject: 'Reset Password - Habema',
        html: '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;"><h2 style="color: #065f46;">Habema</h2><p>Permintaan reset password diterima.</p><p>Klik tombol di bawah untuk mengatur password baru:</p><p style="margin: 24px 0;"><a href="' + resetUrl + '" style="background: #065f46; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Atur Password Baru</a></p><p style="color: #78716c; font-size: 14px;">Link ini berlaku selama 60 menit. Jangan bagikan link ini kepada siapa pun.</p><hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;"><p style="color: #a8a29e; font-size: 12px;">Jika Anda tidak meminta reset password, abaikan email ini.</p></div>',
      })

      if (sendError) {
        console.error('[reset-password] Resend gagal:', sendError)
      }
    } catch (sendEx) {
      console.error('[reset-password] kirim email gagal:', sendEx)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[reset-password] error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}