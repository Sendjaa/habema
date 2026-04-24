'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store'
import { CheckCircle, ArrowLeft, Home, Download, Share2, QrCode } from 'lucide-react'

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { currentTransaction, orders } = useCartStore()
  const [mounted, setMounted] = useState(false)

  const handleDownloadInvoice = () => {
    // Create canvas for JPEG invoice
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 1200

    // Set background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(1, '#f8fafc')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add border
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    // Load and draw logo
    const img = new Image()
    img.onload = () => {
      // Draw logo in header
      const logoSize = 80
      const logoX = canvas.width / 2 - logoSize / 2
      ctx.drawImage(img, logoX, 40, logoSize, logoSize)

      // Company name below logo
      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('HABEMA OUTDOOR', canvas.width / 2, 140)

      // Invoice title
      ctx.font = 'bold 20px Arial'
      ctx.fillStyle = '#64748b'
      ctx.fillText('INVOICE PEMESANAN', canvas.width / 2, 170)

      // Draw decorative line
      ctx.strokeStyle = '#1B4332'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(100, 190)
      ctx.lineTo(canvas.width - 100, 190)
      ctx.stroke()

      // Order details section
      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('Detail Pesanan', 50, 230)

      // Order info box
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(50, 240, canvas.width - 100, 80)
      
      ctx.fillStyle = '#475569'
      ctx.font = '14px Arial'
      ctx.fillText(`Order ID: ${orderId}`, 70, 265)
      ctx.fillText(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 70, 285)
      ctx.fillText(`Waktu: ${new Date().toLocaleTimeString('id-ID')}`, 70, 305)

      // Payment method badge
      const paymentMethod = isWhatsAppBooking ? 'WhatsApp Konfirmasi' : 'Pembayaran Online'
      const badgeColor = isWhatsAppBooking ? '#10b981' : '#3b82f6'
      
      ctx.fillStyle = badgeColor
      ctx.fillRect(canvas.width - 250, 255, 200, 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(paymentMethod, canvas.width - 150, 280)

      // Items section
      ctx.textAlign = 'left'
      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('Detail Produk', 50, 360)

      // Table header
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(50, 370, canvas.width - 100, 40)
      
      ctx.fillStyle = '#475569'
      ctx.font = 'bold 12px Arial'
      ctx.fillText('No', 70, 395)
      ctx.fillText('Produk', 120, 395)
      ctx.fillText('Harga', 400, 395)
      ctx.fillText('Jumlah', 500, 395)
      ctx.fillText('Subtotal', 600, 395)

      // Items data
      let yPosition = 430
      ctx.font = '12px Arial'
      
      itemsArray.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          ctx.fillStyle = '#f8fafc'
          ctx.fillRect(50, yPosition - 15, canvas.width - 100, 35)
        }
        
        // Validate and format price with fallbacks
        const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0
        const itemQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1
        const subtotal = itemPrice * itemQuantity
        
        ctx.fillStyle = '#334155'
        ctx.fillText(`${index + 1}`, 70, yPosition)
        ctx.fillText(item.name || 'Produk Tidak Diketahui', 120, yPosition)
        ctx.fillText(`Rp ${itemPrice.toLocaleString('id-ID')}`, 400, yPosition)
        ctx.fillText(`${itemQuantity} hari`, 500, yPosition)
        ctx.fillText(`Rp ${subtotal.toLocaleString('id-ID')}`, 600, yPosition)
        
        yPosition += 35
      })

      // Total section with proper validation
      const totalPrice = isWhatsAppBooking 
        ? itemsArray.reduce((total, item) => {
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

      // Status section
      const status = isWhatsAppBooking ? 'Menunggu Konfirmasi' : 'Lunas'
      const statusColor = isWhatsAppBooking ? '#f59e0b' : '#10b981'
      
      ctx.fillStyle = statusColor
      ctx.fillRect(50, yPosition + 120, 150, 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(status, 125, yPosition + 145)

      // Instructions
      ctx.textAlign = 'left'
      ctx.fillStyle = '#64748b'
      ctx.font = '12px Arial'
      const instructionText = isWhatsAppBooking 
        ? 'Pembayaran akan dilakukan secara personal melalui WhatsApp. Admin kami akan menghubungi Anda segera.'
        : 'Pembayaran telah berhasil diproses. Terima kasih atas kepercayaan Anda.'
      
      // Wrap text for long instructions
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

      // Footer
      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Terima kasih telah menggunakan layanan Habema Outdoor!', canvas.width / 2, canvas.height - 80)
      
      ctx.fillStyle = '#64748b'
      ctx.font = '12px Arial'
      ctx.fillText('Hubungi kami: WhatsApp +6289509162484', canvas.width / 2, canvas.height - 60)
      ctx.fillText('www.habemaoutdoor.com', canvas.width / 2, canvas.height - 40)

      // Convert to JPEG and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `Invoice-Habema-${orderId}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/jpeg', 0.95)
    }

    // Set logo source
    img.src = '/images/logo-dark.png'
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Allow access for guest users who completed WhatsApp payment
    // Check if there's a recent booking in localStorage as fallback
    const recentBooking = typeof window !== 'undefined' && localStorage.getItem('recentBooking')
    
    if (mounted && !currentTransaction && !recentBooking) {
      router.push('/')
    }
  }, [mounted, currentTransaction, router])

  if (!mounted || (!currentTransaction && !localStorage.getItem('recentBooking'))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Get transaction data from store or localStorage for guest users
  let transactionData = currentTransaction;
  let itemsArray, firstItem;
  let isWhatsAppBooking = false;

  if (!currentTransaction) {
    // Try to get data from localStorage for guest users
    const recentBooking = typeof window !== 'undefined' && localStorage.getItem('recentBooking');
    if (recentBooking) {
      const booking = JSON.parse(recentBooking);
      isWhatsAppBooking = true; // Guest user with localStorage data means WhatsApp booking
      itemsArray = [{
        id: booking.id,
        name: booking.product,
        price: booking.pricePerNight || (booking.totalPrice / booking.days),
        quantity: booking.quantity || 1,
        category: "Equipment"
      }];
      firstItem = itemsArray[0];
    }
  } else {
    itemsArray = Array.isArray(currentTransaction.items) ? currentTransaction.items : [currentTransaction.items];
    firstItem = itemsArray[0];
    // Check if this is a WhatsApp booking from transaction data
    isWhatsAppBooking = currentTransaction.payment?.method === "WhatsApp Konfirmasi";
  }

  const orderId = `HBM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button variant="ghost" size="sm" asChild className="text-emerald-600 hover:text-emerald-800 w-fit">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Kembali ke Beranda</span>
                  <span className="sm:hidden">Kembali</span>
                </Link>
              </Button>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-emerald-900">
                  {isWhatsAppBooking ? "Konfirmasi Berhasil!" : "Pesanan Berhasil!"}
                </h1>
                <p className="text-emerald-600 mt-1 text-sm sm:text-base">
                  {isWhatsAppBooking 
                    ? "Terima kasih! Pesanan Anda telah dikonfirmasi via WhatsApp" 
                    : "Terima kasih telah melakukan pemesanan"
                  }
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm w-fit">
              Order #{orderId}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Success Message */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <div className="p-4 sm:p-6 lg:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-2">
                  {isWhatsAppBooking ? "Konfirmasi WhatsApp Berhasil!" : "Pembayaran Berhasil!"}
                </h2>
                <p className="text-emerald-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  {isWhatsAppBooking 
                    ? "Pesanan Anda telah dikonfirmasi via WhatsApp. Admin kami akan segera memproses pesanan Anda. Pembayaran akan dilakukan secara personal melalui WhatsApp."
                    : "Pesanan Anda telah dikonfirmasi dan sedang diproses. Kami akan mengirimkan detail pesanan melalui email."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-fit">
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" />
                      Kembali ke Beranda
                    </Link>
                  </Button>
                  <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full sm:w-fit" onClick={handleDownloadInvoice}>
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Download Invoice</span>
                    <span className="sm:hidden">Invoice</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Order Details */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-emerald-900 mb-4 sm:mb-6">Detail Pesanan</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-emerald-50 rounded-xl">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-emerald-100 border-2 border-emerald-200 flex-shrink-0">
                      {firstItem?.image_url && (
                        <img
                          src={firstItem.image_url}
                          alt={firstItem?.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-emerald-900 text-sm sm:text-base truncate">{firstItem?.name || 'Produk Sewa'}</h4>
                      <p className="text-emerald-600 text-xs sm:text-sm">Durasi: {currentTransaction.duration || 1} hari sewa</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs w-fit">Dikonfirmasi</Badge>
                        <span className="text-xs sm:text-sm text-emerald-600">
                          Rp {(firstItem?.price || 0).toLocaleString('id-ID')}/hari
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <span className="text-emerald-600">Order ID</span>
                      <span className="font-medium text-emerald-900 text-right truncate">{orderId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <span className="text-emerald-600">Tanggal Pemesanan</span>
                      <span className="font-medium text-emerald-900 text-right">
                        {new Date().toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <span className="text-emerald-600">Metode Pembayaran</span>
                      <span className="font-medium text-emerald-900 text-right">
                        {currentTransaction.paymentMethod || 'Midtrans'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <span className="text-emerald-600">Status Pembayaran</span>
                      <div className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Lunas</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-emerald-900 text-sm sm:text-base">Total Pembayaran</span>
                      <span className="text-lg sm:text-2xl font-bold text-emerald-900">
                        Rp {(currentTransaction.totalPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-emerald-900 mb-3 sm:mb-4">Langkah Selanjutnya</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 text-xs font-semibold">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-emerald-900 text-sm sm:text-base">Konfirmasi Email</h4>
                      <p className="text-xs sm:text-sm text-emerald-600">Cek email Anda untuk detail pesanan lengkap</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 text-xs font-semibold">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-emerald-900 text-sm sm:text-base">Persiapan Produk</h4>
                      <p className="text-xs sm:text-sm text-emerald-600">Kami akan mempersiapkan produk sewa Anda</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 text-xs font-semibold">3</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-emerald-900 text-sm sm:text-base">Pengambilan/Pengantaran</h4>
                      <p className="text-xs sm:text-sm text-emerald-600">Koordinasi waktu dan tempat pengambilan</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-4 sm:top-6 space-y-3 sm:space-y-4">
              {/* QR Code */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <div className="p-4 sm:p-6 text-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4 bg-emerald-50 rounded-xl flex items-center justify-center border-2 border-emerald-200">
                    <QrCode className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-emerald-900 mb-1 sm:mb-2 text-sm sm:text-base">QR Code Pesanan</h4>
                  <p className="text-xs sm:text-sm text-emerald-600 mb-3 sm:mb-4">
                    Tunjukkan QR code ini saat pengambilan produk
                  </p>
                  <Button variant="outline" size="sm" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs sm:text-sm">
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Bagikan QR Code</span>
                    <span className="sm:hidden">Bagikan</span>
                  </Button>
                </div>
              </Card>

              {/* Contact Support */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <div className="p-4 sm:p-6">
                  <h4 className="font-semibold text-emerald-900 mb-2 sm:mb-3 text-sm sm:text-base">Butuh Bantuan?</h4>
                  <p className="text-xs sm:text-sm text-emerald-600 mb-3 sm:mb-4">
                    Tim support kami siap membantu Anda dengan pertanyaan seputar pesanan.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs sm:text-sm">
                      Hubungi Support
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-emerald-600 hover:bg-emerald-50 text-xs sm:text-sm">
                      FAQ Pesanan
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <div className="p-4 sm:p-6">
                  <h4 className="font-semibold text-emerald-900 mb-2 sm:mb-3 text-sm sm:text-base">Aksi Cepat</h4>
                  <div className="space-y-2">
                    <Button variant="ghost" size="sm" className="w-full text-emerald-600 hover:bg-emerald-50 justify-start text-xs sm:text-sm" onClick={handleDownloadInvoice}>
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Download Invoice</span>
                      <span className="sm:hidden">Invoice</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-emerald-600 hover:bg-emerald-50 justify-start text-xs sm:text-sm">
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Bagikan Pesanan</span>
                      <span className="sm:hidden">Bagikan</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-emerald-600 hover:bg-emerald-50 justify-start text-xs sm:text-sm" asChild>
                      <Link href="/">
                        <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Pesanan Lain</span>
                        <span className="sm:hidden">Lain</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
