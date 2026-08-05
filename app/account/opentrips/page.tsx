"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mountain } from "lucide-react";
import { EmptyState } from "@/components/account/empty-state";

export default function OpentripsHistoryPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push("/account")}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Akun
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Open Trip</h1>
          <p className="text-sm text-stone-500 mt-0.5">Riwayat pendaftaran open trip</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
          <EmptyState
            icon={Mountain}
            title="Belum ada riwayat open trip"
            desc="Fitur pendaftaran open trip akan segera hadir. Ikuti petualangan bersama komunitas Habema!"
            action={
              <button
                onClick={() => router.push("/opentrip")}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Jelajahi Open Trip
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
