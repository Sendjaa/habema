import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

async function getSupabase() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean)
  if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean)
  return []
}

// GET /api/admin/bundles?search= — semua bundles termasuk nonaktif.
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.replace(/[,()%"\\]/g, '').trim() || ''

    let query = supabaseAdmin
      .from('bundles')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,target_audience.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('[admin/bundles] GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/bundles — buat bundle baru.
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const body = await request.json().catch(() => ({}))
    const {
      name,
      description,
      target_audience,
      bundle_price,
      original_price,
      discount_percentage,
      image_url,
      includes,
      excludes,
      is_active,
      pax_min,
      pax_max,
    } = body as Record<string, any>

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Nama bundle wajib diisi' }, { status: 400 })
    }
    const price = Number(bundle_price)
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Harga bundle tidak valid' }, { status: 400 })
    }

    const parsePax = (v: unknown) => {
      if (v == null || v === '') return null
      const n = Number(v)
      if (!Number.isFinite(n) || n < 1) return null
      return Math.round(n)
    }

    const payload: any = {
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      target_audience: target_audience ? String(target_audience).trim() : null,
      bundle_price: Math.round(price),
      original_price: original_price == null || original_price === '' ? null : Math.round(Number(original_price)),
      discount_percentage: discount_percentage == null || discount_percentage === '' ? null : Number(discount_percentage),
      image_url: image_url ? String(image_url).trim() : null,
      includes: toStringArray(includes),
      excludes: toStringArray(excludes),
      is_active: is_active !== false,
      pax_min: parsePax(pax_min),
      pax_max: parsePax(pax_max),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('bundles')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[admin/bundles] POST error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
