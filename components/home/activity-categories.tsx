'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useHomeData } from './use-home-data'

export function ActivityCategories() {
  const { home } = useHomeData()
  const items = home?.activities ?? []

  // if (items.length === 0) return null

  return (
    <section className="pt-10 md:pt-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
          <div className="space-y-3">
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold font-sans text-stone-900 tracking-tighter leading-[0.9]">
              <span>Aktivitas.</span>
            </h3>
          </div>
        </div>

        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0">
          {items.map((activity) => (
            <Link
              key={activity.slug}
              href={`/kegiatan/${activity.slug}`}
              className="group relative block shrink-0 grow-0 basis-[144px] aspect-square overflow-hidden rounded-xl bg-stone-100 shadow-sm transition-all hover:shadow-md sm:basis-[160px] lg:shrink lg:basis-auto lg:min-w-0 lg:aspect-4/3 lg:rounded-2xl"
            >
              <Image
                src={activity.imageUrl}
                alt={activity.imageAlt ?? activity.label}
                fill
                sizes="(min-width: 1024px) 397px, (min-width: 640px) 160px, 144px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-stone-900/85 to-transparent lg:h-1/2 lg:from-stone-900/90" />

              <div className="absolute inset-x-0 bottom-0 p-2 md:p-3 lg:p-5">
                <h2 className="truncate lg:text-2xl font-sans text-[10px] font-bold uppercase tracking-tight text-white md:text-xl lg:tracking-tight">
                  {activity.label}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
