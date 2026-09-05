import type { Metadata } from "next";
import Link from "next/link";
import { FlipbookViewer, FLIPBOOK_URL } from "./flipbook-viewer";

export const metadata: Metadata = {
  title: "Katalog Digital — Habema Outdoor",
  description:
    "Jelajahi katalog digital Habema Outdoor: daftar alat sewa tenda, carrier, sleeping bag, cooking set, dan paket outdoor. Buka, geser halaman, lalu pesan langsung.",
};

export default function KatalogDigitalPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">
          Habema Outdoor
        </p>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-forest">
          Katalog Digital
        </h1>
        <p className="text-sm text-stone-500 font-medium mt-2 max-w-2xl">
          Jelajahi katalog sewa peralatan outdoor Habema — tenda, carrier,
          sleeping bag, matras, cooking set, hingga paket open trip. Geser
          halaman buku di bawah, catat alat yang dibutuhkan, lalu lanjut pesan
          lewat tombol di bawah viewer.
        </p>

        <div className="mt-6">
          <FlipbookViewer />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/catalog_rental"
            className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Pesan Alat Sekarang
          </Link>
          <a
            href={FLIPBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-bold text-forest bg-white border border-stone-200 hover:border-stone-300 transition-colors"
          >
            Buka Katalog di Tab Baru
          </a>
        </div>

        <p className="mt-4 text-[11px] text-stone-400 font-medium">
          Catatan: harga dan ketersediaan mengikuti katalog website. Bila ada
          perbedaan dengan isi buku digital, yang berlaku adalah harga saat
          pemesanan.
        </p>
      </div>
    </div>
  );
}
