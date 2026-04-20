// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { ArrowRight, MapPin, Thermometer, AlertTriangle } from 'lucide-react'

// type MountainDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

// interface MountainRecommendation {
//   name: string
//   difficulty: MountainDifficulty
//   altitude: string
//   temperature: string
//   icon: string
//   requiredGear: string[]
//   tips: string[]
// }

// const mountainRecommendations: MountainRecommendation[] = [
//   {
//     name: 'Gunung Salak',
//     difficulty: 'beginner',
//     altitude: '2.211 mdpl',
//     temperature: '10-20°C',
//     icon: '🏔️',
//     requiredGear: [
//       'Tenda',
//       'Sleeping Bag',
//       'Backpack',
//       'Cooking Kit',
//       'Headlamp',
//       'Trekking Poles',
//     ],
//     tips: [
//       'Trek mudah cocok untuk pemula',
//       'Layak dalam 1-2 hari',
//       'Air tersedia di sepanjang trek',
//     ],
//   },
//   {
//     name: 'Gunung Gede Pangrango',
//     difficulty: 'intermediate',
//     altitude: '3.019 mdpl',
//     temperature: '5-15°C',
//     icon: '⛰️',
//     requiredGear: [
//       'Tenda 4P',
//       'Sleeping Bag',
//       'Backpack 60L',
//       'Cooking Kit',
//       'Headlamp',
//       'Trekking Poles',
//     ],
//     tips: [
//       'Trek menengah, butuh persiapan baik',
//       'Cuaca bisa berubah drastis',
//       'Mulai trek pagi hari',
//     ],
//   },
//   {
//     name: 'Gunung Kerinci',
//     difficulty: 'advanced',
//     altitude: '3.805 mdpl',
//     temperature: '0-10°C',
//     icon: '🏔️',
//     requiredGear: [
//       'Tenda 4P',
//       'Sleeping Bag (-5°C)',
//       'Backpack 70L',
//       'Cooking Kit',
//       'Headlamp',
//       'Climbing Gear',
//       'Extreme Cold Gear',
//     ],
//     tips: [
//       'Trek cukup berat, butuh kondisi prima',
//       'Cuaca sangat dingin di puncak',
//       'Diperlukan pemandu lokal',
//     ],
//   },
//   {
//     name: 'Gunung Puncak Jaya',
//     difficulty: 'expert',
//     altitude: '4.884 mdpl',
//     temperature: '-5-5°C',
//     icon: '⛏️',
//     requiredGear: [
//       'Tenda 2P',
//       'Sleeping Bag Extreme (-10°C)',
//       'Backpack 70L',
//       'Cooking Kit',
//       'Headlamp',
//       'Climbing Gear',
//       'Ice Axe',
//       'Crampons',
//     ],
//     tips: [
//       'Trek paling sulit di Indonesia',
//       'Kondisi ekstrem, butuh pengalaman bertahun-tahun',
//       'Pemandu profesional sangat diperlukan',
//       'Musim pendakian terbatas (Juni-Oktober)',
//     ],
//   },
// ]

// export default function RecommendationsPage() {
//   const [selectedMountain, setSelectedMountain] = useState<MountainRecommendation | null>(null)

//   const getDifficultyColor = (difficulty: MountainDifficulty) => {
//     const colors = {
//       beginner: 'bg-green-100 text-green-800',
//       intermediate: 'bg-yellow-100 text-yellow-800',
//       advanced: 'bg-orange-100 text-orange-800',
//       expert: 'bg-red-100 text-red-800',
//     }
//     return colors[difficulty]
//   }

//   const getDifficultyLabel = (difficulty: MountainDifficulty) => {
//     const labels = {
//       beginner: '🌱 Pemula',
//       intermediate: '⛺ Menengah',
//       advanced: '🏔️ Lanjut',
//       expert: '⛏️ Ahli',
//     }
//     return labels[difficulty]
//   }

//   const getRecommendedEquipment = (difficulty: MountainDifficulty) => {
//     return mockEquipment.filter((gear) =>
//       gear.recommended_mountains?.includes(difficulty)
//     )
//   }

//   return (
//     <div className="min-h-screen bg-cream">
//       {/* Header */}
//       <div className="bg-forest text-cream py-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <h1 className="text-4xl md:text-5xl font-bold mb-4">
//             Rekomendasi Peralatan Berdasarkan Lokasi
//           </h1>
//           <p className="text-lg text-cream/90">
//             Pilih gunung impian Anda, dan kami rekomendasikan perlengkapan yang tepat
//           </p>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Left: Mountain List */}
//           <div className="lg:col-span-1 space-y-4">
//             <h2 className="text-2xl font-bold text-forest mb-6">Pilihan Gunung</h2>
//             {mountainRecommendations.map((mountain) => (
//               <Card
//                 key={mountain.name}
//                 className={`p-4 cursor-pointer transition-all border-2 ${
//                   selectedMountain?.name === mountain.name
//                     ? 'border-primary bg-primary/5'
//                     : 'border-border hover:border-primary/50'
//                 }`}
//                 onClick={() => setSelectedMountain(mountain)}
//               >
//                 <div className="flex items-start gap-3">
//                   <span className="text-3xl">{mountain.icon}</span>
//                   <div className="flex-1">
//                     <h3 className="font-bold text-forest">{mountain.name}</h3>
//                     <Badge className={`${getDifficultyColor(mountain.difficulty)} mt-2`}>
//                       {getDifficultyLabel(mountain.difficulty)}
//                     </Badge>
//                     <p className="text-xs text-muted-foreground mt-2">
//                       {mountain.altitude} • {mountain.temperature}
//                     </p>
//                   </div>
//                 </div>
//               </Card>
//             ))}
//           </div>

//           {/* Right: Details & Recommendations */}
//           <div className="lg:col-span-2 space-y-6">
//             {selectedMountain ? (
//               <>
//                 {/* Mountain Header */}
//                 <Card className="p-6 bg-gradient-to-r from-forest to-forest-light text-cream border-none">
//                   <div className="flex items-start justify-between mb-6">
//                     <div>
//                       <h2 className="text-4xl font-bold mb-2">
//                         {selectedMountain.name}
//                       </h2>
//                       <Badge className="bg-gold text-forest">
//                         {getDifficultyLabel(selectedMountain.difficulty)}
//                       </Badge>
//                     </div>
//                     <span className="text-6xl opacity-30">{selectedMountain.icon}</span>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="flex items-center gap-2 mb-1">
//                         <MapPin className="w-4 h-4" />
//                         <span className="text-sm">Ketinggian</span>
//                       </div>
//                       <p className="font-bold text-lg">
//                         {selectedMountain.altitude}
//                       </p>
//                     </div>
//                     <div>
//                       <div className="flex items-center gap-2 mb-1">
//                         <Thermometer className="w-4 h-4" />
//                         <span className="text-sm">Suhu</span>
//                       </div>
//                       <p className="font-bold text-lg">
//                         {selectedMountain.temperature}
//                       </p>
//                     </div>
//                   </div>
//                 </Card>

//                 {/* Tips */}
//                 <Card className="p-6 bg-blue-50 border-blue-200">
//                   <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
//                     <span>💡</span>
//                     Tips Pendakian
//                   </h3>
//                   <ul className="space-y-2">
//                     {selectedMountain.tips.map((tip, idx) => (
//                       <li
//                         key={idx}
//                         className="text-sm text-blue-800 flex items-start gap-2"
//                       >
//                         <span className="text-blue-600 flex-shrink-0">✓</span>
//                         <span>{tip}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </Card>

//                 {/* Required Equipment */}
//                 <div>
//                   <h3 className="text-2xl font-bold text-forest mb-4">
//                     Perlengkapan yang Direkomendasikan
//                   </h3>

//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     {selectedMountain.requiredGear.map((gearName) => {
//                       const gear = mockEquipment.find(
//                         (e) =>
//                           e.name.toLowerCase().includes(gearName.toLowerCase()) ||
//                           gearName.toLowerCase().includes(e.name.toLowerCase())
//                       )

//                       return (
//                         <Card
//                           key={gearName}
//                           className={`p-4 border-2 transition-all ${
//                             gear
//                               ? 'border-gold/50 hover:border-gold cursor-pointer'
//                               : 'border-border opacity-50'
//                           }`}
//                           onClick={() =>
//                             gear && window.location.replace(`/product/${gear.id}`)
//                           }
//                         >
//                           <div className="flex items-start justify-between mb-2">
//                             <h4 className="font-bold text-forest">{gearName}</h4>
//                             {gear && (
//                               <span className="text-gold font-semibold text-sm">
//                                 ✓
//                               </span>
//                             )}
//                           </div>

//                           {gear ? (
//                             <>
//                               <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
//                                 {gear.description}
//                               </p>
//                               <div className="flex justify-between items-center">
//                                 <p className="text-sm text-gold font-bold">
//                                   Rp{gear.dailyPrice.toLocaleString('id-ID')}/hari
//                                 </p>
//                                 <Button
//                                   size="sm"
//                                   variant="ghost"
//                                   className="h-6"
//                                   asChild
//                                 >
//                                   <Link href={`/product/${gear.id}`}>
//                                     <ArrowRight className="w-3 h-3" />
//                                   </Link>
//                                 </Button>
//                               </div>
//                             </>
//                           ) : (
//                             <p className="text-xs text-muted-foreground">
//                               Hubungi kami untuk gear khusus
//                             </p>
//                           )}
//                         </Card>
//                       )
//                     })}
//                   </div>

//                   {/* Package Suggestion */}
//                   <Card className="mt-6 p-6 bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30">
//                     <h4 className="font-bold text-forest mb-3 flex items-center gap-2">
//                       <span>📦</span>
//                       Paket yang Cocok
//                     </h4>
//                     <p className="text-sm text-muted-foreground mb-4">
//                       Berdasarkan tingkat kesulitan pendakian, kami merekomendasikan paket berikut:
//                     </p>

//                     {selectedMountain.difficulty === 'beginner' && (
//                       <Button
//                         className="w-full bg-primary text-primary-foreground hover:bg-forest-dark"
//                         asChild
//                       >
//                         <Link href="/bundles?category=beginner">
//                           Lihat Paket Pemula
//                           <ArrowRight className="w-4 h-4 ml-2" />
//                         </Link>
//                       </Button>
//                     )}
//                     {selectedMountain.difficulty === 'intermediate' && (
//                       <Button
//                         className="w-full bg-primary text-primary-foreground hover:bg-forest-dark"
//                         asChild
//                       >
//                         <Link href="/bundles?category=experienced">
//                           Lihat Paket Berpengalaman
//                           <ArrowRight className="w-4 h-4 ml-2" />
//                         </Link>
//                       </Button>
//                     )}
//                     {['advanced', 'expert'].includes(selectedMountain.difficulty) && (
//                       <div className="space-y-3">
//                         <Button
//                           className="w-full bg-primary text-primary-foreground hover:bg-forest-dark"
//                           asChild
//                         >
//                           <Link href="/bundles?category=professional">
//                             Lihat Paket Profesional
//                             <ArrowRight className="w-4 h-4 ml-2" />
//                           </Link>
//                         </Button>
//                         <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-3">
//                           <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
//                           <p className="text-xs text-orange-800">
//                             Untuk pendakian level lanjut, kami rekomendasikan berkonsultasi
//                             dengan pemandu profesional kami terlebih dahulu.
//                           </p>
//                         </div>
//                         <Button variant="outline" className="w-full" asChild>
//                           <Link href="/contact">
//                             Hubungi Pemandu
//                           </Link>
//                         </Button>
//                       </div>
//                     )}
//                   </Card>
//                 </div>
//               </>
//             ) : (
//               <Card className="p-12 bg-white border-border flex flex-col items-center justify-center text-center">
//                 <span className="text-6xl mb-4 opacity-20">🏔️</span>
//                 <h3 className="text-lg font-bold text-forest mb-2">
//                   Pilih Gunung
//                 </h3>
//                 <p className="text-muted-foreground">
//                   Klik salah satu gunung di sebelah kiri untuk melihat rekomendasi
//                   perlengkapan
//                 </p>
//               </Card>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
