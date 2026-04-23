"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone,
  Mail,
  User,
  Loader2
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
    equipment: {
      id: string;
      name: string;
      image_url?: string;
      description?: string;
    };
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetail = async () => {
      try {
        console.log('Fetching booking detail for ID:', bookingId);
        
        // First get booking data
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        console.log('Booking data:', { bookingData, bookingError });

        if (bookingError) {
          console.error("Booking error details:", JSON.stringify(bookingError, null, 2));
          toast.error("Gagal memuat detail booking: " + bookingError.message);
          return;
        }

        if (!bookingData) {
          toast.error("Booking tidak ditemukan");
          return;
        }

        // Then get booking items separately
        try {
          const { data: itemsData, error: itemsError } = await supabase
            .from("booking_items")
            .select(`
              *,
              equipment (
                id,
                name,
                image_url,
                description
              )
            `)
            .eq("booking_id", bookingId);

          console.log('Items data:', { itemsData, itemsError });

          if (itemsError) {
            console.error("Items error:", itemsError);
            // Set booking without items if items fetch fails
            setBooking({
              ...bookingData,
              booking_items: []
            });
          } else {
            setBooking({
              ...bookingData,
              booking_items: itemsData || []
            });
          }
        } catch (itemsError) {
          console.error("Error fetching items:", itemsError);
          // Set booking without items on error
          setBooking({
            ...bookingData,
            booking_items: []
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
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "returned":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu Konfirmasi";
      case "confirmed":
        return "Dikonfirmasi";
      case "picked_up":
        return "Diambil";
      case "returned":
        return "Dikembalikan";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Booking tidak ditemukan</p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-stone-900">
                Detail Booking
              </h1>
              <p className="text-sm text-stone-500">
                Booking ID: #{booking.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">
        {/* Status Card */}
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">
                Status Booking
              </h2>
              <Badge className={`${getStatusColor(booking.status)} border-none`}>
                {getStatusText(booking.status)}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">Total Pembayaran</p>
              <p className="text-2xl font-bold text-emerald-700">
                {formatCurrency(booking.total_cost)}
              </p>
            </div>
          </div>
        </Card>

        {/* Rental Period */}
        <Card className="p-6 border-stone-200 bg-white">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Periode Sewa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-stone-400" />
              <div>
                <p className="text-sm text-stone-500">Tanggal Mulai</p>
                <p className="font-medium">{formatDate(booking.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-stone-400" />
              <div>
                <p className="text-sm text-stone-500">Tanggal Selesai</p>
                <p className="font-medium">{formatDate(booking.end_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-stone-400" />
              <div>
                <p className="text-sm text-stone-500">Durasi</p>
                <p className="font-medium">{booking.rental_days} hari</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Equipment Items */}
        <Card className="p-6 border-stone-200 bg-white">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Perlengkapan yang Disewa</h2>
          <div className="space-y-4">
            {booking.booking_items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                {item.equipment.image_url && (
                  <img
                    src={item.equipment.image_url}
                    alt={item.equipment.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-stone-900">{item.equipment.name}</h3>
                  <p className="text-sm text-stone-500">
                    {formatCurrency(item.unit_price)} x {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-stone-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Price Breakdown */}
        <Card className="p-6 border-stone-200 bg-white">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Rincian Biaya</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Subtotal</span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>
            {booking.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Diskon</span>
                <span>-{formatCurrency(booking.discount_amount)}</span>
              </div>
            )}
            {booking.additional_options_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span>Biaya Tambahan</span>
                <span>{formatCurrency(booking.additional_options_cost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Deposit</span>
              <span>{formatCurrency(booking.deposit_amount)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-emerald-700">{formatCurrency(booking.total_cost)}</span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card className="p-6 border-stone-200 bg-white">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Catatan</h2>
            <p className="text-stone-600">{booking.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
