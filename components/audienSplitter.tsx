"use client";

import Link from "next/link";

export function AudienceSplitter() {
  return (
    <section className="relative min-h-screen md:min-h-170 w-full overflow-hidden bg-stone-950">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/bg-hydropack.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product cutouts — desktop only agar tidak menutupi teks di layar kecil */}
      <div className="hidden md:block absolute z-10 right-0 top-0 w-[70%] h-screen">
        <img
          src="/images/Group 38.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="hidden md:block absolute z-11 right-0 top-0 w-[60%] h-[90%]">
        <img
          src="/images/Group 39.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="absolute z-[20] left-0 bottom-0 w-full max-w-xl p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl text-white font-arial">
          <span className="uppercase font-black block">habema</span>
          Timbanuh.10
        </h1>
        <p className="text-white text-xs mt-3 leading-relaxed text-justify">
          Dirancang untuk pelari trail, maraton, dan penggiat aktivitas luar
          ruang yang mengutamakan kecepatan serta kenyamanan maksimal. HABEMA
          Timbanuh 10 hadir dengan desain rompi (vest-style) yang membungkus
          tubuh secara presisi, meminimalkan guncangan (bounce) saat bergerak
          aktif di medan berat.
        </p>
        <hr className="border-white my-4" />
        <span className="text-white text-xs leading-relaxed">
          • Ergonomic Vest Fit<br />
          • Stealth & Breathable Material<br />
          • Hydration Ready Smart Storage System<br />
          • Adjustable Bungee Cord
        </span>

        {/* Caption produk — tampil di bawah teks pada mobile */}
        <div className="md:hidden mt-6">
          <p className="text-white text-sm font-bold uppercase">
            Bergerak Lebih Jauh, Tanpa Beban Lebih.
          </p>
          <p className="text-white text-xs mt-1">
            Running Vest Hydropack Lightweight Stealth Black
          </p>
        </div>
      </div>

      {/* Caption produk — posisi semula untuk desktop */}
      <div className="hidden md:block absolute z-[20] right-0 top-[50%] w-full max-w-sm p-1 md:p-12 text-justify">
        <p className="text-white text-sm md:text-base font-bold uppercase w-36 text-justify">
          Bergerak Lebih Jauh, Tanpa Beban Lebih.
        </p>
        <p className="text-white text-xs md:text-sm mt-2 w-36">
          Running Vest Hydropack Lightweight Stealth Black
        </p>
      </div>
    </section>
  );
}
