"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { toast } from "sonner";

interface OtTrip {
  id: string;
  title: string;
  slug: string;
  destination: string;
  final_price: number;
  departure_date: string;
  return_date: string;
  current_participants: number;
  max_participants: number;
}

interface FeaturedOpenTripsProps {
  limit?: number;
}

function parseScheduleParts(raw: string): {
  day: string;
  monthYear: string;
  full: string;
} {
  if (!raw) {
    return { day: "TBA", monthYear: "Jadwal", full: "Jadwal Menyusul" };
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return { day: "—", monthYear: "Kloter", full: raw };
  }
  const day = parsed.toLocaleDateString("id-ID", { day: "2-digit" });
  const monthYear = parsed.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
  const full = parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return { day, monthYear, full };
}

export default function FeaturedOpenTrips({
  limit = 3,
}: FeaturedOpenTripsProps) {
  const [trips, setTrips] = useState<OtTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchTrips = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/ot-trips?limit=${limit}&status=published`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json?.data ?? [];
        const parsed: OtTrip[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          destination: row.destination ?? "",
          final_price: row.final_price ?? 0,
          departure_date: row.departure_date ?? "",
          return_date: row.return_date ?? "",
          current_participants: row.current_participants ?? 0,
          max_participants: row.max_participants ?? 0,
        }));
        if (!cancelled) setTrips(parsed);
      } catch (err) {
        console.error("Gagal memuat open trip:", err);
        toast.error("Gagal memuat jadwal open trip");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchTrips();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (isLoading) {
    return (
      <section className="py-16 sm:py-24 bg-background border-t border-border font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-2xl bg-muted animate-pulse" />
              <div className="h-9 w-64 rounded-2xl bg-muted animate-pulse" />
            </div>
            <div className="h-10 w-40 rounded-2xl bg-muted animate-pulse" />
          </div>

          <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {Array.from({ length: limit }).map((_, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between gap-6 animate-pulse">
                <div className="h-12 w-24 rounded-2xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/2 rounded-2xl bg-muted" />
                  <div className="h-3.5 w-1/3 rounded-2xl bg-muted" />
                </div>
                <div className="h-10 w-32 rounded-2xl bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (trips.length === 0) {
    return (
      <section className="py-16 sm:py-24 bg-background border-t border-border font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest block mb-1">
                Jadwal Pendakian
              </span>
              <h3 className="font-sans text-lg font-bold text-foreground">
                Belum ada kloter open trip yang dibuka saat ini
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Silakan periksa kembali secara berkala untuk pembukaan kuota keberangkatan berikutnya.
              </p>
            </div>
            <Link
              href="/opentrip"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest hover:text-forest-dark shrink-0"
            >
              <span>Arsip Perjalanan</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24 bg-background border-t border-border font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── HEADER EDITORIAL ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-forest block">
              Kalender Keberangkatan
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-[42px] font-bold text-foreground tracking-tight leading-[1.08]">
              Open Trip Terbaru
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
              Kuota terbatas per kloter dengan rasio pemandu lapangan terukur.
            </p>
            <Link
              href="/opentrip"
              className="group inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl border border-foreground bg-background hover:bg-forest hover:border-forest text-foreground hover:text-primary-foreground text-xs font-bold uppercase tracking-wider transition-colors shrink-0 w-fit"
            >
              <span>Semua Jadwal</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* ── SCHEDULE MANIFEST TABLE / LIST (NON-CARD-SLOP) ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {/* Table Column Header (Desktop) */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-muted/40 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <div className="col-span-2">Keberangkatan</div>
            <div className="col-span-5">Rute &amp; Destinasi</div>
            <div className="col-span-2">Ketersediaan Slot</div>
            <div className="col-span-3 text-right">Biaya &amp; Reservasi</div>
          </div>

          {trips.map((trip) => {
            const dep = parseScheduleParts(trip.departure_date);
            const ret = trip.return_date
              ? parseScheduleParts(trip.return_date)
              : null;

            const maxSeats = Math.max(0, Number(trip.max_participants || 0));
            const bookedSeats = Math.max(0, Number(trip.current_participants || 0));
            const remainingSeats = Math.max(0, maxSeats - bookedSeats);
            const isFull = maxSeats > 0 && remainingSeats === 0;
            const isUrgent = !isFull && maxSeats > 0 && remainingSeats <= 4;

            return (
              <Link
                key={trip.id}
                href={`/opentrip/${trip.slug}`}
                className="group block bg-background hover:bg-forest-soft/35 transition-colors"
              >
                <article className="px-5 sm:px-6 py-5 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
                  {/* Kolom 1: Blok Tanggal Tipografis */}
                  <div className="lg:col-span-2 flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl border border-border group-hover:border-forest bg-card flex flex-col items-center justify-center shrink-0 transition-colors">
                      <span className="font-sans text-xl font-bold text-foreground leading-none tabular-nums">
                        {dep.day}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest mt-1">
                        {dep.monthYear.split(" ")[0]}
                      </span>
                    </div>

                    <div className="text-xs tabular-nums">
                      <span className="block font-bold text-foreground">
                        {dep.full}
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {ret ? `s/d ${ret.full}` : "Pulang sesuai rute"}
                      </span>
                    </div>
                  </div>

                  {/* Kolom 2: Judul Trip & Destinasi */}
                  <div className="lg:col-span-5 min-w-0 space-y-1">
                    <h3 className="font-sans text-lg sm:text-xl font-bold text-foreground group-hover:text-forest transition-colors leading-snug">
                      {trip.title}
                    </h3>
                    <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
                      <span className="truncate">
                        {trip.destination || "Jalur Pendakian Habema"}
                      </span>
                    </p>
                  </div>

                  {/* Kolom 3: Status Slot Tanpa Progress Bar Dekoratif */}
                  <div className="lg:col-span-2 flex lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-1.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                    {maxSeats > 0 ? (
                      <>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-2xl text-[11px] font-bold tabular-nums ${
                            isFull
                              ? "bg-muted text-muted-foreground"
                              : isUrgent
                                ? "bg-accent text-accent-foreground border border-gold/40"
                                : "bg-forest-soft text-forest border border-forest/25"
                          }`}
                        >
                          {isFull
                            ? "Kuota Penuh"
                            : `Tersisa ${remainingSeats} dari ${maxSeats} slot`}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {bookedSeats} peserta terdaftar
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-forest">
                        Pendaftaran Dibuka
                      </span>
                    )}
                  </div>

                  {/* Kolom 4: Harga & Aksi */}
                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                    <div className="lg:text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Paket Per Orang
                      </span>
                      <span className="font-sans text-lg sm:text-xl font-bold text-foreground tabular-nums">
                        Rp{trip.final_price.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <span className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-2xl bg-gold group-hover:bg-gold-light text-secondary-foreground text-xs font-bold transition-colors shrink-0">
                      <span>Lihat Rute</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}