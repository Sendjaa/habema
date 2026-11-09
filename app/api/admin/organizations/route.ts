import { NextRequest, NextResponse } from 'next/server'
import { asc, ilike, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { clientOrganizations } from '@/lib/db/schema'
import { errorMessage, isDuplicateName, organizationPatch, toResponse } from './shared'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Daftar + pembuatan client_organizations, instansi yang tampil di logo cloud
 * homepage. Edit dan hapus satu baris ada di [id]/route.ts.
 *
 * Lewat drizzle, bukan supabaseAdmin: tabel ini belum ada di types/supabase.ts
 * hasil `supabase gen types`, sedangkan schema drizzle sudah mengenalnya
 * (lib/db/schema.ts). Sama seperti /api/home yang membaca tabel yang sama.
 */

function connectDb() {
  try {
    return { db: getDb() as ReturnType<typeof getDb> }
  } catch (e: any) {
    return { error: NextResponse.json({ error: errorMessage(e) }, { status: 503 }) }
  }
}

function readValues(body: any) {
  const patch = organizationPatch(body)
  if (patch === null) {
    return {
      error: NextResponse.json(
        { error: 'Slug dokumentasi hanya boleh huruf kecil, angka, dan tanda hubung' },
        { status: 400 },
      ),
    }
  }
  return { patch }
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const raw = request.nextUrl.searchParams.get('search')?.trim() ?? ''
  // ilike memakai % dan _ sebagai wildcard; buang agar pencarian tetap literal.
  const like = `%${raw.replace(/[%_()]/g, '')}%`

  try {
    const rows = await conn.db
      .select()
      .from(clientOrganizations)
      .where(raw ? or(ilike(clientOrganizations.name, like), ilike(clientOrganizations.sector, like)) : undefined)
      .orderBy(asc(clientOrganizations.displayOrder), asc(clientOrganizations.name))

    return NextResponse.json({ success: true, data: rows.map(toResponse) })
  } catch (e: any) {
    console.error('[admin/organizations] GET gagal:', errorMessage(e))
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const body = await request.json().catch(() => ({}))
  const values = readValues(body)
  if (values.error) return values.error

  const name = values.patch?.name
  if (!name) {
    return NextResponse.json({ error: 'Nama instansi wajib diisi' }, { status: 400 })
  }

  try {
    const [row] = await conn.db
      .insert(clientOrganizations)
      .values({ ...values.patch, name, updatedAt: new Date() })
      .returning()

    return NextResponse.json({ success: true, data: toResponse(row) })
  } catch (e: any) {
    if (isDuplicateName(e)) {
      return NextResponse.json(
        { error: `Instansi "${name}" sudah terdaftar` },
        { status: 409 },
      )
    }
    console.error('[admin/organizations] POST gagal:', errorMessage(e))
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
