import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// =====================================================================
// GET /api/admin/branches — daftar semua cabang (termasuk non-aktif)
// =====================================================================
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('[admin/branches] GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

// =====================================================================
// POST /api/admin/branches — buat cabang baru
// =====================================================================
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { name, address, city, phone, operational_hours, map_url, is_active } = body

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Nama cabang wajib diisi' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('branches')
      .insert({
        name: String(name).trim(),
        address: address || null,
        city: city || null,
        phone: phone || null,
        operational_hours: operational_hours || null,
        map_url: map_url || null,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Nama cabang sudah ada' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[admin/branches] POST error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
