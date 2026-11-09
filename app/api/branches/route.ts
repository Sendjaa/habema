import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { branches } from '@/lib/db/schema'

// =====================================================================
// GET /api/branches — daftar cabang aktif
// =====================================================================
export async function GET() {
  let db: ReturnType<typeof getDb>
  try {
    db = getDb()
  } catch (e: any) {
    console.error('Database init failed:', e.message)
    return NextResponse.json(
      { error: 'Database not configured. Set POSTGRES_URL in .env.local' },
      { status: 503 }
    )
  }

  try {
    // Dulu `supabaseAdmin.from('branches').select('id, name, ...')
    // .eq('is_active', true).order('created_at')`. Kunci snake_case
    // dipertahankan supaya pemanggil tidak berubah.
    const data = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        city: branches.city,
        phone: branches.phone,
        operational_hours: branches.operationalHours,
        map_url: branches.mapUrl,
        is_active: branches.isActive,
      })
      .from(branches)
      .where(eq(branches.isActive, true))
      .orderBy(asc(branches.createdAt))

    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('[branches] GET error:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
