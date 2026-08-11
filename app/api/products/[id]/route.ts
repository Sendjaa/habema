import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Coba produk jual (shop_products) terlebih dahulu
  const { data: shopProduct } = await supabase
    .from('shop_products')
    .select('*, reviews(*)')
    .eq('id', id)
    .single();

  if (shopProduct) {
    // Calculate average_rating and review_count
    const reviews: any[] = shopProduct.reviews || [];
    const average_rating = reviews.length
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0;
    const review_count = reviews.length;

    return NextResponse.json({
      ...shopProduct,
      type: 'shop',
      average_rating,
      review_count,
    });
  }

  // Fallback: produk sewa (equipment)
  const { data: rentalProduct } = await supabase
    .from('equipment')
    .select('*, equipment_categories(name)')
    .eq('id', id)
    .single();

  if (rentalProduct) {
    return NextResponse.json({
      ...rentalProduct,
      type: 'rental',
    });
  }

  return NextResponse.json(
    { error: 'Product not found' },
    { status: 404 }
  );
}