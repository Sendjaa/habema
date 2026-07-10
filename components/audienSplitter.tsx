"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Zap, Wind } from "lucide-react";
import { OptimizedImage } from "@/components/optimized-image";

const beginnersContent = [
  { id: 1, img: "https://i.pinimg.com/1200x/cc/bb/d2/ccbbd2653a61b9d536db636009c3e475.jpg", title: "Soft Treking" },
  { id: 2, img: "https://i.pinimg.com/736x/82/46/b7/8246b71509780b2af27129d52d540c29.jpg", title: "Base Camp" },
];

const expertsContent = [
  { id: 1, img: "https://i.pinimg.com/1200x/1b/9b/9b/1b9b9bf1bb5560bd4c9b89b3f5fa2e3e.jpg", title: "Vertical Limit" },
  { id: 2, img: "https://i.pinimg.com/1200x/ed/4e/36/ed4e367a6d39a3306dfd94144fcd6df1.jpg", title: "Peak Season" },
];

export function AudienceSplitter() {
  const [activeSide, setActiveSide] = useState<"left" | "right" | null>(null);

  return (
    // Height diatur ke 90vh, overflow hidden agar tidak bocor
    <section className="relative w-full h-[90vh] bg-[#0a0a0a] overflow-hidden flex flex-col lg:flex-row border-y border-white/5">
      
      {/* --- LEFT SIDE: BEGINNERS --- */}
      <motion.div 
        className="relative flex-1 flex flex-col justify-center items-center p-6 lg:p-16 overflow-hidden cursor-pointer"
        onMouseEnter={() => setActiveSide("left")}
        onMouseLeave={() => setActiveSide(null)}
        animate={{ 
          flex: activeSide === "left" ? 2.5 : activeSide === "right" ? 0.5 : 1,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          className="absolute inset-0 z-0"
          animate={{ 
            scale: activeSide === "left" ? 1.05 : 1, 
            filter: activeSide === "right" ? "grayscale(1) brightness(0.2)" : "grayscale(0) brightness(0.4)" 
          }}
          transition={{ duration: 0.8 }}
        >
          <OptimizedImage src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2070" className="w-full h-full object-cover" alt="Beginner" width={1920} height={1080} loading="eager" priority="high" />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50 z-10" />

        <div className="relative z-20 text-center lg:text-left w-full max-w-xl">
          <motion.div className="inline-flex items-center gap-2 mb-4 text-emerald-400 font-mono text-[10px] tracking-[0.3em] uppercase">
            <Wind className="w-3 h-3" /> Level 01: Explorer
          </motion.div>
          
          <h2 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter mb-6 italic uppercase">
            The <br /> <span className="text-emerald-500">Gentle</span> <br /> Wild.
          </h2>

          <AnimatePresence>
            {activeSide === "left" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                <p className="text-gray-300 text-sm lg:text-base max-w-xs leading-relaxed">
                  Petualangan santai dengan perlengkapan yang mengutamakan kenyamanan maksimal.
                </p>
                <div className="flex gap-3">
                  {beginnersContent.map(item => (
                    <div key={item.id} className="w-16 h-20 lg:w-20 lg:h-28 rounded-lg overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all">
                      <OptimizedImage src={item.img} className="w-full h-full object-cover" alt={item.title} width={80} height={112} loading="lazy" />
                    </div>
                  ))}
                </div>
                <Button className="bg-white text-black hover:bg-emerald-500 hover:text-white rounded-none px-8 h-12 text-xs font-black transition-colors" aria-label="Mulai perjalanan untuk pemula">
                  START JOURNEY
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* --- CENTER DIVIDER (KINETIC) --- */}
      <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-white/20 z-1">
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center mix-blend-difference"
            animate={{ rotate: activeSide === "right" ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <Compass className="w-6 h-6 text-white" />
          </motion.div>
      </div>

      {/* --- RIGHT SIDE: EXPERTS --- */}
      <motion.div 
        className="relative flex-1 flex flex-col justify-center items-center p-6 lg:p-16 overflow-hidden cursor-pointer"
        onMouseEnter={() => setActiveSide("right")}
        onMouseLeave={() => setActiveSide(null)}
        animate={{ 
          flex: activeSide === "right" ? 2.5 : activeSide === "left" ? 0.5 : 1,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          className="absolute inset-0 z-0"
          animate={{ 
            scale: activeSide === "right" ? 1.05 : 1, 
            filter: activeSide === "left" ? "grayscale(1) brightness(0.2)" : "grayscale(0) brightness(0.4)" 
          }}
          transition={{ duration: 0.8 }}
        >
          <OptimizedImage src="https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=2003" className="w-full h-full object-cover" alt="Expert" width={1920} height={1080} loading="eager" priority="high" />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/10 to-transparent opacity-50 z-10" />

        <div className="relative z-20 text-center lg:text-right w-full max-w-xl flex flex-col lg:items-end">
          <motion.div className="inline-flex items-center gap-2 mb-4 text-orange-400 font-mono text-[10px] tracking-[0.3em] uppercase">
            Level 99: Summit <Zap className="w-3 h-3" />
          </motion.div>
          
          <h2 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter mb-6 italic uppercase">
            The <br /> <span className="text-orange-500">Brutal</span> <br /> Peak.
          </h2>

          <AnimatePresence>
            {activeSide === "right" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6 flex flex-col items-center lg:items-end"
              >
                <p className="text-gray-300 text-sm lg:text-base max-w-xs leading-relaxed text-center lg:text-right">
                  Perlengkapan teknis tanpa kompromi untuk mereka yang mendaki lebih tinggi.
                </p>
                <div className="flex gap-3">
                  {expertsContent.map(item => (
                    <div key={item.id} className="w-16 h-20 lg:w-20 lg:h-28 rounded-lg overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all">
                      <OptimizedImage src={item.img} className="w-full h-full object-cover" alt={item.title} width={80} height={112} loading="lazy" />
                    </div>
                  ))}
                </div>
                <Button className="bg-orange-600 text-white hover:bg-white hover:text-black rounded-none px-8 h-12 text-xs font-black transition-colors" aria-label="Tantang puncak untuk ahli">
                  CHALLENGE PEAK
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-50 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
    </section>
  );
}