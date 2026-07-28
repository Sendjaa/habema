"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  user_id: string | null;
  user_profile?: { email?: string } | null;
  status: string;
  start_date: string;
  end_date: string;
  total_cost: number;
  created_at: string;
  rental_days: number;
  notes?: string;
}

interface BookingItem {
  id: string;
  booking_id: string;
  equipment_id: string;
  quantity: number;
  unit_price: number;
  equipment?: {
    name: string;
    description?: string;
    image_url?: string;
  };
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    confirmed: 'Terkonfirmasi',
    picked_up: 'Dipinjam',
    returned: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/bookings/${bookingId}`)
      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || 'Gagal memuat detail booking')
        return
      }

      setBooking(result.data.booking)
      setBookingItems(result.data.items || [])
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast.error('Gagal memuat detail booking')
    } finally {
      setLoading(false)
    }
  };

  const updateBookingStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setBooking(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Status booking diubah menjadi ${statusLabels[newStatus] || newStatus}`);
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Gagal mengubah status booking");
    }
  };

  const deleteBooking = async () => {
    if (!confirm("Yakin ingin menghapus booking ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      })
      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("Booking berhasil dihapus");
      router.push("/admin/bookings");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Gagal menghapus booking");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "picked_up":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "returned":
        return "bg-green-50 text-green-700 border border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-stone-50 text-stone-700 border border-stone-200";
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Booking Tidak Ditemukan</h1>
          <p className="text-stone-600 mb-4">Booking yang Anda cari tidak ada.</p>
          <Button onClick={() => router.push("/admin/bookings")} className="rounded-lg">
            Kembali ke Booking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/bookings")} className="h-8 px-2 text-xs text-stone-500 hover:text-stone-800 rounded-lg">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali
            </Button>
            <span className="w-px h-4 bg-stone-200" />
            <div>
              <h1 className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Detail Booking
              </h1>
              <p className="text-[10px] text-stone-400 hidden sm:block">#{booking.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/bookings/${bookingId}/edit`)} className="h-8 px-3 text-xs border-stone-200 text-stone-600 rounded-lg">
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteBooking} className="h-8 px-3 text-xs rounded-lg">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Hapus
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Information */}
            <Card className="border-stone-200 rounded-xl shadow-none p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>Informasi Booking</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-stone-400">ID Booking</span>
                  <p className="font-mono text-sm text-stone-800">#{booking.id.slice(0, 8)}</p>
                </div>
                <div>
                  <span className="text-xs text-stone-400">Status</span>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(booking.status)} text-[10px]`}>
                      {statusLabels[booking.status] || booking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-stone-400">Tanggal Mulai</span>
                  <p className="text-sm text-stone-800 font-medium">
                    {new Date(booking.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-stone-400">Tanggal Selesai</span>
                  <p className="text-sm text-stone-800 font-medium">
                    {new Date(booking.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-stone-400">Durasi Sewa</span>
                  <p className="text-sm text-stone-800 font-medium">{booking.rental_days} hari</p>
                </div>
                <div>
                  <span className="text-xs text-stone-400">Dibuat Pada</span>
                  <p className="text-sm text-stone-800 font-medium">
                    {new Date(booking.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {new Date(booking.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {booking.notes && (
                <div className="mt-4 p-3 bg-stone-50 rounded-lg">
                  <span className="text-xs text-stone-400">Catatan</span>
                  <p className="text-sm text-stone-700 mt-0.5">{booking.notes}</p>
                </div>
              )}
            </Card>

            {/* Booking Items */}
            <Card className="border-stone-200 rounded-xl shadow-none p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>Barang yang Disewa</h2>
              {bookingItems.length > 0 ? (
                <div className="space-y-3">
                  {bookingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {item.equipment?.image_url ? (
                          <img 
                            src={item.equipment.image_url} 
                            alt={item.equipment.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-stone-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-sm text-stone-800">{item.equipment?.name || 'Barang Tidak Diketahui'}</h3>
                          {item.equipment?.description && (
                            <p className="text-xs text-stone-400 line-clamp-1">{item.equipment.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-sm text-stone-800">{item.quantity}x</p>
                        <p className="text-xs text-stone-400">{formatCurrency(item.unit_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">Tidak ada barang dalam booking ini</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="border-stone-200 rounded-xl shadow-none p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>Informasi Pelanggan</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {booking.user_id ? (
                    <>
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-stone-800 truncate">{booking.user_profile?.email || 'Pengguna Terdaftar'}</p>
                        <p className="text-xs text-stone-400">ID: {booking.user_id.slice(0, 8)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-stone-800">Pengguna Tamu</p>
                        <p className="text-xs text-stone-400">Booking tanpa akun</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Pricing Summary */}
            <Card className="border-stone-200 rounded-xl shadow-none p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>Ringkasan Biaya</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-medium text-stone-800">{formatCurrency(booking.total_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pajak</span>
                  <span className="font-medium text-stone-800">Rp 0</span>
                </div>
                <div className="border-t border-stone-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-stone-900">Total</span>
                    <span className="font-bold text-base text-emerald-700">{formatCurrency(booking.total_cost)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Status Actions */}
            <Card className="border-stone-200 rounded-xl shadow-none p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>Aksi Status</h2>
              <div className="space-y-2">
                {booking.status === 'pending' && (
                  <Button className="w-full rounded-lg" onClick={() => updateBookingStatus('confirmed')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Konfirmasi Booking
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button className="w-full rounded-lg" onClick={() => updateBookingStatus('picked_up')}>
                    <Package className="w-4 h-4 mr-2" />
                    Tandai Dipinjam
                  </Button>
                )}
                {booking.status === 'picked_up' && (
                  <Button className="w-full rounded-lg" onClick={() => updateBookingStatus('returned')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tandai Selesai
                  </Button>
                )}
                <Button variant="outline" className="w-full rounded-lg border-stone-200 text-stone-600" onClick={() => router.push(`/admin/bookings/${bookingId}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Booking
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
