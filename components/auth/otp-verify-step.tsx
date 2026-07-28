'use client'

import { useState, useEffect, useCallback } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

interface OtpVerifyStepProps {
  email: string
  type: 'register' | 'login'
  onVerify: (otp: string) => Promise<void>
  onResend: () => Promise<void>
  onBack: () => void
  loading: boolean
  error?: string | null
}

export default function OtpVerifyStep({
  email,
  type,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
}: OtpVerifyStepProps) {
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
    a + '*'.repeat(Math.min(b.length, 6)) + c
  )

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      await onResend()
      setResendCooldown(30)
      setOtp('')
    } finally {
      setResending(false)
    }
  }, [onResend, resendCooldown, resending])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6 || loading) return
    await onVerify(otp)
  }

  const handleOtpChange = (value: string) => {
    setOtp(value)
  }

  useEffect(() => {
    if (otp.length === 6 && !loading) {
      onVerify(otp)
    }
  }, [otp])

  return (
    <div>
      <div className="flex items-center gap-2 mb-7">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
        <span
          className="text-lg text-stone-900 tracking-tight"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          habema
        </span>
      </div>

      <h1
        className="text-[28px] font-semibold text-stone-900 leading-tight mb-2 tracking-tight"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Verifikasi OTP
      </h1>
      <p className="text-sm text-stone-400 leading-relaxed mb-6">
        {type === 'register'
          ? 'Kode verifikasi telah dikirim ke emailmu.'
          : 'Kode login telah dikirim ke emailmu.'}
      </p>

      <p className="text-sm text-stone-500 mb-4">
        Email: <span className="font-medium text-stone-700">{maskedEmail}</span>
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            disabled={loading}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="w-10 h-12 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <button
          type="submit"
          disabled={otp.length !== 6 || loading}
          className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm transition-colors"
          style={{ fontFamily: "'Fraunces', serif", fontSize: '15px' }}
        >
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium disabled:text-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            {resending
              ? 'Mengirim ulang...'
              : resendCooldown > 0
              ? `Kirim ulang (${resendCooldown}s)`
              : 'Kirim ulang kode'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Kembali
          </button>
        </div>
      </form>
    </div>
  )
}