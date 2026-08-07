import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin: any
    let ensureUserRecord: ((userId: string) => Promise<void>) | undefined
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
      ensureUserRecord = mod.ensureUserRecord
    } catch (e: any) {
      console.error('Supabase admin init failed:', e.message)
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { orderData, itemData, userEmail } = body

    if (!orderData || !itemData) {
      return NextResponse.json(
        { error: 'Missing required fields: orderData, itemData' },
        { status: 400 }
      )
    }

    // Normalize itemData to array (support single object or array)
    const itemsArray = Array.isArray(itemData) ? itemData : [itemData]

    if (itemsArray.length === 0) {
      return NextResponse.json(
        { error: 'itemData must contain at least one item' },
        { status: 400 }
      )
    }

    // Pastikan baris public.users ada. bookings.user_id -> public.users.id,
    // bila user login tidak punya baris users, INSERT gagal FK (23503).
    if (orderData?.user_id && ensureUserRecord) {
      await ensureUserRecord(orderData.user_id)
    }

    // ===== Validasi cabang & stok per cabang =====
    if (orderData?.pickup_branch_id) {
      const branchIds = Array.from(
        new Set([
          orderData.pickup_branch_id,
          orderData.return_branch_id || orderData.pickup_branch_id,
        ])
      )

      const { data: branches, error: branchErr } = await supabaseAdmin
        .from('branches')
        .select('id, name, is_active')
        .in('id', branchIds)

      if (branchErr) {
        return NextResponse.json(
          { error: 'Failed to validate branch', detail: branchErr.message },
          { status: 500 }
        )
      }

      const pickupBranch = branches?.find(
        (b: any) => b.id === orderData.pickup_branch_id
      )
      if (!pickupBranch || pickupBranch.is_active === false) {
        return NextResponse.json(
          { error: 'Cabang pengambilan tidak ditemukan atau tidak aktif' },
          { status: 400 }
        )
      }
      const returnBranch = branches?.find(
        (b: any) => b.id === (orderData.return_branch_id || orderData.pickup_branch_id)
      )

      // Validasi stok di cabang pengambilan untuk semua item
      const equipmentIds = itemsArray.map((item: any) => item.equipment_id)
      const { data: invRows, error: invErr } = await supabaseAdmin
        .from('branch_inventory')
        .select('equipment_id, quantity')
        .eq('branch_id', orderData.pickup_branch_id)
        .in('equipment_id', equipmentIds)

      if (invErr) {
        return NextResponse.json(
          { error: 'Failed to check branch stock', detail: invErr.message },
          { status: 500 }
        )
      }
      const invMap = new Map(
        (invRows || []).map((r: any) => [r.equipment_id, Number(r.quantity) || 0])
      )

      for (const item of itemsArray) {
        const available = invMap.get(item.equipment_id) ?? 0
        const needed = Number(item.quantity) || 0
        if (needed > available) {
          return NextResponse.json(
            {
              error: `Stok di ${pickupBranch.name} tidak mencukupi`,
              detail: `Butuh ${item.quantity} unit, tersedia ${available} unit`,
            },
            { status: 400 }
          )
        }
      }

      // Snapshot nama cabang untuk tampilan admin/WhatsApp
      orderData.pickup_branch_name = pickupBranch.name
      orderData.return_branch_name = returnBranch?.name || pickupBranch.name
    }

    // Insert booking
    const { data: newBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(orderData)
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        {
          error: 'Failed to create booking',
          detail: bookingError.message,
          code: bookingError.code,
          hint: bookingError.hint ?? null,
        },
        { status: 500 }
      )
    }

    // Insert all booking items
    const bookingItems = itemsArray.map((item: any) => ({
      ...item,
      booking_id: newBooking.id,
    }))

    const { error: itemError } = await supabaseAdmin
      .from('booking_items')
      .insert(bookingItems)

    if (itemError) {
      console.error('Error creating booking items:', itemError)
      // Rollback: hapus booking yatim agar tidak tertinggal di DB
      await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', newBooking.id)
        .maybeSingle()
      return NextResponse.json(
        {
          error: 'Failed to create booking items',
          detail: itemError.message,
          code: itemError.code,
          hint: itemError.hint ?? null,
        },
        { status: 500 }
      )
    }

    // ===== Decrement branch_inventory untuk cabang pengambilan =====
    if (orderData?.pickup_branch_id) {
      for (const item of itemsArray) {
        const { error: decErr } = await supabaseAdmin.rpc('decrement_branch_stock', {
          p_branch_id: orderData.pickup_branch_id,
          p_equipment_id: item.equipment_id,
          p_quantity: Number(item.quantity),
        }).single().then(() => ({ error: null })).catch((e: any) => ({ error: e }));

        // Fallback: jika RPC belum tersedia, lakukan decrement manual via update
        if (decErr) {
          // Ambil stok saat ini
          const { data: invRow } = await supabaseAdmin
            .from('branch_inventory')
            .select('id, quantity')
            .eq('branch_id', orderData.pickup_branch_id)
            .eq('equipment_id', item.equipment_id)
            .maybeSingle()

          if (invRow) {
            const newQty = Math.max(0, Number(invRow.quantity) - Number(item.quantity))
            await supabaseAdmin
              .from('branch_inventory')
              .update({ quantity: newQty, updated_at: new Date().toISOString() })
              .eq('id', invRow.id)
          }
        }
      }
    }

    // Create admin notification (hanya bila ada user_id; kolom notifications.user_id NOT NULL)
    try {
      if (orderData.user_id) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: orderData.user_id,
            booking_id: newBooking.id,
            title: 'Pesanan Baru',
            message: `Pesanan baru (${itemsArray.length} item) ${userEmail ? ` dari ${userEmail}` : ' (Guest User)'}`,
            notification_type: 'new_booking',
            is_read: false,
          })
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr)
    }

    return NextResponse.json({ success: true, data: newBooking })
  } catch (error) {
    console.error('Booking create API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
