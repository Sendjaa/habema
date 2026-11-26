"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Home,
  Building,
  Flag,
  Save,
  User,
  Phone,
  ShieldCheck,
  Navigation,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const LABEL_PRESETS = ["Rumah", "Kantor", "Kost / Apartemen", "Basecamp"];

export default function AddAddressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    label: "",
    recipient_name: "",
    phone: "",
    address: "",
    province: "",
    city: "",
    postal_code: "",
    is_default: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: checked !== undefined ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!supabase) {
        toast.error("Terjadi kesalahan");
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      if (formData.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase
        .from("addresses")
        .insert([{ ...formData, user_id: user.id }]);

      if (error) {
        toast.error("Gagal menambahkan alamat");
        return;
      }

      // Simpan ke localStorage agar bertahan setelah refresh
      try {
        const STORAGE_KEY = "habema_addresses";
        const stored = localStorage.getItem(STORAGE_KEY);
        const prev = stored ? JSON.parse(stored) : [];
        const newAddress = {
          id: crypto.randomUUID(),
          user_id: user.id,
          label: formData.label,
          recipient: formData.recipient_name,
          phone: formData.phone,
          address: formData.address,
          is_default: formData.is_default,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, newAddress]));
      } catch {}

      toast.success("Alamat berhasil ditambahkan");
      router.push("/account/addresses");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const formattedLocation = [
    formData.address.trim(),
    formData.city.trim(),
    formData.province.trim(),
    formData.postal_code.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* ── TOP DISPATCH STRIP ── */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link
            href="/account/addresses"
            className="inline-flex items-center gap-1.5 font-bold text-forest hover:text-forest-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Alamat</span>
          </Link>

          <span className="text-[11px] font-medium text-muted-foreground">
            Formulir Titik Pengiriman Baru
          </span>
        </div>
      </div>

      {/* ── ASYMMETRIC TWO-COLUMN WORKSPACE (max-w-7xl) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (4 KOLOM): PRATINJAU LABEL PENGIRIMAN LIVE
             ========================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header Solid Forest */}
              <div className="px-5 py-4 bg-forest text-primary-foreground border-b border-forest-dark flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-tint">
                  Pratinjau Label Pengiriman
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-2xl bg-forest-dark text-primary-foreground border border-primary-foreground/20">
                  Live
                </span>
              </div>

              {/* Preview Body */}
              <div className="p-5 space-y-4 bg-background">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-2xl bg-forest-soft border border-forest/25 text-[10px] font-bold uppercase tracking-wider text-forest">
                    <Flag className="w-3 h-3" />
                    {formData.label.trim() || "Label Lokasi"}
                  </span>

                  {formData.is_default && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-2xl bg-gold text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                      <Home className="w-3 h-3" />
                      Alamat Utama
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Penerima
                  </span>
                  <p className="font-sans text-base font-bold text-foreground">
                    {formData.recipient_name.trim() || "Nama Penerima"}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground tabular-nums mt-0.5">
                    {formData.phone.trim() || "Nomor WhatsApp / HP"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-border bg-muted/40 space-y-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-forest">
                    <Navigation className="w-3 h-3" />
                    Tujuan Pengantaran
                  </span>
                  <p className="text-xs text-foreground/85 leading-relaxed">
                    {formattedLocation ||
                      "Jalan, RT/RW, nomor rumah, kota, provinsi, dan kode pos akan tampil di sini."}
                  </p>
                </div>
              </div>
            </div>

            {/* Panduan Pengisian */}
            <div className="rounded-2xl border border-border bg-forest-soft/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-forest">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Ketepatan Titik Kurir</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Sertakan patokan jalan atau nomor rumah yang jelas serta nomor WhatsApp aktif untuk mempermudah serah terima perlengkapan rental maupun paket toko.
              </p>
            </div>
          </aside>

          {/* ==========================================================
              KOLOM KANAN (8 KOLOM): FORMULIR TAMBAH ALAMAT TERSTRUKTUR
             ========================================================== */}
          <main className="lg:col-span-8">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Header Bar */}
              <div className="px-6 py-5 border-b border-border bg-background flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-forest mb-1">
                    Direktori Lokasi Anggota
                  </span>
                  <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Tambah Alamat Pengiriman Baru
                  </h1>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">
                  Semua kolom bertanda <span className="text-gold">*</span> wajib diisi
                </span>
              </div>

              <div className="divide-y divide-border bg-background">
                {/* Bagian 01: Label & Kategori Titik */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-widest tabular-nums">
                      01
                    </span>
                    <h2 className="font-sans text-sm font-bold text-foreground">
                      Penanda &amp; Label Alamat
                    </h2>
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="label"
                      className="block text-xs font-bold text-foreground"
                    >
                      Label Alamat <span className="text-gold">*</span>
                    </label>
                    <div className="relative">
                      <Flag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        id="label"
                        type="text"
                        name="label"
                        value={formData.label}
                        onChange={handleChange}
                        placeholder="Contoh: Rumah, Kantor, Kost"
                        required
                        className="w-full pl-10 pr-4 h-11 text-sm text-foreground bg-background border border-input rounded-2xl focus:outline-none focus:border-forest transition-colors"
                      />
                    </div>

                    {/* Preset Label Cepat */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-muted-foreground mr-1">
                        Pilihan cepat:
                      </span>
                      {LABEL_PRESETS.map((preset) => {
                        const isSelected =
                          formData.label.toLowerCase() === preset.toLowerCase();
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, label: preset }))
                            }
                            className={`px-3 py-1 rounded-2xl text-[11px] font-bold border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-forest text-primary-foreground border-forest"
                                : "bg-muted/50 text-foreground/80 border-border hover:border-forest hover:text-forest"
                            }`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bagian 02: Kontak Penerima */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-widest tabular-nums">
                      02
                    </span>
                    <h2 className="font-sans text-sm font-bold text-foreground">
                      Data Penerima di Lokasi
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="recipient_name"
                        className="block text-xs font-bold text-foreground"
                      >
                        Nama Penerima <span className="text-gold">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="recipient_name"
                          type="text"
                          name="recipient_name"
                          value={formData.recipient_name}
                          onChange={handleChange}
                          placeholder="Masukkan nama penerima"
                          required
                          className="w-full pl-10 pr-4 h-11 text-sm text-foreground bg-background border border-input rounded-2xl focus:outline-none focus:border-forest transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="phone"
                        className="block text-xs font-bold text-foreground"
                      >
                        Nomor WhatsApp / HP <span className="text-gold">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="0812xxxxxxxx"
                          required
                          className="w-full pl-10 pr-4 h-11 text-sm text-foreground tabular-nums bg-background border border-input rounded-2xl focus:outline-none focus:border-forest transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 03: Detail Wilayah & Alamat Jalan */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-widest tabular-nums">
                      03
                    </span>
                    <h2 className="font-sans text-sm font-bold text-foreground">
                      Rincian Wilayah &amp; Jalan
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="province"
                        className="block text-xs font-bold text-foreground"
                      >
                        Provinsi <span className="text-gold">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="province"
                          type="text"
                          name="province"
                          value={formData.province}
                          onChange={handleChange}
                          placeholder="Contoh: Jawa Barat"
                          required
                          className="w-full pl-10 pr-4 h-11 text-sm text-foreground bg-background border border-input rounded-2xl focus:outline-none focus:border-forest transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="city"
                        className="block text-xs font-bold text-foreground"
                      >
                        Kota / Kabupaten <span className="text-gold">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="city"
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Contoh: Kota Bandung"
                          required
                          className="w-full pl-10 pr-4 h-11 text-sm text-foreground bg-background border border-input rounded-2xl focus:outline-none focus:border-forest transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="postal_code"
                        className="block text-xs font-bold text-foreground"
                      >
                        Kode Pos <span className="text-gold">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="postal_code"
                          type="text"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                          placeholder="Contoh: 40286"
                          required
                          className="w-full pl-10 pr-4 h-11 text-sm text-foreground tabular-nums bg-background border border-input rounded-2xl focus:outline-none focus:border-forest transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="address"
                      className="block text-xs font-bold text-foreground"
                    >
                      Alamat Lengkap &amp; Patokan <span className="text-gold">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan/desa, atau patokan lokasi"
                      required
                      rows={3}
                      className="w-full p-3.5 text-sm text-foreground bg-background border border-input rounded-2xl focus:outline-none focus:border-forest transition-colors resize-none"
                    />
                  </div>

                  {/* Checkbox Alamat Utama */}
                  <label
                    htmlFor="is_default"
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${
                      formData.is_default
                        ? "border-forest bg-forest-soft/50"
                        : "border-border bg-muted/30 hover:border-forest/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_default"
                        name="is_default"
                        checked={formData.is_default}
                        onChange={handleChange}
                        className="w-4 h-4 accent-forest rounded border-input cursor-pointer"
                      />
                      <div>
                        <span className="block text-xs font-bold text-foreground">
                          Jadikan sebagai alamat utama
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          Alamat ini akan terpilih otomatis setiap kali Anda melakukan checkout.
                        </span>
                      </div>
                    </div>
                    {formData.is_default && (
                      <Check className="w-4 h-4 text-forest shrink-0" />
                    )}
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <Link
                  href="/account/addresses"
                  className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-6 rounded-2xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-colors"
                >
                  Batal
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-6 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Alamat...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Alamat</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}