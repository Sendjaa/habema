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
    <section className="relative min-h-screen lg:min-h-screen overflow-hidden bg-[#F2EDE4] flex items-center pt-20 lg:pt-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative w-full h-full">
        
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 items-center h-full gap-12 lg:gap-0">
          
          {/* Left Content */}
          <motion.div 
            className="order-2 lg:order-1 lg:col-span-7 z-30 space-y-4 lg:space-y-2 lg:pr-10 lg:-mt-25 text-center lg:text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h1 
              className="text-6xl md:text-7xl lg:text-[100px] font-black leading-[1] lg:leading-[1.1] tracking-tighter text-[#1B4332]"
              variants={textVariants}
            >
              Camping<br />
              <span className="text-orange-600"> & Tracking.</span>
            </motion.h1>

            <motion.p 
              className="text-emerald-900/70 text-base md:text-lg leading-relaxed max-w-md mx-auto lg:mx-0"
              variants={textVariants}
              transition={{ delay: 0.2 }}
            >
              Habema menyediakan perlengkapan pendakian terbaik untuk memastikan keamanan petualangan Anda di setiap medan.
            </motion.p>

            <motion.div 
              className="flex flex-col items-center lg:items-start gap-6 pt-6"
              variants={textVariants}
              transition={{ delay: 0.4 }}
            >
              <Button
                size="lg"
                className="bg-[#1B4332] hover:bg-emerald-900 text-white rounded-xl px-10 h-16 text-md font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95 w-full sm:w-fit"
                asChild
              >
                <Link href="/catalog">
                  JELAJAHI KATALOG
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <Image src="https://i.pinimg.com/1200x/ed/65/02/ed65027a80e9751a36aa504460ba7694.jpg" alt="User 1" width={36} height={36} className="w-9 h-9 rounded-full border-2 border-[#F2EDE4]" />
                  <Image src="https://i.pinimg.com/1200x/3d/f6/cb/3df6cb7c9feaf11791ab725fdea0d372.jpg" alt="User 2" width={36} height={36} className="w-9 h-9 rounded-full border-2 border-[#F2EDE4]" />
                  <Image src="https://i.pinimg.com/736x/ca/3e/c5/ca3ec5e1cb2553c0c89db029ff67d7cf.jpg" alt="User 3" width={36} height={36} className="w-9 h-9 rounded-full border-2 border-[#F2EDE4]" />
                </div>
                <div className="text-sm font-bold text-emerald-900">
                  2K+ Adventurers Joined
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Mobile Friendly */}
          <motion.div 
            className="order-1 lg:order-2 relative lg:absolute lg:-right-27 lg:top-1/2 lg:-translate-y-1/2 w-full lg:w-[60%] z-10 flex justify-center lg:block"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.img 
              src="/images/bannerImage.png" 
              alt="Outdoor Adventure Gear" 
              className="block h-auto w-[85%] md:w-[60%] lg:w-full object-contain origin-center lg:origin-right"
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

        </div>

        {/* Decorative Background Blur - Subtle on Mobile */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-emerald-900/5 rounded-full blur-[80px] lg:blur-[120px] -z-10" />
      </div>
    </section>
  );
}