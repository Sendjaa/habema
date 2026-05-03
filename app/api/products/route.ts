import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!search || search.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Search by product name and category name
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories (
          id,
          name
        )
      `)
      .or(`
        name.ilike.%${search}%, 
        equipment_categories.name.ilike.%${search}%
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to search products' },
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
