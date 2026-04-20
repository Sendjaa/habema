import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Star, 
  Users, 
  ArrowRight, 
  Check,
  ChevronRight,
  ShieldCheck,
  Clock,
  Compass,
  Camera,
  Tent,
  Mountain,
} from 'lucide-react';

// Mock Data
const BUNDLE = {
  title: "Ultimate Volcano Expedition: Merapi High-End Gear & Guide",
  category: "Adventure Bundle",
  price: 2450000,
  oldPrice: 3100000,
  rating: 4.9,
  reviews: 240,
  highlights: ["Professional Guide", "Full Ultralight Gear", "Private Transport", "Insurance Included"]
};

export default function BundleDetail() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-[#1E293B]">

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[500px] mb-12 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200">
          <div className="md:col-span-2 relative group overflow-hidden">
            <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Main" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div className="grid grid-rows-2 gap-3 md:col-span-1">
            <img src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4" className="w-full h-full object-cover hover:opacity-90 transition" alt="Gear" />
            <img src="https://images.unsplash.com/photo-1533580905030-a38f38d4239c" className="w-full h-full object-cover hover:opacity-90 transition" alt="View" />
          </div>
          <div className="relative group overflow-hidden">
            <img src="https://images.unsplash.com/photo-1533227268408-a76e7ddbd764" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Detail" />
            <button className="absolute bottom-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold shadow-lg border border-slate-200">See All Photos</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Content Detail */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase italic italic tracking-tighter shadow-sm border border-blue-100">
                ⭐ {BUNDLE.category}
              </span>
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <MapPin size={14} /> Yogyakarta, Central Java
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
              {BUNDLE.title}
            </h2>

            {/* Icons Bar */}
            <div className="flex flex-wrap gap-8 py-8 border-y border-slate-200 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600"><Clock size={24} /></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Duration</p><p className="font-bold text-sm">3D 2N</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600"><Users size={24} /></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Group Size</p><p className="font-bold text-sm">Max 10 Pax</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600"><Compass size={24} /></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Difficulty</p><p className="font-bold text-sm">Moderate</p></div>
              </div>
            </div>

            {/* Bundle Components: The "Complex" Part */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">What's in this bundle?</h3>
              
              {/* Card: Gear Rental */}
              <div className="group relative bg-white p-8 rounded-[2rem] border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><Mountain size={24} /></div>
                    <h4 className="text-xl font-bold">Full Ultralight Gear Set</h4>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">RENTAL ITEM</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Tenda BigAgnes V2', 'Sleep System', 'Cooking Kit', 'Headlamp'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Check className="text-green-500" size={16} /> {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card: Trip Experience */}
              <div className="group relative bg-white p-8 rounded-[2rem] border border-slate-200 hover:border-green-400 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-200"><Compass size={24} /></div>
                    <h4 className="text-xl font-bold">Merapi Summit Expedition</h4>
                  </div>
                  <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg">EXPERIENCE</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Eksplorasi jalur Selo dengan porter tim profesional. Termasuk manajemen basecamp, simaksi, dan asuransi pendakian.
                </p>
                <div className="flex items-center gap-6">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" />
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-[10px] text-white flex items-center justify-center font-bold">+12</div>
                    </div>
                    <p className="text-xs font-medium text-slate-500 italic">240+ Travelers joined this trip before</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: High-End Checkout Card */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              
              <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                  Rp {(BUNDLE.price / 1000).toLocaleString()}k
                </span>
                <span className="text-slate-400 line-through text-sm mb-1">
                  Rp {(BUNDLE.oldPrice / 1000).toLocaleString()}k
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6 italic underline decoration-blue-200 underline-offset-4 tracking-tighter">Save 20% by booking this bundle</p>
              
              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition">
                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Select Trip Date</label>
                    <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                        <span>12 Aug - 15 Aug 2024</span>
                        <Calendar size={18} className="text-blue-600" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition">
                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Travelers</label>
                    <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                        <span>2 Persons (Couple Set)</span>
                        <Users size={18} className="text-blue-600" />
                    </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 mb-4">
                Secure Booking <ArrowRight size={20} />
              </button>

              <p className="text-[10px] text-center text-slate-400 font-medium flex items-center justify-center gap-1">
                <ShieldCheck size={14} className="text-green-500" /> Payment protected by Outdoor Guard System
              </p>

              <hr className="my-8 border-slate-100" />

              <div className="space-y-4">
                <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider">Premium Add-ons</h5>
                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                        <Camera size={18} className="text-slate-600" />
                        <div><p className="text-xs font-bold">Drone Documentation</p><p className="text-[10px] text-slate-500">+Rp 350.000</p></div>
                    </div>
                    <div className="w-5 h-5 rounded border border-slate-300" />
                </div>
              </div>
            </div>

            {/* Support Widget */}
            <div className="mt-4 bg-slate-900 text-white p-6 rounded-3xl flex justify-between items-center group cursor-pointer overflow-hidden relative">
                <div className="relative z-10">
                    <p className="text-xs font-medium text-slate-400">Need help?</p>
                    <p className="text-sm font-bold">Chat with Trip Specialist</p>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition duration-300">
                    <ChevronRight size={20} />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}