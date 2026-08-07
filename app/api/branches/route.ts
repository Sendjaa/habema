import { NextRequest, NextResponse } from 'next/server'

// =====================================================================
// GET /api/branches — daftar cabang aktif
// =====================================================================
export async function GET(_request: NextRequest) {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    const supabaseAdmin = mod.supabaseAdmin

    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('id, name, address, city, phone, operational_hours, map_url, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('[branches] GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
