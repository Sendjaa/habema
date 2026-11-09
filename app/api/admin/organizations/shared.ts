import { clientOrganizations } from '@/lib/db/schema'

/**
 * Pemetaan body → kolom client_organizations, dipakai POST dan PUT.
 *
 * Nama field di body mengikuti konvensi admin lain di repo ini: snake_case
 * seperti kolom database (lihat app/api/admin/bundles/route.ts).
 */

export type OrgBody = Record<string, any>

/** Trim; string kosong / null / undefined jadi null. */
export function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * documentation_slug masuk ke URL publik /organisasi/[slug], jadi bentuknya
 * dibatasi: huruf kecil, angka, tanda hubung. null berarti "belum ada halaman".
 */
export function normalizeSlug(value: unknown): string | null {
  const raw = optionalText(value)
  if (!raw) return null
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || null
}

/** true hanya bila dikirim benar-benar true; default database tetap false. */
function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1
}

export function errorMessage(e: any): string {
  return e instanceof Error ? e.message : String(e)
}

/**
 * Drizzle membungkus error pg, jadi kode 23505 (unique violation) ada di
 * `e.cause`, bukan di error terluar — dan pesan terluarnya cuma berisi
 * "Failed query: ...". Diperiksa sampai dua level.
 */
export function isDuplicateName(e: any): boolean {
  const codes = [e?.code, e?.cause?.code]
  if (codes.includes('23505')) return true
  return /client_organizations_name_key/i.test(`${errorMessage(e)} ${errorMessage(e?.cause)}`)
}

/**
 * Baris drizzle memakai nama properti camelCase; seluruh admin page di repo
 * ini membaca baris Supabase yang snake_case. Diseragamkan di sini supaya
 * halaman tidak perlu tahu tabelnya dibaca lewat drizzle.
 */
export function toResponse(row: any) {
  return {
    id: row.id as string,
    name: row.name as string,
    logo_url: row.logoUrl ?? null,
    sector: row.sector ?? null,
    documentation_slug: row.documentationSlug ?? null,
    display_order: row.displayOrder ?? 0,
    is_active: row.isActive ?? false,
    consent_note: row.consentNote ?? null,
  }
}

/**
 * Mengembalikan hanya kolom yang dikirim. `undefined` dibiarkan begitu supaya
 * drizzle memakai default kolom saat INSERT.
 *
 * Mengembalikan `null` bila slug dikirim tapi tidak bisa dinormalisasi —
 * pemanggil membalas 400.
 */
export function organizationPatch(
  body: OrgBody,
): Partial<typeof clientOrganizations.$inferInsert> | null {
  const patch: Partial<typeof clientOrganizations.$inferInsert> = {}

  if ('name' in body) {
    const name = optionalText(body.name)
    if (!name) return patch // pemanggil yang memvalidasi kehadiran nama
    patch.name = name
  }

  if ('logo_url' in body) patch.logoUrl = optionalText(body.logo_url)
  if ('sector' in body) patch.sector = optionalText(body.sector)
  if ('consent_note' in body) patch.consentNote = optionalText(body.consent_note)

  if ('documentation_slug' in body) {
    const raw = optionalText(body.documentation_slug)
    if (raw) {
      const slug = normalizeSlug(raw)
      if (!slug) return null
      patch.documentationSlug = slug
    } else {
      patch.documentationSlug = null
    }
  }

  if ('display_order' in body) {
    const n = Number(body.display_order)
    patch.displayOrder = Number.isFinite(n) ? Math.round(n) : 0
  }

  if ('is_active' in body) patch.isActive = toBoolean(body.is_active)

  return patch
}
