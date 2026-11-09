import { Metadata } from 'next'
import { Package, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian - HABEMA Outdoor',
  description: 'Kebijakan pengembalian peralatan outdoor HABEMA meliputi prosedur, jadwal, dan ketentuan pengembalian.',
}

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <RefreshCw className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Kebijakan <span className="text-emerald-400">Pengembalian</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Panduan lengkap pengembalian peralatan sewaan
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Return Schedule */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Clock className="w-6 h-6 text-emerald-600" />
                Jadwal Pengembalian
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Jam Operasional</h3>
                  <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-emerald-800">Senin - Jumat</p>
                        <p className="text-emerald-700">08:00 - 20:00</p>
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-800">Sabtu</p>
                        <p className="text-emerald-700">08:00 - 18:00</p>
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-800">Minggu</p>
                        <p className="text-emerald-700">09:00 - 16:00</p>
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-800">Hari Libur</p>
                        <p className="text-emerald-700">09:00 - 16:00</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    Pengembalian di luar jam operasional dapat diatur dengan konfirmasi terlebih dahulu.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Toleransi Keterlambatan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Grace Period:</strong> 30 menit tanpa biaya tambahan</li>
                    <li><strong>30 menit - 2 jam:</strong> 10% biaya sewa harian</li>
                    <li><strong>2 - 6 jam:</strong> 25% biaya sewa harian</li>
                    <li><strong>6 - 24 jam:</strong> 50% biaya sewa harian</li>
                    <li><strong>&gt;24 jam:</strong> 100% biaya sewa hari berikutnya</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Return Process */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Package className="w-6 h-6 text-emerald-600" />
                Proses Pengembalian
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Langkah 1: Persiapan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Bersihkan dan keringkan semua peralatan</li>
                    <li>Kumpulkan semua aksesoris dan komponen</li>
                    <li>Periksa kerusakan atau kekurangan</li>
                    <li>Siapkan dokumen penyewaan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Langkah 2: Inspeksi Bersama</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Datang ke basecamp sesuai jadwal</li>
                    <li>Inspeksi kondisi peralatan dengan tim kami</li>
                    <li>Dokumentasikan kondisi akhir</li>
                    <li>Tanda tangani berita acara pengembalian</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Langkah 3: Penyelesaian</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Proses biaya tambahan (jika ada)</li>
                    <li>Hitung pengembalian deposit</li>
                    <li>Lakukan pembayaran biaya tambahan</li>
                    <li>Terima pengembalian deposit</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Equipment Requirements */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                Persyaratan Pengembalian
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Kondisi Peralatan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Bersih:</strong> Bebas dari kotoran, lumpur, dan sisa makanan</li>
                    <li><strong>Kering:</strong> Tidak ada kelembaban yang dapat menyebabkan jamur</li>
                    <li><strong>Lengkap:</strong> Semua komponen dan aksesoris ada</li>
                    <li><strong>Fungsional:</strong> Tidak ada kerusakan baru selama penyewaan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Standar Kebersihan</h3>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <h4 className="font-semibold text-stone-900 mb-2">Contoh Standar:</h4>
                    <ul className="list-disc list-inside space-y-1 text-emerald-700 text-sm">
                      <li>Tenda: dilipat rapi, tidak ada noda atau bau</li>
                      <li>Sleeping bag: dicuci/dry clean, tidak ada noda</li>
                      <li>Cooking set: dibersihkan dari sisa makanan</li>
                      <li>Backpack: dikosongkan dari barang pribadi</li>
                      <li>Sepatu: dibersihkan dari lumpur dan kering</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Damage Assessment */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-emerald-600" />
                Penilaian Kerusakan
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Kategori Kerusakan</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Ringan</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Noda kecil yang bisa dibersihkan</li>
                        <li>• Geseran atau goresan ringan</li>
                        <li>• Komponen aus normal</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Berat</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Robek atau sobek besar</li>
                        <li>• Komponen patah atau hilang</li>
                        <li>• Kerusakan fungsi utama</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Proses Klaim</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Inspeksi bersama saat pengembalian</li>
                    <li>Dokumentasi foto/video kerusakan</li>
                    <li>Perhitungan biaya perbaikan/penggantian</li>
                    <li>Konfirmasi biaya kepada penyewa</li>
                    <li>Pemotongan deposit atau pembayaran tambahan</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Deposit Return */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Pengembalian Deposit</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Waktu Proses</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Transfer Bank:</strong> 1-2 hari kerja</li>
                    <li><strong>E-wallet:</strong> 1 hari kerja</li>
                    <li><strong>Tunai:</strong> Langsung di lokasi (jika tidak ada klaim)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Potensi Potongan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Biaya kebersihan (jika peralatan tidak bersih)</li>
                    <li>Biaya perbaikan kerusakan</li>
                    <li>Biaya penggantian komponen hilang</li>
                    <li>Denda keterlambatan</li>
                    <li>Biaya administrasi (maksimal 5% dari deposit)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Contoh Perhitungan</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Deposit: Rp 500.000</p>
                    <p>Biaya kebersihan: Rp 50.000</p>
                    <p>Kerusakan ringan: Rp 100.000</p>
                    <p>Total potongan: Rp 150.000</p>
                    <p className="font-semibold">Pengembalian: Rp 350.000</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Cases */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Kasus Khusus</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Pengembalian Dini</h3>
                  <p className="text-gray-700 mb-3">
                    Jika Anda mengembalikan peralatan lebih awal dari jadwal:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Tidak ada refund untuk hari yang tidak digunakan</li>
                    <li>Biaya administrasi pengembalian dini 10%</li>
                    <li>Dapat dipertimbangkan untuk force majeure</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Force Majeure</h3>
                  <p className="text-gray-700 mb-3">
                    Keterlambatan atau masalah karena force majeure:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Bencana alam, cuaca ekstrem, keadaan darurat</li>
                    <li>Wajib melampirkan bukti yang valid</li>
                    <li>Dapat dipertimbangkan untuk keringanan biaya</li>
                    <li>Keputusan final berada di pihak HABEMA</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Pengembalian via Kurir</h3>
                  <p className="text-gray-700 mb-3">
                    Untuk pengembalian jarak jauh:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Gunakan jasa kurir terpercaya dengan asuransi</li>
                    <li>Video dokumentasi saat packing</li>
                    <li>Biaya kurir ditanggung penyewa</li>
                    <li>Proses setelah barang diterima di basecamp</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Butuh Bantuan?</h2>
              <p className="text-gray-700 mb-6">
                Jika Anda memiliki pertanyaan tentang pengembalian peralatan:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-[#1B4332]">Support Line</p>
                  <p className="text-gray-700">+62 812 3456 7890</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1B4332]">Email</p>
                  <p className="text-gray-700">returns@habema-outdoor.com</p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-gray-600 mt-12">
              <p>Kebijakan Pengembalian ini terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
