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
    .select('*')
    .eq('id', id)
    .single();

  if (shopProduct) {
    // Ulasan produk toko disimpan di tabel reviews dengan shop_product_id.
    // Balasan (komentar berawalan "@nama:") tidak dihitung sebagai ulasan.
    const { data: shopReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('shop_product_id', id)
      .order('created_at', { ascending: false });

    const validReviews = (shopReviews || []).filter(
      (r: any) => !(r.comment || '').startsWith('@')
    );
    const average_rating = validReviews.length
      ? validReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
        validReviews.length
      : 0;
    const review_count = validReviews.length;

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