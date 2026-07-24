import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch (e: any) {
      console.error('Supabase admin init failed:', e.message)
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { user_id, idType, idNumber, photoUrl, fullName, validationResults } = body

    if (!user_id || !idType || !idNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, idType, idNumber' },
        { status: 400 }
      )
    }

    // Check if identity already exists
    const { data: existing } = await supabaseAdmin
      .from('user_identity')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle()

    let result
    if (existing) {
      result = await supabaseAdmin
        .from('user_identity')
        .update({
          id_type: idType,
          id_number: idNumber,
          id_photo_url: photoUrl || null,
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .select()
        .single()
    } else {
      result = await supabaseAdmin
        .from('user_identity')
        .insert({
          user_id,
          id_type: idType,
          id_number: idNumber,
          id_photo_url: photoUrl || null,
          verification_status: 'pending',
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Supabase error upserting identity:', result.error)
      return NextResponse.json(
        { error: 'Failed to save identity' },
        { status: 500 }
      )
    }

    // Create admin notification
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: null,
          title: 'Verifikasi ID Baru',
          message: `User telah mengupload identitas ${idType.toUpperCase()} dengan nomor ${idNumber}.`,
          notification_type: 'id_verification',
          is_read: false,
          metadata: {
            user_id,
            id_type: idType,
            id_number: idNumber,
            full_name: fullName || '',
            verification_status: validationResults?.authenticity || 'pending',
            confidence: validationResults?.confidence || 0,
            issues: validationResults?.issues || [],
          },
        })
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr)
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Identity upsert API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
