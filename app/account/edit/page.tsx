"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  Camera,
  ShieldCheck,
  AlertCircle,
  Check,
  MapPin,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState({ fullName: "", phone: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSupabaseClient = () => {
    if (!supabase) {
      throw new Error("Konfigurasi Supabase belum tersedia");
    }
    return supabase;
  };

  useEffect(() => {
    const getProfile = async () => {
      try {
        const client = getSupabaseClient();
        const {
          data: { session },
        } = await client.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const user = session.user;
        const loadedName = user.user_metadata?.full_name || "";
        const loadedPhone = user.user_metadata?.phone || "";

        setFullName(loadedName);
        setPhone(loadedPhone);
        setInitialSnapshot({ fullName: loadedName, phone: loadedPhone });
        setEmail(user.email || "");
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setLoading(false);
      } catch {
        router.replace("/login");
      }
    };

    getProfile();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        },
      });

      if (error) throw error;

      setInitialSnapshot({ fullName, phone });
      toast.success("Profil berhasil diperbarui");
      router.push("/account");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil");
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const client = getSupabaseClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await client.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = client.storage.from("avatars").getPublicUrl(path);

      await client.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      toast.success("Foto profil diperbarui");
    } catch (err: any) {
      toast.error(err.message || "Gagal upload foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const hasUnsavedChanges =
    fullName !== initialSnapshot.fullName || phone !== initialSnapshot.phone;

  const computedInitials =
    fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "HB";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Data Identitas...
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

          <div className="flex items-center gap-2 text-[11px]">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-2xl bg-accent border border-gold/40 font-bold text-accent-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Perubahan Belum Disimpan
              </span>
            ) : (
              <span className="text-muted-foreground font-medium">
                Sinkron dengan Dokumen Anggota
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── ASYMMETRIC TWO-COLUMN WORKSPACE (max-w-7xl) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (4 KOLOM): PRATINJAU KARTU ANGGOTA & FOTO
             ========================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header Solid Forest */}
              <div className="px-5 py-4 bg-forest text-primary-foreground border-b border-forest-dark flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-tint">
                  Pratinjau Kartu Anggota
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-2xl bg-forest-dark text-primary-foreground border border-primary-foreground/20">
                  Live
                </span>
              </div>

              {/* Preview Body */}
              <div className="p-5 space-y-5 bg-background">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl border border-border bg-forest-soft flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt="Avatar anggota"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-sans text-2xl font-bold text-forest tracking-tight">
                          {computedInitials}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      aria-label="Unggah foto profil"
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-2xl bg-gold text-secondary-foreground border border-background flex items-center justify-center transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Nama Tercetak
                    </span>
                    <p className="font-sans text-base font-bold text-foreground truncate">
                      {fullName.trim() || "Nama Belum Diisi"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {email}
                    </p>
                  </div>
                </div>

                {/* Live Contact Metadata */}
                <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-border text-xs">
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      WhatsApp
                    </span>
                    <span className="font-bold text-foreground tabular-nums truncate block">
                      {phone.trim() || "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Kelengkapan
                    </span>
                    <span
                      className={`font-bold block ${
                        fullName.trim() && phone.trim()
                          ? "text-forest"
                          : "text-gold"
                      }`}
                    >
                      {fullName.trim() && phone.trim() ? "Siap Rental" : "Perlu Nomor"}
                    </span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full h-10 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />
                      <span>Mengunggah Foto...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 text-forest" />
                      <span>Ganti Foto Profil (Maks. 2MB)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Standar Verifikasi Pool Habema */}
            <div className="rounded-2xl border border-gold/40 bg-accent/45 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-accent-foreground">
                <AlertCircle className="w-4 h-4 text-gold shrink-0" />
                <span>Standar Verifikasi Serah Terima</span>
              </div>
              <p className="text-xs text-accent-foreground/90 leading-relaxed">
                Gunakan nama lengkap yang identik dengan <strong>KTP / SIM</strong> agar pengambilan unit di Pool Habema maupun pendaftaran Simaksi gunung tidak tertunda.
              </p>
            </div>
          </aside>

          {/* ==========================================================
              KOLOM KANAN (8 KOLOM): FORMULIR DATA IDENTITAS TERSTRUKTUR
             ========================================================== */}
          <main className="lg:col-span-8">
            <form
              onSubmit={handleUpdate}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Header Section */}
              <div className="px-6 py-5 border-b border-border bg-background flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-forest mb-1">
                    Formulir Registrasi Anggota
                  </span>
                  <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Edit Profil &amp; Kontak Utama
                  </h1>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest">
                  <ShieldCheck className="w-4 h-4" />
                  Tersimpan di Metadata Akun
                </span>
              </div>

              <div className="divide-y divide-border bg-background">
                {/* Bagian 01: Identitas Personal */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-widest tabular-nums">
                      01
                    </span>
                    <h2 className="font-sans text-sm font-bold text-foreground">
                      Identitas Sesuai Kartu Tanda Penduduk
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="fullName"
                        className="text-xs font-bold text-foreground"
                      >
                        Nama Lengkap <span className="text-gold">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 bg-background border-input focus-visible:border-forest focus-visible:ring-0 rounded-2xl text-sm text-foreground h-11 shadow-none"
                          placeholder="Nama lengkap sesuai KTP"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="phone"
                        className="text-xs font-bold text-foreground"
                      >
                        Nomor WhatsApp / Telepon Aktif
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 bg-background border-input focus-visible:border-forest focus-visible:ring-0 rounded-2xl text-sm text-foreground tabular-nums h-11 shadow-none"
                          placeholder="0812xxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 02: Kredensial Akun (Read-Only) */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-widest tabular-nums">
                        02
                      </span>
                      <h2 className="font-sans text-sm font-bold text-foreground">
                        Kredensial Masuk &amp; Alamat Terkait
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Terkunci
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">
                        Alamat Email Utama
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <Input
                          value={email}
                          disabled
                          className="pl-10 bg-muted/60 border-border rounded-2xl text-muted-foreground cursor-not-allowed text-sm h-11 shadow-none"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-border bg-forest-soft/40 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-forest">
                          Pengiriman &amp; Penjemputan
                        </span>
                        <span className="text-xs font-semibold text-foreground block mt-0.5">
                          Kelola alamat pengantaran gear
                        </span>
                      </div>
                      <Link
                        href="/account/addresses"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border border-border bg-background hover:border-forest text-xs font-bold text-forest shrink-0 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Alamat</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-forest" />
                  Perubahan langsung berlaku pada reservasi berikutnya
                </span>

                <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="w-full sm:w-auto rounded-2xl h-10 border-border bg-background hover:bg-muted text-xs font-bold text-foreground shadow-none px-6"
                  >
                    <Link href="/account">Batal</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="w-full sm:w-auto bg-gold hover:bg-gold-light text-secondary-foreground rounded-2xl h-10 text-xs font-bold shadow-none px-6 gap-2 cursor-pointer"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Simpan Perubahan</span>
                  </Button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}