import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// =====================================================================
// GET /api/admin/branches/inventory — daftar stok per cabang
// Query: ?branchId=<uuid>&equipmentId=<uuid>
// =====================================================================
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const equipmentId = searchParams.get('equipmentId')

    let query = supabaseAdmin
      .from('branch_inventory')
      .select(`
        id, quantity, updated_at,
        branch:branches(id, name, city),
        equipment:equipment(id, name, image_url, stock_quantity)
      `)

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId)
    }

    query = query.order('updated_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('[admin/branches/inventory] GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

// =====================================================================
// PUT /api/admin/branches/inventory — update stok per cabang
// Body: { branchId, equipmentId, quantity }
// =====================================================================
export async function PUT(request: NextRequest) {
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
    const { branchId, equipmentId, quantity } = body

    if (!branchId || !equipmentId) {
      return NextResponse.json({ error: 'branchId dan equipmentId wajib diisi' }, { status: 400 })
    }
    if (quantity === undefined || quantity === null || Number(quantity) < 0) {
      return NextResponse.json({ error: 'quantity harus >= 0' }, { status: 400 })
    }

    // Upsert stok
    const { data, error } = await supabaseAdmin
      .from('branch_inventory')
      .upsert({
        branch_id: branchId,
        equipment_id: equipmentId,
        quantity: Number(quantity),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'branch_id,equipment_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[admin/branches/inventory] PUT error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
