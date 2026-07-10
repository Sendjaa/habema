'use client'
import { useState, useEffect, useRef } from 'react'
import { useCartStore, Order } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package, Calendar, X, ArrowRight, ShoppingBag, Receipt,
  Clock, Truck, CheckCircle2, Wallet, MessageSquare,
  Download, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { OptimizedImage } from '@/components/optimized-image'

export default function OrdersPage() {
  const { orders: realOrders, removeOrder } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const calculateDays = (start: string, end: string) => {
    const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime())
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 1
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || realOrders.length === 0) return
    const seen = new Set<string>()
    realOrders.forEach((o) => {
      if (seen.has(o.id)) removeOrder(o.id)
      else seen.add(o.id)
    })
  }, [realOrders, mounted, removeOrder])

  if (!mounted) return null

  const getStatusInfo = (status: Order['status']) => {
    const map: Record<string, { color: string; label: string; icon: React.ReactNode; step: number }> = {
      pending:    { color: 'bg-amber-50 text-amber-700 border-amber-200',   label: 'Menunggu Verifikasi', icon: <Clock className="w-3 h-3" />,        step: 1 },
      confirmed:  { color: 'bg-blue-50 text-blue-700 border-blue-200',      label: 'Dikonfirmasi',        icon: <CheckCircle2 className="w-3 h-3" />,  step: 2 },
      ready:      { color: 'bg-violet-50 text-violet-700 border-violet-200',label: 'Siap Diambil',        icon: <ShoppingBag className="w-3 h-3" />,   step: 3 },
      'picked-up':{ color: 'bg-teal-50 text-teal-700 border-teal-200',     label: 'Sedang Disewa',       icon: <Truck className="w-3 h-3" />,          step: 4 },
      returned:   { color: 'bg-orange-50 text-orange-700 border-orange-200',label: 'Dikembalikan',        icon: <Package className="w-3 h-3" />,        step: 5 },
      completed:  { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Selesai',         icon: <CheckCircle2 className="w-3 h-3" />,  step: 5 },
    }
    return map[status] ?? { color: 'bg-stone-50 text-stone-600 border-stone-200', label: status, icon: null, step: 1 }
  }

  const activeOrders = realOrders.filter(o => !['returned','completed'].includes(o.status))
  const historyOrders = realOrders.filter(o => ['returned','completed'].includes(o.status))

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Top bar */}
      <div className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Pesanan Saya</h1>
            <p className="text-sm text-stone-500 mt-0.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Pantau status penyewaan alat camping secara real-time.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg border-stone-300 text-stone-600 text-xs h-9 gap-1.5">
            <Download className="w-3.5 h-3.5" /> Rekap Sewa
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 pb-24">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-stone-100 p-1 border border-stone-200 rounded-lg w-fit h-auto">
            <TabsTrigger value="active" className="rounded-md px-5 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:border data-[state=active]:border-stone-200 text-stone-500 transition-all">
              Pesanan Aktif
              {activeOrders.length > 0 && (
                <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-1.5 py-0.5 rounded-md">
                  {activeOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md px-5 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:border data-[state=active]:border-stone-200 text-stone-500 transition-all">
              Riwayat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0
              ? <EmptyState />
              : activeOrders.map(order => (
                  <OrderCard key={order.id} order={order}
                    onDetail={() => setSelectedOrder(order)}
                    statusInfo={getStatusInfo(order.status)}
                    onRemove={() => removeOrder(order.id)}
                  />
                ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyOrders.length === 0
              ? <EmptyState />
              : historyOrders.map(order => (
                  <OrderCard key={order.id} order={order}
                    onDetail={() => setSelectedOrder(order)}
                    statusInfo={getStatusInfo(order.status)}
                    onRemove={() => removeOrder(order.id)}
                  />
                ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-stone-900">Rincian Transaksi</h2>
                  <p className="text-xs font-mono text-stone-400 mt-0.5 tracking-wide">INV / {selectedOrder.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-500 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6 space-y-6">
              {/* Progress tracker */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
                <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-4">Status Pesanan</p>
                <div className="relative flex justify-between items-center">
                  <div className="absolute top-[18px] left-0 right-0 h-[1.5px] bg-stone-200" />
                  <div
                    className="absolute top-[18px] left-0 h-[1.5px] bg-emerald-500 transition-all duration-700"
                    style={{ width: `${((getStatusInfo(selectedOrder.status).step - 1) / 4) * 100}%` }}
                  />
                  {(['Pending','Konfirm','Siap','Disewa','Selesai'] as const).map((label, idx) => {
                    const active = getStatusInfo(selectedOrder.status).step >= idx + 1
                    return (
                      <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white transition-all ${active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border-stone-300 text-stone-300'}`}>
                          {getStatusInfo(selectedOrder.status).step > idx + 1
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <div className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-stone-300'}`} />}
                        </div>
                        <span className={`text-[10px] font-medium ${active ? 'text-emerald-700' : 'text-stone-400'}`}>{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Info grid */}
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-3">Informasi Sewa</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tanggal Ambil', val: selectedOrder.pickup_date },
                    { label: 'Tanggal Kembali', val: selectedOrder.return_date },
                    { label: 'Durasi', val: `${calculateDays(selectedOrder.pickup_date, selectedOrder.return_date)} Hari`, green: true },
                    { label: 'Status Bayar', val: selectedOrder.status === 'pending' ? 'Belum Lunas' : 'Lunas' },
                  ].map(({ label, val, green }) => (
                    <div key={label} className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3">
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className={`text-sm font-medium ${green ? 'text-emerald-700' : 'text-stone-800'}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-3">Rincian Biaya</p>
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                  {[
                    { label: 'Subtotal Sewa', val: `Rp ${selectedOrder.total?.toLocaleString('id-ID')}` },
                    { label: 'Biaya Admin & Layanan', val: 'Rp 2.000' },
                    { label: 'Jaminan Keamanan', val: 'Rp 0 (Member)', green: true },
                  ].map(({ label, val, green }) => (
                    <div key={label} className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-stone-500">{label}</span>
                      <span className={`text-sm font-medium ${green ? 'text-emerald-600' : 'text-stone-800'}`}>{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-stone-50">
                    <span className="text-sm font-semibold text-stone-800">Total Pembayaran</span>
                    <span className="text-lg font-semibold text-emerald-700">
                      Rp {(selectedOrder.total + 2000).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-3">Item Pesanan</p>
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0 overflow-hidden">
                        {selectedOrder.image_url
                          ? <OptimizedImage src={selectedOrder.image_url} className="w-full h-full object-cover" alt="" width={40} height={40} />
                          : <Package className="w-5 h-5 text-stone-300 m-auto mt-2.5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-800">{item}</p>
                        <p className="text-xs text-stone-400">Kondisi: Grade A (Steril)</p>
                      </div>
                      <span className="text-sm font-medium text-stone-700">
                        {calculateDays(selectedOrder.pickup_date, selectedOrder.return_date)} hari
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-stone-100 bg-white">
              <Button variant="outline" className="flex-1 h-11 rounded-xl border-stone-300 text-stone-600 text-sm font-medium gap-2"
                onClick={() => window.open('https://wa.me/628123456789','_blank')}>
                <MessageSquare className="w-4 h-4 text-emerald-600" /> Hubungi Admin
              </Button>
              <Button className="flex-[2] h-11 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium shadow-none"
                onClick={() => setSelectedOrder(null)}>
                Tutup Rincian
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onDetail, statusInfo, onRemove }: any) {
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) onRemove()
  }

  return (
    <Card className="bg-white border border-stone-200 rounded-xl shadow-none hover:border-stone-300 hover:shadow-sm transition-all duration-300 overflow-hidden">
      {/* Card header */}
      <div className="flex flex-wrap justify-between items-center px-5 py-3 border-b border-stone-100 bg-stone-50 gap-2">
        <div className="flex items-center gap-2.5">
          <Badge className={`${statusInfo.color} border text-xs font-medium py-0.5 px-2.5 rounded-md flex items-center gap-1.5 shadow-none`}>
            {statusInfo.icon} {statusInfo.label}
          </Badge>
          <span className="w-px h-3 bg-stone-300 inline-block" />
          <span className="text-xs font-mono text-stone-400 flex items-center gap-1">
            <Receipt className="w-3 h-3" /> {order.id}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-400">
          <Calendar className="w-3 h-3" />
          <span className="text-xs font-medium">{order.date}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex gap-4 flex-1">
          {/* Image */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 bg-stone-100 rounded-xl border border-stone-200 overflow-hidden">
              {order?.image_url
                ? <OptimizedImage src={order?.image_url} alt={order.items[0]} className="w-full h-full object-cover" width={64} height={64} />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-7 h-7 text-stone-300" /></div>}
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-700 text-emerald-50 text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {order.items.length}
            </span>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-base font-medium text-stone-900 leading-tight line-clamp-1 mb-1">{order.items[0]}</h4>
            <p className="text-xs text-stone-400 mb-3">
              {order.items.length > 1
                ? `Beserta ${order.items.length - 1} perlengkapan lainnya`
                : 'Paket standar kualitas Habema'}
            </p>
            <span className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-full px-3 py-1 text-[11px] text-stone-500">
              <Clock className="w-3 h-3 text-emerald-600" /> Ambil: {order.pickup_date}
            </span>
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between lg:justify-end lg:flex-col lg:items-end gap-3 border-t lg:border-none pt-4 lg:pt-0">
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-0.5">Total Tagihan</p>
            <p className="text-xl font-semibold text-stone-900 tracking-tight">
              <span className="text-sm text-emerald-600 font-medium mr-1">Rp</span>
              {order.total?.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {order.status === 'pending' && (
              <Button variant="ghost" size="sm" onClick={handleCancel}
                className="h-9 px-3 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium gap-1.5 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Batalkan</span>
              </Button>
            )}
            <Button size="sm" onClick={onDetail}
              className="h-9 px-4 rounded-lg bg-stone-900 hover:bg-emerald-800 text-white text-xs font-medium gap-1.5 shadow-none transition-colors">
              Rincian <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="py-20 text-center flex flex-col items-center">
      <div className="w-20 h-20 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center mb-6">
        <Package className="w-9 h-9 text-stone-300" />
      </div>
      <h3 className="text-lg font-semibold text-stone-800 mb-2">Belum Ada Pesanan</h3>
      <p className="text-sm text-stone-400 mb-8 max-w-xs">
        Yuk isi tas carrier kamu dengan perlengkapan terbaik dari Habema.
      </p>
      <Button asChild className="bg-emerald-800 hover:bg-emerald-900 rounded-lg px-6 h-10 text-sm font-medium shadow-none">
        <Link href="/catalog" className="flex items-center gap-2">
          Eksplor Katalog <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}