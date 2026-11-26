"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import {
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  Loader2,
  CreditCard,
  ShieldCheck,
  FileText,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BookingDetail {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  subtotal: number;
  discount_amount: number;
  additional_options_cost: number;
  total_cost: number;
  deposit_amount: number;
  status: string;
  pickup_date: string;
  return_date: string;
  notes: string;
  created_at: string;
  booking_items: Array<{
    id: string;
    equipment_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    equipment?: {
      id: string;
      name: string;
      image_url?: string;
      description?: string;
    } | null;
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const setTransaction = useCartStore((state) => state.setTransaction);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  useEffect(() => {
    const fetchBookingDetail = async () => {
      try {
        if (!supabase) {
          toast.error("Koneksi database tidak tersedia");
          return;
        }

        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bookingError) {
          console.error(
            "Booking error details:",
            JSON.stringify(bookingError, null, 2)
          );
          toast.error("Gagal memuat detail booking: " + bookingError.message);
          return;
        }

        if (!bookingData) {
          toast.error("Booking tidak ditemukan");
          return;
        }

        try {
          const { data: itemsData, error: itemsError } = await supabase
            .from("booking_items")
            .select(
              `
              *,
              equipment (
                id,
                name,
                image_url,
                description
              )
            `
            )
            .eq("booking_id", bookingId);

          if (itemsError) {
            console.error("Items error:", itemsError);
            setBooking({
              ...(bookingData as any),
              booking_items: [],
            });
          } else {
            setBooking({
              ...(bookingData as any),
              booking_items: itemsData || [],
            });
          }
        } catch (itemsError) {
          console.error("Error fetching items:", itemsError);
          setBooking({
            ...(bookingData as any),
            booking_items: [],
          });
        }
      } catch (error) {
        console.error("General error:", JSON.stringify(error, null, 2));
        toast.error("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetail();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusMeta = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Menunggu Pembayaran",
          badgeClass:
            "bg-accent text-accent-foreground border border-gold/40",
          Icon: Clock,
        };
      case "confirmed":
        return {
          label: "Dikonfirmasi • Siap Diambil",
          badgeClass:
            "bg-forest-soft text-forest border border-forest/30",
          Icon: CheckCircle2,
        };
      case "picked_up":
      case "active":
        return {
          label: "Sedang Dipinjam",
          badgeClass:
            "bg-forest text-primary-foreground border border-forest-dark",
          Icon: Package,
        };
      case "returned":
      case "completed":
        return {
          label: "Selesai & Dikembalikan",
          badgeClass:
            "bg-forest-soft text-forest-dark border border-forest/25",
          Icon: ShieldCheck,
        };
      case "cancelled":
        return {
          label: "Dibatalkan",
          badgeClass:
            "bg-destructive/10 text-destructive border border-destructive/30",
          Icon: AlertCircle,
        };
      default:
        return {
          label: status,
          badgeClass: "bg-muted text-muted-foreground border border-border",
          Icon: FileText,
        };
    }
  };

  const handlePayment = () => {
    if (!booking) return;

    const transactionData = {
      items: booking.booking_items.map((item) => ({
        id: item.equipment?.id || item.equipment_id,
        name: item.equipment?.name || "Perlengkapan Outdoor",
        image_url: item.equipment?.image_url || "/placeholder.png",
        price: item.unit_price,
        quantity: item.quantity,
        category: "equipment",
      })),
      duration: booking.rental_days,
      days: booking.rental_days,
      payment: {
        method: "Pending",
        bookingId: booking.id,
      },
      paymentMethod: "Midtrans",
      totalPrice: booking.total_cost,
    };

    setTransaction(transactionData);
    router.push("/payment");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Detail Booking...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 font-body">
        <div className="p-8 rounded-2xl border border-border bg-card max-w-md w-full text-center space-y-3">
          <p className="font-sans text-lg font-bold text-foreground">
            Booking tidak ditemukan
          </p>
          <p className="text-xs text-muted-foreground">
            Data reservasi tidak tersedia atau Anda tidak memiliki akses ke dokumen ini.
          </p>
          <Button
            type="button"
            onClick={() => router.back()}
            className="mt-2 rounded-2xl bg-forest hover:bg-forest-dark text-primary-foreground text-xs font-bold px-5 h-10"
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusMeta(booking.status);
  const StatusIcon = statusMeta.Icon;
  const totalUnitQty = booking.booking_items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-16">
      {/* ==========================================
          1. TOP DISPATCH & NAVIGATION BAR
         ========================================== */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Kembali"
              className="w-9 h-9 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft flex items-center justify-center text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-sans text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  Detail Booking Sewa
                </h1>
                <span className="px-2.5 py-0.5 rounded-2xl bg-muted border border-border text-[11px] font-mono font-bold text-foreground">
                  #{booking.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Dibuat pada {formatDate(booking.created_at)}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs font-bold ${statusMeta.badgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusMeta.label}</span>
          </span>
        </div>
      </div>

      {/* ==========================================
          2. MAIN TWO-COLUMN WORKSPACE (max-w-7xl)
         ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (7 KOLOM): PERIODE SEWA, MANIFEST GEAR & CATATAN
             ========================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* Jadwal & Durasi Penyewaan */}
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-background flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                  Jadwal Penggunaan Alat
                </span>
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {booking.rental_days} Malam / Hari
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border bg-background">
                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-forest-soft border border-forest/20 text-forest flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Tanggal Mulai
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-foreground">
                      {formatDate(booking.start_date)}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-forest-soft border border-forest/20 text-forest flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Tanggal Kembali
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-foreground">
                      {formatDate(booking.end_date)}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-accent border border-gold/30 text-accent-foreground flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Durasi Sewa
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                      {booking.rental_days} Hari
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Daftar Perlengkapan yang Disewa */}
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-background flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-forest" />
                  <h2 className="font-sans text-sm sm:text-base font-bold text-foreground">
                    Perlengkapan yang Disewa
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-2xl bg-forest-soft border border-forest/25 text-[11px] font-bold text-forest tabular-nums">
                  {totalUnitQty} Unit
                </span>
              </div>

              {booking.booking_items.length === 0 ? (
                <div className="p-8 text-center bg-background text-xs text-muted-foreground">
                  Rincian item perlengkapan tidak tersedia untuk booking ini.
                </div>
              ) : (
                <div className="divide-y divide-border bg-background">
                  {booking.booking_items.map((item) => {
                    const eqName =
                      item.equipment?.name || "Perlengkapan Outdoor";
                    const eqImage = item.equipment?.image_url;

                    return (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {eqImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={eqImage}
                              alt={eqName}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-border object-cover shrink-0 bg-muted"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-border bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <h3 className="font-sans text-sm sm:text-base font-bold text-foreground truncate">
                              {eqName}
                            </h3>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {formatCurrency(item.unit_price)} × {item.quantity}{" "}
                              unit
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Subtotal
                          </span>
                          <p className="font-sans text-sm sm:text-base font-bold text-foreground tabular-nums">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Catatan Penyewa (Jika Ada) */}
            {booking.notes && (
              <section className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-background flex items-center gap-2">
                  <FileText className="w-4 h-4 text-forest" />
                  <h2 className="font-sans text-sm font-bold text-foreground">
                    Catatan Pemesanan
                  </h2>
                </div>
                <div className="p-5 bg-background">
                  <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                    {booking.notes}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* ==========================================================
              KOLOM KANAN (5 KOLOM): PANEL RINGKASAN TAGIHAN & AKSI BAYAR
             ========================================================== */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header Solid Forest */}
              <div className="px-6 py-4 bg-forest text-primary-foreground border-b border-forest-dark flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-forest-tint">
                    Ringkasan Tagihan
                  </span>
                  <h2 className="font-sans text-base font-bold text-primary-foreground mt-0.5">
                    Rincian Biaya Sewa
                  </h2>
                </div>
                <Receipt className="w-5 h-5 text-forest-tint" />
              </div>

              <div className="p-6 space-y-5 bg-background">
                {/* Breakdown Angka */}
                <div className="space-y-3 text-xs sm:text-sm tabular-nums">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Sewa ({booking.rental_days} hari)</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(booking.subtotal)}
                    </span>
                  </div>

                  {Number(booking.discount_amount) > 0 && (
                    <div className="flex justify-between text-forest font-semibold">
                      <span>Potongan Diskon</span>
                      <span>-{formatCurrency(booking.discount_amount)}</span>
                    </div>
                  )}

                  {Number(booking.additional_options_cost) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Biaya Opsi Tambahan</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(booking.additional_options_cost)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Deposit Jaminan</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(booking.deposit_amount)}
                    </span>
                  </div>

                  <div className="pt-3.5 border-t border-border flex items-baseline justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Total Pembayaran
                    </span>
                    <span className="font-sans text-2xl font-bold text-forest">
                      {formatCurrency(booking.total_cost)}
                    </span>
                  </div>
                </div>

                {/* Tombol Bayar Sekarang (Khusus Status Pending) */}
                {booking.status === "pending" && (
                  <div className="pt-1 space-y-3">
                    <Button
                      type="button"
                      onClick={handlePayment}
                      className="w-full h-12 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground font-bold text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 shadow-none cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Bayar Sekarang</span>
                    </Button>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl border border-border bg-muted/35 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                  <span>
                    Tunjukkan ID Booking{" "}
                    <strong className="font-mono text-foreground">
                      #{booking.id.slice(0, 8).toUpperCase()}
                    </strong>{" "}
                    beserta kartu identitas asli saat pengambilan alat di cabang.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}