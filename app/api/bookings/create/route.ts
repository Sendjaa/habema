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
    const { orderData, itemData, userEmail, bundle } = body as {
      orderData: any
      itemData?: any
      userEmail?: string | null
      bundle?: { bundle_id?: string; quantity?: number } | null
    }

    if (!orderData) {
      return NextResponse.json(
        { error: 'Missing required fields: orderData' },
        { status: 400 }
      )
    }

    // Normalize itemData to array (support single object or array).
    // Boleh kosong bila booking berupa paket (bundle) yang belum punya
    // komposisi stok — paket tetap dicatat di booking_bundle_items.
    let itemsArray: any[] = Array.isArray(itemData) ? itemData : itemData ? [itemData] : []

    // ===== Expand paket grup (bundle) menjadi item equipment =====
    // bundle = { bundle_id, quantity (jumlah paket) }.
    // Bila bundle punya bundle_items, item itu yang dicek/dikurangi stoknya.
    // Harga booking tetap memakai orderData (bundle_price × hari × qty paket).
    let bundleRow: any = null
    let bundleQty = 1
    if (bundle?.bundle_id) {
      bundleQty = Math.max(1, Math.round(Number(bundle.quantity) || 1))
      const { data: bRow, error: bErr } = await supabaseAdmin
        .from('bundles')
        .select('id, name, bundle_price, is_active')
        .eq('id', bundle.bundle_id)
        .maybeSingle()
      if (bErr || !bRow || bRow.is_active === false) {
        return NextResponse.json(
          { error: 'Paket tidak ditemukan atau tidak aktif' },
          { status: 400 }
        )
      }
      bundleRow = bRow

      let composition: any[] = []
      try {
        const { data: comp } = await supabaseAdmin
          .from('bundle_items')
          .select('quantity, equipment:equipment(id, price_per_night)')
          .eq('bundle_id', bundle.bundle_id)
        composition = comp || []
      } catch {
        composition = []
      }

      if (composition.length > 0) {
        const rentalDays = Math.max(1, Number(orderData.rental_days) || 1)
        itemsArray = composition
          .filter((c: any) => c.equipment?.id)
          .map((c: any) => {
            const perPackage = Math.max(1, Number(c.quantity) || 1)
            const qty = perPackage * bundleQty
            const unit = Number(c.equipment?.price_per_night) || 0
            return {
              equipment_id: c.equipment.id,
              quantity: qty,
              unit_price: unit,
              subtotal: unit * qty * rentalDays,
            }
          })
      } else {
        itemsArray = []
      }
    }

    if (itemsArray.length === 0 && !bundleRow) {
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

      // Validasi stok di cabang pengambilan untuk semua item.
      // Dilewati bila paket belum punya komposisi stok (itemsArray kosong).
      if (itemsArray.length > 0) {
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
          const available: number = Number(invMap.get(item.equipment_id) ?? 0) || 0
          const needed: number = Number(item.quantity) || 0
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

    // Insert all booking items (dilewati bila paket tanpa komposisi stok)
    if (itemsArray.length > 0) {
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
    }

    // Catat paket grup bila ada (snapshot harga paket per malam × hari × qty).
    if (bundleRow) {
      try {
        const unitBundle = Number(bundleRow.bundle_price) || Number(orderData.subtotal) || 0
        const rentalDays = Math.max(1, Number(orderData.rental_days) || 1)
        const bundleSubtotal = orderData.subtotal != null
          ? Number(orderData.subtotal)
          : unitBundle * rentalDays * bundleQty
        await supabaseAdmin.from('booking_bundle_items').insert({
          booking_id: newBooking.id,
          bundle_id: bundleRow.id,
          quantity: bundleQty,
          bundle_price: unitBundle,
          subtotal: bundleSubtotal,
        })
      } catch (bundleInsErr) {
        console.error('Error creating booking bundle item:', bundleInsErr)
      }
    }

    // ===== Decrement branch_inventory untuk cabang pengambilan =====
    if (orderData?.pickup_branch_id && itemsArray.length > 0) {
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
        const label = bundleRow
          ? `Paket ${bundleRow.name} ×${bundleQty}`
          : `Pesanan baru (${itemsArray.length} item)`
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: orderData.user_id,
            booking_id: newBooking.id,
            title: 'Pesanan Baru',
            message: `${label} ${userEmail ? ` dari ${userEmail}` : ' (Guest User)'}`,
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
