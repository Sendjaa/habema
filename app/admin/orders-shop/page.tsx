"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Eye,
  Trash2,
  Store,
  DollarSign,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Tag,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface ShopOrderItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  product?: {
    id: string;
    name: string;
    image_url?: string;
  } | null;
}

interface ShopOrder {
  id: string;
  order_id: string | null;
  user_id: string | null;
  status: string;
  payment_status: string;
  customer_name: string;
  phone: string;
  email?: string | null;
  address: string;
  city?: string | null;
  postal_code?: string | null;
  note?: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_cost: number;
  courier_name?: string | null;
  total_amount: number;
  payment_method: string | null;
  created_at: string;
  user_profile?: {
    id: string;
    email: string;
    full_name?: string | null;
  } | null;
  discount?: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
  items: ShopOrderItem[];
}

export default function ShopOrdersManagement() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, paidOrders: 0, totalRevenue: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(currentPage),
        perPage: String(itemsPerPage),
      })
      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (paymentFilter !== 'all') params.set('payment', paymentFilter)

      const res = await fetch(`/api/admin/shop-orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      setOrders(result.data || [])
      setTotalCount(result.count || 0)
      setTotalPages(result.totalPages || 1)

      // Hitung statistik dari data halaman saat ini
      let paid = 0, revenue = 0, pending = 0
      for (const o of result.data || []) {
        if (o.payment_status === 'paid') { paid++; revenue += Number(o.total_amount) || 0 }
        if (o.payment_status === 'pending' || o.payment_status === 'cod') pending++
      }
      setStats({
        totalOrders: result.count || 0,
        pendingOrders: pending,
        paidOrders: paid,
        totalRevenue: revenue,
      })
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Gagal memuat data order")
      setOrders([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  };

  const updateOrder = async (orderId: string, updates: Record<string, string>) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/shop-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);

      toast.success("Order berhasil diperbarui");
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error?.message || "Gagal memperbarui order");
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Hapus order ini? Tindakan tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/shop-orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || `HTTP ${res.status}`);
      }

      toast.success("Order berhasil dihapus");
      fetchOrders();
      setShowDetailModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error(error?.message || "Gagal menghapus order");
    }
  };

  const exportOrders = async () => {
    try {
      const res = await fetch('/api/admin/shop-orders?perPage=99999')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      const data = result.data

      const csv = [
        "Order ID,Pelanggan,Phone,Email,Status,Pembayaran,Subtotal,Discount,Delivery,Total,Created At",
        ...(data || []).map((o: any) => {
          return [
            o.order_id || o.id,
            o.customer_name,
            o.phone,
            o.email || '',
            o.status,
            o.payment_status,
            o.subtotal,
            o.discount_amount,
            o.delivery_cost,
            o.total_amount,
            new Date(o.created_at).toLocaleDateString('id-ID')
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shop_orders_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Order berhasil diexport");
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Gagal mengexport order");
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
    confirmed: 'Diproses',
    shipped: 'Dikirim',
    delivered: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  const paymentLabels: Record<string, string> = {
    pending: 'Belum Bayar',
    paid: 'Lunas',
    cod: 'COD',
    refunded: 'Refund',
    failed: 'Gagal',
    cancelled: 'Batal',
    expired: 'Kedaluwarsa',
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "shipped":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-700 border border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-stone-50 text-stone-700 border border-stone-200";
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "cod":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "refunded":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "cancelled":
      case "failed":
      case "expired":
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

  if (loading && orders.length === 0) {
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
              Order Toko
            </h1>
            <p className="text-[10px] text-stone-400 hidden sm:block">Kelola semua order dari toko</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportOrders} className="h-8 px-3 text-xs border-stone-200 text-stone-600 rounded-lg">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="h-8 px-3 text-xs border-stone-200 text-stone-600 rounded-lg">
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
                <Store className="w-4 h-4 text-stone-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900">{stats.totalOrders}</p>
                <p className="text-[10px] text-stone-500">Total Order</p>
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
                <p className="text-[10px] text-stone-500">Pendapatan Lunas (hal ini)</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900">{stats.pendingOrders}</p>
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
                <p className="text-xl font-bold text-stone-900">{stats.paidOrders}</p>
                <p className="text-[10px] text-stone-500">Order Lunas (hal ini)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-5 mb-6 border-stone-200 rounded-xl shadow-none">
          <div className="space-y-4">
            <div>
              <Label htmlFor="search" className="text-xs font-medium text-stone-600">Cari Order</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Cari berdasarkan nama, email, no. order..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-stone-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status-filter" className="text-xs font-medium text-stone-600">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="mt-1 border-stone-200 rounded-lg">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="confirmed">Diproses</SelectItem>
                    <SelectItem value="shipped">Dikirim</SelectItem>
                    <SelectItem value="delivered">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment-filter" className="text-xs font-medium text-stone-600">Pembayaran</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger id="payment-filter" className="mt-1 border-stone-200 rounded-lg">
                    <SelectValue placeholder="Semua Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                    <SelectItem value="pending">Belum Bayar</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="cod">COD</SelectItem>
                    <SelectItem value="refunded">Refund</SelectItem>
                    <SelectItem value="cancelled">Batal</SelectItem>
                    <SelectItem value="expired">Kedaluwarsa</SelectItem>
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
                    setPaymentFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Hapus Filter
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="border-stone-200 rounded-xl shadow-none p-4 sm:p-5">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <Store className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">Belum ada order</p>
              </div>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="p-4 border border-stone-200 rounded-xl shadow-none">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-xs text-stone-400">{order.order_id || '#' + order.id.slice(0, 8)}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge className={`${getStatusColor(order.status)} text-[10px]`}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                          <Badge className={`${getPaymentColor(order.payment_status)} text-[10px]`}>
                            {paymentLabels[order.payment_status] || order.payment_status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900 text-sm">{formatCurrency(order.total_amount)}</p>
                      </div>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1">
                      <p><span className="text-stone-400">Pelanggan:</span> {order.customer_name}</p>
                      {order.items && order.items.length > 0 && (
                        <p className="truncate">
                          <span className="text-stone-400">Barang:</span>{" "}
                          {order.items.map((i) => i.name).join(", ")}
                        </p>
                      )}
                      <p><span className="text-stone-400">Dibuat:</span> {formatDate(order.created_at)}</p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-stone-100">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-stone-200 text-stone-600 rounded-lg" onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailModal(true);
                      }}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
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
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Barang</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Pembayaran</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Dibuat</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-stone-500">{order.order_id || '#' + order.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-stone-700 truncate max-w-40">
                        <span className="block truncate">{order.customer_name}</span>
                        <span className="text-stone-400 text-xs truncate block">{order.email || order.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {order.items?.[0]?.product?.image_url ? (
                          <img src={order.items[0].product.image_url}
                            alt={order.items[0].product.name}
                            className="w-8 h-8 object-cover rounded border border-stone-200 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-stone-100 rounded border border-stone-200 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-stone-400" />
                          </div>
                        )}
                        <div className="text-sm text-stone-700 min-w-0">
                          <span className="truncate block max-w-28">{order.items?.[0]?.name || '-'}</span>
                          {order.items && order.items.length > 1 && (
                            <span className="text-stone-400 text-xs">+{order.items.length - 1} lainnya</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getStatusColor(order.status)} text-[10px]`}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getPaymentColor(order.payment_status)} text-[10px]`}>
                        {paymentLabels[order.payment_status] || order.payment_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-sm text-stone-800">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-500">
                      <div>{formatDate(order.created_at)}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                        onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                        title="Lihat detail">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && !loading && (
              <div className="text-center py-12 text-stone-400">
                <Store className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">Belum ada order</p>
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          <div className="lg:hidden mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-stone-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} order
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
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} order
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

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border-stone-200 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>Detail Order</h2>
                <Button variant="ghost" size="sm" className="text-stone-400 hover:text-stone-600 rounded-lg" onClick={() => setShowDetailModal(false)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Order Info */}
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Informasi Order</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-stone-400 text-xs">Order ID</span>
                      <p className="font-mono text-stone-800">{selectedOrder.order_id || '#' + selectedOrder.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-xs">Status</span>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <Badge className={`${getStatusColor(selectedOrder.status)} text-[10px]`}>
                          {statusLabels[selectedOrder.status] || selectedOrder.status}
                        </Badge>
                        <Badge className={`${getPaymentColor(selectedOrder.payment_status)} text-[10px]`}>
                          {paymentLabels[selectedOrder.payment_status] || selectedOrder.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-stone-400 text-xs">Pelanggan</span>
                      <p className="text-stone-800">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-xs">Dibuat</span>
                      <p className="text-stone-800">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-xs">Akun</span>
                      <p className="text-stone-800">{selectedOrder.user_profile?.email || 'Tamu'}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-xs">Metode Pembayaran</span>
                      <p className="text-stone-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                        {selectedOrder.payment_method || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Kontak & Pengiriman</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-stone-700">
                      <Phone className="w-3.5 h-3.5 text-stone-400" /> {selectedOrder.phone}
                    </p>
                    {selectedOrder.email && (
                      <p className="flex items-center gap-2 text-stone-700">
                        <Mail className="w-3.5 h-3.5 text-stone-400" /> {selectedOrder.email}
                      </p>
                    )}
                    <p className="flex items-start gap-2 text-stone-700">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedOrder.address}
                        {selectedOrder.city ? `, ${selectedOrder.city}` : ''}
                        {selectedOrder.postal_code ? ` ${selectedOrder.postal_code}` : ''}
                      </span>
                    </p>
                    {selectedOrder.note && (
                      <p className="text-xs text-stone-500 italic">Catatan: {selectedOrder.note}</p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Barang</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.product?.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name}
                              className="w-9 h-9 object-cover rounded border border-stone-200 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 bg-stone-100 rounded border border-stone-200 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-stone-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-stone-800 truncate max-w-40">{item.name}</p>
                            <p className="text-xs text-stone-400">{formatCurrency(item.price)} × {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-sm text-stone-900 shrink-0">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <p className="text-sm text-stone-400 text-center py-4">Tidak ada barang</p>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Rincian Biaya</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Subtotal</span>
                      <span className="text-stone-800">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {Number(selectedOrder.discount_amount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-stone-500 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-stone-400" />
                          Diskon {selectedOrder.discount?.code ? `(${selectedOrder.discount.code})` : ''}
                        </span>
                        <span className="text-emerald-600">-{formatCurrency(selectedOrder.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-500">Ongkos Kirim</span>
                      <span className="text-stone-800">
                        {formatCurrency(selectedOrder.delivery_cost)}
                        {selectedOrder.courier_name && (
                          <span className="text-xs text-stone-500 ml-1">({selectedOrder.courier_name})</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-stone-200">
                      <span className="font-medium text-stone-800">Total</span>
                      <span className="font-bold text-stone-900">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-stone-200">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="order-status-select" className="text-xs text-stone-500">Status:</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => updateOrder(selectedOrder.id, { status: value })}
                    >
                      <SelectTrigger id="order-status-select" className="w-40 border-stone-200 rounded-lg text-sm">
                        <SelectValue placeholder="Ubah Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="confirmed">Diproses</SelectItem>
                        <SelectItem value="shipped">Dikirim</SelectItem>
                        <SelectItem value="delivered">Selesai</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="payment-status-select" className="text-xs text-stone-500">Bayar:</Label>
                    <Select
                      value={selectedOrder.payment_status}
                      onValueChange={(value) => updateOrder(selectedOrder.id, { payment_status: value })}
                    >
                      <SelectTrigger id="payment-status-select" className="w-40 border-stone-200 rounded-lg text-sm">
                        <SelectValue placeholder="Ubah Pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Belum Bayar</SelectItem>
                        <SelectItem value="paid">Lunas</SelectItem>
                        <SelectItem value="cod">COD</SelectItem>
                        <SelectItem value="refunded">Refund</SelectItem>
                        <SelectItem value="cancelled">Batal</SelectItem>
                        <SelectItem value="expired">Kedaluwarsa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-lg text-xs h-9 ml-auto"
                    onClick={() => deleteOrder(selectedOrder.id)}
                    disabled={updating}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
