'use client'

import { useState, Suspense, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const isRecovery = type === 'recovery' && Boolean(code || tokenHash)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isRecovery && typeof window !== 'undefined') {
      const stored = localStorage.getItem('habema-reset-email')
      if (stored) setEmail(stored)
    }
  }, [isRecovery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!isRecovery) {
      setMessage({
        type: 'error',
        text: 'Link reset tidak valid atau sudah kedaluwarsa. Minta link baru dari halaman masuk.',
      })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter.' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password dan konfirmasi tidak cocok.' })
      return
    }

    if (!supabase) {
      setMessage({
        type: 'error',
        text: 'Client Supabase tidak tersedia. Periksa konfigurasi environment.',
      })
      return
    }

    setLoading(true)
    try {
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
        if (error) throw error
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          if (!email.trim()) {
            throw new Error('Masukkan email akun mu untuk memverifikasi link reset.')
          }
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token: code,
            email: email.trim(),
          })
          if (otpError) throw otpError
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      if (typeof window !== 'undefined') {
        localStorage.removeItem('habema-reset-email')
      }

      setMessage({
        type: 'success',
        text: 'Password berhasil diperbarui. Mengarahkan ke halaman masuk.',
      })

      setTimeout(() => router.replace('/login'), 1500)
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Gagal mereset password. Minta link baru dari halaman masuk.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md bg-white border border-[#D3D1C7] rounded-2xl shadow-lg shadow-stone-300/30 px-8 py-9">
        <div className="flex items-center gap-2 mb-7">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
          <span
            className="text-lg text-stone-900 tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            habema
          </span>
        </div>

        <h1 className="text-2xl text-stone-900 mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
          Reset Password
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          Buat password baru untuk akun mu. Setelah tersimpan, kamu bisa masuk dengan password tersebut.
        </p>

        {!isRecovery && (
          <div
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            role="alert"
          >
            Link reset ini tidak valid atau sudah kedaluwarsa. Silakan minta link baru dari halaman masuk.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-xs font-medium text-stone-600 mb-1.5">
              Email akun
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition-all"
            />
          </div>

          <div>
            <label htmlFor="reset-password" className="block text-xs font-medium text-stone-600 mb-1.5">
              Password baru
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 pr-20 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2.5 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-xs font-medium text-stone-600 mb-1.5">
              Konfirmasi password baru
            </label>
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isRecovery}
            className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm transition-colors"
            style={{ fontFamily: "'Fraunces', serif", fontSize: '15px' }}
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>

        <div aria-live="polite">
          {message && (
            <div
              role={message.type === 'error' ? 'alert' : 'status'}
              className={`mt-5 rounded-xl px-4 py-3 text-sm border ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <p className="text-sm text-stone-400 text-center mt-6">
          Sudah ingat password mu?{' '}
          <a href="/login" className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
            Kembali ke halaman masuk
          </a>
        </p>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
          <span className="text-stone-600">Memuat...</span>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
