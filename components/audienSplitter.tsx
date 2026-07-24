"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OptimizedImage } from "@/components/optimized-image";

type Panel = {
  id: string;
  title: React.ReactNode;
  gradient: string;
  bg: string;
  desc: string;
  thumbs: string[];
  cta: string;
  ctaClass: string;
  href: string;
};

const panels: Panel[] = [
  {
    id: "rental",
    title: (
      <>
        Ambil <br /> <span className="text-white">Tanpa Beli</span>
      </>
    ),
    gradient: "from-emerald-500/10 to-transparent",
    bg: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2070",
    desc: "Alat outdoor berkualitas tanpa harus beli. Ambil, pakai, kembalikan.",
    thumbs: [
      "https://i.pinimg.com/1200x/cc/bb/d2/ccbbd2653a61b9d536db636009c3e475.jpg",
      "https://i.pinimg.com/736x/82/46/b7/8246b71509780b2af27129d52d540c29.jpg",
    ],
    cta: "SEWA SEKARANG",
    ctaClass: "bg-emerald-600 text-white hover:bg-white hover:text-black",
    href: "/catalog_rental",
  },
  {
    id: "shop",
    title: (
      <>
        Jadi <br /> <span className="text-white">Petualang</span>
      </>
    ),
    gradient: "from-sky-500/10 to-transparent",
    bg: "https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=2003",
    desc: "Perlengkapan dan apparel resmi untuk koleksi petualanganmu.",
    thumbs: [
      "https://i.pinimg.com/1200x/1b/9b/9b/1b9b9bf1bb5560bd4c9b89b3f5fa2e3e.jpg",
      "https://i.pinimg.com/1200x/ed/4e/36/ed4e367a6d39a3306dfd94144fcd6df1.jpg",
    ],
    cta: "BELANJA",
    ctaClass: "bg-sky-600 text-white hover:bg-white hover:text-black",
    href: "/catalog_shop",
  },
  {
    id: "opentrip",
    title: (
      <>
        Gabung <br /> <span className="text-white">Jangan Sendiri</span>
      </>
    ),
    gradient: "from-orange-500/10 to-transparent",
    bg: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070",
    desc: "Gabung trip bareng komunitas. Guide, rute, dan gear lengkap.",
    thumbs: [
      "https://i.pinimg.com/1200x/cc/bb/d2/ccbbd2653a61b9d536db636009c3e475.jpg",
      "https://i.pinimg.com/736x/82/46/b7/8246b71509780b2af27129d52d540c29.jpg",
    ],
    cta: "IKUT TRIP",
    ctaClass: "bg-orange-600 text-white hover:bg-white hover:text-black",
    href: "/opentrip",
  },
  {
    id: "bebas",
    title: (
      <>
        Kabur <br /> <span className="text-white">Sebentar</span>
      </>
    ),
    gradient: "from-fuchsia-500/10 to-transparent",
    bg: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070",
    desc: "Camping santai, glamping, atau sekadar healing di alam. Bebas pilih.",
    thumbs: [
      "https://i.pinimg.com/1200x/1b/9b/9b/1b9b9bf1bb5560bd4c9b89b3f5fa2e3e.jpg",
      "https://i.pinimg.com/1200x/ed/4e/36/ed4e367a6d39a3306dfd94144fcd6df1.jpg",
    ],
    cta: "JELAJAHI",
    ctaClass: "bg-fuchsia-600 text-white hover:bg-white hover:text-black",
    href: "/bundles",
  },
];

export function AudienceSplitter() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="relative w-full lg:h-[90vh] min-h-[50vh] bg-[#0a0a0a] overflow-hidden flex flex-col lg:flex-row border-y border-white/5">
      {panels.map((p, i) => {
        const isActive = active === p.id;
        const isDimmed = active !== null && !isActive;
        return (
          <motion.div
            key={p.id}
            className={`relative flex-1 flex flex-col justify-center items-center px-4 lg:px-8 py-6 lg:py-10 overflow-hidden cursor-pointer min-h-[50vh] lg:min-h-0 ${
              i === 0 ? "" : "lg:border-l lg:border-white/10"
            }`}
            onMouseEnter={() => setActive(p.id)}
            onMouseLeave={() => setActive(null)}
            animate={{ flex: isActive ? 2.5 : isDimmed ? 0.5 : 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="absolute inset-0 z-0"
              animate={{
                scale: isActive ? 1.05 : 1,
                filter: isDimmed
                  ? "grayscale(1) brightness(0.2)"
                  : "grayscale(0) brightness(0.4)",
              }}
              transition={{ duration: 0.8 }}
            >
              <OptimizedImage
                src={p.bg}
                className="w-full h-full object-cover"
                alt={p.id}
                width={1920}
                height={1080}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </motion.div>

            <div
              className={`absolute inset-0 bg-linear-to-br ${p.gradient} opacity-50 z-10`}
            />

            <div
              className={`relative z-20 text-center w-full max-w-sm flex flex-col items-center ${
                isActive ? "" : "lg:opacity-80"
              }`}
            >
              <h2 className="text-3xl lg:text-5xl font-black text-white leading-none tracking-tighter mb-6 italic uppercase">
                {p.title}
              </h2>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-6 flex flex-col items-center"
                  >
                    <p className="text-white text-sm max-w-xs leading-relaxed text-center">
                      {p.desc}
                    </p>
                    <div className="flex gap-3">
                      {p.thumbs.map((img, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-20 lg:w-20 lg:h-28 rounded-lg overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all"
                        >
                          <OptimizedImage
                            src={img}
                            className="w-full h-full object-cover"
                            alt={p.id}
                            width={80}
                            height={112}
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      asChild
                      className={`${p.ctaClass} rounded-none px-8 h-12 text-xs font-black transition-colors`}
                      aria-label={p.cta}
                    >
                      <Link href={p.href}>{p.cta}</Link>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-50 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
    </section>
  );
}
