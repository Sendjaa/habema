import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Lazy import supabase – handle missing env gracefully
    let supabase: any
    try {
      const mod = await import('@/lib/supabaseClient')
      supabase = mod.supabase
    } catch (e: any) {
      console.error('Supabase client init failed:', e.message)
      return NextResponse.json(
        { error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!search || search.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Sanitasi: buang karakter yang punya arti khusus di filter PostgREST
    // (koma & tanda kurung memisahkan/mengelompokkan kondisi .or()).
    const term = search.replace(/[,()%]/g, "").trim();
    if (term.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Cari id kategori yang namanya cocok, agar produk berkategori tsb ikut
    // muncul walau namanya tidak mengandung kata kunci (mis. cari "tenda").
    const { data: matchedCats } = await supabase
      .from('equipment_categories')
      .select('id')
      .ilike('name', `%${term}%`);
    const categoryIds = (matchedCats || []).map((c: any) => c.id);

    // Susun kondisi .or(): nama, deskripsi, dan (opsional) category_id.
    const orConditions = [
      `name.ilike.%${term}%`,
      `description.ilike.%${term}%`,
    ];
    if (categoryIds.length > 0) {
      orConditions.push(`category_id.in.(${categoryIds.join(',')})`);
    }

    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories (
          id,
          name
        )
      `)
      .or(orConditions.join(','))
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Search error (kompleks):', error.message);

      // Fallback: query paling sederhana (hanya cocokkan nama produk).
      const fallback = await supabase
        .from('equipment')
        .select(`*, equipment_categories ( id, name )`)
        .ilike('name', `%${term}%`)
        .limit(limit);

      if (!fallback.error) {
        return NextResponse.json({
          success: true,
          data: fallback.data || [],
          count: fallback.data?.length || 0,
          fallback: true,
        });
      }

      console.error('Search error (fallback):', fallback.error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to search products',
          detail: fallback.error.message,
          hint: (fallback.error as any).hint ?? null,
          code: (fallback.error as any).code ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
