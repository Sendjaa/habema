import { Metadata } from 'next'
import Image from 'next/image'
import { Mountain, Users, ShieldCheck, Leaf, Clock, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tentang HABEMA - Platform Sewa Peralatan Outdoor',
  description: 'Kenali lebih dekat HABEMA, platform penyewaan peralatan outdoor terpercaya untuk petualangan Anda di pegunungan dan alam bebas.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Tentang <span className="text-emerald-400">HABEMA</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Platform penyewaan peralatan outdoor terpercaya untuk mendukung petualangan Anda di alam bebas
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6">
                Cerita Kami
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="text-lg leading-relaxed">
                  HABEMA lahir dari kecintaan kami terhadap alam dan pengalaman bertahun-tahun dalam petualangan outdoor. 
                  Kami memahami betapa pentingnya peralatan yang berkualitas untuk keselamatan dan kenyamanan saat menjelajahi alam.
                </p>
                <p className="text-lg leading-relaxed">
                  Berawal dari komunitas kecil pecinta alam di Bandung, kini HABEMA telah menjadi platform penyewaan 
                  peralatan outdoor terpercaya yang membantu ribuan petualang mewujudkan mimpi mereka.
                </p>
                <p className="text-lg leading-relaxed">
                  Kami tidak hanya menyewakan peralatan, tetapi juga berbagi pengalaman, tips, dan pengetahuan untuk 
                  memastikan setiap petualangan Anda berjalan lancar dan aman.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl p-8">
                <div className="aspect-square bg-white/50 rounded-xl flex items-center justify-center">
                  <Mountain className="w-32 h-32 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Nilai-Nilai Kami
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Prinsip yang memandu setiap langkah kami dalam melayani Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Keamanan Utama</h3>
              <p className="text-gray-600">
                Semua peralatan kami melalui inspeksi ketat dan maintenance berkala untuk menjamin keamanan Anda.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Pelayanan Terbaik</h3>
              <p className="text-gray-600">
                Tim kami siap membantu Anda dengan pengalaman dan pengetahuan tentang peralatan outdoor.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                <Leaf className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Peduli Lingkungan</h3>
              <p className="text-gray-600">
                Kami mendukung pariwisata berkelanjutan dan edukasi tentang pelestarian alam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#1B4332] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">1000+</div>
              <div className="text-emerald-100">Pelanggan Puas</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">50+</div>
              <div className="text-emerald-100">Jenis Peralatan</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">5+</div>
              <div className="text-emerald-100">Tahun Pengalaman</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">24/7</div>
              <div className="text-emerald-100">Support Online</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Tim HABEMA
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berpengalaman dan siap mendukung petualangan Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Tim Expert</h3>
              <p className="text-gray-600">
                Berpengalaman dalam outdoor activities dan equipment handling
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Clock className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Support 24/7</h3>
              <p className="text-gray-600">
                Siap membantu Anda kapan saja selama petualangan berlangsung
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Star className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Quality Control</h3>
              <p className="text-gray-600">
                Memastikan semua peralatan dalam kondisi prima dan siap pakai
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Memulai Petualangan Anda?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Bergabunglah dengan ribuan petualang yang telah mempercayakan peralatannya kepada HABEMA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/catalog" 
              className="inline-block bg-white text-emerald-700 px-8 py-4 rounded-lg font-bold hover:bg-emerald-50 transition-colors"
            >
              Jelajahi Katalog
            </a>
            <a 
              href="/contact" 
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-emerald-700 transition-colors"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
