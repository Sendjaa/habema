"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Compass,
  FileText,
  MapPin,
  Minus,
  Mountain,
  Plus,
  ShieldCheck,
  Users,
  X,
 } from "lucide-react";

type DetailGalleryItem = {
  url: string;
  caption: string;
};

type DetailItineraryStep = {
  time: string;
  activity: string;
};

type DetailItineraryDay = {
  day: string;
  title: string;
  elevationProfile: string;
  steps: DetailItineraryStep[];
};

type OpenTripDetail = {
  id: string;
  code: string;
  title: string;
  region: string;
  difficulty: string;
  ratioGuide: string;
  route: string;
  elevation: string;
  duration: string;
  departureDate: string;
  meetingPoint: string;
  gallery: DetailGalleryItem[];
  summary: string;
  highlights: string[];
  itinerary: DetailItineraryDay[];
  included: string[];
  excluded: string[];
  mandatoryGear: string[];
  notes: string[];
  pricePerPerson: number;
  quotaTotal: number;
  quotaRemaining: number;
  returnDate: string;
};

type OpenTripCoupon = {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  validUntil: string | null;
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Mudah",
  moderate: "Menengah",
  hard: "Sulit",
  extreme: "Ekstrem",
};

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return [item];
        if (item && typeof item === "object") {
          const candidate =
            (item as any).url ??
            (item as any).image_url ??
            (item as any).activity ??
            (item as any).text;
          return typeof candidate === "string" ? [candidate] : [];
        }
        return [];
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseArray(parsed);
    } catch {
      return trimmed
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return trimmed
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseJsonArray(value: unknown): any[] | null {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatCouponValue(coupon: OpenTripCoupon): string {
  return coupon.discountType === "percentage"
    ? `${coupon.discountValue}%`
    : formatRupiah(coupon.discountValue);
}

function mapCouponRow(row: any): OpenTripCoupon {
  return {
    id: String(row.id),
    code: String(row.code),
    description: String(row.description ?? ""),
    discountType: row.discount_type === "fixed" ? "fixed" : "percentage",
    discountValue: Number(row.discount_value) || 0,
    minPurchase: Number(row.min_purchase) || 0,
    maxDiscount:
      row.max_discount === null || row.max_discount === undefined
        ? null
        : Number(row.max_discount),
    validUntil: row.end_date ? formatDate(row.end_date) : null,
  };
}

function buildItinerary(value: unknown): DetailItineraryDay[] {
  const parsed = parseJsonArray(value);

  if (!parsed) {
    const lines = parseArray(value);
    if (lines.length === 0) return [];

    return [
      {
        day: "Hari 1",
        title: "Rencana Perjalanan",
        elevationProfile: "",
        steps: lines.map((activity) => ({ time: "", activity })),
      },
    ];
  }

  return parsed
    .map((item: any, index: number) => {
      const activities = Array.isArray(item?.activities)
        ? item.activities
        : Array.isArray(item?.steps)
          ? item.steps
          : [];

      return {
        day: `Hari ${item?.day ?? index + 1}`,
        title:
          typeof item?.title === "string"
            ? item.title
            : `Hari ${item?.day ?? index + 1}`,
        elevationProfile:
          typeof item?.elevationProfile === "string"
            ? item.elevationProfile
            : typeof item?.elevation_profile === "string"
              ? item.elevation_profile
              : "",
        steps: activities
          .map((step: any) => ({
            time:
              step && typeof step === "object" && typeof step.time === "string"
                ? step.time
                : "",
            activity:
              typeof step === "string"
                ? step
                : String(step?.activity ?? step?.title ?? ""),
          }))
          .filter((step: DetailItineraryStep) => step.activity.length > 0),
      };
    })
    .filter((day: DetailItineraryDay) => day.steps.length > 0 || day.title);
}

function buildGallery(row: any): DetailGalleryItem[] {
  const imageUrls = [
    row.featured_image,
    ...parseArray(row.gallery_images),
    ...(Array.isArray(row.images)
      ? [...row.images]
          .sort((a: any, b: any) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
          .map((image: any) => image?.image_url)
      : []),
  ].filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0
  );

  const uniqueUrls = Array.from(new Set(imageUrls));

  if (uniqueUrls.length === 0) {
    return [
      {
        url: "/placeholder.jpg",
        caption: String(row.destination ?? row.title ?? "Open Trip"),
      },
    ];
  }

  return uniqueUrls.map((url, index) => ({
    url,
    caption: `${row.destination ?? row.title ?? "Open Trip"} ${index + 1}`,
  }));
}

function buildCode(row: any): string {
  const base = String(row.destination ?? row.title ?? "TRIP")
    .replace(/^gunung\s+/i, "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3);

  const departure = new Date(row.departure_date);
  const day = Number.isNaN(departure.getTime())
    ? "00"
    : String(departure.getDate()).padStart(2, "0");

  return `${base || "TRP"}-${day}`;
}

function buildElevation(row: any): string {
  const text = `${row.title ?? ""} ${row.short_description ?? ""} ${
    row.description ?? ""
  }`;
  const match = text.match(/(\d{1,2}(?:[.,]\d{3})*)\s*mdpl/i);

  return match ? `${match[1].replace(".", ",")} mdpl` : "Lihat briefing";
}

function mapTripRow(row: any): OpenTripDetail {
  const price = Number(row.final_price ?? row.base_price ?? 0);
  const quotaTotal = Number(row.max_participants ?? 0);
  const quotaUsed = Number(row.current_participants ?? 0);
  const summary =
    typeof row.short_description === "string" &&
    row.short_description.trim().length > 0
      ? row.short_description
      : String(row.description ?? "");

  return {
    id: String(row.id ?? row.slug ?? ""),
    code: buildCode(row),
    title: String(row.title ?? "Open Trip"),
    region: String(row.destination_region ?? row.destination ?? ""),
    difficulty:
      DIFFICULTY_LABELS[String(row.difficulty_level)] ?? "Menyesuaikan",
    ratioGuide: "1 Guide : 4 Peserta",
    route: [row.destination, row.destination_region]
      .filter(Boolean)
      .join(", "),
    elevation: buildElevation(row),
    duration: `${Number(row.duration_days ?? 1)} Hari ${Number(
      row.duration_nights ?? 0
    )} Malam`,
    departureDate: formatDate(row.departure_date),
    meetingPoint: String(
      row.pickup_location ?? "Pool Habema Buah Batu, Bandung"
    ),
    gallery: buildGallery(row),
    summary,
    highlights: parseArray(row.highlights),
    itinerary: buildItinerary(row.itinerary),
    included: parseArray(row.inclusions),
    excluded: parseArray(row.exclusions),
    mandatoryGear: parseArray(row.what_to_bring),
    notes: [
      ...parseArray(row.important_notes),
      ...parseArray(row.cancellation_policy),
      ...parseArray(row.refund_policy),
    ],
    pricePerPerson: price,
    quotaTotal,
    quotaRemaining: Math.max(0, quotaTotal - quotaUsed),
    returnDate: formatDate(row.return_date),
  };
}

export default function OpenTripDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug ?? "";

  const [trip, setTrip] = useState<OpenTripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"itinerary" | "facilities" | "gear">(
    "itinerary"
  );
  const [participants, setParticipants] = useState(1);
  const [paymentScheme, setPaymentScheme] = useState<"dp" | "full">("dp");
  const [coupons, setCoupons] = useState<OpenTripCoupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notesInput, setNotesInput] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoadError("Slug trip tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadTrip = async () => {
      setIsLoading(true);
      setLoadError(null);
      setTrip(null);

      try {
        const response = await fetch(
          `/api/ot-trips?slug=${encodeURIComponent(slug)}&limit=1`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const row = Array.isArray(json?.data) ? json.data[0] : null;

        if (!row) {
          throw new Error("Trip tidak ditemukan.");
        }

        if (!cancelled) {
          setTrip(mapTripRow(row));
          setSelectedImageIdx(0);
          setParticipants(1);
          setActiveTab("itinerary");
          setBookingOpen(false);
          setBookingSubmitted(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Gagal memuat detail trip."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTrip();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!supabase) {
      setCouponsError("Database kupon belum tersedia.");
      setIsLoadingCoupons(false);
      return;
    }

    let cancelled = false;

    const loadCoupons = async () => {
      setIsLoadingCoupons(true);
      setCouponsError(null);

      try {
        const { data, error } = await (supabase as any)
          .from("discounts")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const now = Date.now();
        const applicableCoupons = (Array.isArray(data) ? data : [])
          .filter((row: any) => {
            const voucherType = row.voucher_type ?? "all";
            if (voucherType !== "all" && voucherType !== "opentrip") {
              return false;
            }
            if (
              row.usage_limit !== null &&
              row.usage_limit !== undefined &&
              Number(row.usage_count ?? 0) >= Number(row.usage_limit)
            ) {
              return false;
            }
            if (row.start_date && new Date(row.start_date).getTime() > now) {
              return false;
            }
            if (row.end_date && new Date(row.end_date).getTime() < now) {
              return false;
            }
            return true;
          })
          .map(mapCouponRow);

        if (!cancelled) setCoupons(applicableCoupons);
      } catch (error) {
        if (!cancelled) {
          setCouponsError(
            error instanceof Error ? error.message : "Gagal memuat kupon."
          );
        }
      } finally {
        if (!cancelled) setIsLoadingCoupons(false);
      }
    };

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-sm font-medium text-muted-foreground">
          Memuat detail trip...
        </p>
      </div>
    );
  }

  if (loadError || !trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-sm font-medium text-foreground">
            {loadError ?? "Detail trip tidak ditemukan."}
          </p>
          <Link
            href="/opentrip"
            className="inline-flex items-center gap-2 text-xs  font-bold font-sanstracking-wider text-forest hover:text-forest-dark"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Open Trip
          </Link>
        </div>
      </div>
    );
  }

  const maxSelectable = Math.max(1, trip.quotaRemaining);
  const subtotal = participants * trip.pricePerPerson;
  const selectedCoupon =
    coupons.find((coupon) => coupon.code === selectedCouponCode) ?? null;
  const couponEligible =
    !!selectedCoupon && subtotal >= selectedCoupon.minPurchase;

  let couponDiscount = 0;
  if (selectedCoupon && couponEligible) {
    couponDiscount =
      selectedCoupon.discountType === "percentage"
        ? Math.round((subtotal * selectedCoupon.discountValue) / 100)
        : selectedCoupon.discountValue;

    if (selectedCoupon.maxDiscount !== null) {
      couponDiscount = Math.min(couponDiscount, selectedCoupon.maxDiscount);
    }

    couponDiscount = Math.max(0, Math.min(couponDiscount, subtotal));
  }

  const totalFullPrice = Math.max(0, subtotal - couponDiscount);
  const totalPayNow =
    paymentScheme === "dp" ? Math.round(totalFullPrice * 0.5) : totalFullPrice;
  const activePhoto =
    trip.gallery[selectedImageIdx] ??
    trip.gallery[0] ?? {
      url: "/placeholder.jpg",
      caption: trip.title,
    };

  const handleBookingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookingSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <div className="border-b border-forest-dark bg-forest text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-medium text-primary-foreground/80"
          >
            <Link
              href="/opentrip"
              className="inline-flex items-center gap-1.5  font-bold font-sans text-primary-foreground hover:text-forest-tint transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Semua Jadwal Open Trip
            </Link>
            <span className="text-primary-foreground/40">/</span>
            <span className="text-primary-foreground font-semibold truncate max-w-[200px] sm:max-w-none">
              {trip.title}
            </span>
          </nav>

          {/* <div className="flex flex-wrap items-center gap-2.5 text-[11px]  font-bold font-sanstracking-wider">
            <span className="text-primary-foreground/85 tabular-nums">
              Kode: <strong className="text-primary-foreground">{trip.code}</strong>
            </span>
            <span className="px-2.5 py-0.5 bg-gold text-secondary-foreground tabular-nums">
              Sisa {trip.quotaRemaining} Slot
            </span>
          </div> */}
        </div>
      </div>

      {/* ==========================================
          2. HEADER JUDUL & METADATA RUTE (BACKGROUND PUTIH)
         ========================================== */}
      <header className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-2 mb-3.5">
            <span className="px-2.5 py-1 bg-forest text-primary-foreground text-[11px]  font-bold font-sans tracking-[0.16em]">
              {trip.region}
            </span>
            {/* <span className="px-2.5 py-1 bg-forest-soft border border-forest/30 text-[11px]  font-bold font-sans tracking-[0.16em] text-forest-dark">
              Level: {trip.difficulty}
            </span>
            <span className="px-2.5 py-1 bg-accent border border-gold/40 text-[11px]  font-bold font-sans tracking-[0.16em] text-accent-foreground">
              {trip.ratioGuide}
            </span> */}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl  font-bold font-sans text-foreground tracking-tight leading-[1.08] max-w-4xl">
            {trip.title}
          </h1>

          <p className="mt-3 text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-forest shrink-0" />
            <span>Jalur: {trip.route}</span>
          </p>

          {/* Strip Parameter Lapangan 4 Kolom dengan Garis Tipis & Presisi */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-border bg-card mt-7">
            <div className="p-4 border-b lg:border-b-0 border-r border-border bg-background">
              <span className="text-[10px]  font-bold font-sans tracking-[0.18em] text-forest flex items-center gap-1.5 mb-1">
                <Mountain className="w-3.5 h-3.5 text-forest" />
                Elevasi Puncak
              </span>
              <p className="text-sm sm:text-base  font-bold font-sans text-foreground tabular-nums">
                {trip.elevation}
              </p>
            </div>

            <div className="p-4 border-b lg:border-b-0 lg:border-r border-border bg-background">
              <span className="text-[10px]  font-bold font-sans tracking-[0.18em] text-forest flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-forest" />
                Durasi Ekspedisi
              </span>
              <p className="text-sm sm:text-base  font-bold font-sans text-foreground">
                {trip.duration}
              </p>
            </div>

            <div className="p-4 border-r border-border bg-background">
              <span className="text-[10px]  font-bold font-sans tracking-[0.18em] text-forest flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-forest" />
                Tanggal Kloter
              </span>
              <p className="text-sm sm:text-base  font-bold font-sans text-foreground tabular-nums">
                {trip.departureDate}
              </p>
            </div>

            <div className="p-4 bg-accent/60">
              <span className="text-[10px]  font-bold font-sans tracking-[0.18em] text-accent-foreground flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-gold" />
                Titik Kumpul
              </span>
              <p className="text-xs sm:text-sm  font-bold font-sans text-foreground line-clamp-1">
                {trip.meetingPoint}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          3. KONTEN UTAMA 2 KOLOM (GALERI + DETAIL | PANEL RESERVASI)
         ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-background">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* KOLOM KIRI: Galeri, Ringkasan, Tab Itinerary/Fasilitas/Gear */}
          <div className="lg:col-span-8 space-y-10">
            {/* Galeri Visual Rute */}
            <section aria-label="Galeri dokumentasi rute" className="space-y-2.5">
              <div className="relative aspect-[16/9] bg-muted border border-border overflow-hidden">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.caption}
                  width={1600}
                  height={900}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-forest-dark/95 text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-4 border-t border-forest">
                  <p className="text-xs leading-snug line-clamp-1">
                    {activePhoto.caption}
                  </p>
                  <span className="px-2 py-0.5 bg-gold text-secondary-foreground text-[11px]  font-bold font-sans tabular-nums shrink-0">
                    {selectedImageIdx + 1} / {trip.gallery.length}
                  </span>
                </div>
              </div>

              {/* Thumbnail Switcher */}
              <div className="grid grid-cols-4 gap-2.5">
                {trip.gallery.map((item, idx) => {
                  const isSelected = idx === selectedImageIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative aspect-[16/10] overflow-hidden border transition-all cursor-pointer ${
                        isSelected
                          ? "border-gold ring-1 ring-gold opacity-100"
                          : "border-border opacity-65 hover:opacity-100 hover:border-forest"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.caption}
                        width={320}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Ringkasan Ekspedisi & Highlight */}
            <section className="border border-border border-l-2 border-l-forest bg-background p-6 sm:p-7 space-y-6">
              <div>
                <span className="inline-block px-2 py-0.5 bg-forest-soft text-[10px]  font-bold font-sans tracking-[0.2em] text-forest mb-2">
                  Ringkasan Rute &amp; Standar Lapangan
                </span>
                <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed">
                  {trip.summary}
                </p>
              </div>

              <div className="pt-5 border-t border-border">
                <h2 className="text-sm  font-bold font-sans tracking-[0.12em] text-foreground mb-3.5">
                  Poin Utama Keberangkatan Ini
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trip.highlights.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3.5 bg-forest-soft border border-forest/25"
                    >
                      <span className="w-5 h-5 bg-forest text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span className="text-xs sm:text-[13px] text-foreground font-medium leading-snug">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Navigasi Tab Detail (Itinerary / Fasilitas / Perlengkapan Wajib) */}
            <section className="border border-border bg-background">
              <div
                role="tablist"
                aria-label="Detail jadwal dan perlengkapan"
                className="grid grid-cols-3 border-b border-border bg-muted"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "itinerary"}
                  onClick={() => setActiveTab("itinerary")}
                  className={`py-3.5 px-3 text-xs  font-bold font-sans tracking-[0.14em] border-r border-border transition-colors cursor-pointer ${
                    activeTab === "itinerary"
                      ? "bg-forest text-primary-foreground"
                      : "text-foreground/75 hover:text-foreground hover:bg-forest-soft"
                  }`}
                >
                  Itinerary Perjalanan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "facilities"}
                  onClick={() => setActiveTab("facilities")}
                  className={`py-3.5 px-3 text-xs  font-bold font-sans tracking-[0.14em] border-r border-border transition-colors cursor-pointer ${
                    activeTab === "facilities"
                      ? "bg-forest text-primary-foreground"
                      : "text-foreground/75 hover:text-foreground hover:bg-forest-soft"
                  }`}
                >
                  Termasuk &amp; Tidak
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "gear"}
                  onClick={() => setActiveTab("gear")}
                  className={`py-3.5 px-3 text-xs  font-bold font-sans tracking-[0.14em] transition-colors cursor-pointer ${
                    activeTab === "gear"
                      ? "bg-forest text-primary-foreground"
                      : "text-foreground/75 hover:text-foreground hover:bg-forest-soft"
                  }`}
                >
                  Gear Wajib &amp; Aturan
                </button>
              </div>

              <div className="p-6 sm:p-7 bg-background">
                {/* TAB 1: ITINERARY */}
                {activeTab === "itinerary" && (
                  <div className="space-y-6">
                    {trip.itinerary.map((dayItem, dIdx) => (
                      <div
                        key={dIdx}
                        className="border border-forest/30 bg-background"
                      >
                        <div className="px-4 py-3 bg-forest text-primary-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 bg-gold text-secondary-foreground text-[10px]  font-bold font-sans tracking-wider">
                              {dayItem.day}
                            </span>
                            <h3 className="text-sm sm:text-base  font-bold font-sans text-primary-foreground">
                              {dayItem.title}
                            </h3>
                          </div>
                          <span className="text-[11px] font-semibold text-forest-tint tabular-nums">
                            {dayItem.elevationProfile}
                          </span>
                        </div>

                        <div className="divide-y divide-border">
                          {dayItem.steps.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-4 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-5 hover:bg-forest-soft/50 transition-colors"
                            >
                              {step.time && (
                                <span className="inline-block px-2 py-0.5 bg-accent text-accent-foreground text-xs  font-bold font-sans tabular-nums shrink-0 w-fit sm:w-24 text-center">
                                  {step.time}
                                </span>
                              )}
                              <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                                {step.activity}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: TERMASUK & TIDAK TERMASUK */}
                {activeTab === "facilities" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-forest/40 bg-forest-soft/60 p-5">
                      <h3 className="text-xs font-sans font-bold font-sans tracking-[0.14em] text-forest-dark mb-4 pb-2.5 border-b border-forest/20">
                        Sudah Termasuk Dalam Paket
                      </h3>
                      <ul className="space-y-3">
                        {trip.included.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground leading-relaxed"
                          >
                            <Check className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-gold/40 bg-accent/40 p-5">
                      <h3 className="text-xs  font-bold font-sans tracking-[0.14em] text-accent-foreground mb-4 pb-2.5 border-b border-gold/30">
                        Tidak Termasuk (Biaya Pribadi)
                      </h3>
                      <ul className="space-y-3">
                        {trip.excluded.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/85 leading-relaxed"
                          >
                            <X className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* TAB 3: GEAR WAJIB & KETENTUAN */}
                {activeTab === "gear" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold font-sans tracking-[0.14em] text-foreground mb-3">
                        Perlengkapan Pribadi Wajib Peserta
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {trip.mandatoryGear.map((gear, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 border border-border bg-background flex items-start gap-2.5 text-xs sm:text-sm text-foreground"
                          >
                            <span className="px-1.5 py-0.5 bg-forest text-primary-foreground text-[10px]  font-bold font-sans tabular-nums shrink-0 mt-0.5">
                              0{idx + 1}
                            </span>
                            <span>{gear}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-accent border-l-2 border-l-gold border border-gold/30 space-y-2">
                      <h4 className="text-xs  font-bold font-sans tracking-[0.14em] text-accent-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gold" />
                        Ketentuan Operasional Kloter
                      </h4>
                      <ul className="space-y-1.5">
                        {trip.notes.map((note, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-accent-foreground leading-relaxed flex items-start gap-2"
                          >
                            <span className= "font-bold font-sans text-gold">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN: PANEL RESERVASI STICKY (HEADER SOLID FOREST + CTA GOLD) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="border border-border bg-background">
              {/* Header Harga Solid Forest */}
              <div className="p-5 sm:p-6 bg-forest text-primary-foreground border-b border-forest-dark">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px]  font-bold font-sans tracking-[0.2em] text-forest-tint">
                    Biaya Per Peserta
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-forest-dark text-[11px]  font-bold font-sans text-primary-foreground tabular-nums">
                    <Users className="w-3.5 h-3.5 text-forest-tint" />
                    {trip.quotaRemaining}/{trip.quotaTotal} tersedia
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl  font-bold font-sans text-primary-foreground tabular-nums">
                    Rp{trip.pricePerPerson.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-primary-foreground/80">/orang</span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5 bg-background">
                {/* Ringkasan Jadwal Berangkat & Pulang */}
                <div className="grid grid-cols-2 border border-border text-xs">
                  <div className="p-3 border-r border-border bg-forest-soft/50">
                    <span className="block text-[10px]  font-bold font-sans tracking-wider text-forest mb-0.5">
                      Berangkat
                    </span>
                    <span className= "font-bold font-sans text-foreground tabular-nums">
                      {trip.departureDate}
                    </span>
                  </div>
                  <div className="p-3 bg-forest-soft/50">
                    <span className="block text-[10px]  font-bold font-sanstracking-wider text-forest mb-0.5">
                      Kembali
                    </span>
                    <span className= "font-bold font-sans text-foreground tabular-nums">
                      {trip.returnDate}
                    </span>
                  </div>
                </div>

                {/* Jumlah Peserta */}
                <div>
                  <label className="block text-xs  font-bold font-sanstracking-[0.14em] text-foreground mb-2">
                    Jumlah Peserta
                  </label>
                  <div className="flex items-center justify-between border border-border bg-background h-11 px-3">
                    <button
                      type="button"
                      onClick={() => setParticipants((p) => Math.max(1, p - 1))}
                      disabled={participants <= 1}
                      aria-label="Kurangi peserta"
                      className="w-8 h-8 flex items-center justify-center border border-border hover:bg-forest hover:text-primary-foreground hover:border-forest disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm  font-bold font-sans text-foreground tabular-nums">
                      {participants} Peserta
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setParticipants((p) => Math.min(maxSelectable, p + 1))
                      }
                      disabled={participants >= maxSelectable}
                      aria-label="Tambah peserta"
                      className="w-8 h-8 flex items-center justify-center border border-border hover:bg-forest hover:text-primary-foreground hover:border-forest disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Skema Pembayaran (DP vs Lunas) */}
                <div>
                  <label className="block text-xs  font-bold font-sanstracking-[0.14em] text-foreground mb-2">
                    Skema Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentScheme("dp")}
                      className={`p-3 text-left border transition-colors cursor-pointer ${
                        paymentScheme === "dp"
                          ? "bg-forest-soft border-forest text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-forest/50"
                      }`}
                    >
                      <span className="block text-[11px] font-bold font-sans tracking-wider text-forest">
                        Booking DP
                      </span>
                      <span className="block text-xs font-bold font-sans text-foreground tabular-nums mt-0.5">
                        {formatRupiah(Math.round(totalFullPrice * 0.5))}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentScheme("full")}
                      className={`p-3 text-left border transition-colors cursor-pointer ${
                        paymentScheme === "full"
                          ? "bg-forest-soft border-forest text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-forest/50"
                      }`}
                    >
                      <span className="block text-[11px] font-bold font-sans tracking-wider text-forest">
                        Bayar Lunas
                      </span>
                      <span className="block text-xs font-bold font-sans text-foreground tabular-nums mt-0.5">
                        {formatRupiah(totalFullPrice)}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Kupon */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="block text-xs font-bold font-sans tracking-[0.14em] text-foreground">
                      Kupon
                    </span>
                    <Link
                      href="/bundles"
                      className="text-[10px] font-bold font-sans uppercase tracking-wider text-forest hover:underline"
                    >
                      Klaim kupon
                    </Link>
                  </div>

                  {isLoadingCoupons ? (
                    <p className="border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                      Memuat kupon...
                    </p>
                  ) : couponsError ? (
                    <p className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {couponsError}
                    </p>
                  ) : coupons.length === 0 ? (
                    <div className="border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                      Belum ada kupon open trip.{" "}
                      <Link
                        href="/bundles"
                        className="font-bold text-forest hover:underline"
                      >
                        Lihat kupon
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCouponCode("")}
                        className={`flex w-full items-center justify-between border p-3 text-left text-xs transition-colors cursor-pointer ${
                          selectedCouponCode === ""
                            ? "border-forest bg-forest-soft text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-forest/50"
                        }`}
                      >
                        <span className="font-bold font-sans">Tanpa kupon</span>
                        <span>
                          {selectedCouponCode === "" ? "Dipilih" : "Pilih"}
                        </span>
                      </button>

                      {coupons.map((coupon) => {
                        const eligible = subtotal >= coupon.minPurchase;
                        const selected = selectedCouponCode === coupon.code;

                        return (
                          <button
                            key={coupon.id}
                            type="button"
                            disabled={!eligible}
                            onClick={() =>
                              setSelectedCouponCode(
                                selected ? "" : coupon.code
                              )
                            }
                            className={`w-full border p-3 text-left transition-colors ${
                              selected
                                ? "border-forest bg-forest-soft"
                                : "border-border bg-background"
                            } ${
                              eligible
                                ? "cursor-pointer hover:border-forest/50"
                                : "cursor-not-allowed opacity-60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="block text-xs font-bold font-sans text-foreground">
                                  {coupon.code}
                                </span>
                                {coupon.description && (
                                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                                    {coupon.description}
                                  </span>
                                )}
                              </div>
                              <span className="shrink-0 text-xs font-bold font-sans text-forest tabular-nums">
                                {formatCouponValue(coupon)}
                              </span>
                            </div>

                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                              {coupon.minPurchase > 0 && (
                                <span>
                                  Min. {formatRupiah(coupon.minPurchase)}
                                </span>
                              )}
                              {coupon.maxDiscount !== null && (
                                <span>
                                  Maks. {formatRupiah(coupon.maxDiscount)}
                                </span>
                              )}
                              {coupon.validUntil && (
                                <span>s.d. {coupon.validUntil}</span>
                              )}
                              {!eligible && (
                                <span className="font-bold text-red-600">
                                  Kurang{" "}
                                  {formatRupiah(coupon.minPurchase - subtotal)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedCoupon && !couponEligible && (
                    <p className="mt-2 text-[11px] text-red-600">
                      Minimal transaksi{" "}
                      {formatRupiah(selectedCoupon.minPurchase)} untuk memakai
                      kupon ini.
                    </p>
                  )}
                </div>

                {/* Rincian Total */}
                <div className="pt-4 border-t border-border space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({participants} peserta)</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between font-semibold text-forest">
                      <span>Kupon {selectedCouponCode}</span>
                      <span className="tabular-nums">
                        -{formatRupiah(couponDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Paket</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatRupiah(totalFullPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-border">
                    <span className="font-bold font-sans tracking-wider text-foreground">
                      {paymentScheme === "dp"
                        ? "Bayar DP Sekarang"
                        : "Total Dibayar"}
                    </span>
                    <span className="text-lg font-bold font-sans text-forest tabular-nums">
                      {formatRupiah(totalPayNow)}
                    </span>
                  </div>
                </div>

                {/* Tombol Utama (Aksen CTA Gold) */}
                <button
                  type="button"
                  onClick={() => {
                    setBookingSubmitted(false);
                    setBookingOpen(true);
                  }}
                  className="w-full h-12 bg-gold hover:bg-gold-light text-secondary-foreground  font-bold font-sans text-xstracking-[0.16em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Amankan Slot Kloter</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                  <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
                  <span>
                    Pelunasan maksimal H-5. Pengembalian penuh jika kloter
                    batal karena kuota atau cuaca ekstrem.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ==========================================
          4. MODAL FORM RESERVASI SLOT
         ========================================== */}
      {bookingOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/75 flex items-center justify-center p-4"
          onClick={() => setBookingOpen(false)}
        >
          <div
            className="bg-card border border-border max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-forest-soft border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold font-sans tracking-[0.2em] text-forest block">
                  Formulir Registrasi Kloter • {trip.code}
                </span>
                <h2 className="text-base  font-bold font-sans text-foreground">
                  {trip.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingOpen(false)}
                aria-label="Tutup formulir"
                className="p-1.5 hover:bg-muted text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingSubmitted ? (
              <div className="p-6 space-y-5">
                <div className="p-4 bg-forest-soft border border-forest-tint space-y-1.5">
                  <span className="text-[11px]  font-bold font-sanstracking-wider text-forest">
                    Data Reservasi Tercatat
                  </span>
                  <p className="text-sm  font-bold font-sans text-foreground">
                    {fullName} ({participants} Peserta)
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tim operasional Habema akan mengirimkan instruksi pembayaran{" "}
                    <strong>
                      {paymentScheme === "dp" ? "DP" : "Pelunasan"} sebesar{" "}
                      {formatRupiah(totalPayNow)}
                    </strong>{" "}
                    {couponDiscount > 0 && selectedCoupon
                      ? `dengan kupon ${selectedCoupon.code}. `
                      : ""}
                    serta tautan unggah surat sehat ke WhatsApp{" "}
                    <strong>{whatsapp}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingOpen(false)}
                  className="w-full h-11 bg-forest hover:bg-forest-dark text-primary-foreground text-xs  font-bold font-sanstracking-wider cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs  font-bold font-sanstracking-wider text-foreground mb-1.5">
                    Nama Lengkap Koordinator Peserta *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sesuai KTP / Identitas"
                    className="w-full h-10 px-3 border border-input bg-background text-sm text-foreground focus:outline-none focus:border-forest"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs  font-bold font-sanstracking-wider text-foreground mb-1.5">
                      Nomor WhatsApp Aktif *
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full h-10 px-3 border border-input bg-background text-sm text-foreground tabular-nums focus:outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs  font-bold font-sanstracking-wider text-foreground mb-1.5">
                      Kontak Darurat Keluarga *
                    </label>
                    <input
                      type="tel"
                      required
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="Nama & No. HP Kerabat"
                      className="w-full h-10 px-3 border border-input bg-background text-sm text-foreground focus:outline-none focus:border-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs  font-bold font-sanstracking-wider text-foreground mb-1.5">
                    Catatan Medis / Kebutuhan Sewa Alat
                  </label>
                  <textarea
                    rows={2}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Contoh: Riwayat alergi dingin, atau butuh sewa sepatu ukuran 42"
                    className="w-full p-3 border border-input bg-background text-sm text-foreground focus:outline-none focus:border-forest"
                  />
                </div>

                <div className="p-3 bg-muted border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Tagihan {paymentScheme === "dp" ? "DP" : "Lunas"} (
                    {participants} Peserta)
                  </span>
                  <span className="text-base font-bold font-sans text-forest tabular-nums">
                    {formatRupiah(totalPayNow)}
                  </span>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setBookingOpen(false)}
                    className="px-4 h-11 border border-border bg-background text-xs  font-bold font-sanstracking-wider text-foreground hover:bg-muted cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gold hover:bg-gold-light text-secondary-foreground text-xs  font-bold font-sanstracking-wider cursor-pointer"
                  >
                    Konfirmasi Pendaftaran
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
