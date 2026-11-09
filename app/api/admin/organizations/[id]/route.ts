import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { clientOrganizations } from '@/lib/db/schema'
import { errorMessage, isDuplicateName, organizationPatch, toResponse } from '../shared'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * PUT/DELETE satu instansi. Berada di [id]/route.ts — Next hanya melayani
 * segmen dinamis di sini, bukan dari route.ts.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function connectDb() {
  try {
    return { db: getDb() as ReturnType<typeof getDb> }
  } catch (e: any) {
    return { error: NextResponse.json({ error: errorMessage(e) }, { status: 503 }) }
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const { id } = await params
  // uuid() di postgres menolak bentuk apa pun selain UUID; dicek lebih awal
  // supaya pesannya masuk akal, bukan "invalid input syntax for type uuid".
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID instansi tidak valid' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const patch = organizationPatch(body)
  if (patch === null) {
    return NextResponse.json(
      { error: 'Slug dokumentasi hanya boleh huruf kecil, angka, dan tanda hubung' },
      { status: 400 },
    )
  }
  if ('name' in patch && !patch.name) {
    return NextResponse.json({ error: 'Nama instansi wajib diisi' }, { status: 400 })
  }

  try {
    const rows = await conn.db
      .update(clientOrganizations)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(clientOrganizations.id, id))
      .returning()

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Instansi tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: toResponse(rows[0]) })
  } catch (e: any) {
    if (isDuplicateName(e)) {
      return NextResponse.json({ error: 'Nama instansi sudah dipakai' }, { status: 409 })
    }
    console.error('[admin/organizations] PUT gagal:', errorMessage(e))
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID instansi tidak valid' }, { status: 400 })
  }

  try {
    const rows = await conn.db
      .delete(clientOrganizations)
      .where(eq(clientOrganizations.id, id))
      .returning({ id: clientOrganizations.id })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Instansi tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: rows[0] })
  } catch (e: any) {
    console.error('[admin/organizations] DELETE gagal:', errorMessage(e))
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
