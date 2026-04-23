"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

export function HeroSection() {
  const textVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] as any } 
    },
  };

  return (
    <section className="relative min-h-full md:min-h-screen flex items-center overflow-hidden bg-[#F2EDE4] pt-24 pb-12 lg:py-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative w-full">
        
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-0">
          
          {/* Left Content */}
          <motion.div 
            className="order-2 lg:order-1 lg:col-span-7 z-30 lg:pr-10 text-center lg:text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-[90px] xl:text-[100px] font-black leading-[0.95] lg:leading-[1] tracking-tighter text-[#1B4332]"
              variants={textVariants}
            >
              Camping<br />
              <span className="text-orange-600 font-serif italic font-medium"> & Trekking.</span>
            </motion.h1>

            <motion.p 
              className="text-emerald-900/70 text-sm md:text-lg leading-relaxed max-w-md mx-auto lg:mx-0"
              variants={textVariants}
              transition={{ delay: 0.2 }}
            >
              Habema menyediakan perlengkapan pendakian terbaik untuk memastikan keamanan petualangan Anda di setiap medan.
            </motion.p>

            <motion.div 
              className="flex flex-col items-center lg:items-start gap-6 pt-4"
              variants={textVariants}
              transition={{ delay: 0.4 }}
            >
              <Button
                size="lg"
                className="bg-[#1B4332] hover:bg-emerald-900 text-white rounded-xl px-10 h-16 text-sm font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95 w-full sm:w-fit"
                asChild
              >
                <Link href="/catalog">
                  JELAJAHI KATALOG
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-9 h-9 rounded-full border-2 border-[#F2EDE4] overflow-hidden bg-stone-200">
                    <Image src="https://i.pinimg.com/1200x/ed/65/02/ed65027a80e9751a36aa504460ba7694.jpg" alt="U1" width={36} height={36} className="object-cover h-full" />
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 border-[#F2EDE4] overflow-hidden bg-stone-200">
                    <Image src="https://i.pinimg.com/1200x/3d/f6/cb/3df6cb7c9feaf11791ab725fdea0d372.jpg" alt="U2" width={36} height={36} className="object-cover h-full" />
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 border-[#F2EDE4] overflow-hidden bg-stone-200">
                    <Image src="https://i.pinimg.com/736x/ca/3e/c5/ca3ec5e1cb2553c0c89db029ff67d7cf.jpg" alt="U3" width={36} height={36} className="object-cover h-full" />
                  </div>
                </div>
                <div className="text-[11px] md:text-sm font-bold text-emerald-900 uppercase tracking-wider">
                  2K+ Adventurers Joined
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Responsive Image */}
          <motion.div 
            className="order-1 lg:order-2 relative lg:absolute lg:-right-20 lg:top-1/2 lg:-translate-y-1/2 w-full lg:w-[55%] xl:w-[60%] z-10 flex justify-center sm:top-0 sm:-mt-20"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <motion.img 
              src="/images/bannerImage.png" 
              alt="Outdoor Gear" 
              className="w-[90%] sm:w-[70%] md:w-[60%] lg:w-full h-auto object-contain"
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

        </div>

        {/* Decor Blur */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[250px] lg:w-[500px] h-[250px] lg:h-[500px] bg-emerald-900/5 rounded-full blur-[80px] -z-10" />
      </div>
    </section>
  );
}