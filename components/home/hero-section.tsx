"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Compass, Tent, Users } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import React, { useEffect, useState } from "react";

export function HeroSection() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bookingType, setBookingType] = useState<"rental" | "opentrip">("rental");

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
    },
  };

  useEffect(() => {
    const img = new window.Image();
    img.src = "/images/bannerImage.png";
    img.onload = () => setImageLoaded(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#F4EFE6] pt-28 pb-16 lg:py-0">
      {/* Background Subtle Pattern / Texture Accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#1b4332_1px,transparent_1px)] bg-size-[16px_16px]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative w-full lg:-mt-5.5">
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-10 items-center gap-12 lg:gap-8">
          
          {/* LEFT CONTENT */}
          <motion.div
            className="order-2 lg:order-1 lg:col-span-7 z-30 text-center lg:text-left flex flex-col justify-center lg:-mt-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Tagline Kecil */}
            <motion.span 
              variants={textVariants}
              className="text-xs font-bold tracking-widest text-orange-600 uppercase mb-3 block"
            >
              {/* Explore The Unseen World */}
            </motion.span>

            {/* Title dengan Typography Lebih Rapat & Tegas */}
            <motion.h1
              className="text-5xl md:text-7xl lg:text-[56px] relative xl:text-[76px] font-black leading-[0.95] tracking-tight text-[#1B4332] mx-auto lg:mx-0"
              variants={textVariants}
            >
              Rental &{" "}
              <span className="text-orange-600 font-serif italic font-semibold">
                Open Trip.
              </span>
            </motion.h1>

            {/* Deskripsi */}
            <motion.p
              className="mt-4 text-emerald-900/70 text-sm md:text-base lg:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0"
              variants={textVariants}
              transition={{ delay: 0.1 }}
            >
              Habema menyediakan perlengkapan pendakian premium dan trip terpandu untuk memastikan petualangan luar ruangan Anda aman, nyaman, dan tak terlupakan.
            </motion.p>

            {/* ================= MODERN FLOATING CARD FORM ================= */}
            <motion.div
              className="mt-8 bg-white rounded-3xl p-5 border border-stone-200/60 shadow-[0_20px_50px_rgba(27,67,50,0.06)] max-w-xl w-full mx-auto lg:mx-0 relative group"
              variants={textVariants}
              transition={{ delay: 0.2 }}
            >
              {/* Modern Segmented Control Tab */}
              <div className="inline-flex p-1 bg-stone-100 rounded-2xl mb-5 relative w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setBookingType("rental")}
                  className={`flex items-center justify-center gap-2 flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                    bookingType === "rental"
                      ? "bg-white text-[#1B4332] shadow-sm ring-1 ring-black/5"
                      : "text-stone-500 hover:text-[#1B4332]"
                  }`}
                >
                  <Tent className="w-3.5 h-3.5" />
                  Sewa Alat
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType("opentrip")}
                  className={`flex items-center justify-center gap-2 flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                    bookingType === "opentrip"
                      ? "bg-white text-[#1B4332] shadow-sm ring-1 ring-black/5"
                      : "text-stone-500 hover:text-[#1B4332]"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Ikut Open Trip
                </button>
              </div>

              {/* Form Grid Area */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-stone-100 pt-4 text-left">
                {bookingType === "rental" ? (
                  <>
                    {/* INPUT SEWA MULAI */}
                    <div className="group/input flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block pl-0.5">Mulai Sewa</span>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 h-12 focus-within:border-[#1B4332] focus-within:bg-white transition-all">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <input type="date" className="w-full bg-transparent text-xs font-semibold text-emerald-900 focus:outline-none cursor-pointer" />
                      </div>
                    </div>

                    {/* INPUT SEWA SELESAI */}
                    <div className="group/input flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block pl-0.5">Selesai Sewa</span>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 h-12 focus-within:border-[#1B4332] focus-within:bg-white transition-all">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <input type="date" className="w-full bg-transparent text-xs font-semibold text-emerald-900 focus:outline-none cursor-pointer" />
                      </div>
                    </div>

                    {/* SELECT DURASI */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block pl-0.5">Durasi</span>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 h-12 focus-within:border-[#1B4332] focus-within:bg-white transition-all">
                        <select className="w-full bg-transparent text-xs font-semibold text-emerald-900 focus:outline-none cursor-pointer appearance-none">
                          <option value="1">1 Hari Sewa</option>
                          <option value="2">2 Hari Sewa</option>
                          <option value="3">3 Hari Sewa</option>
                          <option value="4">4+ Hari Sewa</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* SELECT DESTINASI */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block pl-0.5">Destinasi</span>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 h-12 focus-within:border-[#1B4332] focus-within:bg-white transition-all">
                        <Compass className="w-4 h-4 text-stone-400 shrink-0" />
                        <select className="w-full bg-transparent text-xs font-semibold text-emerald-900 focus:outline-none cursor-pointer appearance-none">
                          <option value="">Pilih Gunung</option>
                          <option value="gede">Gede Pangrango</option>
                          <option value="merbabu">Gunung Merbabu</option>
                          <option value="prau">Gunung Prau</option>
                          <option value="rinjani">Gunung Rinjani</option>
                        </select>
                      </div>
                    </div>

                    {/* INPUT JADWAL BERANGKAT */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block pl-0.5">Keberangkatan</span>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 h-12 focus-within:border-[#1B4332] focus-within:bg-white transition-all">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <input type="date" className="w-full bg-transparent text-xs font-semibold text-emerald-900 focus:outline-none cursor-pointer" />
                      </div>
                    </div>

                    {/* SELECT TOTAL PESERTA */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block pl-0.5">Kuota Peserta</span>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 h-12 focus-within:border-[#1B4332] focus-within:bg-white transition-all">
                        <Users className="w-4 h-4 text-stone-400 shrink-0" />
                        <select className="w-full bg-transparent text-xs font-semibold text-emerald-900 focus:outline-none cursor-pointer appearance-none">
                          <option value="1">1 Orang</option>
                          <option value="2">2 Orang</option>
                          <option value="3">3 Orang</option>
                          <option value="4">4+ Orang</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
            {/* ====================================================== */}

            {/* BUTTON CTA & SOCIAL PROOF */}
            <motion.div
              className="flex flex-col items-center lg:items-start gap-6 pt-6"
              variants={textVariants}
              transition={{ delay: 0.3 }}
            >
              <Button
                size="lg"
                className="bg-[#1B4332] hover:bg-emerald-950 text-white rounded-xl px-10 h-14 text-xs font-bold tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/10 transition-all active:scale-98 w-full sm:w-fit uppercase"
                asChild
              >
                <Link href={bookingType === "rental" ? "/catalog_rental" : "/open-trip"}>
                  {bookingType === "rental" ? "Jelajahi Katalog Rental" : "Lihat Jadwal Trip"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

             
            </motion.div>
          </motion.div>

          {/* RIGHT CONTENT - BANNER IMAGE */}
          <motion.div
            className="order-1 lg:order-2 lg:absolute lg:-right-12 lg:top-1/2 lg:-translate-y-1/2 w-screen lg:w-[48%] xl:w-[54%] z-10 flex flex-col justify-center lg:-mt-10 lg:h-screen my-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full flex justify-center"
            >
              <Image
                src="/images/bannerImage.png"
                alt="Outdoor Gear & Adventure"
                width={850}
                height={750}
                className={`w-[85%] sm:w-[60%] md:w-[50%] lg:w-full h-auto object-contain transition-all duration-700 ${
                  imageLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-md"
                }`}
                priority
                sizes="(max-width: 768px) 60vw, (max-width: 1024px) 50vw, 48vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oAAMBAAIRAxEAPwCdABmX/9k="
              />
              
            </motion.div>
                 <div className="flex items-center gap-4 lg:mt-10">
                <div className="flex -space-x-2.5">
                  {[
                    "https://i.pinimg.com/1200x/ed/65/02/ed65027a80e9751a36aa504460ba7694.jpg",
                    "https://i.pinimg.com/1200x/3d/f6/cb/3df6cb7c9feaf11791ab725fdea0d372.jpg",
                    "https://i.pinimg.com/736x/ca/3e/c5/ca3ec5e1cb2553c0c89db029ff67d7cf.jpg"
                  ].map((src, i) => (
                    <div key={i} className="w-8 h-8 rounded-full ring-2 ring-[#F4EFE6] overflow-hidden bg-stone-200 relative shadow-sm">
                      <Image src={src} alt={`User ${i}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-[11px] font-extrabold text-emerald-900/60 uppercase tracking-widest">
                  Join 2,000+ Adventurers
                </div>
              </div>
          </motion.div>
        </div>

        {/* Ambient Glow / Clean Blur Effect */}
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-800/3 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-600/2 rounded-full blur-[100px] -z-10 pointer-events-none" />
      </div>
    </section>
  );
}