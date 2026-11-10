"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowRight,
  ChevronDown,
  Compass,
  Search,
  Tent,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/datetime-picker";

/**
 * Hero: foto memenuhi layar dengan overlay gelap, konten di tengah — bentuk
 * yang diminta aturan "lead with large, high-quality photography".
 *
 * Komponen ini yang dipakai app/page.tsx sebagai section pertama. Hero lama
 * (components/home/hero-section.tsx) masih ada tapi tidak dirender.
 *
 * Alur dan tujuan tautannya sengaja sama persis dengan hero lama (tanggal sewa
 * ikut ke /catalog_rental, tab Open Trip ke /opentrip). Kalimatnya sudah diubah
 * mencakup toko juga — Habema sekarang menjual gear, bukan hanya menyewakan —
 * dengan tautan /catalog_shop di baris bukti sosial.
 */

// Foto latar. Ganti lewat prop `imageSrc` kalau mood-nya tidak cocok —
// host harus terdaftar di images.remotePatterns (next.config.mjs).

const DEFAULT_IMAGE = "/images/bannerImage.jpeg";

interface HeroSectionFullProps {
  imageSrc?: string;
  imageAlt?: string;
}

export function HeroSectionFull({
  imageSrc = DEFAULT_IMAGE,
          imageAlt = "Berkemah di alam terbuka — sewa dan beli perlengkapan outdoor Habema",
}: HeroSectionFullProps) {
  const [bookingType, setBookingType] = useState<"rental" | "opentrip">(
    "rental",
  );
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [departDate, setDepartDate] = useState<Date>();
  const [destination, setDestination] = useState("");
  const [pax, setPax] = useState("2");

  // Sama seperti hero lama: tanggal sewa dibawa sebagai query, supaya katalog
  // bisa menyaring ketersediaan sejak awal. Query tetap `yyyy-MM-dd` — hanya
  // jamnya yang dibuang, karena katalog menyaring per hari.
  const rentalParams = new URLSearchParams();
  if (startDate) rentalParams.set("startDate", format(startDate, "yyyy-MM-dd"));
  if (endDate) rentalParams.set("endDate", format(endDate, "yyyy-MM-dd"));
  const rentalHref = rentalParams.size
    ? `/catalog_rental?${rentalParams}`
    : "/catalog_rental";

  // Hero lama membuang pilihan destinasi dan peserta begitu saja. Di sini
  // ikut dikirim sebagai query — halaman /opentrip boleh mengabaikannya, tapi
  // lebih baik diteruskan daripada menghilang diam-diam.
  const opentripParams = new URLSearchParams();
  if (destination) opentripParams.set("destination", destination);
  if (departDate)
    opentripParams.set("departDate", format(departDate, "yyyy-MM-dd"));
  if (pax) opentripParams.set("pax", pax);
  const opentripHref = opentripParams.size
    ? `/opentrip?${opentripParams}`
    : "/opentrip";

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay, ease: [0.25, 1, 0.5, 1] },
    }),
  };

  const inputShell =
    "flex items-center gap-2.5 bg-white border border-border rounded-xl px-3.5 h-12 transition-all focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/15";
  // DateTimePicker merender <Button>, bukan <input>, jadi gayanya dioper
  // langsung — tidak ada div pembungkus. Warna teks sengaja tidak diatur di
  // sini supaya placeholder tetap kelabu dari komponennya.
  const pickerShell =
    "h-12 w-full justify-start gap-2.5 rounded-xl border-border bg-white px-3.5 text-sm font-semibold hover:bg-white focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-forest/15 [&_svg]:text-black/60";
  const fieldLabel =
    "text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5 pl-0.5";

  return (
    <section className="relative min-h-svh w-full overflow-hidden bg-forest-dark items-center align-middle">
      {/* Latar: foto + overlay gelap. Overlay wajib — tanpa itu teks putih
          kehilangan kontras begitu fotonya berganti. */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/75 via-black/55 to-black/85" />

      <div className="relative z-10 mx-auto flex min-h-svh max-w-4xl flex-col items-center justify-center px-6 pb-16 pt-10 text-center">

        <motion.h2
          custom={0.08}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-4xl text-left font-sans font-bold leading-[1.05] tracking-tight text-white sm:text-5xl mb-10 md:mb-25 lg:text-6xl"
        >
          Sewa Buat Sekali Jalan,{" "}
            Beli Buat Selamanya
        </motion.h2>

        {/* <motion.p
          custom={0.16}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base"
        >
          Jangan biarkan alat pas-pasan merusak momen di puncak. Sewa gear
          berkualitas yang selalu kami rawat untuk trip berikutnya, atau bawa
          pulang gear pilihan dari toko dan mulai bangun perlengkapan
          andalanmu sendiri.
        </motion.p> */}

        {/* Tab Sewa Alat / Open Trip */}
        <motion.div
          custom={0.24}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-8 grid w-full max-w-60 grid-cols-2 gap-1 rounded-2xl border border-white/15 bg-white/10 p-1 backdrop-blur-md"
        >
          {(
            [
              { key: "rental", label: "Sewa Alat", Icon: Tent },
              { key: "opentrip", label: "Open Trip", Icon: Compass },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setBookingType(key)}
              aria-pressed={bookingType === key}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
                bookingType === key
                  ? "bg-white text-black shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </motion.div>

        {/* Bar pencarian. key per tab menjaga React tidak memakai ulang input
            antar-tab — masalah yang sudah pernah muncul di hero lama. */}
        <motion.div
          custom={0.32}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-4 w-full max-w-3xl rounded-3xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-md sm:p-5"
        >
          {bookingType === "rental" ? (
            <div
              key="rental-fields"
              className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="flex flex-col">
                <span className={fieldLabel}>Mulai Sewa</span>
                <DateTimePicker
                  id="hero-start-date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Pilih tanggal"
                  className={pickerShell}
                />
              </label>

              <label className="flex flex-col">
                <span className={fieldLabel}>Selesai Sewa</span>
                <DateTimePicker
                  id="hero-end-date"
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Pilih tanggal"
                  fromDate={startDate}
                  className={pickerShell}
                />
              </label>

              <Button
                asChild
                variant="secondary"
                className="h-12 rounded-xl px-7 text-xs font-bold uppercase shadow-lg shadow-black/25 active:scale-[0.98]"
              >
                <Link href={rentalHref}>
                  <Search className="h-4 w-4" />
                  Cari Alat
                </Link>
              </Button>
            </div>
          ) : (
            <div
              key="opentrip-fields"
              className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
            >
              <label className="flex flex-col">
                <span className={fieldLabel}>Destinasi</span>
                <div className={inputShell}>
                  <Compass className="h-4 w-4 shrink-0 text-forest/60" />
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-5 text-sm font-semibold text-stone-800 focus:outline-none"
                  >
                    <option value="">Pilih gunung</option>
                    <option value="gede-pangrango">Gede Pangrango</option>
                    <option value="merbabu">Gunung Merbabu</option>
                    <option value="prau">Gunung Prau</option>
                    <option value="rinjani">Gunung Rinjani</option>
                  </select>
                  <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
                </div>
              </label>

              <label className="flex flex-col">
                <span className={fieldLabel}>Keberangkatan</span>
                <DateTimePicker
                  id="hero-depart-date"
                  value={departDate}
                  onChange={setDepartDate}
                  placeholder="Pilih tanggal"
                  className={pickerShell}
                />
              </label>

              <label className="flex flex-col">
                <span className={fieldLabel}>Peserta</span>
                <div className={inputShell}>
                  <Users className="h-4 w-4 shrink-0 text-forest/60" />
                  <select
                    value={pax}
                    onChange={(e) => setPax(e.target.value)}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-5 text-sm font-semibold text-stone-800 focus:outline-none"
                  >
                    <option value="1">1 Orang</option>
                    <option value="2">2 Orang</option>
                    <option value="3">3 Orang</option>
                    <option value="4">4+ Orang</option>
                  </select>
                  <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
                </div>
              </label>

              <Button
                asChild
                variant="secondary"
                className="h-12 rounded-xl px-7 text-xs font-bold uppercase shadow-lg shadow-black/25 active:scale-[0.98]"
              >
                <Link href={opentripHref}>
                  <Search className="h-4 w-4" />
                  Cari Trip
                </Link>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Bukti sosial */}
        <motion.div
          custom={0.4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <div className="flex -space-x-2.5">
            {[
              "https://i.pinimg.com/1200x/ed/65/02/ed65027a80e9751a36aa504460ba7694.jpg",
              "https://i.pinimg.com/1200x/3d/f6/cb/3df6cb7c9feaf11791ab725fdea0d372.jpg",
              "https://i.pinimg.com/736x/ca/3e/c5/ca3ec5e1cb2553c0c89db029ff67d7cf.jpg",
            ].map((src) => (
              <div
                key={src}
                className="relative h-8 w-8 overflow-hidden rounded-full bg-stone-300 ring-2 ring-white/70"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 sm:text-[11px]">
            Bergabung dengan 2.000+ petualang
          </div>
          {/* <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <Link
            href="/catalog_rental"
            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gold-light transition-colors hover:text-gold sm:text-[11px]"
          >
            Lihat katalog sewa
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <Link
            href="/catalog_shop"
            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gold-light transition-colors hover:text-gold sm:text-[11px]"
          >
            Belanja di toko
            <ArrowRight className="h-3.5 w-3.5" />
          </Link> */}
        </motion.div>
      </div>
    </section>
  );
}
