"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Copy, Tag, Sparkles } from "lucide-react";

/* ─── TYPES ─────────────────────────────────────── */
type Promo = {
  id: string;
  code: string;
  title: string;
  desc: string;
  discount: string;
  terms: string[];
  expiry?: string;
  accent: string;
  accentLight: string;
};

/* ─── DATA ───────────────────────────────────────── */
const PROMOS: Promo[] = [
  {
    id: "newbie-10",
    code: "HABEMABARU",
    title: "Diskon Pengguna Baru",
    desc: "Khusus penyewaan pertama kamu di Habema. Nikmati potongan langsung untuk semua alat outdoor.",
    discount: "10%",
    terms: [
      "Berlaku untuk transaksi pertama",
      "Minimal sewa Rp100.000",
      "Tidak digabung promo lain",
    ],
    expiry: "31 Des 2026",
    accent: "#16a34a",
    accentLight: "#dcfce7",
  },
  {
    id: "weekend-camp",
    code: "WEEKENDSERU",
    title: "Promo Akhir Pekan",
    desc: "Sewa perlengkapan camping untuk keberangkatan Sabtu–Minggu dan dapatkan potongan spesial.",
    discount: "Rp25.000",
    terms: [
      "Keberangkatan Sabtu atau Minggu",
      "Minimal sewa 2 hari",
      "Kuota terbatas per pekan",
    ],
    expiry: "Setiap akhir pekan",
    accent: "#d97706",
    accentLight: "#fef3c7",
  },
  {
    id: "opentrip-5",
    code: "TRIP5PERTAMA",
    title: "Open Trip 5 Pendaftar Pertama",
    desc: "Jadi 5 pendaftar pertama di setiap open trip Habema dan hemat lebih banyak untuk petualanganmu.",
    discount: "10%",
    terms: [
      "5 pendaftar pertama tiap trip",
      "Berlaku untuk semua open trip",
      "Konfirmasi via tim Habema",
    ],
    expiry: "Berlaku selama kuota tersedia",
    accent: "#0284c7",
    accentLight: "#e0f2fe",
  },
  {
    id: "campervan-weekend",
    code: "CAMPERVAN10",
    title: "Campervan Akhir Pekan",
    desc: "Diskon untuk 5 penyewa campervan pertama tiap paket akhir pekan 3 hari 2 malam.",
    discount: "10%",
    terms: [
      "5 penyewa pertama",
      "Paket 3H2M akhir pekan",
      "Belum termasuk BBM tambahan",
    ],
    expiry: "Kuota terbatas",
    accent: "#dc2626",
    accentLight: "#fee2e2",
  },
  {
    id: "komunitas",
    code: "KOMUNITASHEMA",
    title: "Paket Komunitas & Sekolah",
    desc: "Booking Private Camp atau Camping Keluarga untuk rombongan komunitas, sekolah, atau kampus.",
    discount: "15%",
    terms: [
      "Minimal 10 peserta",
      "Private Camp / Camping Keluarga",
      "Reservasi H-7 sebelum acara",
    ],
    expiry: "31 Des 2026",
    accent: "#7c3aed",
    accentLight: "#ede9fe",
  },
  {
    id: "referral",
    code: "AJAKTEMAN",
    title: "Ajak Teman Berpetualang",
    desc: "Ajak temanmu menyewa di Habema dan kalian berdua sama-sama dapat potongan harga.",
    discount: "Rp15.000",
    terms: [
      "Berlaku untuk kamu & teman",
      "Teman harus transaksi pertama",
      "Sebutkan kode saat booking",
    ],
    expiry: "Tanpa batas waktu",
    accent: "#059669",
    accentLight: "#d1fae5",
  },
];

/* ─── HOOKS ──────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── PROMO CARD ─────────────────────────────────── */
function PromoCard({ promo, index }: { promo: Promo; index: number }) {
  const { ref, visible } = useInView();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
    } catch {
      // Fallback bila Clipboard API tidak tersedia (mis. konteks non-secure)
      const ta = document.createElement("textarea");
      ta.value = promo.code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${(index % 3) * 90}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionProperty: "opacity, transform",
        transitionDuration: "0.65s",
        transitionTimingFunction: "ease",
      }}
      className="group"
    >
      <div className="relative rounded-[28px] overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-stone-100 flex flex-col h-full">
        {/* HEADER STRIP */}
        <div
          className="relative px-5 pt-5 pb-4 flex items-start justify-between"
          style={{ background: promo.accentLight }}
        >
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: promo.accent }}
            >
              <Tag className="w-3 h-3" />
              Promo Habema
            </span>
            <h3
              className="text-lg font-black text-stone-900 leading-snug"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {promo.title}
            </h3>
          </div>
          <div
            className="text-right shrink-0 pl-3"
            style={{ color: promo.accent }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Hemat
            </p>
            <p className="text-2xl font-black leading-none">{promo.discount}</p>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 flex flex-col flex-1 gap-4">
          <p className="text-stone-500 text-sm leading-relaxed">{promo.desc}</p>

          {/* terms */}
          <ul className="space-y-1 flex-1">
            {promo.terms.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-stone-600">
                <span
                  style={{ color: promo.accent }}
                  className="flex-shrink-0 mt-0.5 text-xs"
                >
                  ✦
                </span>
                {t}
              </li>
            ))}
          </ul>

          {promo.expiry && (
            <p className="text-[11px] text-stone-400 font-medium">
              Berlaku: {promo.expiry}
            </p>
          )}

          {/* CODE + COPY */}
          <div className="flex items-stretch gap-2">
            <div
              className="flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed font-mono font-bold tracking-widest text-sm py-3 select-all"
              style={{
                borderColor: promo.accent,
                color: promo.accent,
                background: promo.accentLight,
              }}
            >
              {promo.code}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-4 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:opacity-85 active:scale-[0.98] shadow-sm"
              style={{ background: promo.accent }}
              aria-label={copied ? "Kode disalin" : "Salin kode promo"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Salin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────── */
export default function HabemaPromo() {
  const titleRef = useInView(0.1);

  return (
    <div
      className="min-h-screen bg-[#f9f7f4]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f9f7f4; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f9f7f4; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 99px; }
      `}</style>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[18px_18px]" />
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-amber-300 uppercase mb-4">
            <Sparkles className="w-4 h-4" />
            Promo Spesial
          </span>
          <h1
            className="text-4xl md:text-6xl font-black text-white leading-tight mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Klaim Promo di{" "}
            <span className="italic text-amber-300">Habema</span>
          </h1>
          <p className="text-emerald-100/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Salin kode promo di bawah ini dan gunakan saat booking atau
            penyewaan untuk mendapatkan potongan harga terbaik.
          </p>
        </div>
      </section>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-12 pb-24">
        <div
          ref={titleRef.ref}
          className="mb-8"
          style={{
            opacity: titleRef.visible ? 1 : 0,
            transform: titleRef.visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
            Daftar Promo
          </p>
          <h2
            className="text-3xl md:text-4xl font-black text-stone-900 leading-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Pilih & Salin Kodenya
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROMOS.map((promo, i) => (
            <PromoCard key={promo.id} promo={promo} index={i} />
          ))}
        </div>

        {/* HELP STRIP */}
        <div className="mt-16 rounded-[32px] bg-white border border-stone-100 shadow-sm px-8 md:px-12 py-10 text-center">
          <h3
            className="text-2xl md:text-3xl font-black text-stone-900 leading-snug mb-3"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Ada pertanyaan soal promo?
          </h3>
          <p className="text-stone-500 text-sm mb-6 max-w-md mx-auto">
            Tim Habema siap membantu memastikan kamu mendapatkan potongan harga
            yang tepat.
          </p>
          <a
            href="https://wa.me/6283898749357?text=Halo%20Habema%2C%20saya%20mau%20tanya%20soal%20promo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-7 py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 shadow-lg"
          >
            💬 Tanya via WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
