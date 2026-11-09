"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, Upload, X, Image as ImageIcon, Video, GripVertical, CloudUpload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ShopHeroMedia {
  url: string;
  alt?: string;
}

interface ShopHeroStats {
  value: string;
  label: string;
}

interface ShopHero {
  id: string;
  kicker: string;
  heading: string;
  description: string;
  stats: ShopHeroStats[];
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  note: string;
  media: ShopHeroMedia[];
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Draft {
  kicker: string;
  heading: string;
  description: string;
  stats: ShopHeroStats[];
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  note: string;
  media: ShopHeroMedia[];
  isActive: boolean;
}

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];

const EMPTY_STATS: ShopHeroStats[] = [
  { value: "500+", label: "Kurasi Gear" },
  { value: "7 Hari", label: "Garansi Tukar" },
  { value: "100%", label: "Produk Original" },
];

const DEFAULT_MEDIA: ShopHeroMedia[] = [
  { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1080&h=1350&fit=crop&q=80", alt: "Tenda camping menyala di malam hari" },
  { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1080&h=1350&fit=crop&q=80", alt: "Api ungup pinggir tebing saat berkemah" },
  { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1080&h=1350&fit=crop&q=80", alt: "Berselancar jalur pendakian" },
];

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

function checkFile(file: File | null | undefined): boolean {
  if (!file) return false;
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.error("Tipe file tidak didukung (JPG, PNG, WebP, MP4, WebM, MOV)");
    return false;
  }
  if (file.size > MAX_SIZE) {
    toast.error(`File terlalu besar — maksimal ${MAX_SIZE / 1024 / 1024}MB`);
    return false;
  }
  return true;
}

function getInitialDraft(): Draft {
  return {
    kicker: "Habema Official Store",
    heading: "Gear Kuat Buat Jelajah Tanpa Ribet",
    description: "Tenda, carrier, cooking set, dan perlengkapan jalan lainnya kami pilih sendiri satu per satu. Tahan pakai, harga masuk, siap dikirim dari Bandung.",
    stats: [...EMPTY_STATS],
    ctaLabel: "Mulai Belanja",
    ctaHref: "/catalog_shop",
    secondaryCtaLabel: "Bundling Hemat",
    secondaryCtaHref: "/bundles",
    note: "Produk original dengan garansi tukar 7 hari. Pembayaran aman via Midtrans.",
    media: [...DEFAULT_MEDIA],
    isActive: true,
  };
}

export default function ShopHeroManagement() {
  const [hero, setHero] = useState<ShopHero | null>(null);
  const [draft, setDraft] = useState<Draft>(getInitialDraft());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newAlts, setNewAlts] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchHero = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/shop-hero");
      const result = await res.json();
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setAuthError("Anda tidak memiliki akses admin. Silakan login sebagai admin.");
          throw new Error("Unauthorized");
        }
        throw new Error(result.error || "Gagal memuat hero");
      }
      
      if (!result.success) throw new Error(result.error || "Gagal memuat hero");
      
      const data: ShopHero[] = result.data ?? [];
      if (data.length > 0) {
        setHero(data[0]);
        setDraft({
          ...getInitialDraft(),
          ...data[0],
          stats: data[0].stats ?? EMPTY_STATS,
          media: data[0].media ?? DEFAULT_MEDIA,
        });
      }
    } catch (err: any) {
      if (err.message !== "Unauthorized") {
        toast.error(err.message || "Gagal memuat hero");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHero();
  }, [fetchHero]);

  const applyHero = (row: ShopHero) => {
    setHero(row);
    setDraft({
      ...getInitialDraft(),
      ...row,
      stats: row.stats ?? EMPTY_STATS,
      media: row.media ?? DEFAULT_MEDIA,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter(checkFile);
    setNewFiles((prev) => [...prev, ...validFiles]);
    setNewAlts((prev) => [...prev, ...validFiles.map(() => "")]);
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(checkFile);
    setNewFiles((prev) => [...prev, ...validFiles]);
    setNewAlts((prev) => [...prev, ...validFiles.map(() => "")]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewAlts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrUpdate = async () => {
    if (!draft.heading.trim()) {
      toast.error("Judul (heading) wajib diisi");
      return;
    }
    if (!draft.description.trim()) {
      toast.error("Deskripsi wajib diisi");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("kicker", draft.kicker.trim());
      form.append("heading", draft.heading.trim());
      form.append("description", draft.description.trim());
      form.append("stats", JSON.stringify(draft.stats));
      form.append("ctaLabel", draft.ctaLabel.trim());
      form.append("ctaHref", draft.ctaHref.trim());
      form.append("secondaryCtaLabel", draft.secondaryCtaLabel.trim());
      form.append("secondaryCtaHref", draft.secondaryCtaHref.trim());
      form.append("note", draft.note.trim());
      form.append("media", JSON.stringify(draft.media));
      form.append("isActive", String(draft.isActive));

      newFiles.forEach((file) => form.append("files", file));

      const res = await fetch("/api/admin/shop-hero", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan hero");

      toast.success("Hero ShopProducts disimpan");
      applyHero(result.data as ShopHero);
      setNewFiles([]);
      setNewAlts([]);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!hero) return;
    if (!window.confirm(`Hapus hero ShopProducts ini? Semua media ikut dihapus.`)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/shop-hero?id=${encodeURIComponent(hero.id)}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus hero");

      toast.success("Hero dihapus");
      setHero(null);
      setDraft(getInitialDraft());
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  };

  const updateDraft = (patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateStat = (index: number, field: "value" | "label", value: string) => {
    setDraft((prev) => {
      const next = [...prev.stats];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, stats: next };
    });
  };

  const addStat = () => {
    setDraft((prev) => ({ ...prev, stats: [...prev.stats, { value: "", label: "" }] }));
  };

  const removeStat = (index: number) => {
    setDraft((prev) => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));
  };

  const updateMediaAlt = (index: number, alt: string) => {
    setDraft((prev) => {
      const next = [...prev.media];
      next[index] = { ...next[index], alt };
      return { ...prev, media: next };
    });
  };

  const removeMedia = (index: number) => {
    setDraft((prev) => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }));
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    setDraft((prev) => {
      const next = [...prev.media];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, media: next };
    });
  };

  const openFileDialog = () => fileInputRef.current?.click();

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3">
          <h1 className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Hero ShopProducts
          </h1>
          <p className="text-[10px] text-stone-400">
            Section "Toko" di homepage — carousel media (foto/video), judul, deskripsi, stats, CTA. Hanya 1 baris aktif.
          </p>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
        {authError && (
          <Card className="p-4 border-red-200 bg-red-50 rounded-xl">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{authError}</p>
            </div>
          </Card>
        )}

        {/* ── Form ── */}
        <Card className="p-4 border-stone-200 rounded-xl bg-white space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-700" />
              {hero ? "Perbarui Hero" : "Buat Hero Baru"}
            </p>
            {hero && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={busy}
                className="h-9 px-3 text-xs rounded-lg border-stone-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-[10px] text-stone-500">Kicker (label kecil di atas judul)</Label>
              <Input
                value={draft.kicker}
                onChange={(e) => updateDraft({ kicker: e.target.value })}
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] text-stone-500">Judul Utama</Label>
              <Input
                value={draft.heading}
                onChange={(e) => updateDraft({ heading: e.target.value })}
                placeholder="Gear Kuat Buat Jelajah Tanpa Ribet"
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] text-stone-500">Deskripsi</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                rows={3}
                className="mt-1 h-auto rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Stats */}
          <div>
            <Label className="text-[10px] text-stone-500 flex items-center gap-2">
              Statistik (value + label)
              <Button type="button" variant="ghost" size="icon" onClick={addStat} className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </Label>
            <div className="mt-2 space-y-2">
              {draft.stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Value (mis. 500+)"
                    value={stat.value}
                    onChange={(e) => updateStat(i, "value", e.target.value)}
                    className="flex-1 h-8 rounded-lg text-xs"
                  />
                  <Input
                    placeholder="Label (mis. Kurasi Gear)"
                    value={stat.label}
                    onChange={(e) => updateStat(i, "label", e.target.value)}
                    className="flex-1 h-8 rounded-lg text-xs"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeStat(i)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="grid gap-3 sm:grid-cols-2 border-t border-stone-200 pt-4">
            <div>
              <Label className="text-[10px] text-stone-500">CTA Utama Label</Label>
              <Input
                value={draft.ctaLabel}
                onChange={(e) => updateDraft({ ctaLabel: e.target.value })}
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">CTA Utama HREF</Label>
              <Input
                value={draft.ctaHref}
                onChange={(e) => updateDraft({ ctaHref: e.target.value })}
                placeholder="/catalog_shop"
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">CTA Kedua Label</Label>
              <Input
                value={draft.secondaryCtaLabel}
                onChange={(e) => updateDraft({ secondaryCtaLabel: e.target.value })}
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">CTA Kedua HREF</Label>
              <Input
                value={draft.secondaryCtaHref}
                onChange={(e) => updateDraft({ secondaryCtaHref: e.target.value })}
                placeholder="/bundles"
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <Label className="text-[10px] text-stone-500">Catatan (di bawah CTA)</Label>
            <Input
              value={draft.note}
              onChange={(e) => updateDraft({ note: e.target.value })}
              className="mt-1 h-9 rounded-lg text-xs"
            />
          </div>

          {/* Media Carousel with Drag & Drop */}
          <div className="border-t border-stone-200 pt-4">
            <Label className="text-[10px] text-stone-500 flex items-center gap-2">
              Media Carousel (foto/video, rasio 1080x1350)
              <Button type="button" variant="ghost" size="icon" onClick={openFileDialog} className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50" disabled={busy}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </Label>
            <p className="text-[10px] text-stone-400 mt-1">
              Drag & drop multiple files, atau klik tombol + di atas. Video otomatis diputar di carousel (MP4/WebM/MOV).
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="media-upload"
            />

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={(e) => handleDrag(e)}
              onDragLeave={(e) => handleDrag(e)}
              onDragOver={(e) => handleDrag(e)}
              onDrop={handleDrop}
              className={`mt-3 border-2 border-dashed rounded-xl p-6 transition-colors ${
                dragActive ? "border-emerald-500 bg-emerald-50" : "border-stone-200 hover:border-emerald-300"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-2 text-stone-500">
                  <CloudUpload className="w-8 h-8" />
                  <span className="text-lg font-medium">Drag & drop files here</span>
                </div>
                <p className="text-xs text-stone-400">Atau klik tombol + di atas untuk memilih file</p>
                <p className="text-[10px] text-stone-400">Max 50MB per file · JPG, PNG, WebP, MP4, WebM, MOV</p>
              </div>
            </div>

            {/* New file uploads preview */}
            {newFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-stone-700">File baru ({newFiles.length})</p>
                <div className="space-y-3">
                  {newFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-stone-100 relative">
                        {isVideoUrl(URL.createObjectURL(file)) ? (
                          <Video className="w-full h-full text-stone-400" />
                        ) : (
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-stone-700 truncate">{file.name}</p>
                        <p className="text-[10px] text-stone-400">{file.type.startsWith("video/") ? "Video" : "Gambar"} · {(file.size / 1024).toFixed(0)} KB</p>
                        <Input
                          placeholder="Alt text (opsional)"
                          value={newAlts[i]}
                          onChange={(e) => setNewAlts((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                          className="mt-1 h-8 rounded-lg text-xs"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeNewFile(i)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing media */}
            {draft.media.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-stone-700">Media tersimpan ({draft.media.length})</p>
                <div className="space-y-3">
                  {draft.media.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-200">
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveMedia(i, i - 1)} disabled={i === 0} className="h-8 w-8 p-0 text-stone-400 hover:text-stone-600 disabled:opacity-50">
                        <GripVertical className="w-3.5 h-3.5" />
                      </Button>
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-stone-100 relative">
                        {isVideoUrl(m.url) ? (
                          <Video className="w-full h-full text-stone-400" />
                        ) : (
                          <img src={m.url} alt={m.alt ?? ""} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <Input
                        placeholder="Alt text"
                        value={m.alt ?? ""}
                        onChange={(e) => updateMediaAlt(i, e.target.value)}
                        className="flex-1 h-8 rounded-lg text-xs"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMedia(i)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newFiles.length === 0 && draft.media.length === 0 && (
              <p className="text-center text-stone-400 py-8 text-sm">Belum ada media. Tambahkan minimal 1 gambar/video.</p>
            )}
          </div>

          {/* Active toggle & Save */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-stone-200 pt-4">
            <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => updateDraft({ isActive: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              Langsung aktif (hanya 1 hero aktif sekaligus)
            </label>
            <Button
              size="sm"
              onClick={handleCreateOrUpdate}
              disabled={busy}
              className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:bg-stone-300"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {busy ? "Menyimpan..." : hero ? "Perbarui" : "Simpan Hero"}
            </Button>
          </div>
        </Card>

        {loading && !hero && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        )}

        {!loading && !hero && !authError && (
          <Card className="p-10 border-stone-200 rounded-xl bg-white text-center">
            <ImageIcon className="w-8 h-8 mx-auto text-stone-300 mb-3" />
            <p className="text-sm font-medium text-stone-700">Belum ada hero ShopProducts</p>
            <p className="text-xs text-stone-400 mt-1">Isi form di atas untuk membuat hero pertama.</p>
          </Card>
        )}
      </div>
    </div>
  );
}