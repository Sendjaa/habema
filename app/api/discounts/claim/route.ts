import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch (e: any) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { code, userId } = body

    if (!code || !userId) {
      return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 })
    }

    const { data: discount, error: discountError } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (discountError || !discount) {
      return NextResponse.json({ error: 'Diskon tidak ditemukan atau sudah tidak aktif' }, { status: 404 })
    }

    // Coba auto-create tabel user_discounts jika belum ada
    try {
      await supabaseAdmin.rpc('exec', { query: '' })
    } catch {
      // ignore — rpc mungkin tidak ada
    }

    // Coba insert ke user_discounts — jika tabel belum ada, fallback
    let claimId: string | null = null
    let claimedAt: string | null = null

    try {
      const { data: existing } = await supabaseAdmin
        .from('user_discounts')
        .select('id, claimed_at')
        .eq('user_id', userId)
        .eq('discount_id', discount.id)
        .maybeSingle()

      if (existing) {
        claimId = existing.id
        claimedAt = existing.claimed_at
      } else {
        const { data: claim, error: claimError } = await supabaseAdmin
          .from('user_discounts')
          .insert({ user_id: userId, discount_id: discount.id })
          .select('id, claimed_at')
          .single()

        if (claimError) throw claimError
        claimId = claim.id
        claimedAt = claim.claimed_at
      }
    } catch (insertErr: any) {
      // Tabel user_discounts belum ada — hanya simpan client-side via Zustand
      console.warn('user_discounts table not available, saving client-side only:', insertErr?.message)
    }

    return NextResponse.json({
      success: true,
      alreadyClaimed: !!claimId,
      discount: {
        id: discount.id,
        code: discount.code,
        description: discount.description,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        min_purchase: discount.min_purchase,
        max_discount: discount.max_discount,
        applies_to: discount.applies_to,
        target_id: discount.target_id,
      },
      ...(claimId ? { claim: { id: claimId, claimed_at: claimedAt } } : {}),
    })
  } catch (error) {
    console.error('Claim discount API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
