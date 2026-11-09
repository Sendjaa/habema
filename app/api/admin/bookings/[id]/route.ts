import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

async function getSupabase() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 404 })
    }

    const { data: items } = await supabaseAdmin
      .from('booking_items')
      .select(`
        *,
        equipment (
          name,
          description,
          image_url
        )
      `)
      .eq('booking_id', id)

    // Fetch user profile
    let userProfile = null
    let userIdentity = null
    if (booking.user_id) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, full_name')
        .eq('id', booking.user_id)
        .single()
      userProfile = user || null

      const { data: identity } = await supabaseAdmin
        .from('user_identity')
        .select('*')
        .eq('user_id', booking.user_id)
        .maybeSingle()
      userIdentity = identity || null
    }

    return NextResponse.json({
      success: true,
      data: {
        booking: { ...booking, user_profile: userProfile, user_identity: userIdentity },
        items: items || [],
      },
    })
  } catch (error) {
    console.error('Admin booking detail API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { status, payment_status } = body

    if (!status && !payment_status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    if (status) updateData.status = status
    if (payment_status) {
      const allowed = ['pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded']
      if (!allowed.includes(payment_status)) {
        return NextResponse.json({ error: 'payment_status tidak valid' }, { status: 400 })
      }
      updateData.payment_status = payment_status
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Jika pembayaran ditolak / booking dibatalkan: kembalikan stok yang
    // sudah di-decrement saat booking dibuat (best-effort, jangan gagalkan).
    const needsRestore = payment_status === 'failed' || status === 'cancelled'
    if (needsRestore) {
      try {
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('pickup_branch_id')
          .eq('id', id)
          .single()
        const { data: items } = await supabaseAdmin
          .from('booking_items')
          .select('equipment_id, quantity')
          .eq('booking_id', id)

        if (booking?.pickup_branch_id && items && items.length > 0) {
          for (const item of items) {
            const { data: invRow } = await supabaseAdmin
              .from('branch_inventory')
              .select('id, quantity')
              .eq('branch_id', booking.pickup_branch_id)
              .eq('equipment_id', item.equipment_id)
              .maybeSingle()
            if (invRow) {
              await supabaseAdmin
                .from('branch_inventory')
                .update({
                  quantity: Number(invRow.quantity || 0) + Number(item.quantity || 0),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', invRow.id)
            }
          }
        }
      } catch (restoreErr: any) {
        console.warn('Stock restore failed:', restoreErr?.message || restoreErr)
      }
    }

    // Email hasil verifikasi ke pelanggan (best-effort).
    if (payment_status === 'paid' || payment_status === 'failed') {
      try {
        const { sendPaymentDecisionEmail } = await import('@/lib/booking-email');
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('id, user_id, total_cost')
          .eq('id', id)
          .single();
        let customerEmail: string | null = null;
        if (booking?.user_id) {
          const { data } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
          customerEmail = (data?.user as any)?.email || null;
        }
        if (customerEmail) {
          await sendPaymentDecisionEmail(customerEmail, {
            bookingId: id,
            total: Number(booking?.total_cost) || 0,
            approved: payment_status === 'paid',
          });
        }
      } catch (emailErr: any) {
        console.error('Error sending decision email:', emailErr?.message || emailErr);
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin booking update API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin booking delete API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
