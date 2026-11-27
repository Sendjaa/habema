import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * CRUD konten Open Trip untuk admin.
 *
 * Satu route generik untuk lima jenis konten supaya tidak ada lima endpoint
 * yang isinya sama. Setiap resource punya daftar kolom yang boleh ditulis —
 * field lain di body diabaikan, jadi body tidak bisa menyentuh id/created_at.
 *
 *   GET    /api/admin/opentrip-content/[resource]
 *   POST   /api/admin/opentrip-content/[resource]
 *   PUT    /api/admin/opentrip-content/[resource]   (body.id)
 *   DELETE /api/admin/opentrip-content/[resource]?id=
 *
 * resource: categories | gear | faqs | gallery | vouchers
 */

type FieldType = 'text' | 'number' | 'bool' | 'date'

type ResourceConfig = {
  table: string
  order: string
  required: string[]
  fields: Record<string, FieldType>
}

const RESOURCES: Record<string, ResourceConfig> = {
  categories: {
    table: 'ot_trip_categories',
    order: 'sort_order',
    required: ['name'],
    fields: {
      name: 'text',
      slug: 'text',
      description: 'text',
      icon: 'text',
      color: 'text',
      is_active: 'bool',
      sort_order: 'number',
    },
  },
  gear: {
    table: 'ot_gear_addons',
    order: 'sort_order',
    required: ['name'],
    fields: {
      name: 'text',
      spec: 'text',
      price_per_trip: 'number',
      is_active: 'bool',
      sort_order: 'number',
    },
  },
  faqs: {
    table: 'ot_faqs',
    order: 'sort_order',
    required: ['question', 'answer'],
    fields: {
      question: 'text',
      answer: 'text',
      is_active: 'bool',
      sort_order: 'number',
    },
  },
  gallery: {
    table: 'ot_field_gallery',
    order: 'sort_order',
    required: ['image_url'],
    fields: {
      image_url: 'text',
      caption: 'text',
      location: 'text',
      elevation: 'text',
      trip_title: 'text',
      taken_at: 'date',
      is_active: 'bool',
      sort_order: 'number',
    },
  },
  vouchers: {
    table: 'ot_vouchers',
    order: 'sort_order',
    required: ['code', 'title', 'discount_amount'],
    fields: {
      code: 'text',
      title: 'text',
      discount_amount: 'number',
      min_participants: 'number',
      valid_until: 'date',
      is_active: 'bool',
      sort_order: 'number',
    },
  },
  meeting_points: {
    table: 'ot_meeting_points',
    order: 'sort_order',
    required: ['trip_id', 'name', 'address'],
    fields: {
      trip_id: 'text',
      name: 'text',
      address: 'text',
      lat: 'number',
      lng: 'number',
      price_adjustment: 'number',
      is_active: 'bool',
      sort_order: 'number',
    },
  },
  rental_addons: {
    table: 'ot_rental_addons',
    order: 'sort_order',
    required: ['trip_id', 'equipment_id'],
    fields: {
      trip_id: 'text',
      equipment_id: 'text',
      branch_id: 'text',
      quantity: 'number',
      price_per_unit: 'number',
      is_active: 'bool',
      sort_order: 'number',
    },
  },
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function sanitize(
  body: Record<string, any>,
  fields: Record<string, FieldType>,
  partial: boolean
): Record<string, any> {
  const payload: Record<string, any> = {}

  for (const [key, type] of Object.entries(fields)) {
    const value = body[key]
    if (value === undefined) continue
    if (type === 'text') {
      if (value === null) {
        payload[key] = null
      } else {
        const text = String(value).trim()
        payload[key] = text || null
      }
    } else if (type === 'number') {
      const n = Number(value)
      payload[key] = Number.isFinite(n) ? n : 0
    } else if (type === 'bool') {
      payload[key] = value === true || value === 'true'
    } else {
      payload[key] = value ? String(value) : null
    }
  }

  if (!partial) {
    // Default aman untuk baris baru.
    if (fields.is_active && payload.is_active === undefined) payload.is_active = true
    if (fields.sort_order && payload.sort_order === undefined) payload.sort_order = 0
    if (fields.slug && !payload.slug && payload.name) payload.slug = slugify(payload.name)
    if (fields.code && payload.code) payload.code = String(payload.code).toUpperCase()
  }

  return payload
}

function getConfig(resource: string): ResourceConfig | null {
  return RESOURCES[resource] ?? null
}

async function getAdmin() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { resource } = await params
  const config = getConfig(resource)
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal' }, { status: 404 })

  const supabase = await getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { data, error } = await supabase
    .from(config.table)
    .select('*')
    .order(config.order, { ascending: true })

  if (error) {
    console.error(`[admin/opentrip-content] GET ${resource}:`, error.message)
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { resource } = await params
  const config = getConfig(resource)
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal' }, { status: 404 })

  const supabase = await getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const body = await request.json()
    const payload = sanitize(body, config.fields, false)

    const missing = config.required.filter((key) => !payload[key])
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Field wajib belum diisi: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.from(config.table).insert(payload).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error(`[admin/opentrip-content] POST ${resource}:`, error?.message || error)
    const message =
      error?.code === '23505' ? 'Kode/slug sudah dipakai. Gunakan nilai lain.' : 'Gagal menyimpan data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { resource } = await params
  const config = getConfig(resource)
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal' }, { status: 404 })

  const supabase = await getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const body = await request.json()
    const id = body?.id
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

    const patch = sanitize(body, config.fields, true)
    if (config.fields.slug && !patch.slug && patch.name) patch.slug = slugify(patch.name)
    if (config.fields.code && patch.code) patch.code = String(patch.code).toUpperCase()
    patch.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from(config.table)
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error(`[admin/opentrip-content] PUT ${resource}:`, error?.message || error)
    const message =
      error?.code === '23505' ? 'Kode/slug sudah dipakai. Gunakan nilai lain.' : 'Gagal memperbarui data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { resource } = await params
  const config = getConfig(resource)
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal' }, { status: 404 })

  const supabase = await getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

  const { error } = await supabase.from(config.table).delete().eq('id', id)

  if (error) {
    console.error(`[admin/opentrip-content] DELETE ${resource}:`, error.message)
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
