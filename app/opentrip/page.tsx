"use client"


import { useState, useEffect, useRef } from "react";

/* ─── TYPES ─────────────────────────────────────── */
type Package = {
  id: string;
  category: string;
  label: string;
  badge?: string;
  price?: string;
  priceOld?: string;
  unit?: string;
  desc: string;
  image: string;
  include: string[];
  exclude?: string[];
  accent: string;
  accentLight: string;
};

/* ─── DATA ───────────────────────────────────────── */

const CATEGORIES = [
  "Semua",
  "Open Trip",
  "Camping Keluarga",
  "Private Camp",
  "Campervan",
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

/* ─── CARD ───────────────────────────────────────── */
function Card({ pkg, index }: { pkg: Package; index: number }) {
  const { ref, visible } = useInView();

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
      <div className="relative rounded-[28px] overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-stone-100 flex flex-col">
        {/* IMAGE */}
        <div className="relative h-52 overflow-hidden flex-shrink-0">
          <img
            src={pkg.image}
            alt={pkg.label}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* category pill */}
          <span
            className="absolute top-3 left-3 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ background: pkg.accentLight, color: pkg.accent }}
          >
            {pkg.category}
          </span>

          {/* badge */}
          {pkg.badge && (
            <span
              className="absolute top-3 right-3 text-[11px] font-bold px-3 py-1 rounded-full text-white shadow"
              style={{ background: pkg.accent }}
            >
              {pkg.badge}
            </span>
          )}

          {/* price */}
          <div className="absolute bottom-3 right-3 text-right">
            {pkg.priceOld && (
              <p className="text-white/60 text-xs line-through leading-none">
                Rp {pkg.priceOld}
              </p>
            )}
            {pkg.price ? (
              <p className="text-white font-black text-lg leading-tight drop-shadow-md">
                Rp {pkg.price}
                {pkg.unit && (
                  <span className="text-white/70 font-normal text-xs ml-1">
                    {pkg.unit}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-white/90 font-semibold text-sm italic drop-shadow">
                Harga custom
              </p>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <h3
            className="font-display text-lg font-black text-stone-900 leading-snug"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {pkg.label}
          </h3>
          <p className="text-stone-500 text-sm leading-relaxed">{pkg.desc}</p>

          {/* include */}
          <div className="flex-1">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: pkg.accent }}
            >
              Include
            </p>
            <ul className="space-y-1">
              {pkg.include?.map?.((it) => (
                <li key={it} className="flex gap-2 text-sm text-stone-600">
                  <span
                    style={{ color: pkg.accent }}
                    className="flex-shrink-0 mt-0.5 text-xs"
                  >
                    ✦
                  </span>
                  {it}
                </li>
              ))}
            </ul>

            {pkg.exclude && pkg.exclude.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-stone-400">
                  Exclude
                </p>
                <ul className="space-y-1">
                  {pkg.exclude?.map?.((it) => (
                    <li key={it} className="flex gap-2 text-sm text-stone-400">
                      <span className="flex-shrink-0 mt-0.5 text-xs">✕</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={`https://wa.me/6283898749357?text=Halo%20Habema%20Outdoor%2C%20saya%20tertarik%20dengan%20${encodeURIComponent(
              pkg.label
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 hover:opacity-85 active:scale-[0.98] shadow-sm"
            style={{ background: pkg.accent, color: "#fff" }}
          >
            Pesan via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── HERO CAROUSEL ──────────────────────────────── */
const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=1600&q=80",
    badge: "Est. 2020",
    title: "Berkemah Lebih",
    highlight: "Mudah & Berkesan",
    subtitle: "Open Trip · Camping Keluarga · Private Camp · Campervan",
  },
  {
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
    badge: "Terlaris",
    title: "Saksikan",
    highlight: "Matahari Terbit",
    subtitle: "Open Trip Sunrise — keberangkatan setiap akhir pekan.",
  },
  {
    image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1600&q=80",
    badge: "Campervan",
    title: "Jelajah Bebas",
    highlight: "dengan Campervan",
    subtitle: "3 hari 2 malam petualangan seru ke daerah wisata pilihanmu.",
  },
  {
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600&q=80",
    badge: "Private Camp",
    title: "Area Eksklusif",
    highlight: "Untuk Komunitas",
    subtitle: "Private camp untuk sekolah, kampus, & komunitas — nuansa alami.",
  },
];

function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = HERO_SLIDES.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 5000);
    return () => clearInterval(t);
  }, [paused, n]);

  const go = (i: number) => setIdx(((i % n) + n) % n);
  const s = HERO_SLIDES[idx];

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 mt-4">
      <div
        className="relative overflow-hidden rounded-[28px]"
        style={{ height: "min(46vw, 520px)", minHeight: 320 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
      {/* slides (crossfade) */}
      {HERO_SLIDES.map((sl, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1100ms] ease-out"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <img src={sl.image} alt={sl.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
      ))}

      {/* animated caption for active slide */}
      <div
        key={idx}
        className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 max-w-md pr-4 z-10"
        style={{ animation: "fadeUp 0.7s ease both" }}
      >
        <span className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-500 text-white mb-4 shadow">
          {s.badge}
        </span>
        <h2
          className="text-white font-black text-3xl md:text-5xl leading-[1.05] drop-shadow-lg"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {s.title} <span className="italic text-emerald-300">{s.highlight}</span>
        </h2>
        <p className="text-white/85 text-sm md:text-base mt-3 drop-shadow">{s.subtitle}</p>
      </div>

      {/* contact pill */}
      <a
        href="https://wa.me/6283898749357"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-bold text-stone-700 shadow hover:bg-white transition-all duration-300"
      >
        <span className="text-green-500">●</span>
        083898749357
      </a>

      {/* arrows */}
      <button
        onClick={() => go(idx - 1)}
        aria-label="Sebelumnya"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/75 hover:bg-white text-stone-800 shadow-lg flex items-center justify-center text-2xl transition"
      >
        ‹
      </button>
      <button
        onClick={() => go(idx + 1)}
        aria-label="Berikutnya"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/75 hover:bg-white text-stone-800 shadow-lg flex items-center justify-center text-2xl transition"
      >
        ›
      </button>

      {/* brand chip */}
      <div className="absolute bottom-5 left-5 md:bottom-7 md:left-10 z-20 flex items-center gap-2 bg-white/85 backdrop-blur-md rounded-full pl-3 pr-4 py-2 shadow">
        <span className="text-emerald-500 text-lg">⛺</span>
        <span className="text-[11px] font-bold tracking-widest uppercase text-stone-500">
          Habema Outdoor · Est. 2020
        </span>
      </div>

      {/* dots */}
      <div className="absolute bottom-6 right-5 md:bottom-7 md:right-10 z-20 flex gap-1.5">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Ke slide ${i + 1}`}
            className="h-2.5 rounded-full transition-all duration-300"
            style={{
              width: i === idx ? 24 : 10,
              background: i === idx ? "#10b981" : "rgba(255,255,255,0.65)",
            }}
          />
        ))}
      </div>
    </div>
    </div>
  );
}

/* ─── APP ────────────────────────────────────────── */
export default function HabemaOpenTrip() {
  const [active, setActive] = useState("Semua");
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useInView(0.1);

  // Fetch packages from database
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/bundles');
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const result = await response.json();

        if (result.success && result.data) {
          setPackages(result.data);
        } else {
          throw new Error(result.error || 'No data received');
        }
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError(err instanceof Error ? err.message : 'Failed to load packages');

        // Fallback to static data if API fails
        setPackages([
          {
            id: "open-trip-sunrise",
            category: "Open Trip",
            label: "Open Trip Sunrise",
            badge: "Terlaris",
            price: "195.000",
            unit: "/ orang",
            desc: "Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
            include: [
              "Guide berpengalaman",
              "Tenda & sleeping bag",
              "Sarapan ringan",
              "Dokumentasi foto",
            ],
            exclude: ["Transportasi pribadi", "Makan malam"],
            accent: "#d97706",
            accentLight: "#fef3c7",
          },
          {
            id: "open-trip-tracking",
            category: "Open Trip",
            label: "Open Trip Tracking & Hutan",
            badge: "Petualangan",
            price: "225.000",
            unit: "/ orang",
            desc: "Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.",
            image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
            include: [
              "Guide tracking profesional",
              "Alat keselamatan",
              "Peta jalur",
              "Snack energi",
            ],
            exclude: ["Tiket masuk kawasan", "Transportasi"],
            accent: "#059669",
            accentLight: "#d1fae5",
          },
          {
            id: "open-trip-explorer",
            category: "Open Trip",
            label: "Open Trip Explorer Wisata",
            price: "275.000",
            unit: "/ orang",
            desc: "Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
            include: [
              "3 hari 2 malam",
              "Tenda & matras",
              "Guide wisata",
              "Dokumentasi trip",
            ],
            exclude: ["Tiket masuk objek wisata", "Makan"],
            accent: "#7c3aed",
            accentLight: "#ede9fe",
          },
          {
            id: "camping-keluarga",
            category: "Camping Keluarga",
            label: "Paket Camping Keluarga",
            badge: "Rekomendasi",
            price: "700.000",
            priceOld: "850.000",
            unit: "/ 15 orang",
            desc: "Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.",
            image: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80",
            include: [
              "5 Tenda kap 3–4 orang",
              "15 Sleeping bag",
              "15 Matras",
              "5 Lampu tenda",
              "Flysheet 4×6 + tiang",
              "Lampu remang & luar",
              "Bongkar pasang tenda",
              "Antar jemput lokasi",
            ],
            exclude: ["Tiket masuk kawasan", "Peralatan masak", "Ongkir jarak jauh"],
            accent: "#16a34a",
            accentLight: "#dcfce7",
          },
          {
            id: "camping-komunitas",
            category: "Camping Keluarga",
            label: "Paket Camping Komunitas",
            price: "600.000",
            unit: "/ 10 orang",
            desc: "Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.",
            image: "https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&q=80",
            include: [
              "3 Tenda kap 3–4 orang",
              "10 Sleeping bag",
              "10 Matras",
              "Lampu tenda & luar",
              "Bongkar pasang tenda",
            ],
            exclude: ["Tiket masuk kawasan", "Transportasi"],
            accent: "#16a34a",
            accentLight: "#dcfce7",
          },
          {
            id: "private-camp",
            category: "Private Camp",
            label: "Private Camp Eksklusif",
            badge: "Komunitas / Sekolah",
            desc: "Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami.",
            image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
            include: [
              "Area camp privat",
              "Dekorasi & bendera warna-warni",
              "Tenda sesuai jumlah peserta",
              "Pendampingan tim Habema",
              "Fleksibel lokasi & durasi",
            ],
            exclude: ["Tiket masuk kawasan", "Konsumsi peserta"],
            accent: "#0284c7",
            accentLight: "#e0f2fe",
          },
          {
            id: "campervan-weekend",
            category: "Campervan",
            label: "Campervan Akhir Pekan",
            badge: "10% Diskon – 5 Pertama",
            price: "1.200.000",
            unit: "/ paket",
            desc: "3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.",
            image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80",
            include: [
              "Campervan nyaman",
              "Paket Matahari Terbit (2H1M)",
              "Paket Akhir Pekan (3H2M)",
              "Supir berpengalaman",
            ],
            exclude: ["BBM tambahan", "Tiket masuk wisata"],
            accent: "#dc2626",
            accentLight: "#fee2e2",
          },
          {
            id: "campervan-explorer",
            category: "Campervan",
            label: "Campervan Explorer Wisata",
            desc: "Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped.",
            image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
            include: [
              "Paket Explorer Wisata Daerah",
              "Paket Petualangan Tracking",
              "Akomodasi campervan",
              "Guide wisata lokal",
            ],
            accent: "#dc2626",
            accentLight: "#fee2e2",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const filtered =
    active === "Semua"
      ? packages
      : packages.filter((p) => p.category === active);

  // Rekomendasi: paket ber-badge dulu, fallback 3 pertama
  const recommended = packages.filter((p) => p.badge);
  const recommendations =
    recommended.length > 0 ? recommended.slice(0, 3) : packages.slice(0, 3);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Memuat paket open trip...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-stone-900 mb-2">Gagal Memuat Data</h3>
          <p className="text-stone-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f9f7f4; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f9f7f4; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 99px; }
      `}</style>

      {/* HERO CAROUSEL */}
      <HeroCarousel />

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-10 pb-24">

        {/* Section heading */}
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
            Pilihan Open Trip
          </p>
          <h2
            className="text-3xl md:text-5xl font-black text-stone-900 leading-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Petualangan untuk<br />
            <span style={{ fontStyle: "italic", color: "#a8a29e" }}>
              Semua Kalangan
            </span>
          </h2>
        </div>

        {/* RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                  Rekomendasi
                </p>
                <h3
                  className="text-xl md:text-2xl font-black text-stone-900"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Pilihan Terbaik{" "}
                  <span className="italic text-stone-400">Untukmu</span>
                </h3>
              </div>
              <span className="text-xs text-stone-400 hidden sm:block">
                Geser &rarr;
              </span>
            </div>
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x"
              style={{ scrollbarWidth: "thin" }}
            >
              {recommendations.map((pkg, i) => (
                <div
                  key={pkg?.id || `rec-${i}`}
                  className="min-w-[280px] max-w-[280px] snap-start"
                >
                  <Card pkg={pkg} index={i} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FILTER TABS */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES?.map?.((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer"
              style={
                active === cat
                  ? {
                      background: "#1c1917",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }
                  : {
                      background: "#fff",
                      color: "#78716c",
                      border: "1px solid #e7e5e4",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(filtered) && filtered.length > 0 ? (
            filtered.map((pkg, i) => (
              <Card key={pkg?.id || `pkg-${i}`} pkg={pkg} index={i} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-stone-500">
                {loading ? "Memuat data..." : "Tidak ada paket yang tersedia untuk kategori ini"}
              </p>
            </div>
          )}
        </div>

        {/* CONTACT STRIP */}
        <div className="mt-20 rounded-[32px] overflow-hidden relative" style={{ minHeight: 220 }}>
          <img
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1400&q=80"
            alt="contact"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-stone-900/72" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-8 md:px-12 py-12">
            <div>
              <p
                className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2"
              >
                Butuh bantuan memilih paket?
              </p>
              <h3
                className="text-2xl md:text-3xl font-black text-white leading-snug"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Konsultasi Gratis<br />
                <span className="italic text-emerald-400">Bersama Tim Kami</span>
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a
                href="https://wa.me/6283898749357"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-300 text-center shadow-lg"
              >
                💬 WhatsApp
              </a>
              <a
                href="https://instagram.com/habema_outdoor"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-2xl font-bold text-sm border border-white/30 text-white hover:bg-white/10 transition-all duration-300 text-center"
              >
                📷 Instagram
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
