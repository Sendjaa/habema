import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { equipmentCategories } from '@/lib/db/schema'

export async function GET() {
  try {
    // Lazy init – handle missing POSTGRES_URL gracefully, sama seperti sebelumnya
    // saat klien Supabase gagal dibuat.
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

    // Nama kolom diambil satu per satu agar hasilnya tetap snake_case seperti
    // `select('*')` PostgREST — komponen pemanggil mengharapkan bentuk itu.
    const data = await db
      .select({
        id: equipmentCategories.id,
        name: equipmentCategories.name,
        description: equipmentCategories.description,
        display_order: equipmentCategories.displayOrder,
        created_at: equipmentCategories.createdAt,
      })
      .from(equipmentCategories)
      .orderBy(asc(equipmentCategories.displayOrder))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Categories API error:', error)
    // Return fallback categories if database fails
    const fallbackCategories = [
      { id: '1', name: 'Tenda', description: 'Berbagai jenis tenda untuk camping' },
      { id: '2', name: 'Sleeping Bag', description: 'Kantong tidur yang nyaman' },
      { id: '3', name: 'Backpack', description: 'Tas ransel untuk hiking' },
      { id: '4', name: 'Cooking Set', description: 'Peralatan memasak outdoor' }
    ]
    return NextResponse.json(fallbackCategories)
  }
}
