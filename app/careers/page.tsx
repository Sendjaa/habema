import { Metadata } from 'next'
import { Briefcase, Users, Target, Award, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Karir di HABEMA - Bergabung dengan Tim Kami',
  description: 'Temukan kesempatan karir di HABEMA dan bergabung dengan tim yang bersemangat dalam industri outdoor adventure.',
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2EDE4] to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1B4332] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Karir di <span className="text-emerald-400">HABEMA</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
              Bergabunglah dengan tim kami dan wujudkan passion Anda dalam industri outdoor
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Mengapa Bergabung dengan HABEMA?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kami lebih dari sekadar tempat kerja - kami adalah komunitas pecinta alam
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Misi Berarti</h3>
              <p className="text-gray-600">
                Dukung ribuan petualang untuk menjelajahi alam dengan aman dan nyaman
              </p>
            </div>

            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Tim Hebat</h3>
              <p className="text-gray-600">
                Bergabung dengan profesional yang bersemangat dan berpengalaman di industri outdoor
              </p>
            </div>

            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Berkembang Bersama</h3>
              <p className="text-gray-600">
                Peluang pengembangan karir dan training dalam industri outdoor adventure
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Posisi Tersedia
            </h2>
            <p className="text-xl text-gray-600">
              Temukan peran yang cocok dengan passion dan keahlian Anda
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">Outdoor Equipment Specialist</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Bandung
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      Full-time
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    Full-time
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Bertanggung jawab atas maintenance, quality control, dan customer service untuk peralatan outdoor. 
                Memiliki pengalaman di industri outdoor dan passion terhadap adventure equipment.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Customer Service</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Equipment Knowledge</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Outdoor Experience</span>
              </div>
              <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Lamar Sekarang
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">Digital Marketing Specialist</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Remote / Bandung
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      Full-time
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    Full-time
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Mengembangkan dan mengelola strategi digital marketing untuk meningkatkan brand awareness dan customer acquisition. 
                Pengalaman di industri e-commerce atau travel/outdoor diutamakan.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Digital Marketing</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Social Media</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">SEO/SEM</span>
              </div>
              <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Lamar Sekarang
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">Adventure Guide (Part-time)</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Various Locations
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Part-time
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Part-time
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Memandu outdoor activities dan memberikan pengalaman adventure terbaik untuk customers. 
                Sertifikasi first aid dan mountain guide diutamakan.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Adventure Guide</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">First Aid</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Mountaineering</span>
              </div>
              <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Lamar Sekarang
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Tidak menemukan posisi yang cocok?
            </p>
            <p className="text-lg text-[#1B4332] font-semibold mb-6">
              Kirim CV Anda ke <span className="text-emerald-600">careers@habema-outdoor.com</span>
            </p>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Budaya Kerja Kami
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nilai-nilai yang memandu setiap langkah kami
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🏔️</div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Adventure First</h3>
              <p className="text-gray-600 text-sm">
                Kami percaya pengalaman langsung di alam membuat kami lebih baik dalam melayani customer
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Team Collaboration</h3>
              <p className="text-gray-600 text-sm">
                Sukses kita diraih bersama dengan saling mendukung dan berbagi pengetahuan
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Sustainability</h3>
              <p className="text-gray-600 text-sm">
                Berkomitmen pada pelestarian alam dan pariwisata yang bertanggung jawab
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Continuous Growth</h3>
              <p className="text-gray-600 text-sm">
                Selalu belajar dan mengembangkan diri untuk memberikan layanan terbaik
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Bergabung dengan Tim HABEMA?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Mari wujudkan petualangan impian bersama ribuan customer kami
          </p>
          <button className="bg-white text-emerald-700 px-8 py-4 rounded-lg font-bold hover:bg-emerald-50 transition-colors">
            Lihat Semua Posisi
          </button>
        </div>
      </section>
    </div>
  )
}
