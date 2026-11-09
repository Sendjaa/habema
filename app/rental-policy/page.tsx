import { Metadata } from 'next'
import { Package, Clock, ShieldCheck, AlertTriangle, CheckCircle, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kebijakan Sewa - HABEMA Outdoor',
  description: 'Kebijakan penyewaan peralatan outdoor HABEMA meliputi syarat, prosedur, dan ketentuan penyewaan.',
}

export default function RentalPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Package className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Kebijakan <span className="text-emerald-400">Sewa</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Panduan lengkap penyewaan peralatan outdoor di HABEMA
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Eligibility */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-emerald-600" />
                Kelayakan Penyewa
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Persyaratan Umum</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Minimal usia 17 tahun (dengan persetujuan orang tua untuk 17-18 tahun)</li>
                    <li>Memiliki identitas yang valid (KTP/SIM/Paspor)</li>
                    <li>Mengisi form pendaftaran secara lengkap dan jujur</li>
                    <li>Menyetujui syarat dan ketentuan penyewaan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Dokumen yang Diperlukan</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Fotokopi identitas (KTP/SIM/Paspor)</li>
                    <li>Kartu keluarga (untuk penyewa di bawah 20 tahun)</li>
                    <li>Surat izin orang tua (untuk penyewa 17-18 tahun)</li>
                    <li>Kontak darurat yang dapat dihubungi</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Rental Process */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <Clock className="w-6 h-6 text-emerald-600" />
                Proses Penyewaan
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Langkah 1: Reservasi</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Pilih peralatan yang diinginkan melalui website atau langsung di basecamp</li>
                    <li>Tentukan tanggal dan durasi penyewaan</li>
                    <li>Lakukan pembayaran uang muka (minimal 30%)</li>
                    <li>Terima konfirmasi reservasi via email/WhatsApp</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Langkah 2: Persiapan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Lunasi pembayaran sisa sebelum pengambilan</li>
                    <li>Siapkan dokumen identitas asli</li>
                    <li>Bayar deposit (sesuai ketentuan peralatan)</li>
                    <li>Ikuti briefing penggunaan peralatan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Langkah 3: Pengambilan</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Tiba di basecamp sesuai jadwal</li>
                    <li>Periksa kondisi peralatan bersama tim kami</li>
                    <li>Tanda tangani berita acara serah terima</li>
                    <li>Dapatkan kontak support selama penyewaan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Langkah 4: Pengembalian</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Kembalikan peralatan sesuai jadwal</li>
                    <li>Periksa kondisi peralatan bersama</li>
                    <li>Selesaikan administrasi pengembalian</li>
                    <li>Terima pengembalian deposit (jika tidak ada kerusakan)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Equipment Care */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                Perawatan Peralatan
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Selama Penyewaan</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Gunakan peralatan sesuai fungsi dan petunjuk</li>
                    <li>Jaga kebersihan dan keringkan setelah penggunaan</li>
                    <li>Simpan di tempat aman dan kering</li>
                    <li>Laporkan masalah atau kerusakan segera</li>
                    <li>Jangan memodifikasi atau mengubah peralatan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Yang Tidak Diperbolehkan</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Menyewakan kembali peralatan kepada pihak lain</li>
                    <li>Menggunakan untuk kegiatan ilegal atau berbahaya</li>
                    <li>Membawa peralatan keluar negeri tanpa izin</li>
                    <li>Melepas atau menghilangkan merek/label peralatan</li>
                    <li>Menggunakan peralatan di luar kapasitasnya</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Damage Policy */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-emerald-600" />
                Kebijakan Kerusakan dan Kehilangan
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Kerusakan Ringan</h3>
                  <p className="text-gray-700 mb-3">
                    Kerusakan yang dapat diperbaiki dan tidak mengganggu fungsi utama:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Biaya perbaikan ditanggung penyewa</li>
                    <li>Maksimal 20% dari harga sewa per hari</li>
                    <li>Deposit akan dipotong sesuai biaya perbaikan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Kerusakan Berat</h3>
                  <p className="text-gray-700 mb-3">
                    Kerusakan yang membuat peralatan tidak dapat digunakan:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Ganti rugi 50-100% harga peralatan (sesuai depresiasi)</li>
                    <li>Deposit hangus dan biaya tambahan mungkin berlaku</li>
                    <li>Biaya kehilangan penggunaan selama perbaikan</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Kehilangan</h3>
                  <p className="text-gray-700 mb-3">
                    Jika peralatan hilang:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Ganti rugi 100% harga peralatan (sesuai depresiasi)</li>
                    <li>Deposit hangus sepenuhnya</li>
                    <li>Biaya administrasi tambahan 10%</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4">
                  <h4 className="font-semibold text-stone-900 mb-2">Depresiasi Peralatan</h4>
                  <p className="text-emerald-700 text-sm">
                    Tahun 1: 80% | Tahun 2: 60% | Tahun 3: 40% | Tahun 4: 20% | Tahun 5+: 10%
                  </p>
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                Asuransi Opsional
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <p>
                  Kami menawarkan asuransi perlindungan peralatan dengan coverage:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Coverage:</strong> 90% biaya kerusakan dan kehilangan</li>
                  <li><strong>Premi:</strong> 5-10% dari total biaya sewa (tergantung jenis peralatan)</li>
                  <li><strong>Klaim:</strong> Maksimal 2 kali per tahun</li>
                  <li><strong>Ekslusi:</strong> Kerusakan akibat kelalaian berat, penyalahgunaan, atau kegiatan ilegal</li>
                </ul>
                
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Manfaat Asuransi</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Perlindungan dari biaya tak terduga</li>
                    <li>Peace of mind selama petualangan</li>
                    <li>Proses klaim yang mudah dan cepat</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Late Return */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Kebijakan Keterlambatan</h2>
              
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Biaya Keterlambatan</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>1-6 jam:</strong> 10% dari harga sewa per hari</li>
                    <li><strong>6-24 jam:</strong> 50% dari harga sewa per hari</li>
                    <li><strong>&gt;24 jam:</strong> 100% harga sewa hari berikutnya</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">Force Majeure</h3>
                  <p className="text-gray-700">
                    Keterlambatan karena force majeure (bencana alam, cuaca ekstrem, keadaan darurat) 
                    dapat dipertimbangkan untuk keringanan biaya dengan melampirkan bukti yang valid.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Butuh Bantuan?</h2>
              <p className="text-gray-700 mb-6">
                Tim kami siap membantu Anda dengan pertanyaan tentang kebijakan sewa:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-[#1B4332]">Support Line</p>
                  <p className="text-gray-700">+62 812 3456 7890 (24/7 untuk penyewa)</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1B4332]">Email</p>
                  <p className="text-gray-700">support@habema-outdoor.com</p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-gray-600 mt-12">
              <p>Kebijakan Sewa ini terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
