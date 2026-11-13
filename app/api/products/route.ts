import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!search || search.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  const term = search.replace(/[,()%]/g, "").trim();
  if (term.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { data: matchedCats, error: catError } = await supabase
    .from('equipment_categories')
    .select('id')
    .ilike('name', `%${term}%`);

  if (catError) {
    console.error('Error fetching categories:', catError.message);
  }

  const categoryIds = matchedCats?.map((c) => c.id) ?? [];

  const filters: string[] = [
    `name.ilike.%${term}%`,
    `description.ilike.%${term}%`,
  ];
  if (categoryIds.length > 0) {
    filters.push(`category_id.in.(${categoryIds.join(',')})`);
  }
  const orFilter = filters.join(',');

  const { data: eqData, error: eqError } = await supabase
    .from('equipment')
    .select('*')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (eqError) {
    console.error('Error fetching equipment:', eqError.message);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }

  const data = (eqData ?? []).map((item: any) => ({
    ...item,
    dailyPrice: item.price_per_night || 0,
    category_id: item.category_id ? String(item.category_id) : null,
  }));

  return NextResponse.json({
    success: true,
    data,
    count: data.length,
  });
}
