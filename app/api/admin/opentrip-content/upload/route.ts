import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'
import { requireAdmin } from '@/lib/admin-auth'

const BUCKET = 'opentrip-gallery'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const DEV_URL_PREFIX = '/uploads/opentrip-gallery'
const DEV_DIR = join('public', 'uploads', 'opentrip-gallery')

function extensionFor(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5 MB.' },
        { status: 400 },
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const name = `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file.type)}`

    if (DEV_LOCAL_AUTH) {
      const dir = join(process.cwd(), DEV_DIR)
      await mkdir(dir, { recursive: true })
      await writeFile(join(dir, name), bytes)
      return NextResponse.json({ data: { url: `${DEV_URL_PREFIX}/${name}` } })
    }

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(name, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      throw new Error(
        uploadError.message.includes('bucket')
          ? `Bucket Storage "${BUCKET}" belum ada. Jalankan supabase/migrations/20261122000000_add_opentrip_gallery_storage.sql.`
          : `Gagal menyimpan gambar: ${uploadError.message}`,
      )
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(name)
    if (!data?.publicUrl) throw new Error('URL publik gambar tidak bisa dibentuk')

    return NextResponse.json({ data: { url: data.publicUrl } })
  } catch (error) {
    console.error('[admin/opentrip-content/upload] gagal:', errorMessage(error))
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
