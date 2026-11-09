import { Metadata } from 'next'
import { FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - HABEMA Outdoor',
  description: 'Syarat dan ketentuan layanan penyewaan peralatan outdoor di HABEMA.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FileText className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Syarat & <span className="text-emerald-400">Ketentuan</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Ketentuan penggunaan layanan HABEMA Outdoor
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
                <FileText className="w-6 h-6 text-emerald-600" />
                Pendahuluan
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Selamat datang di HABEMA Outdoor. Syarat dan Ketentuan ini mengatur penggunaan layanan penyewaan peralatan outdoor yang kami sediakan. 
                Dengan menggunakan layanan kami, Anda setuju untuk terikat oleh ketentuan ini.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Harap membaca dengan seksama sebelum menggunakan layanan kami.
              </p>
            </div>

            {/* Definitions */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Definisi</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <strong>"HABEMA"</strong> merujuk pada Habema Outdoor Adventure, penyedia layanan penyewaan peralatan.
                </div>
                <div>
                  <strong>"Pengguna/Penyewa"</strong> merujuk pada individu atau entitas yang menggunakan layanan penyewaan kami.
                </div>
                <div>
                  <strong>"Peralatan"</strong> merujuk pada semua barang yang disewakan melalui platform kami.
                </div>
                <div>
                  <strong>"Layanan"</strong> merujuk pada seluruh layanan penyewaan dan pendukung yang kami sediakan.
                </div>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-600" />
                Kewajiban Pengguna
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Informasi Akurat</h3>
                  <p className="text-gray-700">
                    Anda wajib memberikan informasi yang akurat, lengkap, dan terkini saat registrasi dan penyewaan. 
                    Informasi palsu dapat menyebabkan pembatalan layanan.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Penggunaan Peralatan</h3>
                  <p className="text-gray-700 mb-3">
                    Anda setuju untuk:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Menggunakan peralatan sesuai tujuan dan petunjuk penggunaan</li>
                    <li>Merawat peralatan dengan baik selama masa sewa</li>
                    <li>Tidak memodifikasi atau mengubah peralatan</li>
                    <li>Tidak memindahkan hak kepemilikan atau menyewakan kembali</li>
                    <li>Melaporkan kerusakan atau masalah segera</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Keamanan dan Keselamatan</h3>
                  <p className="text-gray-700">
                    Anda bertanggung jawab atas keselamatan diri sendiri dan orang lain saat menggunakan peralatan. 
                    Kami menyarankan untuk memiliki asuransi pribadi dan mengikuti prosedur keselamatan yang berlaku.
                  </p>
                </div>
              </div>
            </div>

            {/* Rental Terms */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Ketentuan Penyewaan</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Durasi dan Jadwal</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Minimal sewa: 1 hari (24 jam)</li>
                    <li>Maksimal sewa: 30 hari</li>
                    <li>Waktu pengambilan dan pengembalian sesuai kesepakatan</li>
                    <li>Keterlambatan akan dikenakan biaya tambahan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Pembayaran dan Deposit</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Pembayaran penuh dilakukan sebelum pengambilan peralatan</li>
                    <li>Deposit wajib dibayarkan dan akan dikembalikan setelah pengembalian</li>
                    <li>Deposit akan dipotong untuk biaya kerusakan atau kehilangan</li>
                    <li>Metode pembayaran sesuai yang tersedia di platform</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Pembatalan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>&gt;7 hari sebelum: Full refund</li>
                    <li>3-6 hari sebelum: 50% refund</li>
                    <li>&lt;3 hari sebelum: No refund (kecuali force majeure)</li>
                    <li>Force majeure: refund sesuai kondisi dan kebijakan</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Liability */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-emerald-600" />
                Tanggung Jawab dan Kewajiban
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Tanggung Jawab HABEMA</h3>
                  <p className="text-gray-700 mb-3">
                    Kami bertanggung jawab untuk:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Menyediakan peralatan dalam kondisi baik dan aman</li>
                    <li>Memberikan petunjuk penggunaan yang jelas</li>
                    <li>Memberikan support teknis selama masa sewa</li>
                    <li>Melakukan maintenance berkala pada semua peralatan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Batasan Tanggung Jawab</h3>
                  <p className="text-gray-700 mb-3">
                    HABEMA tidak bertanggung jawab untuk:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Kecelakaan atau cedera akibat penggunaan peralatan</li>
                    <li>Kehilangan barang pribadi selama aktivitas</li>
                    <li>Kerusakan akibat kelalaian atau penyalahgunaan</li>
                    <li>Force majeure (bencana alam, cuaca buruk, dll)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Hak Kekayaan Intelektual</h2>
              <p className="text-gray-700 leading-relaxed">
                Semua konten di platform HABEMA termasuk namun tidak terbatas pada logo, desain, teks, gambar, dan software 
                dilindungi oleh hak kekayaan intelektual. Anda tidak diperbolehkan menggunakan, menyalin, atau mendistribusikan 
                konten tanpa izin tertulis dari HABEMA.
              </p>
            </div>

            {/* Privacy */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Privasi</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kami menghormati privasi Anda dan berkomitmen untuk melindungi data pribadi sesuai dengan Kebijakan Privasi kami. 
                Dengan menggunakan layanan kami, Anda setuju dengan pengumpulan dan penggunaan data sesuai kebijakan tersebut.
              </p>
              <p className="text-gray-700">
                Untuk informasi lengkap, silakan lihat <a href="/privacy" className="text-emerald-600 hover:underline">Kebijakan Privasi</a> kami.
              </p>
            </div>

            {/* Dispute Resolution */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Penyelesaian Sengketa</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Jika terjadi sengketa, kami akan berusaha menyelesaikannya melalui:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Negosiasi:</strong> Diskusi langsung antara kedua belah pihak</li>
                  <li><strong>Mediasi:</strong> Menggunakan pihak ketiga netral jika diperlukan</li>
                  <li><strong>Hukum:</strong> Penyelesaian melalui pengadilan jika tidak mencapai kesepakatan</li>
                </ol>
                <p>
                  Sengketa akan diselesaikan sesuai hukum yang berlaku di Republik Indonesia.
                </p>
              </div>
            </div>

            {/* Changes */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                Perubahan Ketentuan
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Kami berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui website atau email. 
                Penggunaan layanan setelah perubahan berarti Anda setuju dengan ketentuan yang baru.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Hubungi Kami</h2>
              <p className="text-gray-700 mb-6">
                Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> legal@habema-outdoor.com</p>
                <p><strong>Telepon:</strong> +62 812 3456 7890</p>
                <p><strong>Alamat:</strong> Jl. Outdoor Adventure No. 123, Bandung</p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-gray-600 mt-12">
              <p>Syarat dan Ketentuan ini terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
