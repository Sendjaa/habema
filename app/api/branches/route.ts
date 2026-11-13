import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// =====================================================================
// GET /api/branches — daftar cabang aktif
// =====================================================================
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('[branches] GET error:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
