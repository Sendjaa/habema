'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Phone, MapPin, Settings, LogOut, Edit2 } from 'lucide-react'

const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+62 812-3456-7890',
}

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-forest mb-2">Akun Saya</h1>
          <p className="text-muted-foreground">Kelola profil dan pengaturan akun Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gradient-to-br from-forest to-forest-light text-cream rounded-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{mockUser.name}</h2>
                  <p className="text-sm text-cream/80">{mockUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-cream/20 pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{mockUser.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{mockUser.email}</span>
                </div>
              </div>

              <div className="pt-6 space-y-2 border-t border-cream/20 mt-6">
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="#" className="flex items-center justify-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit Profil
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="#" className="flex items-center justify-center gap-2">
                    <Settings className="w-4 h-4" />
                    Pengaturan
                  </Link>
                </Button>
                <Button variant="destructive" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </Card>

            {/* Verification Status */}
            <Card className="p-4 bg-white border-border mt-4">
              <h3 className="font-bold text-forest mb-3">Status Verifikasi</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <Badge className="bg-green-100 text-green-800">✓ Terverifikasi</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Identitas</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    ⏳ Menunggu
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Telepon</span>
                  <Badge className="bg-green-100 text-green-800">✓ Terverifikasi</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="bg-white border border-border">
                <TabsTrigger value="orders">Pesanan</TabsTrigger>
                <TabsTrigger value="addresses">Alamat</TabsTrigger>
                <TabsTrigger value="security">Keamanan</TabsTrigger>
                <TabsTrigger value="preferences">Preferensi</TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card className="p-6 bg-white border-border">
                  <h3 className="font-bold text-forest mb-4">Pesanan Terbaru</h3>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href="/orders">
                      Lihat Semua Pesanan
                    </Link>
                  </Button>
                </Card>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <Card className="p-6 bg-white border-border space-y-4">
                  <h3 className="font-bold text-forest">Alamat Saya</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <p className="text-muted-foreground mb-4">Belum ada alamat tersimpan</p>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-forest-dark">
                      + Tambah Alamat
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card className="p-6 bg-white border-border space-y-6">
                  <h3 className="font-bold text-forest">Keamanan Akun</h3>

                  <div className="space-y-4">
                    <div className="border-b border-border pb-4">
                      <h4 className="font-medium text-forest mb-2">Password</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Terakhir diubah 3 bulan yang lalu
                      </p>
                      <Button variant="outline" size="sm">
                        Ubah Password
                      </Button>
                    </div>

                    <div className="border-b border-border pb-4">
                      <h4 className="font-medium text-forest mb-2">
                        Autentikasi Dua Faktor
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Aktifkan untuk keamanan lebih tinggi
                      </p>
                      <Button variant="outline" size="sm">
                        Aktifkan 2FA
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-medium text-forest mb-2">
                        Sesi Aktif
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Anda sedang login di 1 perangkat
                      </p>
                      <Button variant="outline" size="sm">
                        Logout Dari Semua Perangkat
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card className="p-6 bg-white border-border space-y-6">
                  <h3 className="font-bold text-forest">Preferensi Notifikasi</h3>

                  <div className="space-y-4">
                    {[
                      {
                        label: 'Email Pesanan',
                        description: 'Terima notifikasi pesanan dan update',
                      },
                      {
                        label: 'SMS Pengingat',
                        description: 'Pengingat pengambilan dan pengembalian',
                      },
                      {
                        label: 'Newsletter',
                        description: 'Update produk baru dan promo eksklusif',
                      },
                    ].map((pref, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-forest">{pref.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {pref.description}
                          </p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
