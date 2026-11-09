import { Metadata } from 'next'
import { Shield, Eye, Lock, Database, UserCheck, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - HABEMA Outdoor',
  description: 'Kebijakan privasi HABEMA Outdoor mengenai pengumpulan, penggunaan, dan perlindungan data pribadi pelanggan.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Kebijakan <span className="text-emerald-400">Privasi</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Komitmen kami dalam melindungi data pribadi Anda
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Eye className="w-6 h-6 text-emerald-600" />
                Pendahuluan
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Di HABEMA Outdoor, kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda percayakan kepada kami. 
                Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, melindungi, dan membagi informasi pribadi Anda.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Dengan menggunakan layanan kami, Anda menyetujui praktik-praktik yang dijelaskan dalam kebijakan ini.
              </p>
            </div>

            {/* Data Collection */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-emerald-600" />
                Data yang Kami Kumpulkan
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Informasi Pribadi</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Nama lengkap dan alamat email</li>
                    <li>Nomor telepon dan alamat lengkap</li>
                    <li>Informasi identifikasi (KTP/SIM)</li>
                    <li>Informasi pembayaran dan penagihan</li>
                    <li>Informasi kontak darurat</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Data Penggunaan Layanan</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Riwayat penyewaan dan preferensi</li>
                    <li>Feedback dan rating layanan</li>
                    <li>Interaksi dengan website dan aplikasi</li>
                    <li>Data lokasi (jika diizinkan)</li>
                    <li>Informasi perangkat dan browser</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Data Teknis</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>IP address dan cookies</li>
                    <li>Data analytics dan penggunaan website</li>
                    <li>Log akses dan aktivitas sistem</li>
                    <li>Informasi crash dan error reports</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Usage */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-600" />
                Penggunaan Data
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <p>Kami menggunakan data pribadi Anda untuk:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Penyediaan Layanan:</strong> Memproses penyewaan, reservasi, dan transaksi</li>
                  <li><strong>Komunikasi:</strong> Mengirim konfirmasi, reminder, dan informasi penting</li>
                  <li><strong>Personalisasi:</strong> Menyesuaikan pengalaman dan rekomendasi produk</li>
                  <li><strong>Keamanan:</strong> Verifikasi identitas dan mencegah penipuan</li>
                  <li><strong>Improvement:</strong> Menganalisis pola penggunaan untuk meningkatkan layanan</li>
                  <li><strong>Marketing:</strong> Mengirim informasi promosi (dengan persetujuan)</li>
                  <li><strong>Legal Compliance:</strong> Memenuhi kewajiban hukum dan peraturan</li>
                </ul>
              </div>
            </div>

            {/* Data Protection */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-emerald-600" />
                Perlindungan Data
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <p>
                  Kami melindungi data Anda dengan:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Enkripsi:</strong> Data sensitif dienkripsi saat transit dan penyimpanan</li>
                  <li><strong>Access Control:</strong> Akses terbatas untuk authorized personnel</li>
                  <li><strong>Regular Audits:</strong> Pemeriksaan keamanan berkala</li>
                  <li><strong>Secure Infrastructure:</strong> Server dengan standard keamanan tinggi</li>
                  <li><strong>Data Minimization:</strong> Hanya mengumpulkan data yang diperlukan</li>
                </ul>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-emerald-600" />
                Pembagian Data
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <p>
                  Kami tidak menjual data pribadi Anda. Kami hanya membagi data dengan:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Payment Providers:</strong> Untuk memproses transaksi pembayaran</li>
                  <li><strong>Shipping Partners:</strong> Untuk pengiriman peralatan</li>
                  <li><strong>Legal Authorities:</strong> Jika diwajibkan oleh hukum</li>
                  <li><strong>Service Providers:</strong> Pihak ketiga yang membantu operasional</li>
                </ul>
                <p className="font-semibold">
                  Semua pihak ketiga terikat dengan perjanjian kerahasiaan dan kepatuhan privasi.
                </p>
              </div>
            </div>

            {/* User Rights */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Hak Anda sebagai Pengguna</h2>
              
              <div className="space-y-4 text-gray-700">
                <p>Anda memiliki hak untuk:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Mengakses:</strong> Melihat data pribadi yang kami simpan</li>
                  <li><strong>Mengoreksi:</strong> Memperbaiki data yang tidak akurat</li>
                  <li><strong>Menghapus:</strong> Meminta penghapusan data pribadi</li>
                  <li><strong>Membatasi:</strong> Membatasi pemrosesan data tertentu</li>
                  <li><strong>Menolak:</strong> Menolak pemrosesan untuk marketing</li>
                  <li><strong>Portabilitas:</strong> Memindahkan data ke layanan lain</li>
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Hubungi Kami</h2>
              <p className="text-gray-700 mb-6">
                Jika Anda memiliki pertanyaan tentang kebijakan privasi atau ingin menggunakan hak Anda, silakan hubungi:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@habema-outdoor.com</p>
                <p><strong>Telepon:</strong> +62 812 3456 7890</p>
                <p><strong>Alamat:</strong> Jl. Outdoor Adventure No. 123, Bandung</p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-gray-600 mt-12">
              <p>Kebijakan Privasi ini terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
