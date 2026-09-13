import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

// GET /api/admin/bundles/[id]/items — komposisi paket (untuk cek stok booking online).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { data, error } = await supabaseAdmin
      .from('bundle_items')
      .select('id, quantity, equipment:equipment(id, name, price_per_night, stock_quantity, image_url)')
      .eq('bundle_id', id)
      .order('created_at', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/bundles/[id]/items — ganti seluruh komposisi.
// Body: { items: [{ equipment_id: string, quantity: number }] }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const body = await request.json().catch(() => ({}))
    const items = Array.isArray(body.items) ? body.items : null
    if (!items) {
      return NextResponse.json({ error: 'items harus berupa array' }, { status: 400 })
    }

    const normalized: { bundle_id: string; equipment_id: string; quantity: number }[] = []
    const seen = new Set<string>()
    for (const it of items) {
      const equipment_id = String(it?.equipment_id || '').trim()
      const quantity = Number(it?.quantity)
      if (!equipment_id || seen.has(equipment_id)) continue
      if (!Number.isFinite(quantity) || quantity < 1) {
        return NextResponse.json({ error: 'quantity tiap item minimal 1' }, { status: 400 })
      }
      seen.add(equipment_id)
      normalized.push({ bundle_id: id, equipment_id, quantity: Math.round(quantity) })
    }

    // Validasi equipment_id benar-benar ada.
    if (normalized.length > 0) {
      const ids = normalized.map((n) => n.equipment_id)
      const { data: found, error: foundErr } = await supabaseAdmin
        .from('equipment')
        .select('id')
        .in('id', ids)
      if (foundErr) {
        return NextResponse.json({ error: foundErr.message }, { status: 500 })
      }
      const foundSet = new Set((found || []).map((r: any) => String(r.id)))
      const missing = ids.filter((x) => !foundSet.has(String(x)))
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Equipment tidak ditemukan: ${missing.slice(0, 3).join(', ')}` },
          { status: 400 },
        )
      }
    }

    // Ganti total: hapus lama lalu insert baru.
    const { error: delErr } = await supabaseAdmin.from('bundle_items').delete().eq('bundle_id', id)
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }
    if (normalized.length > 0) {
      const { error: insErr } = await supabaseAdmin.from('bundle_items').insert(normalized)
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, data: normalized })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
