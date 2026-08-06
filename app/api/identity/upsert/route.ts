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
    const { user_id, idType, idNumber, photoUrl, fullName, validationResults } = body

    if (!user_id || !idType || !idNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, idType, idNumber' },
        { status: 400 }
      )
    }

    // Pastikan baris public.users ada untuk user ini, jika tidak INSERT di bawah
    // akan gagal FK (23503): user_identity.user_id -> public.users.id
    if (ensureUserRecord) {
      await ensureUserRecord(user_id)
    }

    // Upsert atomik: user_identity punya constraint unique (user_id).
    const { data, error } = await supabaseAdmin
      .from('user_identity')
      .upsert(
        {
          user_id,
          id_type: idType,
          id_number: idNumber,
          id_photo_url: photoUrl || null,
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Supabase error upserting identity:', error)
      return NextResponse.json(
        {
          error: 'Failed to save identity',
          detail: error.message,
          code: error.code,
          hint: error.hint ?? null,
        },
        { status: 500 }
      )
    }

    // Create admin notification (user_id sekarang valid karena ensureUserRecord)
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id,
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

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Identity upsert API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', detail: error?.message || null },
      { status: 500 }
    )
  }
}
