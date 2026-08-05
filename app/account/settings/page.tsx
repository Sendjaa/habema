"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, ArrowLeft, Edit2, LogOut } from "lucide-react";
import { useAccountData } from "@/lib/account-data";
import { formatDate, DEFAULT_NOTIF } from "@/components/account/status-config";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-emerald-500" : "bg-stone-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAccountData();
  const [notif, setNotif] = useState(DEFAULT_NOTIF);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const toggleNotif = (key: keyof typeof DEFAULT_NOTIF) =>
    setNotif((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      supabase.auth.updateUser({ data: { notif_preferences: updated } });
      return updated;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      </div>
    );
  }
  if (!user) return null;

  const fullName = user.user_metadata?.full_name || "Petualang Habema";
  const email = user.email ?? "";
  const phone = user.phone || null;
  const joinDate = formatDate(user.created_at);

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
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Pengaturan</h1>
          <p className="text-sm text-stone-500 mt-0.5">Kelola informasi dan preferensi akun Anda</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 space-y-6 max-w-3xl">
          {/* Personal Info */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-800">Informasi Pribadi</h3>
              <button
                onClick={() => router.push("/account/edit")}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nama Lengkap", value: fullName },
                { label: "Email", value: email },
                { label: "Nomor HP", value: phone || "Belum diatur" },
                { label: "Bergabung Sejak", value: joinDate },
              ].map((field) => (
                <div key={field.label} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                  <p className="text-xs text-stone-400 mb-1">{field.label}</p>
                  <p className="text-sm font-medium text-stone-800 truncate">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-4">Preferensi Notifikasi</h3>
            <div className="rounded-xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
              {[
                { key: "order_confirm",   label: "Konfirmasi Pesanan",    desc: "Notifikasi saat pesanan dikonfirmasi" },
                { key: "return_reminder", label: "Pengingat Pengembalian", desc: "Ingatkan H-1 sebelum tanggal kembali" },
                { key: "promo",           label: "Promo & Diskon",         desc: "Info penawaran dan diskon terbaru" },
                { key: "whatsapp",        label: "Notifikasi WhatsApp",    desc: "Terima notifikasi via WhatsApp" },
                { key: "weekly_email",    label: "Email Mingguan",         desc: "Ringkasan aktivitas setiap minggu" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50/50 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-stone-800">{label}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    checked={notif[key as keyof typeof DEFAULT_NOTIF]}
                    onChange={() => toggleNotif(key as keyof typeof DEFAULT_NOTIF)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-3">Sesi</h3>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Keluar dari Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
