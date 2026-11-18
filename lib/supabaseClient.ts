import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient<Database> | undefined

if (supabaseUrl && supabasePublicKey) {
  supabase = createBrowserClient<Database>(supabaseUrl, supabasePublicKey, {
    auth: {
      // Default 5s terlalu pendek saat banyak komponen (header, navUserControl,
      // katalog, checkout) menginisialisasi auth bersamaan di awal page load.
      // Timer yang meletus membuat auth-js mencuri lock (steal: true) yang sedang
      // dipakai komponen lain, membatalkan fetch refresh token ("Failed to fetch")
      // dan query katalog ("Lock broken by another request with the 'steal' option").
      lockAcquireTimeout: 20000,
      // Field ini ada di GoTrueClientOptions runtime, tapi belum dideklarasikan
      // di tipe SupabaseClientOptions@2.104.1.
    } as any,
  })
} else {
  const missing = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabasePublicKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ')

  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      `[Supabase] Environment variable belum termuat: ${missing}. ` +
        `Pastikan nilainya ada di .env / .env.local, lalu restart dev server (npm run dev).`
    )
  }

  console.warn(
    `[Supabase] Environment variable tidak lengkap di production: ${missing}. ` +
      `Fitur auth (login, register, reset password) tidak akan berfungsi sampai env var diisi di Vercel.`
  )
}

export { supabase }
