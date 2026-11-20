"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Backpack,
  Compass,
  Plus,
  Minus,
} from "lucide-react";

// ==========================================
// 1. DEFINISI TIPE DATA (SESUAI SKEMA OtTrip)
// ==========================================
export type OtTripStatus = "published" | "draft" | "full" | "completed" | "archived";
export type OtDifficultyLevel = "easy" | "moderate" | "challenging" | "expert";

export interface OtCategory {
  id: string;
  name: string;
  slug: string;
}

export interface OtItineraryItem {
  day: number;
  title: string;
  activities: string[];
}

export interface OtFaqItem {
  question: string;
  answer: string;
}

export interface OtTrip {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  destination: string;
  destination_region: string;
  pickup_location: string;
  dropoff_location: string;
  base_price: number;
  discount_price: number | null;
  tax_amount: number;
  final_price: number;
  currency: string;
  duration_days: number;
  duration_nights: number;
  min_participants: number;
  max_participants: number;
  current_participants: number;
  departure_date: string;
  return_date: string;
  departure_time: string;
  return_time: string;
  status: OtTripStatus;
  featured: boolean;
  priority: number;
  category_id: string;
  featured_image: string;
  gallery_images: string[];
  itinerary: OtItineraryItem[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  what_to_bring: string[];
  important_notes: string[];
  cancellation_policy: string;
  refund_policy: string;
  faq: OtFaqItem[];
  min_age: number | null;
  max_age: number | null;
  difficulty_level: OtDifficultyLevel | null;
  fitness_required: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  archived_at?: string | null;
  category?: OtCategory;
}

interface GalleryPhoto {
  id: string;
  tripTitle: string;
  location: string;
  elevation: string;
  date: string;
  caption: string;
  imageUrl: string;
}

interface GearAddon {
  id: string;
  name: string;
  spec: string;
  pricePerTrip: number;
}

interface DiscountVoucher {
  id: string;
  code: string;
  title: string;
  discountAmount: number;
  minParticipants: number;
  validUntil: string | null;
}

interface TripFaq {
  id: string;
  question: string;
  answer: string;
}

interface ParticipantReview {
  id: string;
  participant: string;
  avatar: string | null;
  trip: string;
  rating: number;
  highlight: boolean;
  note: string;
}

interface OpenTripContent {
  vouchers: DiscountVoucher[];
  gear: GearAddon[];
  faqs: TripFaq[];
  gallery: GalleryPhoto[];
  reviews: ParticipantReview[];
}

interface OpenTripPageProps {
  trips?: OtTrip[];
}

// ==========================================
// 3. FUNGSI HELPER FORMAT
// ==========================================
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(dateStr: string): { day: string; monthYear: string } {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { day: "--", monthYear: dateStr };
  }
  const day = date.toLocaleDateString("id-ID", { day: "2-digit" });
  const monthYear = date.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
  return { day, monthYear };
}

function getDifficultyLabel(level: OtDifficultyLevel | null): string {
  switch (level) {
    case "easy":
      return "Pemula";
    case "moderate":
      return "Menengah";
    case "challenging":
      return "Menantang";
    case "expert":
      return "Mahir";
    default:
      return "Umum";
  }
}

// ==========================================
// 3b. NORMALISASI DATA API /api/ot-trips
// ==========================================
function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : ""))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 0);
  }
  return [];
}

function toItinerary(value: unknown): OtItineraryItem[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object"
      )
      .map((item, index) => ({
        day: Number(item.day) || index + 1,
        title:
          typeof item.title === "string" && item.title.trim()
            ? item.title
            : `Hari ${index + 1}`,
        activities: toList(item.activities),
      }));
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return toItinerary(parsed);
    } catch {
      // Bukan JSON — ditampilkan sebagai satu blok rencana perjalanan.
    }
    return [
      { day: 1, title: "Rencana Perjalanan", activities: toList(value) },
    ];
  }
  return [];
}

function toFaq(value: unknown): OtFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object"
    )
    .map((item) => ({
      question: typeof item.question === "string" ? item.question : "",
      answer: typeof item.answer === "string" ? item.answer : "",
    }))
    .filter((item) => item.question.length > 0);
}

function toGalleryImages(row: Record<string, any>): string[] {
  const images = Array.isArray(row.images) ? row.images : [];
  const urls = images
    .map((image): string => {
      if (typeof image === "string") return image;
      if (image && typeof image === "object") {
        return typeof image.image_url === "string" ? image.image_url : "";
      }
      return "";
    })
    .filter((url) => url.length > 0);

  return urls.length > 0 ? urls : toList(row.gallery_images);
}

function formatTime(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "--";
  return `${value.slice(0, 5)} WIB`;
}

function mapApiTrip(row: Record<string, any>): OtTrip {
  const rawStatus = String(row.status ?? "draft");
  const status: OtTripStatus =
    rawStatus === "cancelled" || rawStatus === "completed"
      ? "archived"
      : (rawStatus as OtTripStatus);

  const rawDifficulty = row.difficulty_level ?? null;
  const difficulty_level: OtDifficultyLevel | null =
    rawDifficulty === "hard"
      ? "challenging"
      : rawDifficulty === "extreme"
        ? "expert"
        : (rawDifficulty as OtDifficultyLevel | null);

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    description: String(row.description ?? ""),
    short_description: String(row.short_description ?? ""),
    destination: String(row.destination ?? ""),
    destination_region: String(row.destination_region ?? ""),
    pickup_location: String(row.pickup_location ?? ""),
    dropoff_location: String(row.dropoff_location ?? ""),
    base_price: Number(row.base_price ?? 0),
    discount_price:
      row.discount_price === null || row.discount_price === undefined
        ? null
        : Number(row.discount_price),
    tax_amount: Number(row.tax_amount ?? 0),
    final_price: Number(row.final_price ?? 0),
    currency: String(row.currency ?? "IDR"),
    duration_days: Number(row.duration_days ?? 0),
    duration_nights: Number(row.duration_nights ?? 0),
    min_participants: Number(row.min_participants ?? 1),
    max_participants: Number(row.max_participants ?? 0),
    current_participants: Number(row.current_participants ?? 0),
    departure_date: String(row.departure_date ?? ""),
    return_date: String(row.return_date ?? ""),
    departure_time: formatTime(row.departure_time),
    return_time: formatTime(row.return_time),
    status,
    featured: Boolean(row.featured),
    priority: Number(row.priority ?? 0),
    category_id: String(row.category_id ?? ""),
    featured_image: String(row.featured_image ?? ""),
    gallery_images: toGalleryImages(row),
    itinerary: toItinerary(row.itinerary),
    highlights: toList(row.highlights),
    inclusions: toList(row.inclusions),
    exclusions: toList(row.exclusions),
    what_to_bring: toList(row.what_to_bring),
    important_notes: toList(row.important_notes),
    cancellation_policy: String(row.cancellation_policy ?? ""),
    refund_policy: String(row.refund_policy ?? ""),
    faq: toFaq(row.faq),
    min_age: row.min_age === null || row.min_age === undefined ? null : Number(row.min_age),
    max_age: row.max_age === null || row.max_age === undefined ? null : Number(row.max_age),
    difficulty_level,
    fitness_required:
      row.fitness_required === true
        ? "Peserta perlu kondisi fisik yang baik."
        : typeof row.fitness_required === "string"
          ? row.fitness_required
          : "",
    meta_title: row.meta_title ?? undefined,
    meta_description: row.meta_description ?? undefined,
    meta_keywords: row.meta_keywords ?? undefined,
    created_by: row.created_by ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    published_at: row.published_at ?? undefined,
    archived_at: row.archived_at ?? null,
    category: row.category
      ? {
          id: String(row.category.id ?? ""),
          name: String(row.category.name ?? ""),
          slug: String(row.category.slug ?? ""),
        }
      : undefined,
  };
}

// ==========================================
// 3c. KARTU TESTIMONI PESERTA (DARI DATABASE)
// ==========================================
function ReviewCard({ rev }: { rev: ParticipantReview }) {
  return (
    <article
      className={`relative w-77.5 sm:w-92.5 shrink-0 rounded-2xl p-6 pb-5 flex flex-col justify-between transition-colors ${
        rev.highlight
          ? "bg-linear-to-br from-[#F3E2D5] via-[#F7ECE3] to-[#FAF5F0] border border-[#C85A17]/20"
          : "bg-white border border-stone-900/12"
      }`}
    >
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-2.5">
          Testimoni Peserta
        </span>
        <p className="text-xs sm:text-[13px] text-stone-800 leading-relaxed min-h-22">
          {rev.note}
        </p>
      </div>

      <div className="mt-5 pt-2 flex items-end justify-between gap-3">
        <span
          aria-hidden="true"
          className={`text-4xl font-serif leading-none select-none ${
            rev.highlight ? "text-[#C85A17]/30" : "text-stone-300"
          }`}
        >
          &ldquo;
        </span>

        <div className="-mr-6 -mb-5 bg-[#F4F1EA] pl-3.5 pt-2.5 pr-4 pb-3 rounded-tl-2xl flex items-center gap-2.5 border-t border-l border-stone-900/10">
          {rev.avatar ? (
            <img
              src={rev.avatar}
              alt={rev.participant}
              loading="lazy"
              className="w-9 h-9 rounded-lg object-cover border border-stone-900/15 shrink-0"
            />
          ) : (
            <span className="w-9 h-9 rounded-lg bg-[#183028] text-[#F4F1EA] grid place-items-center text-sm font-bold shrink-0">
              {rev.participant.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-stone-950 truncate">
              {rev.participant}
            </div>
            <div className="text-[10px] font-medium text-stone-500 truncate">
              {rev.trip}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ==========================================
// 4. KOMPONEN UTAMA HALAMAN OPEN TRIP
// ==========================================
export default function OpenTripPage({ trips: initialTrips = [] }: OpenTripPageProps) {
  // Daftar jadwal dari database (diisi lewat /api/ot-trips)
  const [trips, setTrips] = useState<OtTrip[]>(initialTrips);
  const [isLoadingTrips, setIsLoadingTrips] = useState<boolean>(
    initialTrips.length === 0
  );
  const [tripsError, setTripsError] = useState<string | null>(null);

  // Konten operasional dari database (voucher, gear, FAQ, galeri, testimoni)
  const [vouchers, setVouchers] = useState<DiscountVoucher[]>([]);
  const [gearAddons, setGearAddons] = useState<GearAddon[]>([]);
  const [tripFaqs, setTripFaqs] = useState<TripFaq[]>([]);
  const [fieldGallery, setFieldGallery] = useState<GalleryPhoto[]>([]);
  const [reviews, setReviews] = useState<ParticipantReview[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(true);

  // State Filter Jadwal Keberangkatan
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Semua");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // State Modal Detail & Pemesanan Trip
  const [activeTrip, setActiveTrip] = useState<OtTrip | null>(null);
  const [modalImageIdx, setModalImageIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"itinerary" | "fasilitas" | "ketentuan">(
    "itinerary"
  );
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([]);
  const [claimedVoucherCodes, setClaimedVoucherCodes] = useState<string[]>([]);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(null);
  const [bookingSubmitted, setBookingSubmitted] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // State Lightbox & Filter Galeri Lapangan
  const trackRef = useRef<HTMLDivElement | null>(null);
  const singleSetWidthRef = useRef<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollPosRef = useRef<number>(0);
  const velocityRef = useRef<number>(0.65);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollRef = useRef<number>(0);
  const movedDistanceRef = useRef<number>(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Ambil jadwal dari API saat prop tidak diisi (route /opentrip)
  useEffect(() => {
    if (initialTrips.length > 0) return;
    let cancelled = false;

    const loadTrips = async () => {
      try {
        const res = await fetch("/api/ot-trips?limit=50", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) {
          setTrips(
            rows.map((row: Record<string, any>) => mapApiTrip(row))
          );
        }
      } catch (error) {
        console.error("Gagal memuat jadwal open trip:", error);
        if (!cancelled) {
          setTripsError("Gagal memuat jadwal. Coba muat ulang halaman.");
        }
      } finally {
        if (!cancelled) setIsLoadingTrips(false);
      }
    };

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, [initialTrips]);

  // Ambil konten operasional (voucher, gear, FAQ, galeri, testimoni)
  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      try {
        const res = await fetch("/api/opentrip-content", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const content: Partial<OpenTripContent> = json?.data ?? {};
        if (cancelled) return;
        setVouchers(Array.isArray(content.vouchers) ? content.vouchers : []);
        setGearAddons(Array.isArray(content.gear) ? content.gear : []);
        setTripFaqs(Array.isArray(content.faqs) ? content.faqs : []);
        setFieldGallery(Array.isArray(content.gallery) ? content.gallery : []);
        setReviews(Array.isArray(content.reviews) ? content.reviews : []);
      } catch (error) {
        console.error("Gagal memuat konten open trip:", error);
      } finally {
        if (!cancelled) setIsLoadingContent(false);
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  // Daftar Kategori Unik dari Data Trip
  const categories = useMemo(() => {
    const names = new Set<string>(["Semua"]);
    trips.forEach((t) => {
      if (t.category?.name) names.add(t.category.name);
    });
    return Array.from(names);
  }, [trips]);

  // Penyaringan Daftar Trip
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        trip.title.toLowerCase().includes(q) ||
        trip.destination.toLowerCase().includes(q) ||
        trip.destination_region.toLowerCase().includes(q);

      const matchCat =
        selectedCategory === "Semua" || trip.category?.name === selectedCategory;

      const matchDiff =
        selectedDifficulty === "Semua" || trip.difficulty_level === selectedDifficulty;

      const remainingSeats = Math.max(0, trip.max_participants - trip.current_participants);
      const isFull = trip.status === "full" || remainingSeats === 0;
      const matchAvail = !onlyAvailable || !isFull;

      return matchQuery && matchCat && matchDiff && matchAvail;
    });
  }, [trips, searchQuery, selectedCategory, selectedDifficulty, onlyAvailable]);

  // Keberangkatan Terdekat untuk Kartu Hero
  const nextDispatchTrip = useMemo(() => {
    return (
      trips.find(
        (t) => t.status === "published" && t.max_participants > t.current_participants
      ) || trips[0]
    );
  }, [trips]);

  // Daftar Destinasi Unik untuk Filter Portofolio Foto
  const filteredGallery = fieldGallery;

  // Navigasi Keyboard untuk Lightbox & Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePhotoIndex(null);
        setActiveTrip(null);
      } else if (activePhotoIndex !== null && filteredGallery.length > 0) {
        if (e.key === "ArrowLeft") {
          setActivePhotoIndex((prev) =>
            prev === null
              ? 0
              : (prev - 1 + filteredGallery.length) % filteredGallery.length
          );
        } else if (e.key === "ArrowRight") {
          setActivePhotoIndex((prev) =>
            prev === null ? 0 : (prev + 1) % filteredGallery.length
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex, filteredGallery.length]);

  // Continuous Smooth Auto-Scroll + Manual Inertia & Concave Geometry
  const loopGallery = useMemo(
    () => [...filteredGallery, ...filteredGallery, ...filteredGallery],
    [filteredGallery]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId: number;
    const baseSpeed = 0.65;

    const updateTransforms = () => {
      const containerWidth = track.parentElement?.clientWidth || window.innerWidth;
      if (containerWidth === 0) return;

      const centerX = scrollPosRef.current + containerWidth / 2;
      const isMobile = containerWidth < 640;
      const isTablet = containerWidth >= 640 && containerWidth < 1024;
      const halfSpan = Math.min(containerWidth * 0.5, 680);
      const zDepth = isMobile ? 130 : isTablet ? 210 : 280;
      const maxAngle = isMobile ? 16 : isTablet ? 21 : 25;

      track.style.transform = `translate3d(${-scrollPosRef.current.toFixed(2)}px, 0, 0)`;

      cardRefs.current.forEach((card) => {
        if (!card) return;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const norm = Math.max(
          -1.35,
          Math.min(1.35, (cardCenter - centerX) / halfSpan)
        );
        const absNorm = Math.abs(norm);

        // Kedalaman cekung silindris: tengah menjauh ke dalam, sisi kiri-kanan melengkung mendekat
        const translateZ = (absNorm * absNorm - 0.65) * zDepth;
        const rotateY = norm * -maxAngle;

        card.style.transform = `translate3d(0, 0, ${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg)`;
      });
    };

    const initScroll = () => {
      const singleSetWidth = track.scrollWidth / 3;
      singleSetWidthRef.current = singleSetWidth;
      if (singleSetWidth > 0) {
        if (scrollPosRef.current < singleSetWidth || scrollPosRef.current >= singleSetWidth * 2) {
          scrollPosRef.current = singleSetWidth;
        }
      }
      updateTransforms();
    };

    initScroll();

    const tick = () => {
      const singleSetWidth = singleSetWidthRef.current || track.scrollWidth / 3;

      if (!isDraggingRef.current && singleSetWidth > 0) {
        velocityRef.current += (baseSpeed - velocityRef.current) * 0.06;
        scrollPosRef.current += velocityRef.current;

        if (scrollPosRef.current >= singleSetWidth * 2) {
          scrollPosRef.current -= singleSetWidth;
        } else if (scrollPosRef.current < singleSetWidth) {
          scrollPosRef.current += singleSetWidth;
        }
      }

      updateTransforms();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    const resizeObserver = new ResizeObserver(() => initScroll());
    if (track.parentElement) resizeObserver.observe(track.parentElement);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [loopGallery.length]);

  const openTripModal = (trip: OtTrip) => {
    setActiveTrip(trip);
    setModalImageIdx(0);
    setActiveTab("itinerary");
    setParticipantCount(1);
    setSelectedGearIds([]);
    setAppliedVoucherCode(claimedVoucherCodes[0] ?? null);
    setBookingSubmitted(false);
  };

  const handleClaimVoucher = (code: string) => {
    setClaimedVoucherCodes((prev) =>
      prev.includes(code) ? prev : [...prev, code]
    );
    setAppliedVoucherCode(code);
  };

  const toggleGearAddon = (gearId: string) => {
    setSelectedGearIds((prev) =>
      prev.includes(gearId) ? prev.filter((id) => id !== gearId) : [...prev, gearId]
    );
  };

  // Voucher aktif yang memenuhi syarat jumlah peserta
  const activeVoucherDiscount = useMemo(() => {
    if (!appliedVoucherCode) return 0;
    const voucher = vouchers.find((v) => v.code === appliedVoucherCode);
    if (!voucher || participantCount < voucher.minParticipants) return 0;
    return voucher.discountAmount;
  }, [appliedVoucherCode, participantCount]);

  // Kalkulasi Total Biaya pada Modal Booking
  const calculatedTotal = useMemo(() => {
    if (!activeTrip) return 0;
    const gearPerPerson = selectedGearIds.reduce((sum, id) => {
      const found = gearAddons.find((g) => g.id === id);
      return sum + (found ? found.pricePerTrip : 0);
    }, 0);
    const subtotal = (activeTrip.final_price + gearPerPerson) * participantCount;
    return Math.max(0, subtotal - activeVoucherDiscount);
  }, [activeTrip, selectedGearIds, participantCount, activeVoucherDiscount]);

  return (
    <div className="min-h-screen bg-white text-stone-950 font-sans selection:bg-[#183028] selection:text-[#F4F1EA]">
      {/* ==========================================
          1. HERO SPLIT BERBATAS GRID (EDITORIAL LEDGER)
         ========================================== */}
      <header className="border-b border-stone-900/15 bg-[#F4F1EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 border-x border-stone-900/15">
            {/* Kolom Kiri: Pernyataan Operasional */}
            <div className="lg:col-span-8 p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-stone-900/15 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#183028] mb-5">
                  <span className="w-2 h-2 bg-[#C85A17]" />
                  <span>Habema Outdoor Expedition • Bandung</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-950 tracking-tight leading-[1.08] max-w-3xl">
                  Jadwal Keberangkatan Open Trip &amp; Ekspedisi Terbuka.
                </h1>

                <p className="text-sm sm:text-base text-stone-700 mt-5 max-w-2xl leading-relaxed">
                  Pendakian gunung dan perjalanan alam terjadwal dari Bandung
                  dengan kuota peserta terukur, rasio pemandu bersertifikat 1:4,
                  serta dukungan perlengkapan lapangan lengkap dari Habema.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-900/15 flex flex-wrap items-center gap-6 text-xs text-stone-700">
                <div>
                  <span className="text-stone-500 block">Titik Kumpul Utama</span>
                  <span className="font-bold text-stone-950">
                    Pool Habema Buah Batu, Bandung
                  </span>
                </div>
                <div className="h-7 w-px bg-stone-900/15 hidden sm:block" />
                <div>
                  <span className="text-stone-500 block">Rasio Pemandu</span>
                  <span className="font-bold text-stone-950 tabular-nums">
                    1 Guide : 4 Peserta
                  </span>
                </div>
                <div className="h-7 w-px bg-stone-900/15 hidden sm:block" />
                <div>
                  <span className="text-stone-500 block">Fasilitas Sewa Alat</span>
                  <span className="font-bold text-[#183028]">
                    Diskon 20% Peserta Trip
                  </span>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Tiket Keberangkatan Terdekat */}
            {nextDispatchTrip && (
              <div className="lg:col-span-4 p-6 sm:p-8 lg:p-10 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-[#C85A17] pb-3 border-b border-stone-200">
                    <span>Keberangkatan Terdekat</span>
                    <span className="tabular-nums">
                      Sisa{" "}
                      {Math.max(
                        0,
                        nextDispatchTrip.max_participants -
                          nextDispatchTrip.current_participants
                      )}{" "}
                      Slot
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-stone-950 mt-4 leading-snug">
                    {nextDispatchTrip.title}
                  </h2>
                  <p className="text-xs text-stone-600 mt-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#183028] shrink-0" />
                    <span>{nextDispatchTrip.destination_region}</span>
                  </p>

                  <div className="mt-5 grid grid-cols-2 border border-stone-300 divide-x divide-stone-300 text-xs">
                    <div className="p-3">
                      <span className="text-stone-500 block text-[11px]">
                        Tanggal
                      </span>
                      <span className="font-bold text-stone-950 tabular-nums mt-0.5 block">
                        {nextDispatchTrip.departure_date}
                      </span>
                    </div>
                    <div className="p-3">
                      <span className="text-stone-500 block text-[11px]">
                        Durasi
                      </span>
                      <span className="font-bold text-stone-950 tabular-nums mt-0.5 block">
                        {nextDispatchTrip.duration_days}H{" "}
                        {nextDispatchTrip.duration_nights}M
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-stone-200">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs text-stone-500">Biaya / Peserta</span>
                    <span className="text-xl font-bold text-stone-950 tabular-nums">
                      {formatRupiah(nextDispatchTrip.final_price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTripModal(nextDispatchTrip)}
                    className="w-full py-3 px-4 bg-[#183028] hover:bg-[#11221c] text-[#F4F1EA] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Pilih Jadwal Ini</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ==========================================
          2. VOUCHER DISKON YANG DAPAT DIKLAIM
         ========================================== */}
      <section className="border-b border-stone-900/15 bg-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C85A17] block">
                Promo &amp; Potongan Biaya
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Voucher Open Trip Habema
              </h1>
            </div>
            <p className="text-xs text-stone-600">
              Klaim kode voucher untuk diterapkan otomatis pada kalkulator
              pemesanan.
            </p>
          </div>

          {vouchers.length === 0 ? (
            <div className="border border-stone-900/20 p-6 text-sm text-stone-600 bg-[#F4F1EA]/45">
              {isLoadingContent
                ? "Memuat voucher…"
                : "Belum ada voucher aktif saat ini."}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 border border-stone-900/20 divide-y md:divide-y-0 md:divide-x divide-stone-900/20">
            {vouchers.map((voucher) => {
              const isClaimed = claimedVoucherCodes.includes(voucher.code);
              return (
                <div
                  key={voucher.id}
                  className="p-5 bg-[#F4F1EA]/45 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-white border border-stone-300 text-[11px] font-bold tracking-wider text-stone-950">
                        {voucher.code}
                      </span>
                      {voucher.validUntil && (
                        <span className="text-[11px] text-stone-500 tabular-nums">
                          s.d. {voucher.validUntil}
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-stone-950 leading-snug">
                      {voucher.title}
                    </h2>
                    <p className="text-xs text-stone-600 mt-1">
                      Minimal {voucher.minParticipants} peserta dalam 1 transaksi.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#183028] tabular-nums">
                      -{formatRupiah(voucher.discountAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleClaimVoucher(voucher.code)}
                      className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isClaimed
                          ? "bg-[#183028] text-[#F4F1EA]"
                          : "bg-white border border-stone-900 text-stone-950 hover:bg-stone-950 hover:text-white"
                      }`}
                    >
                      {isClaimed ? "Diklaim ✓" : "Klaim Voucher"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* ==========================================
          3. BILAH FILTER INDEKS & DISPATCH LEDGER JADWAL
         ========================================== */}
      <section id="jadwal-trip" className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#183028] block">
                Manifest Keberangkatan
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Jadwal Open Trip Terbuka
              </h1>
            </div>
            <span className="text-xs font-semibold text-stone-600 tabular-nums">
              Menampilkan {filteredTrips.length} dari {trips.length} jadwal
            </span>
          </div>

          {/* Bilah Kontrol Indeks Bergaris Tegas */}
          <div className="bg-white border border-stone-900/20 p-3 sm:p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Pencarian */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari gunung, jalur, atau kota tujuan..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F4F1EA]/50 border border-stone-300 text-stone-950 placeholder:text-stone-400 focus:border-stone-950 focus:outline-none"
              />
            </div>

            {/* Filter Kategori, Level & Slot */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center overflow-x-auto border border-stone-300 bg-[#F4F1EA]/40 max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-stone-950 text-white"
                        : "text-stone-700 hover:bg-stone-200/70"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                aria-label="Filter tingkat kesulitan"
                className="px-3 py-2 text-xs font-semibold bg-white border border-stone-300 text-stone-900 focus:border-stone-950 focus:outline-none"
              >
                <option value="Semua">Semua Level</option>
                <option value="easy">Pemula</option>
                <option value="moderate">Menengah</option>
                <option value="challenging">Menantang</option>
              </select>

              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border border-stone-300 bg-white text-stone-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="accent-[#183028]"
                />
                <span>Slot Tersedia</span>
              </label>
            </div>
          </div>

          {/* Dispatch Schedule Ledger (Tanpa Thumbnail Gambar) */}
          {isLoadingTrips ? (
            <div className="bg-white border border-stone-900/20 p-10 text-center">
              <p className="text-sm font-bold text-stone-900">
                Memuat jadwal keberangkatan…
              </p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="bg-white border border-stone-900/20 p-10 text-center">
              <p className="text-sm font-bold text-stone-900">
                {trips.length === 0
                  ? tripsError ??
                    "Belum ada jadwal open trip yang tersedia saat ini."
                  : "Tidak ada jadwal yang sesuai filter pencarian."}
              </p>
              {trips.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Semua");
                    setSelectedDifficulty("Semua");
                    setOnlyAvailable(false);
                  }}
                  className="mt-3 px-4 py-2 bg-stone-950 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-stone-900/20 divide-y divide-stone-900/15">
              {filteredTrips.map((trip) => {
                const { day, monthYear } = formatShortDate(trip.departure_date);
                const remaining = Math.max(
                  0,
                  trip.max_participants - trip.current_participants
                );
                const isFull = trip.status === "full" || remaining === 0;
                const fillPercent = Math.min(
                  100,
                  Math.round(
                    (trip.current_participants / Math.max(1, trip.max_participants)) *
                      100
                  )
                );

                return (
                  <article
                    key={trip.id}
                    className="grid grid-cols-1 lg:grid-cols-12 items-stretch hover:bg-[#F4F1EA]/45 transition-colors"
                  >
                    {/* Kolom Tanggal */}
                    <div className="lg:col-span-2 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-stone-200 flex lg:flex-col justify-between lg:justify-center items-baseline lg:items-start bg-[#F4F1EA]/30">
                      <div>
                        <span className="text-2xl sm:text-3xl font-bold text-stone-950 tabular-nums leading-none">
                          {day}
                        </span>
                        <span className="text-xs font-semibold text-stone-600 ml-2 lg:ml-0 lg:mt-1 block">
                          {monthYear}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-500 tabular-nums lg:mt-2">
                        {trip.duration_days}H {trip.duration_nights}M
                      </span>
                    </div>

                    {/* Kolom Rute & Spesifikasi */}
                    <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-stone-200 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#183028]/10 text-[#183028]">
                          {getDifficultyLabel(trip.difficulty_level)}
                        </span>
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{trip.destination_region}</span>
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-stone-950 leading-snug">
                        {trip.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>Kumpul {trip.departure_time}</span>
                        </span>
                        <span>•</span>
                        <span>{trip.pickup_location}</span>
                      </div>
                    </div>

                    {/* Kolom Rasio Kuota Visual */}
                    <div className="lg:col-span-2 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-stone-200 flex flex-col justify-center">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-stone-500">Kuota</span>
                        <span
                          className={`font-bold tabular-nums ${
                            isFull ? "text-stone-500" : "text-[#183028]"
                          }`}
                        >
                          {isFull ? "Penuh" : `Sisa ${remaining} slot`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full ${
                            isFull ? "bg-stone-500" : "bg-[#183028]"
                          }`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-stone-500 tabular-nums mt-1.5">
                        {trip.current_participants}/{trip.max_participants} peserta
                      </span>
                    </div>

                    {/* Kolom Biaya & Aksi */}
                    <div className="lg:col-span-3 p-4 sm:p-5 flex items-center justify-between lg:justify-end gap-4">
                      <div className="lg:text-right">
                        {trip.discount_price && (
                          <span className="text-[11px] text-stone-400 line-through tabular-nums block">
                            {formatRupiah(trip.base_price)}
                          </span>
                        )}
                        <span className="text-base sm:text-lg font-bold text-stone-950 tabular-nums">
                          {formatRupiah(trip.final_price)}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          per peserta
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openTripModal(trip)}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                          isFull
                            ? "border border-stone-300 text-stone-600 hover:bg-stone-100"
                            : "bg-[#C85A17] hover:bg-[#b14d10] text-white"
                        }`}
                      >
                        {isFull ? "Detail" : "Daftar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          4. DOKUMENTASI TRIP (CONCAVE 3D PERSPECTIVE STRIP 1:2)
         ========================================== */}
      <section
        id="dokumentasi-trip"
        className="border-t border-stone-900/15 bg-[#F4F1EA] py-14 sm:py-20 overflow-x-clip"
      >
        {/* Title & Subtitle di Atas Carousel (Tanpa Tombol Prev/Next) */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#183028] block mb-2">
            Dokumentasi Lapangan
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-950 tracking-tight leading-[1.12]">
            Arsip Perjalanan &amp; Kloter Habema
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-3 max-w-2xl mx-auto leading-relaxed">
            Rekaman visual keberangkatan pendakian dan perkemahan bersama
            peserta Habema di berbagai puncak dan jalur Jawa.
          </p>
        </div>

        {/* Strip Carousel 3D Cekung Berasio 1:2 (Tanpa Teks di Kartu) */}
        <div
          className="relative w-full py-6 sm:py-10 select-none"
          style={{
            perspective: "850px",
            perspectiveOrigin: "50% 50%",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            ref={trackRef}
            onPointerDown={(e) => {
              const track = trackRef.current;
              if (!track) return;
              isDraggingRef.current = true;
              dragStartXRef.current = e.clientX;
              dragStartScrollRef.current = scrollPosRef.current;
              movedDistanceRef.current = 0;
              velocityRef.current = 0;
              track.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!isDraggingRef.current || !trackRef.current) return;
              const dx = e.clientX - dragStartXRef.current;
              movedDistanceRef.current = Math.abs(dx);
              const singleSetWidth =
                singleSetWidthRef.current || trackRef.current.scrollWidth / 3;
              const prevScroll = scrollPosRef.current;
              let nextScroll = dragStartScrollRef.current - dx * 1.45;

              if (singleSetWidth > 0) {
                while (nextScroll >= singleSetWidth * 2) nextScroll -= singleSetWidth;
                while (nextScroll < singleSetWidth) nextScroll += singleSetWidth;
              }

              scrollPosRef.current = nextScroll;
              velocityRef.current = Math.max(
                -28,
                Math.min(28, (nextScroll - prevScroll) * 0.45)
              );
            }}
            onPointerUp={(e) => {
              isDraggingRef.current = false;
              trackRef.current?.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              isDraggingRef.current = false;
            }}
            onWheel={(e) => {
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                velocityRef.current = Math.max(
                  -24,
                  Math.min(24, velocityRef.current + e.deltaX * 0.15)
                );
              }
            }}
            className="flex items-center gap-4 sm:gap-5 w-max py-4 touch-pan-y cursor-grab active:cursor-grabbing will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {loopGallery.map((photo, idx) => {
              const originalIndex = idx % filteredGallery.length;
              return (
                <div
                  key={`${photo.id}-${idx}`}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (movedDistanceRef.current < 8) {
                      setActivePhotoIndex(originalIndex);
                    }
                  }}
                  className="w-32 sm:w-40 md:w-44 lg:w-52 aspect-1/2 shrink-0 rounded-2xl overflow-hidden bg-stone-300 shadow-sm will-change-transform cursor-pointer"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.tripTitle}
                    draggable={false}
                    loading="lazy"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==========================================
          5B. ALUR PENDAFTARAN & PERSIAPAN (HOW IT WORKS)
         ========================================== */}
      <section className="border-t border-stone-900/15 bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Rata Tengah sesuai Referensi */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#183028] mb-3">
              <Compass className="w-3.5 h-3.5 text-[#C85A17]" />
              <span>Cara Kerja &amp; Alur</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-950 tracking-tight leading-[1.15]">
              Persiapan ekspedisi terencana untuk{" "}
              <span className="relative inline-block text-[#183028] italic">
                perjalanan
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -right-3 text-xs not-italic text-[#C85A17] font-bold"
                >
                  ✦
                </span>
              </span>{" "}
              aman.
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mt-4 leading-relaxed max-w-2xl mx-auto">
              Mulai dari pemilihan jadwal keberangkatan, verifikasi kesehatan,
              hingga titik kumpul di Bandung dalam tiga tahapan operasional yang
              ringkas.
            </p>
          </div>

          {/* 3 Kolom Langkah dengan Ikon Bulat & Garis Vertikal Memudar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
            {/* Langkah 1 */}
            <div className="flex items-start gap-5">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#183028]/10 text-[#183028] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="w-0.5 h-28 sm:h-32 mt-3 bg-linear-to-b from-[#183028]/25 to-transparent" />
              </div>

              <div className="pt-1">
                <h3 className="text-base sm:text-lg font-bold text-stone-950">
                  Pilih jadwal &amp; gear
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed">
                  Tentukan rute pendakian yang tersedia, klaim voucher diskon
                  aktif, dan tambahkan penyewaan perlengkapan gunung bila
                  diperlukan.
                </p>
                <a
                  href="#jadwal-trip"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183028] hover:text-[#C85A17] mt-4 transition-colors"
                >
                  <span>Lihat jadwal terbuka</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Langkah 2 */}
            <div className="flex items-start gap-5">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#183028] bg-[#F4F1EA] text-[#183028] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="w-0.5 h-28 sm:h-32 mt-3 border-l-2 border-dashed border-[#183028]/35 mask-[linear-gradient(to_bottom,black_45%,transparent)]" />
              </div>

              <div className="pt-1">
                <h3 className="text-base sm:text-lg font-bold text-stone-950">
                  Konfirmasi &amp; surat sehat
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed">
                  Selesaikan pembayaran DP untuk mengunci kuota simaksi,
                  unggah surat keterangan sehat H-2, dan ikuti briefing grup
                  kloter.
                </p>
                <a
                  href="#dokumentasi-trip"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183028] hover:text-[#C85A17] mt-4 transition-colors"
                >
                  <span>Lihat dokumentasi kloter</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Langkah 3 */}
            <div className="flex items-start gap-5">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-[#183028] bg-[#183028]/10 text-[#183028] flex items-center justify-center">
                  <Backpack className="w-5 h-5" />
                </div>
                <div className="w-0.5 h-28 sm:h-32 mt-3 bg-linear-to-b from-[#183028] via-[#183028]/35 to-transparent" />
              </div>

              <div className="pt-1">
                <h3 className="text-base sm:text-lg font-bold text-stone-950">
                  Kumpul pool &amp; berangkat
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed">
                  Registrasi ulang di Pool Habema Buah Batu Bandung, ambil
                  perlengkapan sewaan yang telah disiapkan, dan berangkat
                  bersama tim.
                </p>
                <a
                  href="https://wa.me/6281200000000?text=Halo%20Habema,%20saya%20ingin%20tanya%20titik%20kumpul%20Open%20Trip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183028] hover:text-[#C85A17] mt-4 transition-colors"
                >
                  <span>Hubungi admin basecamp</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          5C. CATATAN PESERTA KLOTER TERAKHIR (FIELD LOG REVIEWS)
         ========================================== */}
      {reviews.length > 0 && (
      <section className="border-t border-stone-900/15 bg-[#F4F1EA] py-14 sm:py-20 overflow-hidden">
        {/* Header 2 Kolom sesuai Referensi */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#183028] block mb-2">
                Catatan Lapangan
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-950 tracking-tight leading-[1.12]">
                Apa Kata Peserta Kloter Habema.
              </h1>
            </div>
            <div className="lg:col-span-6 lg:pt-6">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                Peserta mengapresiasi rasio pemandu 1:4 di jalur terjal, kesiapan
                tenda tim saat tiba di area camp, serta kemudahan penyewaan
                perlengkapan gunung yang langsung tersedia di Pool Buah Batu Bandung.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 sm:space-y-6">
          {[0, 1].map((rowIndex) => {
            const rowReviews = reviews.filter((_, index) => index % 2 === rowIndex);
            if (rowReviews.length === 0) return null;
            return (
              <div
                key={rowIndex}
                className="w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div
                  className={`flex gap-4 sm:gap-5 pr-4 sm:pr-8 w-max ${
                    rowIndex === 0
                      ? "px-4 sm:px-8 lg:px-12"
                      : "pl-6 sm:pl-20 lg:pl-36"
                  }`}
                >
                  {rowReviews.map((rev) => (
                    <ReviewCard key={rev.id} rev={rev} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* ==========================================
          5D. FAQ & KEBIJAKAN LAPANGAN
         ========================================== */}
      <section className="border-t border-stone-900/15 bg-white py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#183028] block">
                Informasi Teknis
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Pertanyaan Umum &amp; Kebijakan Trip
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
                Ketentuan standar terkait kuota minimal keberangkatan, cuaca
                ekstrem, serta pengambilan perlengkapan sewa.
              </p>
            </div>

            <div className="lg:col-span-8 border border-stone-900/20 divide-y divide-stone-900/15">
              {isLoadingContent ? (
                <div className="p-6 text-sm text-stone-600">Memuat FAQ…</div>
              ) : tripFaqs.length === 0 ? (
                <div className="p-6 text-sm text-stone-600">
                  Belum ada FAQ yang dipublikasikan.
                </div>
              ) : (
                tripFaqs.map((faqItem, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={faqItem.id} className="bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 hover:bg-[#F4F1EA]/50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-bold text-stone-950">
                        {faqItem.question}
                      </span>
                      <span className="shrink-0 w-7 h-7 border border-stone-300 flex items-center justify-center text-stone-900">
                        {isOpen ? (
                          <Minus className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                        {faqItem.answer}
                      </div>
                    )}
                  </div>
                );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          6. PRIVATE TRIP / CUSTOM GROUP CTA
         ========================================== */}
      <section className="border-t bg-white text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C85A17]  block">
              Private &amp; Corporate Trip
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mt-2">
              Atur Jadwal Keberangkatan Khusus Rombongan Anda.
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
              Tersedia untuk komunitas, kantor, maupun keluarga mulai dari 6
              peserta dengan fleksibilitas tanggal, titik jemput, dan paket
              sewa alat lengkap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/6281200000000?text=Halo%20Habema,%20saya%20ingin%20konsultasi%20Private%20Trip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#C85A17] hover:bg-[#b14d10] text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Konsultasi Jadwal Private
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ==========================================
          7. MODAL DETAIL TRIP & KALKULATOR BOOKING
         ========================================== */}
      {activeTrip && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
          onClick={() => setActiveTrip(null)}
        >
          <div
            className="bg-white border-t sm:border border-stone-900 max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#F4F1EA] border-b border-stone-300 flex items-center justify-between gap-4 sticky top-0 z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#183028] block">
                  {activeTrip.destination_region} • {activeTrip.duration_days}H{" "}
                  {activeTrip.duration_nights}M
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-stone-950">
                  {activeTrip.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTrip(null)}
                aria-label="Tutup detail trip"
                className="p-2 hover:bg-stone-200 text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Kolom Kiri: Informasi Trip & Tabs */}
              <div className="lg:col-span-7 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-stone-300">
                {(() => {
                  const modalPhotos =
                    activeTrip.gallery_images && activeTrip.gallery_images.length > 0
                      ? activeTrip.gallery_images
                      : [activeTrip.featured_image];
                  const currentPhoto =
                    modalPhotos[modalImageIdx] || activeTrip.featured_image;
                  return (
                    <div className="mb-5">
                      <div className="aspect-video w-full overflow-hidden bg-stone-200 border border-stone-300">
                        <img
                          src={currentPhoto}
                          alt={activeTrip.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {modalPhotos.length > 1 && (
                        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                          {modalPhotos.map((imgUrl, idx) => (
                            <button
                              key={`${activeTrip.id}-img-${idx}`}
                              type="button"
                              onClick={() => setModalImageIdx(idx)}
                              aria-label={`Lihat foto rute ${idx + 1}`}
                              className={`w-16 h-11 shrink-0 overflow-hidden border-2 transition-opacity cursor-pointer ${
                                idx === modalImageIdx
                                  ? "border-[#183028] opacity-100"
                                  : "border-stone-300 opacity-60 hover:opacity-95"
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`${activeTrip.title} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Navigasi Tab */}
                <div className="flex overflow-x-auto border-b border-stone-300 mb-5">
                  {(
                    [
                      { id: "itinerary", label: "Itinerary" },
                      { id: "fasilitas", label: "Include & Perlengkapan" },
                      { id: "ketentuan", label: "Ketentuan" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                        activeTab === tab.id
                          ? "border-[#183028] text-stone-950"
                          : "border-transparent text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Isi Tab */}
                {activeTab === "itinerary" && (
                  <div className="space-y-4">
                    {activeTrip.itinerary.map((item) => (
                      <div
                        key={item.day}
                        className="border border-stone-200 p-4 bg-[#F4F1EA]/35"
                      >
                        <div className="text-xs font-bold uppercase tracking-wider text-[#183028] mb-1">
                          Hari {item.day} — {item.title}
                        </div>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-stone-700 mt-2">
                          {item.activities.map((act, i) => (
                            <li key={i} className="leading-relaxed">
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "fasilitas" && (
                  <div className="space-y-5 text-xs sm:text-sm">
                    <div>
                      <h4 className="font-bold text-stone-950 uppercase text-xs tracking-wider mb-2">
                        Sudah Termasuk (Include)
                      </h4>
                      <ul className="space-y-1.5 text-stone-700">
                        {activeTrip.inclusions.map((inc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#183028] shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-950 uppercase text-xs tracking-wider mb-2">
                        Belum Termasuk (Exclude)
                      </h4>
                      <ul className="space-y-1.5 text-stone-600">
                        {activeTrip.exclusions.map((exc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-stone-400 font-bold">—</span>
                            <span>{exc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-950 uppercase text-xs tracking-wider mb-2">
                        Perlengkapan Pribadi Wajib
                      </h4>
                      <ul className="space-y-1 text-stone-700 list-disc pl-5">
                        {activeTrip.what_to_bring.map((gear, idx) => (
                          <li key={idx}>{gear}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "ketentuan" && (
                  <div className="space-y-4 text-xs sm:text-sm text-stone-700">
                    <div className="p-3.5 bg-[#F4F1EA]/60 border border-stone-200">
                      <span className="font-bold text-stone-950 block mb-1">
                        Kesiapan Fisik
                      </span>
                      <p>{activeTrip.fitness_required}</p>
                    </div>
                    <div>
                      <span className="font-bold text-stone-950 block mb-1">
                        Kebijakan Pembatalan
                      </span>
                      <p>{activeTrip.cancellation_policy}</p>
                    </div>
                    <div>
                      <span className="font-bold text-stone-950 block mb-1">
                        Kebijakan Pengembalian Dana
                      </span>
                      <p>{activeTrip.refund_policy}</p>
                    </div>
                    {activeTrip.important_notes.length > 0 && (
                      <div className="flex items-start gap-2 p-3 border border-amber-300 bg-amber-50 text-amber-950">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{activeTrip.important_notes[0]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Form Pemesanan & Add-on Sewa Gear */}
              <div className="lg:col-span-5 p-4 sm:p-6 bg-[#F4F1EA]/40 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">
                    Ringkasan Pemesanan
                  </h3>

                  <div className="space-y-2 text-xs border-b border-stone-300 pb-4 mb-4">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Keberangkatan</span>
                      <span className="font-bold text-stone-950 tabular-nums">
                        {activeTrip.departure_date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Jam Kumpul</span>
                      <span className="font-bold text-stone-950 tabular-nums">
                        {activeTrip.departure_time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Paket Dasar</span>
                      <span className="font-bold text-stone-950 tabular-nums">
                        {formatRupiah(activeTrip.final_price)} / org
                      </span>
                    </div>
                  </div>

                  {/* Jumlah Peserta */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-stone-900 mb-2">
                      Jumlah Peserta
                    </label>
                    <div className="inline-flex items-center border border-stone-300 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          setParticipantCount((c) => Math.max(1, c - 1))
                        }
                        aria-label="Kurangi peserta"
                        className="p-2.5 hover:bg-stone-100 text-stone-800 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-5 text-sm font-bold tabular-nums">
                        {participantCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setParticipantCount((c) =>
                            Math.min(
                              Math.max(
                                1,
                                activeTrip.max_participants -
                                  activeTrip.current_participants
                              ),
                              c + 1
                            )
                          )
                        }
                        aria-label="Tambah peserta"
                        className="p-2.5 hover:bg-stone-100 text-stone-800 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add-on Sewa Alat Habema */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-900">
                        Tambahan Sewa Gear Habema
                      </span>
                      <span className="text-[11px] text-[#183028] font-semibold">
                        Tarif Khusus Peserta
                      </span>
                    </div>
                    <div className="space-y-2">
                      {gearAddons.map((gear) => {
                        const checked = selectedGearIds.includes(gear.id);
                        return (
                          <label
                            key={gear.id}
                            className={`flex items-center justify-between p-2.5 border text-xs cursor-pointer transition-colors ${
                              checked
                                ? "bg-white border-[#183028]"
                                : "bg-white/70 border-stone-300 hover:border-stone-500"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 pr-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleGearAddon(gear.id)}
                                className="mt-0.5 accent-[#183028]"
                              />
                              <div>
                                <span className="font-bold text-stone-900 block">
                                  {gear.name}
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  {gear.spec}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-stone-900 tabular-nums shrink-0">
                              +{formatRupiah(gear.pricePerTrip)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pilihan Voucher Diklaim */}
                  {claimedVoucherCodes.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-stone-900 mb-2">
                        Voucher Diskon Diklaim
                      </label>
                      <select
                        value={appliedVoucherCode ?? ""}
                        onChange={(e) =>
                          setAppliedVoucherCode(e.target.value || null)
                        }
                        className="w-full px-3 py-2 text-xs font-semibold bg-white border border-stone-300 text-stone-900 focus:border-stone-950 focus:outline-none"
                      >
                        <option value="">Tanpa Voucher</option>
                        {vouchers.filter((v) =>
                          claimedVoucherCodes.includes(v.code)
                        ).map((v) => (
                          <option key={v.id} value={v.code}>
                            {v.code} — Potongan {formatRupiah(v.discountAmount)}{" "}
                            (Min. {v.minParticipants} org)
                          </option>
                        ))}
                      </select>
                      {appliedVoucherCode && activeVoucherDiscount === 0 && (
                        <p className="text-[11px] text-[#C85A17] mt-1">
                          Tambah jumlah peserta untuk memenuhi syarat minimum voucher ini.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Total & Tombol Konfirmasi */}
                <div className="border-t border-stone-300 pt-4">
                  {activeVoucherDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs text-[#183028] font-semibold mb-1.5">
                      <span>Potongan Voucher ({appliedVoucherCode})</span>
                      <span className="tabular-nums">
                        -{formatRupiah(activeVoucherDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs font-semibold text-stone-600">
                      Total Estimasi ({participantCount} Peserta)
                    </span>
                    <span className="text-xl font-bold text-stone-950 tabular-nums">
                      {formatRupiah(calculatedTotal)}
                    </span>
                  </div>

                  {bookingSubmitted ? (
                    <div className="p-3.5 bg-[#183028] text-[#F4F1EA] text-xs leading-relaxed">
                      Permintaan booking dicatat untuk{" "}
                      <strong>{participantCount} peserta</strong> pada{" "}
                      <strong>{activeTrip.title}</strong>. Admin Habema akan
                      mengirimkan rincian pembayaran &amp; form data diri.
                    </div>
                  ) : activeTrip.status === "full" ||
                    activeTrip.current_participants >= activeTrip.max_participants ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 bg-stone-300 text-stone-600 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                    >
                      Kuota Keberangkatan Penuh
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBookingSubmitted(true)}
                      className="w-full py-3.5 bg-[#C85A17] hover:bg-[#b14d10] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Lanjutkan Pemesanan Slot
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          8. LIGHTBOX PORTOFOLIO DOKUMENTASI
         ========================================== */}
      {activePhotoIndex !== null && filteredGallery[activePhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/85 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div
            className="bg-white border border-stone-900 max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-[#F4F1EA] border-b border-stone-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 truncate">
                <span className="font-bold text-stone-950 truncate">
                  {filteredGallery[activePhotoIndex].tripTitle}
                </span>
                <span>•</span>
                <span className="shrink-0">
                  {filteredGallery[activePhotoIndex].date}
                </span>
                <span>•</span>
                <span className="shrink-0">
                  {filteredGallery[activePhotoIndex].elevation}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                aria-label="Tutup foto"
                className="p-1.5 hover:bg-stone-200 text-stone-900 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-950 aspect-16/10 max-h-[60vh] w-full overflow-hidden flex items-center justify-center">
              <img
                src={filteredGallery[activePhotoIndex].imageUrl}
                alt={filteredGallery[activePhotoIndex].tripTitle}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnail Strip untuk Lompat Cepat antar Banyak Foto */}
            {filteredGallery.length > 1 && (
              <div className="px-5 py-2.5 bg-stone-900 flex items-center gap-2 overflow-x-auto">
                {filteredGallery.map((thumb, tIdx) => (
                  <button
                    key={thumb.id}
                    type="button"
                    onClick={() => setActivePhotoIndex(tIdx)}
                    className={`w-14 h-10 shrink-0 overflow-hidden border-2 transition-opacity cursor-pointer ${
                      tIdx === activePhotoIndex
                        ? "border-white opacity-100"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img
                      src={thumb.imageUrl}
                      alt={thumb.tripTitle}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="px-5 py-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {filteredGallery[activePhotoIndex].caption}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === null
                        ? 0
                        : (prev - 1 + filteredGallery.length) %
                          filteredGallery.length
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-300 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider text-stone-900 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>

                <span className="text-xs text-stone-500 tabular-nums px-1">
                  {activePhotoIndex + 1}/{filteredGallery.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === null ? 0 : (prev + 1) % filteredGallery.length
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-300 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider text-stone-900 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}