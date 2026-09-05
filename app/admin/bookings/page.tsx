"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  Users,
  Package,
  DollarSign,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  user_profile: any;
  id: string;
  user_id: string | null;
  status: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  total_cost: number;
  deposit_amount: number;
  created_at: string;
  notes?: string;
  customer_full_name?: string | null;
  customer_id_type?: string | null;
  customer_id_number?: string | null;
  customer_phone?: string | null;
  pickup_branch_id: string | null;
  pickup_branch_name: string | null;
  return_branch_id: string | null;
  return_branch_name: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_proof_url?: string | null;
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
    };
  }>;
}

export default function BookingManagement() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, confirmedBookings: 0, totalRevenue: 0, monthlyRevenue: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, userTypeFilter, branchFilter]);

  useEffect(() => {
    const fetchBranchesList = async () => {
      try {
        const res = await fetch("/api/admin/branches");
        const result = await res.json();
        if (result.success) setBranches(result.data || []);
      } catch {}
    };
    fetchBranchesList();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) return
      const result = await res.json()
      if (!result.success) return
      const s = result.data
      setStats({
        totalBookings: s.totalBookings || 0,
        pendingBookings: s.pendingBookings || 0,
        confirmedBookings: s.confirmedBookings || 0,
        totalRevenue: s.totalRevenue || 0,
        monthlyRevenue: s.monthlyRevenue || 0,
      })
    } catch {}
  }

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(currentPage),
        perPage: String(itemsPerPage),
      })
      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (userTypeFilter !== 'all') params.set('userType', userTypeFilter)
      if (branchFilter !== 'all') params.set('branchId', branchFilter)

      const res = await fetch(`/api/admin/bookings?${params}`)
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      setBookings(result.data || [])
      setTotalCount(result.count || 0)
      setTotalPages(result.totalPages || 1)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast.error("Gagal memuat data booking")
      setBookings([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  };

  const exportBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings?perPage=99999')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      const data = result.data

      // Convert to CSV
      const csv = [
        "Booking ID,Customer,Nomor Identitas,Tipe ID,Telepon,Status,Cabang Pengambilan,Cabang Pengembalian,Start Date,End Date,Total,Created At",
        ...(data || []).map((booking: any) => {
          return [
            booking.id.slice(0, 8),
            booking.customer_full_name || booking.user_profile?.email || (booking.user_id ? "Registered User" : "Guest"),
            booking.customer_id_number || '-',
            booking.customer_id_type || '-',
            booking.customer_phone || '-',
            booking.status,
            booking.pickup_branch_name || '-',
            booking.return_branch_name || '-',
            booking.start_date,
            booking.end_date,
            formatCurrency(booking.total_cost),
            new Date(booking.created_at).toLocaleDateString('id-ID')
          ].join(',');
        })
      ].join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Bookings exported successfully");
    } catch (error) {
      console.error("Error exporting bookings:", error);
      toast.error("Failed to export bookings");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    confirmed: 'Terkonfirmasi',
    picked_up: 'Dipinjam',
    returned: 'Selesai',
    cancelled: 'Dibatalkan',
  }

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Booking QRIS manual yang bukti bayarnya menunggu diverifikasi admin.
  const needsVerification = (b: Booking) =>
    b.payment_status === "pending" && !!b.payment_proof_url;

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Manajemen Booking
            </h1>
            <p className="text-[10px] text-stone-400 hidden sm:block">Kelola semua penyewaan</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportBookings} className="h-8 px-3 text-xs border-stone-200 text-stone-600 rounded-lg">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchBookings} className="h-8 px-3 text-xs border-stone-200 text-stone-600 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* Stats Keseluruhan */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-stone-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900">{stats.totalBookings}</p>
                <p className="text-[10px] text-stone-500">Total Booking</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-[10px] text-stone-500">Total Pendapatan</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900">{stats.pendingBookings}</p>
                <p className="text-[10px] text-stone-500">Perlu Diproses</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-[10px] text-stone-500">Pendapatan Bulan Ini</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-5 mb-6 border-stone-200 rounded-xl shadow-none">
          <div className="space-y-4">
            <div>
              <Label htmlFor="search" className="text-xs font-medium text-stone-600">Cari Booking</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Cari berdasarkan ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-stone-200 rounded-lg text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="status-filter" className="text-xs font-medium text-stone-600">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="mt-1 border-stone-200 rounded-lg">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="confirmed">Terkonfirmasi</SelectItem>
                    <SelectItem value="picked_up">Dipinjam</SelectItem>
                    <SelectItem value="returned">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-type-filter" className="text-xs font-medium text-stone-600">Tipe Pengguna</Label>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger id="user-type-filter" className="mt-1 border-stone-200 rounded-lg">
                    <SelectValue placeholder="Semua Pengguna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pengguna</SelectItem>
                    <SelectItem value="registered">Terdaftar</SelectItem>
                    <SelectItem value="anonymous">Tamu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="branch-filter" className="text-xs font-medium text-stone-600">Cabang</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger id="branch-filter" className="mt-1 border-stone-200 rounded-lg">
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-10 border-stone-200 text-stone-600 rounded-lg text-xs"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setUserTypeFilter("all");
                    setBranchFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Hapus Filter
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Bookings Table */}
        <Card className="border-stone-200 rounded-xl shadow-none p-4 sm:p-5">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">Belum ada booking</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="p-4 border border-stone-200 rounded-xl shadow-none">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-xs text-stone-400">#{booking.id.slice(0, 8)}</p>
                        <Badge className={`${getStatusColor(booking.status)} text-[10px] mt-1`}>
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                        {needsVerification(booking) && (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] mt-1 ml-1">
                            Menunggu verifikasi
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900 text-sm">{formatCurrency(booking.total_cost)}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-stone-600 space-y-1">
                      <p><span className="text-stone-400">Pelanggan:</span> {booking.customer_full_name || booking.user_profile?.email || 'Tamu'}</p>
                      {booking.booking_items && booking.booking_items.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {booking.booking_items.slice(0, 3).map((item: any) => (
                            item.equipment?.image_url ? (
                              <img key={item.id} src={item.equipment.image_url} alt={item.equipment.name}
                                className="w-7 h-7 object-cover rounded border border-stone-200" />
                            ) : (
                              <div key={item.id} className="w-7 h-7 bg-stone-100 rounded border border-stone-200 flex items-center justify-center">
                                <Package className="w-3.5 h-3.5 text-stone-400" />
                              </div>
                            )
                          ))}
                          {booking.booking_items.length > 3 && (
                            <span className="text-[10px] text-stone-400">+{booking.booking_items.length - 3}</span>
                          )}
                        </div>
                      )}
                      <p><span className="text-stone-400">Tanggal:</span> {formatDate(booking.start_date)} - {formatDate(booking.end_date)}</p>
                      {booking.pickup_branch_name && (
                        <p><span className="text-stone-400">Cabang:</span> {booking.pickup_branch_name}{booking.return_branch_name && booking.return_branch_name !== booking.pickup_branch_name ? ` → ${booking.return_branch_name}` : ''}</p>
                      )}
                      <p><span className="text-stone-400">Dibuat:</span> {formatDate(booking.created_at)}</p>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t border-stone-100">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-stone-200 text-stone-600 rounded-lg" onClick={() => router.push(`/admin/bookings/${booking.id}`)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-stone-200 text-stone-600 rounded-lg" onClick={() => {
                        setSelectedBooking(booking);
                        setShowEditModal(true);
                      }}>
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Barang</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Cabang</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Tanggal Sewa</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Dibuat</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-stone-500">#{booking.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {booking.user_id ? (
                          <>
                            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                              <Users className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <span className="text-sm text-stone-700 truncate max-w-40" title={booking.user_profile?.email || ''}>
                              {booking.customer_full_name || booking.user_profile?.email || 'Terdaftar'}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                              <Users className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <span className="text-sm text-stone-500 truncate max-w-40">
                              {booking.customer_full_name || 'Tamu'}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {booking.booking_items?.[0]?.equipment?.image_url ? (
                          <img src={booking.booking_items[0].equipment.image_url}
                            alt={booking.booking_items[0].equipment.name}
                            className="w-8 h-8 object-cover rounded border border-stone-200 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-stone-100 rounded border border-stone-200 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-stone-400" />
                          </div>
                        )}
                        <div className="text-sm text-stone-700 min-w-0">
                          <span className="truncate block max-w-28">{booking.booking_items?.[0]?.equipment?.name || '-'}</span>
                          {booking.booking_items && booking.booking_items.length > 1 && (
                            <span className="text-stone-400 text-xs">+{booking.booking_items.length - 1} lainnya</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-stone-600">
                        <div className="flex items-center gap-1">
                          <span className="text-stone-400">ambil:</span>
                          <span className="font-medium truncate max-w-28" title={booking.pickup_branch_name || ''}>
                            {booking.pickup_branch_name || '-'}
                          </span>
                        </div>
                        {booking.return_branch_name && booking.return_branch_name !== booking.pickup_branch_name && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-stone-400">kembali:</span>
                            <span className="font-medium text-blue-600 truncate max-w-28" title={booking.return_branch_name}>
                              {booking.return_branch_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-stone-700">
                        <div>{formatDate(booking.start_date)}</div>
                        <div className="text-stone-400 text-xs">→ {formatDate(booking.end_date)}</div>
                        <div className="text-[10px] text-stone-400">{booking.rental_days} hari</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getStatusColor(booking.status)} text-[10px]`}>
                        {statusLabels[booking.status] || booking.status}
                      </Badge>
                      {needsVerification(booking) && (
                        <div>
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] mt-1">
                            Menunggu verifikasi
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-sm text-stone-800">
                      {formatCurrency(booking.total_cost)}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-500">
                      <div>{formatDate(booking.created_at)}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(booking.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                          onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                          title="Lihat detail">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-stone-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          onClick={() => { setSelectedBooking(booking); setShowEditModal(true); }}
                          title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {bookings.length === 0 && !loading && (
              <div className="text-center py-12 text-stone-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">Belum ada booking</p>
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          <div className="lg:hidden mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-stone-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} booking
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 border-stone-200 text-stone-600 rounded-lg"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-stone-600">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8 border-stone-200 text-stone-600 rounded-lg"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Desktop Pagination */}
          <div className="hidden lg:flex mt-6 justify-between items-center">
            <div className="text-xs text-stone-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} booking
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 border-stone-200 text-stone-600 rounded-lg text-xs"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-stone-600">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8 border-stone-200 text-stone-600 rounded-lg text-xs"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}>
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Detail Modal dihapus: tombol eye langsung ke halaman detail */}
      {/* Edit Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md rounded-xl border-stone-200 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
                  Edit Booking #{selectedBooking.id.slice(0, 8)}
                </h2>
                <Button variant="ghost" size="sm" className="text-stone-400 hover:text-stone-600 rounded-lg" onClick={() => setShowEditModal(false)}>
                  ✕
                </Button>
              </div>
              <EditBookingForm
                key={selectedBooking.id}
                booking={selectedBooking}
                onClose={() => { setShowEditModal(false); setSelectedBooking(null); }}
                onSaved={() => { setShowEditModal(false); setSelectedBooking(null); fetchBookings(); }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function EditBookingForm({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(booking.status);
  const [paymentStatus, setPaymentStatus] = useState(booking.payment_status || "pending");
  const [saving, setSaving] = useState(false);

  const paymentLabels: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    paid: "Lunas",
    failed: "Ditolak",
    cancelled: "Dibatalkan",
    expired: "Kedaluwarsa",
    refunded: "Dikembalikan",
  };

  const save = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, payment_status: paymentStatus }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) {
        throw new Error(result?.error || `HTTP ${res.status}`);
      }
      toast.success("Booking berhasil diperbarui");
      onSaved();
    } catch (e: any) {
      console.error("Error saving booking:", e);
      toast.error(e?.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-stone-500">Status Booking</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="mt-1 border-stone-200 rounded-lg text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="confirmed">Terkonfirmasi</SelectItem>
            <SelectItem value="picked_up">Dipinjam</SelectItem>
            <SelectItem value="returned">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-stone-500">Status Pembayaran</Label>
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="mt-1 border-stone-200 rounded-lg text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(paymentLabels).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-lg border-stone-200 text-stone-600" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" onClick={save} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
