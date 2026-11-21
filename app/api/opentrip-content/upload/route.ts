import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const timestamp = Date.now()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = `gallery/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('opentrip-gallery')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[opentrip-gallery-upload] Gagal upload:', uploadError.message)
      return NextResponse.json({ error: 'Gagal mengunggah gambar' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('opentrip-gallery')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData?.publicUrl

    if (!publicUrl) {
      return NextResponse.json({ error: 'Gagal mendapatkan URL gambar' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    })
  } catch (error) {
    console.error('[opentrip-gallery-upload] Error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengunggah' },
      { status: 500 }
    )
  }
}
