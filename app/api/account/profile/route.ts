import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET /api/account/profile — profil akun + avatar hasil Google (sinkron).
// Sumber kebenaran:
//   1. auth.users (user_metadata — berisi name, full_name, picture dari Google)
//   2. public.users (baris yang dibuat trigger on_auth_user_created; dipakai
//      untuk full_name/avatar bila user update manual di Edit Profile)
// Data dikembalikan ke client sehingga halaman /account dapat memakai
// nilai yang konsisten dengan login Google.
export async function GET(request: NextRequest) {
  try {
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      },
    )
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const db = supabaseAdmin as any
    const { data: profileRow } = await db
      .from('users')
      .select('id, email, full_name, phone, avatar_url, last_sign_in_at, created_at')
      .eq('id', user.id)
      .maybeSingle()

    // Prioritas: profileRow (manual edits) > user_metadata Google
    const meta = (user.user_metadata || {}) as any
    const fullName =
      profileRow?.full_name ||
      meta.full_name ||
      meta.name ||
      meta.preferred_username ||
      (user.email ? user.email.split('@')[0] : 'Petualang Habema')
    const email = user.email || profileRow?.email || ''
    const phone = profileRow?.phone || meta.phone || user.phone || null
    const avatarUrl =
      profileRow?.avatar_url ||
      meta.avatar_url ||
      meta.picture ||
      null
    const providerList = (user.app_metadata?.providers as string[]) || []
    const primaryProvider = (user.app_metadata?.provider as string) || 'email'
    // Akun bisa tertaut multi-provider (mis. ["email", "google"]) dengan
    // primary = email. Untuk badge/foto, Google dihitung bila tertaut.
    const provider = providerList.includes('google') ? 'google' : primaryProvider
    const emailConfirmed = !!user.email_confirmed_at

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email,
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        provider,
        email_confirmed: emailConfirmed,
        last_sign_in_at: profileRow?.last_sign_in_at || user.last_sign_in_at || null,
        created_at: profileRow?.created_at || user.created_at || null,
      },
    })
  } catch (e: any) {
    console.error('[account/profile] error:', e?.message || e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
