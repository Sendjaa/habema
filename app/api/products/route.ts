import { NextRequest, NextResponse } from 'next/server';
import { desc, ilike, inArray, or } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { equipment, equipmentCategories } from '@/lib/db/schema';
import { toLegacyEquipmentRow } from '@/lib/db/mappers';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!search || search.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Sanitasi: buang karakter yang dulu punya arti khusus di filter PostgREST
    // (koma & tanda kurung memisahkan/mengelompokkan kondisi .or()).
    //
    // Alasan aslinya sudah hilang — query Drizzle terparameterisasi, jadi koma
    // dan kurung tidak lagi berbahaya. Tetap dipertahankan supaya hasil
    // pencarian tidak berubah sedikit pun selama migrasi. `%` memang masih
    // berperan sebagai wildcard ILIKE, jadi tetap dibuang.
    const term = search.replace(/[,()%]/g, "").trim();
    if (term.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Cari id kategori yang namanya cocok, agar produk berkategori tsb ikut
    // muncul walau namanya tidak mengandung kata kunci (mis. cari "tenda").
    const matchedCats = await db
      .select({ id: equipmentCategories.id })
      .from(equipmentCategories)
      .where(ilike(equipmentCategories.name, `%${term}%`));
    const categoryIds = matchedCats.map((c) => c.id);

    // Dulu disusun sebagai string kondisi .or(); sekarang jadi ekspresi Drizzle.
    const conditions = [
      ilike(equipment.name, `%${term}%`),
      ilike(equipment.description, `%${term}%`),
    ];
    if (categoryIds.length > 0) {
      conditions.push(inArray(equipment.categoryId, categoryIds));
    }

    try {
      const rows = await db.query.equipment.findMany({
        with: { category: { columns: { id: true, name: true } } },
        where: or(...conditions),
        orderBy: [desc(equipment.createdAt)],
        limit,
      });

      const data = rows.map((row) =>
        toLegacyEquipmentRow(row as unknown as Record<string, unknown>)
      );

      return NextResponse.json({
        success: true,
        data,
        count: data.length
      });
    } catch (queryError: any) {
      console.error('Search error (kompleks):', queryError?.message);

      // Fallback: query paling sederhana (hanya cocokkan nama produk).
      try {
        const fallback = await db.query.equipment.findMany({
          with: { category: { columns: { id: true, name: true } } },
          where: ilike(equipment.name, `%${term}%`),
          limit,
        });

        const data = fallback.map((row) =>
          toLegacyEquipmentRow(row as unknown as Record<string, unknown>)
        );

        return NextResponse.json({
          success: true,
          data,
          count: data.length,
          fallback: true,
        });
      } catch (fallbackError: any) {
        console.error('Search error (fallback):', fallbackError?.message);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to search products',
            detail: fallbackError?.message ?? null,
            hint: fallbackError?.hint ?? null,
            code: fallbackError?.code ?? null,
          },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
