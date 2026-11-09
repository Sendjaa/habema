'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShopHeroMedia, isHeroVideo } from '@/lib/shop-hero-types'

interface ShopHeroThumbnailsProps {
  media: ShopHeroMedia[]
  heading: string
}

export function ShopHeroThumbnails({ media, heading }: ShopHeroThumbnailsProps) {
  const [index, setIndex] = useState(0)

  return (
    <div className="flex flex-wrap gap-2">
      {media.map((item, i) => (
        <button
          key={`${item.url}-${i}`}
          type="button"
          onClick={() => setIndex(i)}
          className={`relative h-14 w-[46px] overflow-hidden rounded-lg border-2 transition-all ${
            index === i ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
          }`}
        >
          {isHeroVideo(item.url) ? (
            <span className="flex h-full w-full items-center justify-center bg-slate-900 text-[10px] text-black">▶</span>
          ) : (
            <Image src={item.url} alt={item.alt || `${heading} ${i + 1}`} fill sizes="46px" className="object-cover" />
          )}
        </button>
      ))}
    </div>
  )
}