"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, 
  Map as MapIcon, 
  Activity, 
  ChevronRight,
  Maximize2,
  Anchor
} from "lucide-react";
 
const HABEMA_STATIONS = [
  { id: 1, x: 440, y: 535, name: "Gunung Prau", hub: "Central Java Hub", load: "92%" },
  { id: 2, x: 495, y: 555, name: "Gunung Merbabu", hub: "Merapi-Merbabu Sector", load: "78%" },
  { id: 3, x: 670, y: 610, name: "Gunung Rinjani", hub: "Lombok Base", load: "95%" },
  { id: 4, x: 1410, y: 560, name: "Carstensz Pyramid", hub: "Papua High-Altitude", load: "64%" },
];

export function HabemaRefinedMap() {
  const [activeStation, setActiveStation] = useState<number | null>(null);

  return (
    <section className="relative w-full h-[90vh] bg-white overflow-hidden font-sans border-y border-gray-100">
      
      {/* 1. ARCHITECTURAL GRID & SCANLINES */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none z-10" />

      {/* 2. THE REFINED INDONESIA VECTOR (Based on your Reference) */}
      <svg className="absolute inset-0 w-full h-full z-0 translate-y-10" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <g className="fill-gray-50 stroke-gray-200" strokeWidth="1.5" strokeLinejoin="round">
          {/* Sumatera - Siluet miring memanjang */}
          <motion.path 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            d="M 120 320 L 180 300 L 250 350 L 380 500 L 330 530 L 150 400 Z" 
          />
          {/* Kalimantan - Siluet blok tengah atas */}
          <motion.path 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            d="M 520 280 L 680 260 L 750 350 L 720 480 L 550 480 L 510 380 Z" 
          />
          {/* Jawa - Siluet horizontal panjang */}
          <motion.path 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            d="M 390 540 L 680 610 L 680 635 L 390 570 Z" 
          />
          {/* Sulawesi - Siluet huruf 'K' geometris */}
          <motion.path 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            d="M 800 320 L 920 320 L 920 380 L 860 420 L 930 520 L 890 540 L 810 440 L 790 510 L 760 500 Z" 
          />
          {/* Papua - Siluet kepala burung di timur */}
          <motion.path 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            d="M 1250 460 L 1320 440 L 1520 490 L 1540 620 L 1280 630 L 1280 550 Z" 
          />
        </g>

        {/* EXPEDITION LINE (Rute Perjalanan Habema) */}
        <motion.path
          d="M 440 535 C 460 545, 480 555, 495 555 S 600 600, 670 610 S 1100 580, 1410 560"
          fill="none"
          stroke="#000"
          strokeWidth="1.2"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />

        {/* DATA NODES (STATIONS) */}
        {HABEMA_STATIONS.map((node) => (
          <motion.g
            key={node.id}
            onMouseEnter={() => setActiveStation(node.id)}
            onMouseLeave={() => setActiveStation(null)}
            className="cursor-pointer pointer-events-auto"
          >
            {/* Base Ring */}
            <circle cx={node.x} cy={node.y} r="8" fill="white" stroke="#e5e7eb" strokeWidth="1" />
            <motion.circle
              cx={node.x} cy={node.y} r="4" fill="black"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: node.id * 0.3 }}
            />

            {/* HOVER TOOLTIP */}
            <AnimatePresence>
              {activeStation === node.id && (
                <motion.g initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <foreignObject x={node.x + 15} y={node.y - 45} width="160" height="90">
                    <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-3 rounded-lg shadow-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black italic uppercase">{node.name}</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-2">{node.hub}</div>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-gray-400">Current Load</span>
                        <span className="font-bold text-black">{node.load}</span>
                      </div>
                    </div>
                  </foreignObject>
                </motion.g>
              )}
            </AnimatePresence>
          </motion.g>
        ))}
      </svg>

      {/* 3. TACTICAL OVERLAYS */}

      {/* Top Center: System Status */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-8 bg-white px-8 py-3 rounded-full border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-300" />
          <span className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.2em]">National Gear Tracker v2.0</span>
        </div>
        <div className="h-4 w-[1px] bg-gray-100" />
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4 text-gray-300" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Supabase Active</span>
        </div>
      </div>

      {/* Right Sidebar: Quick Stats */}
      <div className="absolute top-1/2 right-10 -translate-y-1/2 z-20 space-y-4">
        {[
          { label: "Active Rents", val: "428", icon: <MapIcon className="w-3 h-3" /> },
          { label: "Hub Efficiency", val: "94%", icon: <Activity className="w-3 h-3" /> },
          { label: "Peak Load", val: "Carstensz", icon: <Maximize2 className="w-3 h-3" /> },
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="bg-white p-4 w-44 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-2 text-gray-300 mb-1">
              {item.icon}
              <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
            </div>
            <div className="text-xl font-black italic">{item.val}</div>
          </motion.div>
        ))}
      </div>

      {/* Brand Corner */}
      <div className="absolute bottom-10 left-10 z-20">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 border-2 border-black flex items-center justify-center rounded-full group-hover:bg-black group-hover:text-white transition-all">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black italic leading-none">HABEMA<span className="text-gray-300">.ID</span></h3>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.4em] flex items-center gap-1">
              Indonesia Expedition Network <ChevronRight className="w-2 h-2" />
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}