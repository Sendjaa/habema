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
  XCircle,
  AlertTriangle,
  Trash2,
  Download,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  user_id: string | null;
  user_profile?: { email?: string; full_name?: string | null } | null;
  user_identity?: {
    id_type?: string;
    id_number?: string;
    id_photo_url?: string | null;
    verification_status?: string | null;
  } | null;
  customer_full_name?: string | null;
  customer_id_type?: string | null;
  customer_id_number?: string | null;
  customer_phone?: string | null;
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  pickup_branch_name?: string | null;
  return_branch_name?: string | null;
  deposit_amount?: number | null;
  subtotal?: number | null;
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
  subtotal?: number | null;
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
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    confirmed: 'Terkonfirmasi',
    picked_up: 'Dipinjam',
    returned: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  const idTypeLabel = (t?: string) =>
    ({ ktp: 'KTP', sim: 'SIM', passport: 'Paspor', npwp: 'NPWP' } as Record<string, string>)[t || ''] || t || '-'

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

  const updatePayment = async (action: "approve" | "reject") => {
    if (action === "reject" && !confirm("Tolak bukti pembayaran ini? Booking akan dibatalkan dan stok dikembalikan.")) {
      return;
    }
    try {
      setUpdatingPayment(true);
      const payload =
        action === "approve"
          ? { status: "confirmed", payment_status: "paid" }
          : { status: "cancelled", payment_status: "failed" };
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status,
              payment_status: payload.payment_status,
            }
          : null,
      );
      toast.success(
        action === "approve"
          ? "Pembayaran disetujui, booking dikonfirmasi"
          : "Pembayaran ditolak, booking dibatalkan",
      );
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Gagal memproses verifikasi pembayaran");
    } finally {
      setUpdatingPayment(false);
    }
  };

  const deleteBooking = async () => {
    if (confirm("Yakin ingin menghapus booking ini? Tindakan ini tidak dapat dibatalkan.")) {
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

  const paymentStatusLabels: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    paid: "Lunas",
    failed: "Ditolak",
    cancelled: "Dibatalkan",
    expired: "Kedaluwarsa",
    refunded: "Dikembalikan",
  };

  const getPaymentStatusColor = (s?: string | null) => {
    switch (s) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "failed":
      case "cancelled":
      case "expired":
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

  const identityName =
    booking.customer_full_name ||
    booking.user_profile?.full_name ||
    (booking.user_id ? booking.user_profile?.email || 'Pengguna Terdaftar' : 'Pengguna Tamu');
  const idType = booking.customer_id_type || booking.user_identity?.id_type;
  const idNumber = booking.customer_id_number || booking.user_identity?.id_number;
  const phone = booking.customer_phone;
  const hasIdentity = Boolean(booking.customer_full_name || idType || idNumber || phone);

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
            <Button variant="destructive" size="sm" onClick={deleteBooking} className="h-8 px-3 text-xs rounded-lg">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Hapus
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
        {/* Ringkasan utama */}
        <Card className="border-stone-200 rounded-xl shadow-none p-5 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-stone-400">#{booking.id.slice(0, 8)}</span>
            <Badge className={`${getStatusColor(booking.status)} text-[10px]`}>
              {statusLabels[booking.status] || booking.status}
            </Badge>
            {booking.payment_status && (
              <Badge className={`text-[10px] ${getPaymentStatusColor(booking.payment_status)}`}>
                {paymentStatusLabels[booking.payment_status] || booking.payment_status}
              </Badge>
            )}
            {booking.payment_status === "pending" && booking.payment_proof_url && (
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px]">
                Perlu verifikasi
              </Badge>
            )}
            <span className="ml-auto text-[11px] text-stone-400">
              Dibuat {new Date(booking.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}
              {new Date(booking.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-stone-100">
            <div>
              <p className="text-[11px] text-stone-400 mb-1">Total Tagihan</p>
              <p className="font-bold text-lg text-emerald-700">{formatCurrency(booking.total_cost)}</p>
            </div>
            <div>
              <p className="text-[11px] text-stone-400 mb-1">Periode Sewa</p>
              <p className="text-sm text-stone-800 font-medium">
                {new Date(booking.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                {' → '}
                {new Date(booking.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[11px] text-stone-400">{booking.rental_days} hari</p>
            </div>
            <div>
              <p className="text-[11px] text-stone-400 mb-1">Pengambilan</p>
              <p className="text-sm text-stone-800 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{booking.pickup_branch_name || '-'}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-stone-400 mb-1">Pengembalian</p>
              <p className="text-sm text-stone-800 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{booking.return_branch_name || booking.pickup_branch_name || '-'}</span>
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verifikasi Pembayaran */}
            {(booking.payment_method || booking.payment_proof_url || booking.payment_status) && (
              <Card className="border-stone-200 rounded-xl shadow-none p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>Verifikasi Pembayaran</h2>
                  <Badge className={`text-[10px] ${getPaymentStatusColor(booking.payment_status)}`}>
                    {paymentStatusLabels[booking.payment_status || ""] || booking.payment_status || "-"}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs text-stone-400 shrink-0">Metode</span>
                    <span className="text-sm text-stone-800 font-medium text-right">{booking.payment_method || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-xs text-stone-400 shrink-0">Total Tagihan</span>
                    <span className="text-sm text-stone-800 font-bold text-right">{formatCurrency(booking.total_cost)}</span>
                  </div>
                  {booking.payment_proof_url ? (
                    <div>
                      <span className="text-xs text-stone-400">Bukti Pembayaran</span>
                      <a href={booking.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                        <img
                          src={booking.payment_proof_url}
                          alt="Bukti pembayaran"
                          className="w-full max-h-96 rounded-lg object-contain bg-stone-50 ring-1 ring-stone-200 hover:ring-emerald-400 transition-all"
                        />
                      </a>
                      <p className="text-[10px] text-stone-400 mt-1">
                        Klik gambar untuk ukuran penuh
                        {booking.payment_proof_uploaded_at && (
                          <> · diupload {new Date(booking.payment_proof_uploaded_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 italic">Belum ada bukti pembayaran diupload.</p>
                  )}
                  {booking.payment_status === "pending" && booking.payment_proof_url && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        disabled={updatingPayment}
                        onClick={() => updatePayment("approve")}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Setujui Pembayaran
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg border-red-200 text-red-600 hover:bg-red-50 text-xs"
                        disabled={updatingPayment}
                        onClick={() => updatePayment("reject")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Catatan (hanya bila ada) */}
            {booking.notes && (
              <Card className="border-stone-200 rounded-xl shadow-none p-5">
                <h2 className="text-sm font-semibold text-stone-900 mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Catatan</h2>
                <p className="text-sm text-stone-700">{booking.notes}</p>
              </Card>
            )}

            {/* Booking Items */}
            <Card className="border-stone-200 rounded-xl shadow-none p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>Barang yang Disewa</h2>
                {bookingItems.length > 0 && (
                  <Badge className="bg-stone-100 text-stone-600 border border-stone-200 text-[10px]">
                    {bookingItems.length} jenis · {bookingItems.reduce((s, it) => s + Number(it.quantity || 0), 0)} unit
                  </Badge>
                )}
              </div>
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
                        <p className="font-semibold text-sm text-stone-800">{formatCurrency(item.subtotal ?? Number(item.unit_price || 0) * Number(item.quantity || 0))}</p>
                        <p className="text-xs text-stone-400">{item.quantity}x @ {formatCurrency(item.unit_price)}</p>
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
          <div className="space-y-6 lg:sticky lg:top-20">
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

                {hasIdentity && (
                  <div className="pt-3 mt-3 border-t border-stone-200 space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-stone-400 shrink-0">Nama Penyewa</span>
                      <span className="text-sm text-stone-800 font-medium text-right truncate">{identityName}</span>
                    </div>
                    {(idType || idNumber) && (
                      <div className="flex justify-between gap-2">
                        <span className="text-xs text-stone-400 shrink-0">No. {idTypeLabel(idType)}</span>
                        <span className="text-sm text-stone-800 font-medium text-right break-all">{idNumber || '-'}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex justify-between gap-2">
                        <span className="text-xs text-stone-400 shrink-0">No. Telepon</span>
                        <span className="text-sm text-stone-800 font-medium text-right break-all">{phone}</span>
                      </div>
                    )}
                    {booking.user_identity?.verification_status && (
                      <div className="flex justify-between gap-2">
                        <span className="text-xs text-stone-400 shrink-0">Status Verifikasi</span>
                        <Badge className={`text-[10px] ${booking.user_identity.verification_status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {booking.user_identity.verification_status === 'verified' ? 'Terverifikasi' : booking.user_identity.verification_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Pricing Summary */}
            <Card className="border-stone-200 rounded-xl shadow-none p-5">
              <h2 className="text-sm font-semibold text-stone-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>Ringkasan Biaya</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal sewa</span>
                  <span className="font-medium text-stone-800">{formatCurrency(booking.subtotal ?? booking.total_cost)}</span>
                </div>
                {booking.deposit_amount != null && Number(booking.deposit_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Deposit (info)</span>
                    <span className="font-medium text-stone-800">{formatCurrency(booking.deposit_amount)}</span>
                  </div>
                )}
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
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
