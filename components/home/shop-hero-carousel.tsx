'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Package, Video } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShopHeroMedia, isHeroVideo } from '@/lib/shop-hero-types'

interface ShopHeroCarouselProps {
  media: ShopHeroMedia[]
  heading: string
}

export function ShopHeroCarousel({ media, heading }: ShopHeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const active = media.length ? media[Math.min(index, media.length - 1)] : null

  const go = (target: number) => {
    if (media.length === 0) return
    const next = ((target % media.length) + media.length) % media.length
    if (next === index) return
    setDirection(next > index ? 1 : -1)
    setIndex(next)
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
    center: { x: 0 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%' }),
  }

  return (
    <div className="flex justify-center lg:h-full lg:items-center">
      <div className="relative aspect-[1080/1350] w-full max-w-md overflow-hidden rounded-2xl bg-stone-100 lg:h-full lg:w-auto lg:max-w-none">
        {active ? (
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={active.url}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
            >
              {isHeroVideo(active.url) ? (
                <video src={active.url} controls playsInline className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={active.url}
                  alt={active.alt || heading}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-14 w-14 text-stone-300" />
          </div>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Media sebelumnya"
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Media berikutnya"
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {media.map((item, i) => (
                <button
                  key={`${item.url}-${i}`}
                  type="button"
                  aria-label={`Media ${i + 1}`}
                  onClick={() => go(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>
            {active && isHeroVideo(active.url) && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                Video
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}