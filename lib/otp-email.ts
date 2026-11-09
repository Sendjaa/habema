/**
 * Kirim email OTP lewat Resend.
 *
 * Dulu template-nya hidup di dalam app/api/auth/send-otp/route.ts. Sekarang
 * ada dua pemanggil: rute itu (pendaftaran + login berisiko) dan
 * app/api/auth/login/route.ts (login yang butuh langkah tambahan). Menyalin
 * HTML-nya dua kali berarti satu perubahan tampilan bisa bikin kode di email
 * berbeda dari yang disimpan di database.
 *
 * Gagal kirim = melempar Error dengan pesan yang sudah menjelaskan
 * penyebabnya, supaya rute tinggal membiarkannya jatuh ke handler error.
 */

import { getResend } from '@/lib/resend'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: 'register' | 'login',
): Promise<void> {
  // Dev lokal: kode ditulis ke terminal, bukan dikirim. Resend tidak boleh
  // dipakai dari mesin pengembang, dan tanpa ini seluruh jalur OTP — termasuk
  // perangkat terpercaya admin — tidak bisa dicoba sama sekali.
  if (DEV_LOCAL_AUTH) {
    console.log(`\n  [dev] OTP ${type} untuk ${email}: ${otp}\n`)
    return
  }

  try {
    const resendClient = getResend()
    const { error } = await resendClient.emails.send({
      from: process.env.OTP_EMAIL_FROM || 'Habema <noreply@habema.com>',
      to: email,
      subject: type === 'register' ? 'Kode Verifikasi Email - Habema' : 'Kode Login - Habema',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #065f46;">Habema</h2>
          <p>${type === 'register' ? 'Terima kasih sudah mendaftar!' : 'Permintaan login diterima.'}</p>
          <p>Gunakan kode OTP berikut untuk melanjutkan:</p>
          <div style="background: #f5f5f4; padding: 16px; border-radius: 12px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #065f46; margin: 16px 0;">
            ${otp}
          </div>
          <p style="color: #78716c; font-size: 14px;">Kode berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>
          <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;">
          <p style="color: #a8a29e; font-size: 12px;">Jika kamu tidak meminta kode ini, abaikan email ini.</p>
        </div>
      `,
    })

    if (error) {
      const message = typeof error === 'object' && error !== null
        ? (error as any).message || JSON.stringify(error)
        : String(error)
      throw new Error(`Gagal mengirim email: ${message}. Pastikan domain sudah diverifikasi di Resend Dashboard.`)
    }
  } catch (error: any) {
    if (error instanceof Error && error.message.startsWith('Gagal mengirim email')) throw error
    throw new Error(`${error?.message || 'Gagal mengirim email OTP'}. Cek Resend Dashboard untuk verifikasi domain.`)
  }
}
