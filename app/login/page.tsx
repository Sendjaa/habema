'use client'
import { useState, Suspense, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';
import OtpVerifyStep from '@/components/auth/otp-verify-step';
export const dynamic = "force-dynamic"

type Mode = 'login' | 'register' | 'forgot' | 'reset'

const COPY = {
  login: {
    title: 'Dapatkan Harga Spesial!',
    sub: 'Nikmati diskon 10-50% untuk pendaftar baru. Masuk dan hemat setiap petualanganmu.',
    cta: 'Masuk',
    switch: { text: 'Belum punya akun?', label: 'Daftar sekarang', mode: 'register' as Mode },
  },
  register: {
    title: 'Klaim Diskon 10-50%',
    sub: 'Daftar sekarang dan nikmati penawaran spesial untuk penyewaan perlengkapan pertamamu.',
    cta: 'Buat Akun',
    switch: { text: 'Sudah punya akun?', label: 'Masuk di sini', mode: 'login' as Mode },
  },
  forgot: {
    title: 'Lupa Password?',
    sub: 'Tenang, kami kirim link reset ke emailmu. Jangan khawatir, diskon 10-50% tetap bisa kamu klaim setelah masuk.',
    cta: 'Kirim Link Reset',
    switch: { text: 'Ingat passwordmu?', label: 'Kembali ke login', mode: 'login' as Mode },
  },
  reset: {
    title: 'Reset Password',
    sub: 'Buat password baru yang kuat untuk akun mu.',
    cta: 'Simpan Password Baru',
    switch: { text: '', label: '', mode: 'login' as Mode },
  },
}

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  
  // FIX: Check untuk type=recovery (password reset), bukan hanya code
  // Supabase password reset mengirim: ?code=TOKEN&type=recovery
  // Google OAuth hanya mengirim code tanpa type=recovery
  const resetToken = searchParams.get('code')
  const typeParam = searchParams.get('type')
  const isPasswordReset = typeParam === 'recovery'
  const initialMode: Mode = isPasswordReset && resetToken ? 'reset' : 'login'
  
  // Clean up URL after successful OAuth login
  // Hapus code parameter jika bukan password reset
  useEffect(() => {
    if (resetToken && !isPasswordReset) {
      // This is an OAuth code, not a password reset code
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [resetToken, isPasswordReset])
  
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // ── OTP & Turnstile state ──
  const [turnstileToken, setTurnstileToken] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [otpType, setOtpType] = useState<'register' | 'login'>('login')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  
  const copy = COPY[mode]

  const clearMessage = () => setMessage(null)

  // ─────────────────────────────────────────
  // Turnstile + OTP Auth
  // ─────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessage()

    if (mode === 'register' && !firstName.trim()) {
      setMessage({ type: 'error', text: 'Nama depan wajib diisi!' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter!' })
      return
    }

    if (!turnstileToken) {
      setMessage({ type: 'error', text: 'Harap selesaikan verifikasi keamanan (Turnstile)!' })
      return
    }

    setLoading(true)
    try {
      const type = mode === 'register' ? 'register' : 'login'
      const body: Record<string, string> = {
        email: email.trim(),
        password,
        turnstileToken,
        type,
      }
      if (mode === 'register') {
        body.firstName = firstName.trim()
        body.lastName = lastName.trim()
      }

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim kode OTP')
      }

      setOtpType(type)
      setOtpStep(true)
      setOtpError(null)
      setTurnstileToken('')
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = useCallback(async (otp: string) => {
    setOtpLoading(true)
    setOtpError(null)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp, type: otpType, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Kode OTP salah')
      }

      // OTP verified - now sign in on the client to establish the session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      router.replace(redirectTo)
    } catch (err: any) {
      setOtpError(err.message || 'Verifikasi gagal')
    } finally {
      setOtpLoading(false)
    }
  }, [email, otpType, password, router, redirectTo])

  const handleResendOtp = useCallback(async () => {
    setOtpError(null)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          turnstileToken: '',
          type: otpType,
          ...(otpType === 'register' ? { firstName: firstName.trim(), lastName: lastName.trim() } : {}),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim ulang OTP')
      }
    } catch (err: any) {
      setOtpError(err.message || 'Gagal mengirim ulang')
    }
  }, [email, password, otpType, firstName, lastName])

  const handleOtpBack = () => {
    setOtpStep(false)
    setOtpError(null)
  }

  // ─────────────────────────────────────────
  // Google OAuth
  // ─────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true)
    clearMessage()
    
    try {
      console.log('Starting Google OAuth...')
      console.log('Redirect to:', `${typeof window !== 'undefined' ? window.location.origin : ''}/`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect ke auth callback untuk proses PKCE code exchange
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
          queryParams: {
            prompt: 'consent',
            access_type: 'online',
          },
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        setMessage({ 
          type: 'error', 
          text: `Google login error: ${error.message}` 
        })
        setGoogleLoading(false)
        return
      }

      console.log('OAuth initiated successfully, redirecting...')
    } catch (err: any) {
      console.error('Google login exception:', err)
      setMessage({ 
        type: 'error', 
        text: err.message || 'Gagal login dengan Google' 
      })
      setGoogleLoading(false)
    }
  }

  // ─────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessage()

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Masukkan email mu!' })
      return
    }

    setLoading(true)
    try {
      // Supabase akan mengirim: ?code=TOKEN&type=recovery
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth`,
        }
      )
      
      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Link reset password telah dikirim ke email mu. Cek folder spam jika tidak ditemukan.' 
      })
      setEmail('')
      
      setTimeout(() => setMode('login'), 3000)
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Gagal mengirim link reset' 
      })
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────
  // Reset Password
  // ─────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessage()

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter!' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password tidak cocok!' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Password berhasil direset! Silakan login dengan password baru.' 
      })
      
      setPassword('')
      setConfirmPassword('')
      
      setTimeout(() => {
        setMode('login')
        router.replace('/auth')
      }, 2000)
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Gagal reset password' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-[#F1EFE8] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-[#D3D1C7] shadow-2xl shadow-stone-300/40">
        {/* ── LEFT PANEL ── */}
        <div className="bg-white px-10 py-9 flex flex-col justify-between">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-2 mb-7">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span
                className="text-lg text-stone-900 tracking-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                habema
              </span>
            </div>

            {/* Tab toggle */}
            {(mode === 'login' || mode === 'register') && (
              <div className="flex gap-0.5 bg-stone-100 rounded-xl p-1 mb-6">
                {(['login', 'register'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m)
                      clearMessage()
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      mode === m
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {m === 'login' ? 'Masuk' : 'Daftar'}
                  </button>
                ))}
              </div>
            )}

            {/* Heading */}
            <h1
              className="text-[28px] font-semibold text-stone-900 leading-tight mb-2 tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {copy.title}
            </h1>
            <p className="text-sm text-stone-400 leading-relaxed mb-6">{copy.sub}</p>

            {/* Message Alert */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Social buttons */}
            {(mode === 'login' || mode === 'register') && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading || googleLoading}
                  className="w-full h-11 mb-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
                  title="Login dengan Google"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    className="w-5 h-5"
                    alt="Google"
                  />
                  <span className="text-sm text-stone-700 font-medium">
                    {googleLoading ? 'Connecting to Google...' : 'Login dengan Google'}
                  </span>
                  {googleLoading && (
                    <svg className="animate-spin h-4 w-4 text-stone-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-stone-100" />
                  <span className="text-[10px] text-stone-300 font-medium uppercase tracking-widest">atau</span>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>
              </>
            )}

            {/* Form */}
            {otpStep ? (
              <OtpVerifyStep
                email={email.trim()}
                type={otpType}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onBack={handleOtpBack}
                loading={otpLoading}
                error={otpError}
              />
            ) : (
            <form
              onSubmit={
                mode === 'forgot'
                  ? handleForgotPassword
                  : mode === 'reset'
                  ? handleResetPassword
                  : handleSendOTP
              }
              className="space-y-2.5"
            >
              {/* ── REGISTER MODE ── */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nama depan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Nama belakang"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                    required
                  />
                </div>
              )}

              {/* ── EMAIL ── */}
              {mode !== 'reset' && (
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                  required
                />
              )}

              {/* ── PASSWORD ── */}
              {(mode === 'login' || mode === 'register') && (
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-3.5 pr-11 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              )}

              {/* ── RESET PASSWORD MODE ── */}
              {mode === 'reset' && (
                <>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password Baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                    required
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Konfirmasi Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                    required
                  />
                </>
              )}

              {/* ── TURNSTILE (login & register only) ── */}
              {!otpStep && (mode === 'login' || mode === 'register') && (
                <div className="flex justify-center my-3">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                    options={{ size: 'normal' }}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken('')}
                    onError={() => setTurnstileToken('')}
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm transition-colors mt-1"
                style={{ fontFamily: "'Fraunces', serif", fontSize: '15px' }}
              >
                {loading ? 'Memproses...' : copy.cta}
              </button>
            </form>
            )}

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <button
                onClick={() => {
                  setMode('forgot')
                  clearMessage()
                }}
                className="w-full text-center mt-3 text-sm text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
              >
                Lupa password?
              </button>
            )}
          </div>

          {/* Switch mode */}
          {copy.switch.text && (
            <p className="text-sm text-stone-400 text-center mt-6">
              {copy.switch.text}{' '}
              <button
                onClick={() => {
                  setMode(copy.switch.mode)
                  clearMessage()
                }}
                className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors"
              >
                {copy.switch.label}
              </button>
            </p>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden md:block relative bg-stone-800 overflow-hidden">
          <img
            src="https://i.pinimg.com/1200x/0d/a0/b8/0da0b8670efdb830ab4553e0753e204b.jpg"
            alt="banner_login"
            className="absolute inset-0 w-full h-full bg-top object-cover opacity-85"
          />
          {/* Vertical dot-line decoration */}
          <div className="absolute left-14 top-20 bottom-20 flex flex-col items-center pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-white/80 border-2 border-white/40" />
            <div className="w-px flex-1 bg-white/25 my-1.5" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="w-px flex-1 bg-white/25 my-1.5" />
            <div className="w-2 h-2 rounded-full bg-white/80 border-2 border-white/40" />
          </div>
          {/* Floating card */}
          <div className="absolute top-8 left-8 flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-[10px] leading-none mb-1">Lokasi Basecamp</p>
              <p className="text-white text-[13px] font-medium leading-none">Parongpong, Bandung Barat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center"><div className="text-stone-600">Loading...</div></div>}>
      <AuthPageContent />
    </Suspense>
  )
}