import { invalidatePreviousOTPs } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/otp-email'

/**
 * Kirim OTP lewat email, dengan dua perilaku saat pengiriman gagal:
 *
 * - Development: kode ditulis ke terminal dan dikembalikan ke pemanggil
 *   sebagai devOtp. Kredensial Resend yang salah tidak boleh membuat login
 *   lokal mustahil dicoba — jalur OTP di dev memang sudah menampilkan kode
 *   (lihat DEV_LOCAL_AUTH), ini hanya jaring pengaman ketika env menunjuk
 *   Supabase production sehingga DEV_LOCAL_AUTH tidak aktif.
 * - Selain development: OTP yang sudah tersimpan dibatalkan supaya tidak ada
 *   kode menggantung yang tidak pernah sampai ke email, lalu pemanggil
 *   mengembalikan error yang bisa ditindaklanjuti.
 */
export interface OtpDeliveryResult {
  delivered: boolean
  devOtp?: string
}

export async function deliverOtpEmail(
  email: string,
  otp: string,
  type: 'register' | 'login',
): Promise<OtpDeliveryResult> {
  try {
    await sendOtpEmail(email, otp, type)
    return { delivered: true }
  } catch (error) {
    console.error(
      `[otp] gagal mengirim email ${type} ke ${email}:`,
      error instanceof Error ? error.message : error,
    )

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `\n  [dev] email OTP gagal terkirim. Kode ${type} untuk ${email}: ${otp}\n`,
      )
      return { delivered: false, devOtp: otp }
    }

    await invalidatePreviousOTPs(email, type).catch(() => {})
    return { delivered: false }
  }
}
