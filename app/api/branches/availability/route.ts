import { NextRequest, NextResponse } from 'next/server'

// =====================================================================
// GET /api/branches/availability?productId=<equipment_id>
// Kembalikan cabang yang memiliki stok untuk produk tertentu, beserta
// sisa stoknya. Tanpa productId, kembalikan semua cabang dengan stok.
// =====================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    const mod = await import('@/lib/supabaseAdmin')
    const supabaseAdmin = mod.supabaseAdmin

    let query = supabaseAdmin
      .from('branch_inventory')
      .select(`quantity, branch:branches(id, name, address, city, phone, operational_hours, map_url, is_active)`)

    if (productId) {
      query = query.eq('equipment_id', productId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const availability = (data || [])
      .filter((row: any) => row.branch?.is_active !== false)
      .map((row: any) => ({ ...row.branch, stock: row.quantity }))
      .sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0))

    return NextResponse.json({ success: true, data: availability })
  } catch (e: any) {
    console.error('[branches/availability] GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
