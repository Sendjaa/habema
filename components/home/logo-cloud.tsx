'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useHomeData } from './use-home-data'

/**
 * Logo cloud: instansi/lembaga/organisasi yang pernah menyewa.
 *
 * Baris hanya tampil bila ada data is_active — strip kepercayaan yang kosong
 * atau berisi nama yang belum izin justru menurunkan kredibilitas.
 * Tile yang belum punya halaman dokumentasi sengaja tidak dibuat tautan.
 */
export function LogoCloud() {
  const { home } = useHomeData()
  const organizations = home?.organizations ?? []

  if (organizations.length === 0) return null

  return (
    <section className="border-y border-border bg-background py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Dipercaya oleh instansi &amp; komunitas
        </p>

        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8 items-center justify-items-center">
          {organizations.map((org) => {
            const mark = org.logoUrl ? (
              <Image
                src={org.logoUrl}
                alt={`Logo ${org.name}`}
                width={160}
                height={48}
                className="h-8 md:h-10 w-auto object-contain grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
              />
            ) : (
              <span className="text-sm font-bold uppercase tracking-tight text-foreground/50 transition-colors hover:text-forest">
                {org.name}
              </span>
            )

            return (
              <li key={org.id} title={org.sector ?? org.name}>
                {org.documentationSlug ? (
                  <Link href={`/organisasi/${org.documentationSlug}`} className="block">
                    {mark}
                  </Link>
                ) : (
                  mark
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
