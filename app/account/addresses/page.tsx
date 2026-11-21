"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Home,
  ArrowLeft,
  ShieldCheck,
  Check,
  Phone,
  User,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "habema_addresses";

interface Address {
  id: string;
  user_id: string | null;
  label: string | null;
  recipient: string | null;
  phone: string | null;
  address: string | null;
  is_default: boolean;
}

export default function AddressesPage() {
  const router = useRouter();

  // Inisialisasi state dari localStorage agar data bertahan setelah refresh
  const [addresses, setAddresses] = useState<Address[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        // Tetap tampilkan data dari localStorage jika tidak login
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      // Jika error, pertahankan data localStorage yang sudah ada
      if (error) {
        console.error("Error fetching addresses:", error);
        setLoading(false);
        return;
      }

      const fetched = data ?? [];
      setAddresses(fetched);

      // Simpan ke localStorage agar bertahan setelah refresh
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetched));
      } catch {}
    } catch (err) {
      console.error("Error fetching addresses:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleDelete = async (id: string) => {
    if (!supabase) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) {
        toast.error("Gagal menghapus alamat");
        return;
      }
      setAddresses((prev) => {
        const next = prev.filter((a) => a.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      toast.success("Alamat berhasil dihapus");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!supabase) return;

    setSettingDefaultId(id);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) return;

      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);

      setAddresses((prev) => {
        const next = prev
          .map((a) => ({ ...a, is_default: a.id === id }))
          .sort((a, b) => Number(b.is_default) - Number(a.is_default));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      toast.success("Alamat default diperbarui");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Direktori Alamat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* ── TOP DISPATCH STRIP ── */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 font-bold text-forest hover:text-forest-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Ringkasan Akun</span>
          </Link>

          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
            Total Tersimpan:{" "}
            <strong className="text-foreground">{addresses.length} Titik Lokasi</strong>
          </span>
        </div>
      </div>

      {/* ── ASYMMETRIC TWO-COLUMN WORKSPACE (max-w-7xl) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (4 KOLOM): RINGKASAN TITIK UTAMA & AKSI CEPAT
             ========================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header Solid Forest */}
              <div className="px-5 py-4 bg-forest text-primary-foreground border-b border-forest-dark flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-tint">
                  Titik Pengiriman Utama
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-2xl bg-forest-dark text-primary-foreground border border-primary-foreground/20 tabular-nums">
                  {addresses.length} Alamat
                </span>
              </div>

              {/* Active Default Address Summary */}
              <div className="p-5 space-y-4 bg-background">
                {defaultAddress ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-2xl bg-forest-soft border border-forest/25 text-[10px] font-bold uppercase tracking-wider text-forest mb-1.5">
                          <Home className="w-3 h-3" />
                          {defaultAddress.label}
                        </span>
                        <h2 className="font-sans text-base font-bold text-foreground">
                          {defaultAddress.recipient ?? ""}
                        </h2>
                        <p className="text-xs font-semibold text-muted-foreground tabular-nums mt-0.5">
                          {defaultAddress.phone}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-foreground/85 leading-relaxed p-3.5 rounded-2xl border border-border bg-muted/40">
                      {defaultAddress.address}
                    </p>
                  </>
                ) : (
                  <div className="py-4 text-center space-y-1.5">
                    <Navigation className="w-6 h-6 text-muted-foreground mx-auto" />
                    <p className="text-xs font-bold text-foreground">
                      Belum Ada Alamat Utama
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Tambahkan alamat rumah atau kantor untuk pengiriman gear dan pesanan toko.
                    </p>
                  </div>
                )}

                <Link
                  href="/account/addresses/add"
                  className="w-full h-11 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Alamat Baru</span>
                </Link>
              </div>
            </div>

            {/* Info Pengiriman Pool Habema */}
            <div className="rounded-2xl border border-border bg-forest-soft/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-forest">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Cakupan Antar-Jemput Gear</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Alamat utama digunakan otomatis sebagai tujuan pengiriman ekspedisi toko serta estimasi kurir lokal dari Pool Habema.
              </p>
            </div>
          </aside>

          {/* ==========================================================
              KOLOM KANAN (8 KOLOM): DAFTAR LEDGER ALAMAT TERSIMPAN
             ========================================================== */}
          <main className="lg:col-span-8 space-y-5">
            {/* Header Bar */}
            <div className="rounded-2xl border border-border bg-card px-6 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-forest mb-1">
                  Direktori Lokasi Anggota
                </span>
                <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Daftar Alamat Pengiriman
                </h1>
              </div>

              <Link
                href="/account/addresses/add"
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-2xl bg-forest hover:bg-forest-dark text-primary-foreground text-xs font-bold transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Alamat</span>
              </Link>
            </div>

            {/* Address List */}
            {addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl border border-border bg-forest-soft flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6 text-forest" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h2 className="font-sans text-base font-bold text-foreground">
                    Belum Ada Alamat Tersimpan
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Simpan alamat pengiriman Anda agar proses checkout rental maupun pembelian perlengkapan lebih cepat.
                  </p>
                </div>
                <Link
                  href="/account/addresses/add"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Alamat Pertama</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr, index) => (
                  <article
                    key={addr.id}
                    className={`rounded-2xl border bg-card overflow-hidden transition-colors ${
                      addr.is_default
                        ? "border-forest"
                        : "border-border hover:border-forest/50"
                    }`}
                  >
                    {/* Top Metadata Strip */}
                    <div
                      className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
                        addr.is_default
                          ? "bg-forest-soft/60 border-forest/20"
                          : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-widest tabular-nums">
                          0{index + 1}
                        </span>
                        <h3 className="font-sans text-sm font-bold text-foreground">
                          {addr.label ?? "Alamat"}
                        </h3>
                        {addr.is_default && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-2xl bg-gold text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                            <Check className="w-3 h-3" />
                            Alamat Utama
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Body Detail Penerima & Alamat Lengkap */}
                    <div className="p-5 bg-background space-y-3">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                          <User className="w-3.5 h-3.5 text-forest" />
                          {addr.recipient ?? ""}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground tabular-nums">
                          <Phone className="w-3.5 h-3.5 text-forest" />
                          {addr.phone}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {addr.address}
                      </p>
                    </div>

                    {/* Footer Action Strip */}
                    <div className="px-5 py-3 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {!addr.is_default ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(addr.id)}
                            disabled={settingDefaultId === addr.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-forest/30 bg-forest-soft hover:bg-forest hover:text-primary-foreground text-xs font-bold text-forest transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {settingDefaultId === addr.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Home className="w-3.5 h-3.5" />
                            )}
                            <span>Jadikan Utama</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-forest flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Dipilih otomatis saat checkout
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/account/addresses/edit?id=${addr.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border border-border bg-background hover:border-forest hover:text-forest text-xs font-bold text-foreground transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(addr.id)}
                          disabled={deletingId === addr.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border border-gold/40 bg-accent hover:bg-gold text-accent-foreground hover:text-secondary-foreground text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === addr.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}