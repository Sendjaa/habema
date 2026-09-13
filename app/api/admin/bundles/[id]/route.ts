import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

function toStringArray(v: unknown): string[] | undefined {
  if (v === undefined) return undefined
  if (Array.isArray(v)) return v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean)
  if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean)
  return []
}

const NUM_FIELDS = ['bundle_price', 'original_price', 'discount_percentage'] as const

// PATCH /api/admin/bundles/[id] — update parsial.
export async function PATCH(
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

    const allowed = [
      'name', 'description', 'target_audience', 'image_url', 'is_active',
      'includes', 'excludes', 'pax_min', 'pax_max', ...NUM_FIELDS,
    ] as const
    const payload: any = { updated_at: new Date().toISOString() }

    for (const key of allowed) {
      if (!(key in body)) continue
      const v = (body as Record<string, any>)[key]
      if (key === 'includes' || key === 'excludes') {
        payload[key] = toStringArray(v) ?? []
      } else if (key === 'pax_min' || key === 'pax_max') {
        if (v == null || v === '') {
          payload[key] = null
        } else {
          const n = Number(v)
          if (!Number.isFinite(n) || n < 1) {
            return NextResponse.json({ error: `Nilai ${key} tidak valid` }, { status: 400 })
          }
          payload[key] = Math.round(n)
        }
      } else if ((NUM_FIELDS as readonly string[]).includes(key)) {
        if (v == null || v === '') {
          payload[key] = null
        } else {
          const n = Number(v)
          if (!Number.isFinite(n) || n < 0) {
            return NextResponse.json({ error: `Nilai ${key} tidak valid` }, { status: 400 })
          }
          payload[key] = key === 'discount_percentage' ? n : Math.round(n)
        }
      } else if (key === 'is_active') {
        payload[key] = v !== false && v !== 'false' && v !== 0
      } else if (key === 'name') {
        if (!String(v ?? '').trim()) {
          return NextResponse.json({ error: 'Nama bundle wajib diisi' }, { status: 400 })
        }
        payload[key] = String(v).trim()
      } else {
        payload[key] = v == null || v === '' ? null : String(v).trim()
      }
    }

    const { data, error } = await supabaseAdmin
      .from('bundles')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[admin/bundles] PATCH error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/bundles/[id]
// Urutan hapus: bundle_items (komposisi) → bundle_id_mapping (pemetaan id
// lama) → bundles. booking_bundle_items sengaja TIDAK dihapus: bila paket
// sudah pernah dibooking, hapus ditolak dengan pesan ramah (nonaktifkan saja).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // 1. Komposisi stok (tabel ini CASCADE, tapi hapus eksplisit agar jelas).
    // Abaikan error bila tabel belum ada di environment lama.
    try {
      await supabaseAdmin.from('bundle_items').delete().eq('bundle_id', id)
    } catch {}

    // 2. Pemetaan id string lama → uuid. FK-nya (bundle_id_mapping_uuid_id_fkey)
    // di beberapa database dibuat tanpa CASCADE sehingga DELETE bundles gagal
    // dengan error 23503 bila baris mapping masih ada. Hapus dulu di sini.
    try {
      await supabaseAdmin.from('bundle_id_mapping').delete().eq('uuid_id', id)
    } catch {}

    const { error } = await supabaseAdmin.from('bundles').delete().eq('id', id)
    if (error) {
      // 23503 = masih ada baris anak (umumnya booking_bundle_items = paket
      // sudah pernah dibooking). Jangan hapus paksa riwayat transaksi.
      if ((error as any).code === '23503') {
        return NextResponse.json(
          { error: 'Paket sudah pernah dibooking dan tidak bisa dihapus. Nonaktifkan saja lewat tombol Aktif/Nonaktif.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[admin/bundles] DELETE error:', e)
    if (e?.code === '23503') {
      return NextResponse.json(
        { error: 'Paket sudah pernah dibooking dan tidak bisa dihapus. Nonaktifkan saja lewat tombol Aktif/Nonaktif.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
