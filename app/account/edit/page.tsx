"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, Save, User, Phone, Mail, Camera } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  const getProfile = async () => {
    // 1. Ambil session aktif
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      router.replace("/login");
      return;
    }

    const user = session.user;

    // 2. Set state dari metadata
    setFullName(user.user_metadata?.full_name || "");
    setPhone(user.user_metadata?.phone || "");
    setEmail(user.email || "");
    setAvatarUrl(user.user_metadata?.avatar_url || null);
    setLoading(false);
  };

  getProfile();
}, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault()
  setUpdating(true)

  try {
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: fullName,
        phone: phone // Disimpan sebagai metadata biasa
      }
    })

    if (error) throw error
    
    toast.success('Profil berhasil diperbarui')
    router.push('/account')
    router.refresh()
  } catch (error: any) {
    toast.error(error.message || 'Gagal memperbarui profil')
  } finally {
    setUpdating(false)
  }
}

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Ukuran foto maksimal 2MB"); return; }

    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      toast.success("Foto profil diperbarui");
    } catch (err: any) {
      toast.error(err.message || "Gagal upload foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    // PERBAIKAN: Menghapus min-w-7xl karena ini merusak responsivitas di layar kecil
    <div className="min-h-screen bg-[#F1EFE8] font-body">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full shrink-0"
          >
            <Link href="/account">
              <ChevronLeft className="w-5 h-5 text-stone-600" />
            </Link>
          </Button>
          <div className="min-w-0">
            {" "}
            {/* min-w-0 mencegah teks meluap */}
            <h1
              className="text-lg md:text-xl font-semibold text-stone-900 tracking-tight truncate"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Edit Profil
            </h1>
            <p className="text-[10px] md:text-xs text-stone-500 truncate">
              Perbarui informasi identitas Anda
            </p>
          </div>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Card className="bg-white border-stone-200 rounded-2xl shadow-none overflow-hidden">
          <form onSubmit={handleUpdate} className="p-4 md:p-8 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center py-2 md:py-4 border-b border-stone-50">
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 md:w-10 md:h-10 text-emerald-700" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-stone-100 rounded-lg flex items-center justify-center shadow-sm hover:bg-stone-50 transition-colors"
                >
                  {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" /> : <Camera className="w-3.5 h-3.5 text-stone-600" />}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-[10px] md:text-xs font-medium text-emerald-700 cursor-pointer hover:underline disabled:opacity-50"
              >
                {uploadingPhoto ? "Mengunggah..." : "Ubah Foto Profil"}
              </button>
            </div>

            <div className="space-y-4">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="fullName"
                  className="text-[10px] md:text-xs font-medium text-stone-500 uppercase tracking-wider"
                >
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-stone-50 border-stone-200 rounded-xl focus-visible:ring-emerald-600 text-sm md:text-base h-11"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
              </div>

              {/* Email (Disabled) */}
              <div className="space-y-1.5">
                <Label className="text-[10px] md:text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Email (Tidak dapat diubah)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <Input
                    value={email}
                    disabled
                    className="pl-10 bg-stone-100 border-stone-200 rounded-xl text-stone-400 cursor-not-allowed text-sm md:text-base h-11"
                  />
                </div>
              </div>

              {/* Nomor HP */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-[10px] md:text-xs font-medium text-stone-500 uppercase tracking-wider"
                >
                  Nomor WhatsApp / HP
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-stone-50 border-stone-200 rounded-xl focus-visible:ring-emerald-600 text-sm md:text-base h-11"
                    placeholder="Contoh: 0812xxxx"
                  />
                </div>
                <p className="text-[10px] text-stone-400">
                  Gunakan format internasional atau lokal yang valid.
                </p>
              </div>
            </div>

            {/* PERBAIKAN: Tombol menjadi Stack di mobile (lebih mudah diklik) dan Row di desktop */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                asChild
                className="w-full sm:w-auto rounded-xl h-11 border-stone-200 text-stone-600 shadow-none px-8"
              >
                <Link href="/account">Batal</Link>
              </Button>
              <Button
                type="submit"
                disabled={updating}
                className="w-full sm:flex-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl h-11 shadow-none gap-2"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-amber-700">!</span>
          </div>
          <p className="text-[11px] md:text-xs text-amber-800 leading-relaxed">
            Pastikan nama Anda sesuai dengan <strong>KTP</strong> untuk
            mempermudah proses verifikasi alat di Habema Rental.
          </p>
        </div>
      </div>
    </div>
  );
}
