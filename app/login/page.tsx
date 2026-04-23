'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register'

const COPY = {
  login: {
    title: 'Halo, Petualang!',
    sub: 'Siap untuk perjalanan berikutnya? Masuk ke akunmu.',
    cta: 'Masuk',
    switch: { text: 'Belum punya akun?', label: 'Daftar sekarang', mode: 'register' as Mode },
  },
  register: {
    title: 'Mulai Petualanganmu',
    sub: 'Buat akun dan temukan perlengkapan terbaik untukmu.',
    cta: 'Buat Akun',
    switch: { text: 'Sudah punya akun?', label: 'Masuk di sini', mode: 'login' as Mode },
  },
}

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)

  const copy = COPY[mode]

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return alert('Password minimal 6 karakter!')
    setLoading(true)
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: `${firstName} ${lastName}`.trim() },
          },
        })
        if (error) throw error
        alert('Cek email kamu untuk konfirmasi akun!')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        router.replace('/booking')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/booking` },
    })
    if (error) alert(error.message)
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
            <div className="flex gap-0.5 bg-stone-100 rounded-xl p-1 mb-6">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
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

            {/* Heading */}
            <h1
              className="text-[28px] font-semibold text-stone-900 leading-tight mb-2 tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {copy.title}
            </h1>
            <p className="text-sm text-stone-400 leading-relaxed mb-6">{copy.sub}</p>

            {/* Social buttons */}
            <div className="flex gap-2.5 mb-4">
              {[
                {
                  label: 'Apple',
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1C1C1E">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.29.07 2.18.74 3.01.76 1.15-.22 2.25-.92 3.45-.84 1.46.12 2.56.7 3.28 1.86-3.03 1.8-2.3 5.75.28 6.87-.55 1.4-1.27 2.79-2.02 4.23M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25" />
                    </svg>
                  ),
                  onClick: undefined,
                },
                {
                  label: 'Google',
                  icon: (
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      className="w-5 h-5"
                      alt="Google"
                    />
                  ),
                  onClick: handleGoogle,
                },
                {
                  label: 'Facebook',
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                  onClick: undefined,
                },
              ].map(({ label, icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="w-11 h-11 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center transition-colors"
                  title={label}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-[10px] text-stone-300 font-medium uppercase tracking-widest">atau</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-2.5">
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
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-300 focus:border-emerald-500 focus:bg-white focus:ring-0 outline-none transition-all"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm transition-colors mt-1"
                style={{ fontFamily: "'Fraunces', serif", fontSize: '15px' }}
              >
                {loading ? 'Memproses...' : copy.cta}
              </button>
            </form>
          </div>

          {/* Switch mode */}
          <p className="text-sm text-stone-400 text-center mt-6">
            {copy.switch.text}{' '}
            <button
              onClick={() => setMode(copy.switch.mode)}
              className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors"
            >
              {copy.switch.label}
            </button>
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden md:block relative bg-stone-800 overflow-hidden">
          {/* Replace with your own nature photo */}
          <img
            src="https://i.pinimg.com/1200x/0d/a0/b8/0da0b8670efdb830ab4553e0753e204b.jpg"
            alt="banner_login"
            className="absolute inset-0 w-full h-full bg-top object-cover opacity-85"
          />

          {/* Vertical dot-line decoration (like Voyger) */}
          <div className="absolute left-14 top-20 bottom-20 flex flex-col items-center pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-white/80 border-2 border-white/40" />
            <div className="w-px flex-1 bg-white/25 my-1.5" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="w-px flex-1 bg-white/25 my-1.5" />
            <div className="w-2 h-2 rounded-full bg-white/80 border-2 border-white/40" />
          </div>

          {/* Floating card — top left */}
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

          {/* Floating card — right */}
          {/* <div className="absolute right-6 bottom-24 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3 text-right">
            <p
              className="text-white text-2xl leading-none"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              4.200
            </p>
            <p className="text-white/70 text-[11px] mt-1.5 leading-snug">meter di atas<br />permukaan laut</p>
          </div> */}

          {/* Floating pill — bottom center */}
          {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-5 py-2.5">
            <p className="text-white text-xs font-medium whitespace-nowrap">Jalur Habema — Nduga</p>
          </div> */}
        </div>

      </div>
    </div>
  )
}