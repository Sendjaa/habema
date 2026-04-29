import { Metadata } from 'next'
import { HelpCircle, Clock, ShieldCheck, Package, Users, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ - Tanya Jawab HABEMA',
  description: 'Temukan jawaban untuk pertanyaan umum tentang penyewaan peralatan outdoor di HABEMA.',
}

export default function FAQPage() {
  const faqs = [
    {
      category: "Penyewaan Umum",
      icon: <Package className="w-6 h-6" />,
      questions: [
        {
          q: "Bagaimana cara menyewa peralatan di HABEMA?",
          a: "Anda bisa menyewa melalui website kami, datang langsung ke basecamp, atau menghubungi via telepon/WhatsApp. Pilih peralatan, tentukan durasi, lakukan pembayaran, dan ambil peralatan sesuai jadwal."
        },
        {
          q: "Apa saja persyaratan untuk menyewa?",
          a: "Anda perlu KTP/SIM untuk identifikasi, deposit (bisa jaminan atau uang tunai), dan mengisi form penyewaan. Untuk pendaki di bawah 17 tahun, perlu orang tua/wali."
        },
        {
          q: "Berapa lama minimal dan maksimal penyewaan?",
          a: "Minimal 1 hari, maksimal 30 hari. Untuk penyewaan lebih dari 7 hari, kami berikan diskon khusus."
        },
        {
          q: "Apakah ada biaya tambahan selain harga sewa?",
          a: "Harga sewa sudah termasuk maintenance dasar. Biaya tambahan mungkin berlaku untuk asuransi opsional, pengiriman, atau kerusakan akibat kelalaian."
        }
      ]
    },
    {
      category: "Peralatan & Kualitas",
      icon: <ShieldCheck className="w-6 h-6" />,
      questions: [
        {
          q: "Apakah peralatan yang disewakan berkualitas dan aman?",
          a: "Ya, semua peralatan melalui quality control ketat, maintenance berkala, dan sesuai standar safety. Kami juga menyediakan pengarahan penggunaan."
        },
        {
          q: "Bagaimana jika peralatan rusak saat digunakan?",
          a: "Kami menyediakan support 24/7 untuk penyewa aktif. Untuk kerusakan teknis, kami akan bantu mencarikan pengganti atau solusi alternatif."
        },
        {
          q: "Apakah peralatan sudah termasuk aksesoris lengkap?",
          a: "Ya, setiap peralatan disewakan dengan aksesoris standar lengkap. Misalnya tenda dengan pasak dan tali, sleeping bag dengan compression sack, dll."
        },
        {
          q: "Bisakah saya mencoba peralatan sebelum menyewa?",
          a: "Tentu! Kami menyediakan area test di basecamp. Anda bisa mencoba setup tenda, mencocokan carrier, dll sebelum memutuskan menyewa."
        }
      ]
    },
    {
      category: "Pembayaran & Deposit",
      icon: <CreditCard className="w-6 h-6" />,
      questions: [
        {
          q: "Metode pembayaran apa saja yang diterima?",
          a: "Kami menerima transfer bank, e-wallet (OVO, GoPay, Dana), kartu kredit/debit, dan pembayaran langsung di basecamp."
        },
        {
          q: "Berapa besar deposit yang diperlukan?",
          a: "Deposit bervariasi tergantung jenis dan nilai peralatan, biasanya 20-50% dari harga sewa. Deposit akan dikembalikan setelah peralatan dikembalikan dalam kondisi baik."
        },
        {
          q: "Apakah ada sistem cicilan?",
          a: "Ya, kami bekerja sama dengan beberapa fintech untuk menyediakan opsi cicilan 0% untuk penyewaan minimal 3 hari dengan nilai tertentu."
        },
        {
          q: "Bagaimana kebijakan pembatalan?",
          a: "Pembatalan 7+ hari sebelum: full refund. 3-6 hari: 50% refund. Kurang dari 3 hari: tidak ada refund, kecuali untuk force majeure."
        }
      ]
    },
    {
      category: "Pengembalian & Late Fee",
      icon: <Clock className="w-6 h-6" />,
      questions: [
        {
          q: "Kapan harus mengembalikan peralatan?",
          a: "Pengembalian sesuai jam yang disepakati. Biasanya hari yang sama untuk sewa harian, atau sesuai kesepakatan untuk sewa multi-hari."
        },
        {
          q: "Apakah ada denda untuk keterlambatan?",
          a: "Ya, ada denda keterlambatan 10% per hari dari harga sewa. Keterlambatan lebih dari 24 jam akan dikenakan biaya sewa penuh hari berikutnya."
        },
        {
          q: "Bagaimana proses pengembalian deposit?",
          a: "Deposit dikembalikan setelah peralatan diperiksa dan dinyatakan dalam kondisi baik. Proses 1-2 hari kerja untuk transfer bank."
        },
        {
          q: "Apa yang terjadi jika peralatan hilang?",
          a: "Kehilangan peralatan akan diganti dengan nilai sesuai harga pasar setelah depresiasi. Kami sarankan untuk mengambil asuransi opsional."
        }
      ]
    },
    {
      category: "Layanan Tambahan",
      icon: <Users className="w-6 h-6" />,
      questions: [
        {
          q: "Apakah HABEMA menyediakan jasa guide?",
          a: "Ya, kami memiliki team guide berpengalaman dan tersertifikasi. Bisa disewa untuk berbagai aktivitas outdoor dengan biaya terpisah."
        },
        {
          q: "Apakah ada layanan pengiriman peralatan?",
          a: "Ya, kami melayani pengiriman ke lokasi tertentu di area Bandung dan sekitarnya dengan biaya tambahan."
        },
        {
          q: "Bisakah konsultasi sebelum menyewa?",
          a: "Tentu! Tim kami siap memberikan konsultasi gratis tentang pemilihan peralatan yang sesuai dengan kebutuhan Anda."
        },
        {
          q: "Apakah ada program membership?",
          a: "Ya, kami memiliki membership program dengan benefits seperti diskon khusus, prioritas booking, dan akses ke equipment premium."
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Pusat Bantuan <span className="text-emerald-400">HABEMA</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Temukan jawaban untuk pertanyaan umum tentang layanan kami
            </p>
          </div>
        </div>
      </section>

      {/* Quick Help */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1B4332] mb-2">100+ Items</h3>
              <p className="text-gray-600 text-sm">Peralatan outdoor tersedia</p>
            </div>
            <div className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1B4332] mb-2">1000+ Customers</h3>
              <p className="text-gray-600 text-sm">Puas dengan layanan kami</p>
            </div>
            <div className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1B4332] mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Bantuan saat petualangan</p>
            </div>
            <div className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1B4332] mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600 text-sm">Peralatan terjamin kualitasnya</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center text-emerald-600">
                  {category.icon}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1B4332]">
                  {category.category}
                </h2>
              </div>

              <div className="space-y-6">
                {category.questions.map((faq, faqIndex) => (
                  <details key={faqIndex} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <summary className="cursor-pointer p-6 hover:bg-emerald-50 transition-colors flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#1B4332] pr-4">
                        {faq.q}
                      </h3>
                      <div className="w-6 h-6 rounded-full border-2 border-emerald-600 flex items-center justify-center group-open:rotate-180 transition-transform">
                        <div className="w-2 h-2 border-emerald-600 border-t-2 border-r-2 transform rotate-45 -translate-y-0.5 translate-x-0.5"></div>
                      </div>
                    </summary>
                    <div className="px-6 pb-6">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#1B4332] mb-6">
            Masih Butuh Bantuan?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Tim kami siap membantu menjawab pertanyaan Anda
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-emerald-50 rounded-xl p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1B4332] mb-2">Live Chat</h3>
              <p className="text-gray-600 text-sm mb-4">
                Chat langsung dengan tim support kami
              </p>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                Mulai Chat
              </button>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1B4332] mb-2">Telepon</h3>
              <p className="text-gray-600 text-sm mb-4">
                Hubungi +62 812 3456 7890
              </p>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                Hubungi Sekarang
              </button>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1B4332] mb-2">Kunjungi Basecamp</h3>
              <p className="text-gray-600 text-sm mb-4">
                Konsultasi langsung di lokasi
              </p>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                Lihat Lokasi
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">
              Tidak Menemukan Jawaban?
            </h3>
            <p className="text-emerald-100 mb-6">
              Kirim pertanyaan Anda dan kami akan merespons dalam 2 jam
            </p>
            <a 
              href="/contact"
              className="inline-block bg-white text-emerald-700 px-8 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-colors"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
