'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store'
import { CheckCircle, ArrowLeft, Home, Download } from 'lucide-react'

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { currentTransaction } = useCartStore()
  const [mounted, setMounted] = useState(false)

  const handleDownloadInvoice = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 1200

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(1, '#f8fafc')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    const img = new window.Image()
    img.onload = () => {
      const logoSize = 80
      const logoX = canvas.width / 2 - logoSize / 2
      ctx.drawImage(img, logoX, 40, logoSize, logoSize)

      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('HABEMA OUTDOOR', canvas.width / 2, 140)

      ctx.font = 'bold 20px Arial'
      ctx.fillStyle = '#64748b'
      ctx.fillText('INVOICE PEMESANAN', canvas.width / 2, 170)

      ctx.strokeStyle = '#1B4332'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(100, 190)
      ctx.lineTo(canvas.width - 100, 190)
      ctx.stroke()

      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('Detail Pesanan', 50, 230)

      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(50, 240, canvas.width - 100, 80)

      ctx.fillStyle = '#475569'
      ctx.font = '14px Arial'
      ctx.fillText(`Order ID: ${orderId}`, 70, 265)
      ctx.fillText(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 70, 285)
      ctx.fillText(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`, 70, 305)

      const paymentMethod = isWhatsAppBooking ? 'WhatsApp Konfirmasi' : 'Pembayaran Online'
      const badgeColor = isWhatsAppBooking ? '#10b981' : '#3b82f6'

      ctx.fillStyle = badgeColor
      ctx.fillRect(canvas.width - 250, 255, 200, 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(paymentMethod, canvas.width - 150, 280)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('Detail Produk', 50, 360)

      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(50, 370, canvas.width - 100, 40)

      ctx.fillStyle = '#475569'
      ctx.font = 'bold 12px Arial'
      ctx.fillText('No', 70, 395)
      ctx.fillText('Produk', 120, 395)
      ctx.fillText('Harga', 400, 395)
      ctx.fillText('Jumlah', 500, 395)
      ctx.fillText('Subtotal', 600, 395)

      let yPosition = 430
      ctx.font = '12px Arial';

      (itemsArray ?? []).forEach((item: any, index: number) => {
        if (index % 2 === 0) {
          ctx.fillStyle = '#f8fafc'
          ctx.fillRect(50, yPosition - 15, canvas.width - 100, 35)
        }

        const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0
        const itemQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1
        const subtotal = itemPrice * itemQuantity

        ctx.fillStyle = '#334155'
        ctx.fillText(`${index + 1}`, 70, yPosition)
        ctx.fillText(item.name || 'Produk Tidak Diketahui', 120, yPosition)
        ctx.fillText(`Rp ${itemPrice.toLocaleString('id-ID')}`, 400, yPosition)
        ctx.fillText(`${item.days || itemQuantity} hari`, 500, yPosition)
        ctx.fillText(`Rp ${subtotal.toLocaleString('id-ID')}`, 600, yPosition)

        yPosition += 35
      })

      const totalPrice = isWhatsAppBooking
        ? (itemsArray ?? []).reduce((total: number, item: any) => {
            const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0
            const itemQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1
            return total + (itemPrice * itemQuantity)
          }, 0)
        : (typeof transactionData?.totalPrice === 'number' && !isNaN(transactionData.totalPrice) ? transactionData.totalPrice : 0)

      ctx.fillStyle = '#1B4332'
      ctx.fillRect(canvas.width - 250, yPosition + 20, 200, 80)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.fillText('Total:', canvas.width - 230, yPosition + 45)
      ctx.font = 'bold 18px Arial'
      ctx.fillText(`Rp ${totalPrice.toLocaleString('id-ID')}`, canvas.width - 230, yPosition + 75)

      const status = isWhatsAppBooking ? 'Menunggu Konfirmasi' : 'Lunas'
      const statusColor = isWhatsAppBooking ? '#f59e0b' : '#10b981'

      ctx.fillStyle = statusColor
      ctx.fillRect(50, yPosition + 120, 150, 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(status, 125, yPosition + 145)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#64748b'
      ctx.font = '12px Arial'
      const instructionText = isWhatsAppBooking
        ? 'Pembayaran akan dilakukan secara personal melalui WhatsApp. Admin kami akan menghubungi Anda segera.'
        : 'Pembayaran telah berhasil diproses. Terima kasih atas kepercayaan Anda.'

      const maxWidth = canvas.width - 100
      const words = instructionText.split(' ')
      let line = ''
      let instructionY = yPosition + 180

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, 50, instructionY)
          line = words[n] + ' '
          instructionY += 20
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, 50, instructionY)

      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Terima kasih telah menggunakan layanan Habema Outdoor!', canvas.width / 2, canvas.height - 80)

      ctx.fillStyle = '#64748b'
      ctx.font = '12px Arial'
      ctx.fillText('Hubungi kami: WhatsApp +6289509162484', canvas.width / 2, canvas.height - 60)
      ctx.fillText('www.habemaoutdoor.com', canvas.width / 2, canvas.height - 40)

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Invoice-Habema-${orderId || 'unknown'}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/jpeg', 0.95)
    }

    img.src = '/images/logo-dark.webp'
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const getRecentBooking = () => {
    try {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem('recentBooking')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  useEffect(() => {
    const recentBooking = getRecentBooking()
    if (mounted && !currentTransaction && !recentBooking) {
      router.push('/')
    }
  }, [mounted, currentTransaction, router])

  if (!mounted || (!currentTransaction && !getRecentBooking())) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
      </div>
    )
  }

  let transactionData = currentTransaction;
  let itemsArray: any[] | undefined;
  let isWhatsAppBooking = false;

  if (!currentTransaction) {
    const recentBooking = getRecentBooking()
    if (recentBooking) {
      isWhatsAppBooking = true;
      itemsArray = [{
        id: recentBooking.id,
        name: recentBooking.product,
        price: recentBooking.totalPrice,
        quantity: 1,
        category: "Equipment",
        days: recentBooking.days
      }];
    }
  } else {
    itemsArray = Array.isArray(currentTransaction.items) ? currentTransaction.items : [currentTransaction.items];
    isWhatsAppBooking = currentTransaction.payment?.method === "WhatsApp Konfirmasi";
  }

  const orderId =
    currentTransaction?.orderId
    || (currentTransaction?.payment as any)?.bookingId
    || getRecentBooking()?.id
    || ''

  const recentBooking = !currentTransaction ? getRecentBooking() : null
  const totalDays = transactionData?.duration || transactionData?.days || recentBooking?.days || 1

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon-sm" asChild className="text-forest hover:text-forest-dark shrink-0">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-forest leading-tight">
                  {isWhatsAppBooking ? "Konfirmasi Berhasil" : "Pesanan Berhasil"}
                </h1>
                <p className="text-stone-600 font-medium text-xs sm:text-sm leading-tight">
                  {isWhatsAppBooking
                    ? "Pesanan dikonfirmasi via WhatsApp"
                    : "Terima kasih telah memesan"
                  }
                </p>
              </div>
            </div>
            <Badge className="bg-forest/10 text-forest rounded-full px-2.5 py-0.5 text-xs w-fit font-bold shrink-0">
              {orderId ? `#${orderId.slice(0, 8)}` : 'Baru'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="p-4 sm:p-6 lg:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-forest mb-2">
                  {isWhatsAppBooking ? "Konfirmasi WhatsApp Berhasil" : "Pembayaran Berhasil"}
                </h2>
                <p className="text-stone-600 font-medium mb-4 sm:mb-6 text-sm sm:text-base">
                  {isWhatsAppBooking
                    ? "Pesanan Anda telah dikonfirmasi via WhatsApp. Admin kami akan segera memproses pesanan Anda. Pembayaran akan dilakukan secara personal melalui WhatsApp."
                    : "Pesanan Anda telah dikonfirmasi dan sedang diproses. Kami akan mengirimkan detail pesanan melalui email."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="ghost" asChild className="bg-green hover:bg-earth/80 text-white rounded-xl font-bold w-full sm:w-fit">
                    <Link href="/">
                      <Home className="w-4 h-4" />
                      Kembali ke Beranda
                    </Link>
                  </Button>
                  <Button variant="ghost" className="bg-earth hover:bg-earth/80 text-white rounded-xl font-bold w-full sm:w-fit" onClick={handleDownloadInvoice}>
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-forest mb-4 sm:mb-6">Detail Pesanan</h3>
                <div className="space-y-3">
                  {itemsArray?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-cream rounded-xl">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 relative">
                        {item?.image_url && (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-forest text-sm sm:text-base truncate">{item.name || 'Produk Sewa'}</h4>
                        <p className="text-stone-600 font-medium text-xs sm:text-sm">Durasi: {totalDays} hari</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                          <Badge className="bg-emerald-100 text-emerald-700 rounded-full text-xs w-fit font-medium">Dikonfirmasi</Badge>
                          <span className="text-xs sm:text-sm text-stone-600 font-medium">
                            Rp {(item.days
                              ? Math.round(item.price / item.days)
                              : item.price || 0
                            ).toLocaleString('id-ID')}/hari
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-forest mb-4 sm:mb-6">Ringkasan Pesanan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-stone-600 font-medium">Order ID</span>
                    <span className="font-bold text-forest truncate ml-4">{orderId || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-stone-600 font-medium">Tanggal Pemesanan</span>
                    <span className="font-bold text-forest ml-4">
                      {transactionData?.dates?.start
                        ? new Date(transactionData.dates.start).toLocaleDateString('id-ID')
                        : new Date().toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-stone-600 font-medium">Metode Pembayaran</span>
                    <span className="font-bold text-forest ml-4">
                      {transactionData?.payment?.method === "WhatsApp Konfirmasi" ? "WhatsApp Konfirmasi" : "Pembayaran Online"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-stone-600 font-medium">Status Pembayaran</span>
                    <Badge className={`rounded-full text-xs font-medium ${isWhatsAppBooking ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isWhatsAppBooking ? 'Menunggu Konfirmasi' : 'Lunas'}
                    </Badge>
                  </div>
                  <div className="border-t border-stone-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-forest text-sm sm:text-base">Total Pembayaran</span>
                      <span className="text-lg sm:text-2xl font-black text-forest">
                        Rp {(transactionData?.totalPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-forest mb-3 sm:mb-4">Langkah Selanjutnya</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-forest text-xs font-bold">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-forest text-sm sm:text-base">Konfirmasi Email</h4>
                      <p className="text-xs sm:text-sm text-stone-600 font-medium">Cek email Anda untuk detail pesanan lengkap</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-forest text-xs font-bold">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-forest text-sm sm:text-base">Persiapan Produk</h4>
                      <p className="text-xs sm:text-sm text-stone-600 font-medium">Kami akan mempersiapkan produk sewa Anda</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-forest text-xs font-bold">3</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-forest text-sm sm:text-base">Pengambilan/Pengantaran</h4>
                      <p className="text-xs sm:text-sm text-stone-600 font-medium">Koordinasi waktu dan tempat pengambilan</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-4 sm:top-6 space-y-3 sm:space-y-4">
              <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="p-4 sm:p-6">
                  <h4 className="font-black uppercase tracking-tight text-forest mb-3 text-sm sm:text-base">Aksi Cepat</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full border-forest text-forest hover:bg-forest hover:text-white rounded-xl font-bold justify-start text-xs sm:text-sm" onClick={handleDownloadInvoice}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button variant="outline" className="w-full border-forest text-forest hover:bg-forest hover:text-white rounded-xl font-bold justify-start text-xs sm:text-sm" asChild>
                      <Link href="/">
                        <Home className="w-4 h-4 mr-2" />
                        Pesanan Lain
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="p-4 sm:p-6">
                  <h4 className="font-black uppercase tracking-tight text-forest mb-2 text-sm sm:text-base">Butuh Bantuan?</h4>
                  <p className="text-xs sm:text-sm text-stone-600 font-medium mb-3">
                    Hubungi tim support kami melalui WhatsApp
                  </p>
                  <Button variant="outline" className="w-full border-forest text-forest hover:bg-forest hover:text-white rounded-xl font-bold text-xs sm:text-sm" asChild>
                    <a href="https://wa.me/6289509162484" target="_blank" rel="noopener noreferrer">
                      Hubungi WhatsApp
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
