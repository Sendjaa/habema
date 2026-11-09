import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

async function getAdmin() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { data, error } = await supabaseAdmin
    .from('discounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching discounts:', error)
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const body = await req.json()
    
    const payload: Record<string, any> = {
      code: body.code?.trim(),
      description: body.description?.trim() || null,
      discount_type: body.discount_type || 'percentage',
      discount_value: parseFloat(body.discount_value) || 0,
      min_purchase: body.min_purchase ? parseFloat(body.min_purchase) : null,
      max_discount: body.max_discount ? parseFloat(body.max_discount) : null,
      applies_to: body.applies_to || 'all',
      target_id: body.target_id?.trim() || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      is_active: body.is_active ?? true,
      usage_limit: body.usage_limit ? parseInt(body.usage_limit) : null,
    }

    const { data, error } = await supabaseAdmin.from('discounts').insert(payload as any).select().single()

    if (error) {
      if (error.message?.includes('discounts_code_key')) {
        return NextResponse.json({ error: 'Kode diskon sudah digunakan. Gunakan kode lain.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating discount:', error)
    return NextResponse.json({ error: error.message || 'Failed to create discount' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const body = await req.json()
    const { id, ...fields } = body

    if (!id) return NextResponse.json({ error: 'Discount ID is required' }, { status: 400 })

    const payload: Record<string, any> = {}
    if (fields.code !== undefined) payload.code = fields.code?.trim()
    if (fields.description !== undefined) payload.description = fields.description?.trim() || null
    if (fields.discount_type !== undefined) payload.discount_type = fields.discount_type
    if (fields.discount_value !== undefined) payload.discount_value = parseFloat(fields.discount_value) || 0
    if (fields.min_purchase !== undefined) payload.min_purchase = fields.min_purchase ? parseFloat(fields.min_purchase) : null
    if (fields.max_discount !== undefined) payload.max_discount = fields.max_discount ? parseFloat(fields.max_discount) : null
    if (fields.applies_to !== undefined) payload.applies_to = fields.applies_to
    if (fields.target_id !== undefined) payload.target_id = fields.target_id?.trim() || null
    if (fields.start_date !== undefined) payload.start_date = fields.start_date || null
    if (fields.end_date !== undefined) payload.end_date = fields.end_date || null
    if (fields.is_active !== undefined) payload.is_active = fields.is_active
    if (fields.usage_limit !== undefined) payload.usage_limit = fields.usage_limit ? parseInt(fields.usage_limit) : null

    const { data, error } = await supabaseAdmin.from('discounts').update(payload as any).eq('id', id).select().single()

    if (error) {
      if (error.message?.includes('discounts_code_key')) {
        return NextResponse.json({ error: 'Kode diskon sudah digunakan. Gunakan kode lain.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating discount:', error)
    return NextResponse.json({ error: error.message || 'Failed to update discount' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Discount ID is required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('discounts').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting discount:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete discount' }, { status: 500 })
  }
}
