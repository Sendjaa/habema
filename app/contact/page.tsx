import { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from 'lucide-react'
import ContactForm from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Hubungi HABEMA - Kontak Kami',
  description: 'Hubungi tim HABEMA untuk pertanyaan, bantuan, atau informasi tentang penyewaan peralatan outdoor. Kami siap membantu petualangan Anda.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Hubungi <span className="text-emerald-400">HABEMA</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Kami siap membantu Anda menjawab pertanyaan dan memenuhi kebutuhan peralatan outdoor
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center group">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                <MapPin className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1B4332] mb-3">Alamat</h3>
              <p className="text-gray-600">
                <a href="https://maps.app.goo.gl/" target="_blank" rel="noopener noreferrer">
                  Jl. Cihanjuang No.71, Cihanjuang Rahayu, Kec. Parongpong, Kab. Bandung Barat, Jawa Barat 40559
                </a>
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                <Phone className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1B4332] mb-3">Telepon</h3>
              <p className="text-gray-600">
                +62 812 3456 7890<br />
                +62 22 1234 5678
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1B4332] mb-3">Email</h3>
              <p className="text-gray-600">
                info@habema-outdoor.com<br />
                support@habema-outdoor.com
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-[#1B4332] mb-8">
                Kirim Pesan
              </h2>
              <ContactForm />
            </div>

            {/* Operating Hours & Info */}
            <div>
              <h2 className="text-3xl font-bold text-[#1B4332] mb-8">
                Jam Operasional
              </h2>
              
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="font-semibold text-gray-700">Senin - Jumat</span>
                    <span className="text-emerald-600 font-bold">08:00 - 20:00</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="font-semibold text-gray-700">Sabtu</span>
                    <span className="text-emerald-600 font-bold">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Minggu</span>
                    <span className="text-emerald-600 font-bold">09:00 - 16:00</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Quick Response
                </h3>
                <p className="text-gray-700 mb-4">
                  Kami berkomitmen untuk merespons setiap pertanyaan Anda dalam waktu maksimal 2 jam 
                  selama jam operasional. Untuk keadaan darurat, silakan hubungi nomor telepon kami.
                </p>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Emergency Support:</strong>
                  </p>
                  <p className="text-emerald-600 font-bold">
                    +62 812 3456 7890 (24/7 untuk penyewa aktif)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1B4332] mb-4">
              Lokasi Kami
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kunjungi basecamp kami untuk melihat langsung koleksi peralatan outdoor terlengkap
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl p-8 aspect-video flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1B4332] mb-2">Basecamp Habema</h3>
              <p className="text-gray-700 mb-4">
                Jl. Outdoor Adventure No. 123, Bandung
              </p>
              <a 
                href="https://maps.google.com/?q=Basecamp+Habema+Bandung"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Buka di Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1B4332] mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xl text-gray-600">
              Jawaban untuk pertanyaan umum tentang layanan kami
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#1B4332] mb-3">
                Bagaimana cara menyewa peralatan?
              </h3>
              <p className="text-gray-600">
                Anda dapat menyewa melalui website kami, datang langsung ke basecamp, atau menghubungi 
                kami via telepon/WhatsApp. Pilih peralatan yang Anda butuhkan, tentukan durasi sewa, 
                dan lakukan pembayaran.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#1B4332] mb-3">
                Apakah peralatan sudah termasuk asuransi?
              </h3>
              <p className="text-gray-600">
                Ya, semua peralatan kami sudah dilindungi asuransi. Namun, penyewa tetap bertanggung 
                jawab atas kerusakan akibat kelalaian atau penggunaan yang tidak sesuai.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#1B4332] mb-3">
                Berapa lama proses peminjaman?
              </h3>
              <p className="text-gray-600">
                Proses peminjaman biasanya memakan waktu 15-30 menit. Kami akan melakukan pengecekan 
                peralatan bersama Anda dan memberikan pengarahan singkat tentang penggunaannya.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
