/**
 * Verifikasi token Cloudflare Turnstile.
 *
 * Dipakai dua jalur dengan kebutuhan berbeda:
 *   - verifyTurnstile()        → cukup "lolos / tidak" (pendaftaran, kirim OTP)
 *   - verifyTurnstileDetailed() → juga skor risiko, untuk login yang ingin
 *     memakai OTP hanya sebagai langkah tambahan saat risikonya tinggi.
 *
 * Field `risk` hanya dikirim Cloudflare kalau widget-nya dikonfigurasi dengan
 * refreshRisk. Kalau tidak ada, anggap 'normal' — login normal tanpa OTP,
 * bukan login yang gagal.
 */

export type TurnstileRisk = 'not assessed' | 'normal' | 'low' | 'medium' | 'high'

export interface TurnstileVerdict {
  ok: boolean
  risk: TurnstileRisk
  action: string
}

const FAILED: TurnstileVerdict = { ok: false, risk: 'not assessed', action: '' }

export async function verifyTurnstileDetailed(token: string): Promise<TurnstileVerdict> {
  if (!token) return FAILED

  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not configured')
    return FAILED
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (data.success !== true) return FAILED

    const risk = ['normal', 'low', 'medium', 'high'].includes(data.risk)
      ? (data.risk as TurnstileRisk)
      : 'not assessed'

    return { ok: true, risk, action: typeof data.action === 'string' ? data.action : '' }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return FAILED
  }
}

export async function verifyTurnstile(token: string): Promise<boolean> {
  return (await verifyTurnstileDetailed(token)).ok
}
