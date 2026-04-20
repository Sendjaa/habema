'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  Package,
  TrendingUp,
  Users,
  AlertCircle,
  Settings,
  Download,
  Plus,
} from 'lucide-react'

const revenueData = [
  { month: 'Jan', revenue: 4000, rentals: 24 },
  { month: 'Feb', revenue: 3000, rentals: 20 },
  { month: 'Mar', revenue: 2000, rentals: 18 },
  { month: 'Apr', revenue: 2780, rentals: 22 },
  { month: 'May', revenue: 1890, rentals: 19 },
  { month: 'Jun', revenue: 2390, rentals: 21 },
]

const inventoryData = [
  { id: 1, name: 'Dome Tent 2P', stock: 8, rented: 2, maintenance: 0, available: 8 },
  { id: 2, name: 'Dome Tent 4P', stock: 5, rented: 1, maintenance: 1, available: 3 },
  { id: 3, name: 'Hiking Backpack', stock: 15, rented: 4, maintenance: 0, available: 11 },
  { id: 4, name: 'Sleeping Bag', stock: 20, rented: 8, maintenance: 2, available: 10 },
  { id: 5, name: 'Cooking Kit', stock: 12, rented: 5, maintenance: 0, available: 7 },
]

const recentOrders = [
  {
    id: 'ORD-2024-001',
    customer: 'Budi Petualang',
    items: 3,
    amount: 117000,
    status: 'ready',
    date: '2024-04-10',
  },
  {
    id: 'ORD-2024-002',
    customer: 'Siti Adventure',
    items: 2,
    amount: 85000,
    status: 'completed',
    date: '2024-04-05',
  },
  {
    id: 'ORD-2024-003',
    customer: 'Rudi Outdoor',
    items: 4,
    amount: 156000,
    status: 'pending',
    date: '2024-04-08',
  },
]

export default function VendorDashboard() {
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0)
  const totalRentals = revenueData.reduce((sum, item) => sum + item.rentals, 0)
  const totalStock = inventoryData.reduce((sum, item) => sum + item.stock, 0)
  const itemsNeedingMaintenance = inventoryData.reduce(
    (sum, item) => sum + item.maintenance,
    0
  )

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      maintenance: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-forest mb-2">Dashboard Vendor</h1>
            <p className="text-muted-foreground">Kelola toko dan inventaris Anda</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-forest-dark flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Item
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-forest">
                  Rp{totalRevenue.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-green-600 mt-1">+12% dari bulan lalu</p>
              </div>
              <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gold" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Penyewaan</p>
                <p className="text-2xl font-bold text-forest">{totalRentals}</p>
                <p className="text-xs text-blue-600 mt-1">Bulan ini</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Stok</p>
                <p className="text-2xl font-bold text-forest">{totalStock}</p>
                <p className="text-xs text-green-600 mt-1">Item</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Perlu Perawatan
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {itemsNeedingMaintenance}
                </p>
                <p className="text-xs text-red-600 mt-1">Item</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white border border-border">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="inventory">Inventaris</TabsTrigger>
            <TabsTrigger value="orders">Pesanan</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="p-6 bg-white border-border">
                <h3 className="font-bold text-forest mb-4">Pendapatan Bulanan</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8DFCF" />
                    <XAxis dataKey="month" stroke="#8B7355" />
                    <YAxis stroke="#8B7355" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F5EFE7',
                        border: '1px solid #2D5016',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#E8A76B"
                      strokeWidth={2}
                      dot={{ fill: '#2D5016' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Rental Chart */}
              <Card className="p-6 bg-white border-border">
                <h3 className="font-bold text-forest mb-4">Trend Penyewaan</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8DFCF" />
                    <XAxis dataKey="month" stroke="#8B7355" />
                    <YAxis stroke="#8B7355" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F5EFE7',
                        border: '1px solid #2D5016',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="rentals" fill="#2D5016" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card className="p-6 bg-white border-border overflow-x-auto">
              <h3 className="font-bold text-forest mb-4">Daftar Inventaris</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Nama Item
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Total
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Disewa
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Tersedia
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Perawatan
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-2 font-medium text-forest">
                        {item.name}
                      </td>
                      <td className="py-3 px-2">{item.stock}</td>
                      <td className="py-3 px-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {item.rented}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className="bg-green-100 text-green-800">
                          {item.available}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {item.maintenance > 0 ? (
                          <Badge className="bg-red-100 text-red-800">
                            {item.maintenance}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="p-6 bg-white border-border overflow-x-auto">
              <h3 className="font-bold text-forest mb-4">Pesanan Terbaru</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      No. Pesanan
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Pelanggan
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Item
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Total
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Status
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-forest">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-2 font-mono font-bold text-forest">
                        {order.id}
                      </td>
                      <td className="py-3 px-2">{order.customer}</td>
                      <td className="py-3 px-2">{order.items}</td>
                      <td className="py-3 px-2 font-semibold text-gold">
                        Rp{order.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'ready' && 'Siap Diambil'}
                          {order.status === 'completed' && 'Selesai'}
                          {order.status === 'pending' && 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {order.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 bg-white border-border">
              <h3 className="font-bold text-forest mb-6">Pengaturan Toko</h3>

              <div className="space-y-6">
                <div>
                  <label className="font-medium text-forest block mb-2">
                    Nama Toko
                  </label>
                  <input
                    type="text"
                    defaultValue="Habema Outdoor Bandung"
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-medium text-forest block mb-2">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    defaultValue="Bandung, Jawa Barat"
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-medium text-forest block mb-2">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    defaultValue="+62 812 3456 7890"
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-medium text-forest block mb-2">
                    Jam Operasional
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="time"
                      defaultValue="08:00"
                      className="rounded-md border border-border bg-background px-3 py-2"
                    />
                    <input
                      type="time"
                      defaultValue="20:00"
                      className="rounded-md border border-border bg-background px-3 py-2"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <Button className="bg-primary text-primary-foreground hover:bg-forest-dark">
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
