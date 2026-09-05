'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store'
import { MANUAL_QRIS_METHOD } from '@/lib/manual-payment'
import { CheckCircle, ArrowLeft, Home, Download, IdCard } from 'lucide-react'

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { currentTransaction } = useCartStore()
  const [mounted, setMounted] = useState(false)

  const handleDownloadInvoice = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 800
    const M = 50
    const CW = W - M * 2
    canvas.width = W
    canvas.height = 1250

    // ==================== HELPERS ====================
    const roundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    const wrapText = (text: string, x: number, y0: number, maxW: number, lineH: number): number => {
      const words = text.split(' ')
      let line = ''
      let ly = y0
      for (const w of words) {
        const test = line ? `${line} ${w}` : w
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, x, ly)
          line = w
          ly += lineH
        } else {
          line = test
        }
      }
      if (line) {
        ctx.fillText(line, x, ly)
        ly += lineH
      }
      return ly
    }

    const truncate = (text: string, maxW: number): string => {
      let t = text
      while (ctx.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -1)
      return t !== text ? `${t}…` : t
    }

    // ==================== DATA ====================
    const isRental =
      isWhatsAppBooking ||
      Boolean(transactionData?.days) ||
      Boolean(transactionData?.duration)

    const items = (itemsArray ?? []).map((item: any) => {
      const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0
      const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1
      const days = isRental ? Number(item.days || totalDays || 1) : 1
      return { ...item, price, qty, days, subtotal: price * qty * days }
    })

    const subtotalTotal = items.reduce((s, it) => s + it.subtotal, 0)
    const storedTotal =
      (typeof transactionData?.totalPrice === 'number' && !isNaN(transactionData.totalPrice)
        ? transactionData.totalPrice
        : Number(recentBooking?.totalPrice) || 0)
    const invoiceTotal = storedTotal > 0 ? storedTotal : subtotalTotal
    const discount = Math.max(0, subtotalTotal - invoiceTotal)

    const paymentMethod = isWhatsAppBooking
      ? 'WhatsApp Konfirmasi'
      : isQrisManual ? 'QRIS Manual' : 'Pembayaran Online'
    const status = isWhatsAppBooking
      ? 'Menunggu Konfirmasi'
      : isQrisManual ? 'Menunggu Verifikasi' : 'Lunas'
    const statusColor = (isWhatsAppBooking || isQrisManual) ? '#f59e0b' : '#10b981'

    const instructionText = isWhatsAppBooking
      ? 'Pembayaran akan dilakukan secara personal melalui WhatsApp. Admin kami akan menghubungi Anda segera.'
      : isQrisManual
        ? 'Bukti pembayaran telah diterima dan sedang diverifikasi admin. Pesanan diproses setelah pembayaran disetujui.'
        : 'Pembayaran telah berhasil diproses. Terima kasih atas kepercayaan Anda.'

    const extendText =
      'Perpanjangan masa sewa dikenakan biaya sesuai tarif sewa harian × jumlah hari tambahan, dan wajib dikonfirmasi ke admin sebelum jatuh tempo. Keterlambatan pengembalian tanpa pemberitahuan dikenakan biaya: 1-6 jam = 10% tarif harian, 6-24 jam = 50% tarif harian, dan lebih dari 24 jam = 100% tarif harian hari berikutnya.'

    // ==================== RENDER ====================
    const render = (withLogo: boolean) => {
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(1, '#f8fafc')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

      // Header
      if (withLogo) {
        const logoSize = 68
        ctx.drawImage(img, W / 2 - logoSize / 2, 40, logoSize, logoSize)
      }
      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 30px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('HABEMA OUTDOOR', W / 2, withLogo ? 138 : 78)
      ctx.font = 'bold 17px Arial'
      ctx.fillStyle = '#64748b'
      ctx.fillText('INVOICE PEMESANAN', W / 2, withLogo ? 166 : 106)

      ctx.strokeStyle = '#1B4332'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(M, withLogo ? 192 : 132)
      ctx.lineTo(W - M, withLogo ? 192 : 132)
      ctx.stroke()

      // Detail Pesanan
      let y = withLogo ? 220 : 160
      ctx.fillStyle = '#f1f5f9'
      roundedRect(M, y, CW, 112, 12)
      ctx.fill()

      const meta = [
        { label: 'Order ID', value: orderId || '-' },
        { label: 'Tanggal', value: new Date().toLocaleDateString('id-ID') },
        { label: 'Waktu', value: new Date().toLocaleTimeString('id-ID') },
        { label: 'Metode', value: paymentMethod },
      ]
      ctx.textAlign = 'left'
      let my = y + 30
      for (const m of meta) {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '13px Arial'
        ctx.fillText(m.label, M + 24, my)
        ctx.fillStyle = '#334155'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(truncate(m.value, 200), M + 150, my)
        my += 24
      }

      ctx.fillStyle = statusColor
      roundedRect(W - M - 186, y + 34, 162, 28, 14)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(status, W - M - 105, y + 53)
      ctx.textAlign = 'left'

      // Tabel Produk
      y += 118
      ctx.fillStyle = '#1B4332'
      roundedRect(M, y, CW, 40, 10)
      ctx.fill()

      const cols = isRental
        ? { no: 70, name: 110, price: 330, qty: 460, days: 545, sub: 645 }
        : { no: 70, name: 110, price: 330, qty: 520, days: null, sub: 630 }
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.fillText('No', cols.no, y + 25)
      ctx.fillText('Produk', cols.name, y + 25)
      ctx.fillText(isRental ? 'Harga/Hari' : 'Harga', cols.price, y + 25)
      ctx.fillText('Qty', cols.qty, y + 25)
      if (isRental) ctx.fillText('Durasi', cols.days!, y + 25)
      ctx.fillText('Subtotal', cols.sub, y + 25)

      y += 40
      ctx.font = '12px Arial'
      let row = 0
      for (const item of items) {
        if (row % 2 === 0) {
          ctx.fillStyle = '#f8fafc'
          ctx.fillRect(M, y - 2, CW, 32)
        }
        ctx.fillStyle = '#334155'
        ctx.fillText(String(row + 1), cols.no, y + 20)
        ctx.font = 'bold 12px Arial'
        ctx.fillText(truncate(item.name || 'Produk Tidak Diketahui', 200), cols.name, y + 20)
        ctx.font = '12px Arial'
        ctx.fillText(`Rp ${item.price.toLocaleString('id-ID')}`, cols.price, y + 20)
        ctx.fillText(String(item.qty), cols.qty, y + 20)
        if (isRental) ctx.fillText(`${item.days} hari`, cols.days!, y + 20)
        ctx.fillStyle = '#1B4332'
        ctx.font = 'bold 12px Arial'
        ctx.fillText(`Rp ${item.subtotal.toLocaleString('id-ID')}`, cols.sub, y + 20)
        ctx.font = '12px Arial'
        row++
        y += 34
      }

      // Ringkasan harga
      y += 16
      const summaryX = W - M - 280
      ctx.textAlign = 'right'
      ctx.fillStyle = '#64748b'
      ctx.font = '13px Arial'
      ctx.fillText('Subtotal', summaryX, y + 14)
      ctx.fillStyle = '#334155'
      ctx.font = 'bold 13px Arial'
      ctx.fillText(`Rp ${subtotalTotal.toLocaleString('id-ID')}`, W - M - 20, y + 14)

      if (discount > 0) {
        y += 24
        ctx.fillStyle = '#64748b'
        ctx.font = '13px Arial'
        ctx.fillText('Diskon', summaryX, y + 14)
        ctx.fillStyle = '#dc2626'
        ctx.font = 'bold 13px Arial'
        ctx.fillText(`-Rp ${discount.toLocaleString('id-ID')}`, W - M - 20, y + 14)
      }

      y += 32
      ctx.fillStyle = '#1B4332'
      roundedRect(W - M - 250, y, 230, 74, 10)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.fillText('TOTAL', W - M - 42, y + 30)
      ctx.font = 'bold 19px Arial'
      ctx.fillText(`Rp ${invoiceTotal.toLocaleString('id-ID')}`, W - M - 42, y + 60)
      ctx.textAlign = 'left'

      // Penjelasan Extend Charge
      y += 104
      ctx.fillStyle = '#fffbeb'
      roundedRect(M, y, CW, 110, 10)
      ctx.fill()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 1.2
      roundedRect(M, y, CW, 110, 10)
      ctx.stroke()

      ctx.fillStyle = '#b45309'
      ctx.font = 'bold 13px Arial'
      ctx.fillText('BIYA PERPANJANGAN SEWA (EXTEND CHARGE)', M + 24, y + 28)
      ctx.fillStyle = '#78350f'
      ctx.font = '12px Arial'
      wrapText(extendText, M + 24, y + 50, CW - 48, 18)

      // Instruksi & footer
      ctx.fillStyle = '#64748b'
      ctx.font = '12px Arial'
      const instrEnd = wrapText(instructionText, M, y + 130, CW, 18)

      ctx.fillStyle = '#1B4332'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Terima kasih telah menggunakan layanan Habema Outdoor!', W / 2, canvas.height - 88)
      ctx.fillStyle = '#64748b'
      ctx.font = '12px Arial'
      ctx.fillText('Hubungi kami: WhatsApp +6283898749357', W / 2, canvas.height - 66)
      ctx.fillText('https.habema.biz.id', W / 2, canvas.height - 46)
      ctx.textAlign = 'left'

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

    const img = new window.Image()
    img.onload = () => render(true)
    img.onerror = () => render(false)
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
        price: recentBooking.pricePerNight,
        quantity: recentBooking.quantity || 1,
        category: "Equipment",
        days: recentBooking.days
      }];
    }
  } else {
    itemsArray = Array.isArray(currentTransaction.items) ? currentTransaction.items : [currentTransaction.items];
    isWhatsAppBooking = currentTransaction.payment?.method === "WhatsApp Konfirmasi";
  }

  const isQrisManual =
    !!currentTransaction &&
    currentTransaction.payment?.method === MANUAL_QRIS_METHOD;

  const orderId =
    currentTransaction?.orderId
    || (currentTransaction?.payment as any)?.bookingId
    || getRecentBooking()?.id
    || ''

  const recentBooking = !currentTransaction ? getRecentBooking() : null
  const totalDays = transactionData?.duration || transactionData?.days || recentBooking?.days || 1

  const idTypeLabel = (t?: string) =>
    ({ ktp: 'KTP', sim: 'SIM', passport: 'Paspor', npwp: 'NPWP' } as Record<string, string>)[t || ''] || t || '-'

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
                  {isWhatsAppBooking
                    ? "Konfirmasi WhatsApp Berhasil"
                    : isQrisManual ? "Bukti Terkirim" : "Pembayaran Berhasil"}
                </h2>
                <p className="text-stone-600 font-medium mb-4 sm:mb-6 text-sm sm:text-base">
                  {isWhatsAppBooking
                    ? "Pesanan Anda telah dikonfirmasi via WhatsApp. Admin kami akan segera memproses pesanan Anda. Pembayaran akan dilakukan secara personal melalui WhatsApp."
                    : isQrisManual
                      ? "Bukti pembayaran Anda telah diterima dan sedang diverifikasi admin. Pesanan akan diproses setelah pembayaran disetujui."
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

            {transactionData?.identity && (transactionData.identity.fullName || transactionData.identity.idNumber) && (
              <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-forest mb-4 sm:mb-6">Data Pemesan</h3>
                  <div className="bg-cream rounded-xl p-4 sm:p-5">
                    <div className="flex items-center gap-3 sm:gap-4 pb-3">
                      <div className="w-11 h-11 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
                        <IdCard className="w-5 h-5 text-forest" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-stone-500 font-medium">Nama Lengkap</p>
                        <p className="font-bold text-forest truncate">{transactionData.identity.fullName || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-200">
                      <div>
                        <p className="text-xs text-stone-500 font-medium">Tipe Identitas</p>
                        <p className="font-bold text-stone-800 mt-0.5 capitalize">{idTypeLabel(transactionData.identity.idType)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 font-medium">Nomor Identitas</p>
                        <p className="font-bold text-stone-800 mt-0.5 break-all">{transactionData.identity.idNumber || '-'}</p>
                      </div>
                      {transactionData.identity.phone && (
                        <div>
                          <p className="text-xs text-stone-500 font-medium">No. Telepon</p>
                          <p className="font-bold text-stone-800 mt-0.5">{transactionData.identity.phone}</p>
                        </div>
                      )}
                      {transactionData.identity.address && (
                        <div>
                          <p className="text-xs text-stone-500 font-medium">Alamat</p>
                          <p className="font-bold text-stone-800 mt-0.5 break-words">{transactionData.identity.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

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
                      {transactionData?.payment?.method === "WhatsApp Konfirmasi"
                        ? "WhatsApp Konfirmasi"
                        : transactionData?.payment?.method === MANUAL_QRIS_METHOD
                          ? "QRIS Manual"
                          : "Pembayaran Online"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-stone-600 font-medium">Status Pembayaran</span>
                    <Badge className={`rounded-full text-xs font-medium ${(isWhatsAppBooking || isQrisManual) ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isWhatsAppBooking ? 'Menunggu Konfirmasi' : isQrisManual ? 'Menunggu Verifikasi' : 'Lunas'}
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
                      <h4 className="font-bold text-forest text-sm sm:text-base">Pengambilan</h4>
                      {transactionData?.pickupBranch ? (
                        <div className="text-xs sm:text-sm text-stone-600 font-medium mt-1 space-y-0.5">
                          <p>
                            Ambil di{" "}
                            <span className="font-bold text-forest">
                              {transactionData.pickupBranch.name}
                            </span>
                          </p>
                          {transactionData.returnBranch &&
                            transactionData.returnBranch.id !==
                              transactionData.pickupBranch.id && (
                              <p>
                                Kembalikan di{" "}
                                <span className="font-bold text-forest">
                                  {transactionData.returnBranch.name}
                                </span>
                              </p>
                            )}
                          <p className="text-stone-400">
                            {transactionData.pickupBranch.address}
                            {transactionData.pickupBranch.city
                              ? `, ${transactionData.pickupBranch.city}`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-stone-600 font-medium">
                          Koordinasi waktu dan tempat pengambilan
                        </p>
                      )}
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
