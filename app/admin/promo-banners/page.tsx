"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageOff, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

/**
 * Banner promo homepage.
 *
 * Section "Promo" di homepage hanya menampilkan gambar kampanye — bukan kartu
 * produk. Halaman ini yang mengisinya: judul (sekaligus teks alternatif),
 * gambar, tautan opsional, jadwal tayang, dan urutan.
 *
 * Gambar diunggah sebagai file, bukan URL yang ditempel, jadi banner tidak
 * mungkin menunjuk alamat yang mati. Ganti gambar lewat POST (id + file);
 * teks/jadwal/urutan lewat PUT.
 */

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface Draft {
  title: string;
  link_url: string;
  starts_at: string;
  ends_at: string;
  display_order: string;
  is_active: boolean;
}

const MAX_SIZE = 5 * 1024 * 1024;

const EMPTY_NEW = {
  title: "",
  link_url: "",
  starts_at: "",
  ends_at: "",
  display_order: "0",
  is_active: true,
};

/** ISO dari server → nilai untuk input datetime-local (waktu lokal). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function toDraft(banner: Banner): Draft {
  return {
    title: banner.title,
    link_url: banner.link_url ?? "",
    starts_at: toLocalInput(banner.starts_at),
    ends_at: toLocalInput(banner.ends_at),
    display_order: String(banner.display_order),
    is_active: banner.is_active,
  };
}

function statusOf(banner: Banner) {
  if (!banner.is_active) {
    return { label: "Nonaktif", cls: "bg-stone-100 text-stone-500" };
  }
  const now = Date.now();
  if (banner.starts_at && new Date(banner.starts_at).getTime() > now) {
    return { label: "Terjadwal", cls: "bg-blue-50 text-blue-700" };
  }
  if (banner.ends_at && new Date(banner.ends_at).getTime() <= now) {
    return { label: "Berakhir", cls: "bg-red-50 text-red-600" };
  }
  return { label: "Tayang", cls: "bg-emerald-50 text-emerald-700" };
}

function isDirty(banner: Banner, draft: Draft): boolean {
  const current = toDraft(banner);
  return (
    current.title !== draft.title ||
    current.link_url !== draft.link_url ||
    current.starts_at !== draft.starts_at ||
    current.ends_at !== draft.ends_at ||
    current.display_order !== draft.display_order ||
    current.is_active !== draft.is_active
  );
}

function checkFile(file: File | null | undefined): boolean {
  if (!file) return false;
  if (!file.type.startsWith("image/")) {
    toast.error("Pilih file gambar (JPG, PNG, WebP)");
    return false;
  }
  if (file.size > MAX_SIZE) {
    toast.error("File terlalu besar — maksimal 5MB");
    return false;
  }
  return true;
}

export default function PromoBannersManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [newForm, setNewForm] = useState(EMPTY_NEW);
  const [newFile, setNewFile] = useState<File | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-banners");
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Gagal memuat banner");
      const data: Banner[] = result.data ?? [];
      setBanners(data);
      setDrafts(Object.fromEntries(data.map((b) => [b.id, toDraft(b)])));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat banner");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  /**
   * Gabungkan baris hasil mutasi tanpa memuat ulang seluruh daftar — memuat
   * ulang akan membuang perubahan yang belum disimpan di banner lain.
   */
  const applyRow = (row: Banner) => {
    setBanners((prev) => {
      const next = prev.some((b) => b.id === row.id)
        ? prev.map((b) => (b.id === row.id ? row : b))
        : [...prev, row];
      return next.sort(
        (a, b) =>
          a.display_order - b.display_order ||
          (a.created_at ?? "").localeCompare(b.created_at ?? ""),
      );
    });
    setDrafts((prev) => ({ ...prev, [row.id]: toDraft(row) }));
  };

  const handleCreate = async () => {
    if (!newForm.title.trim()) {
      toast.error("Judul banner wajib diisi");
      return;
    }
    if (!newFile) {
      toast.error("Pilih gambar banner dulu");
      return;
    }
    if (!checkFile(newFile)) return;

    setBusy("new");
    try {
      const form = new FormData();
      form.append("title", newForm.title.trim());
      if (newForm.link_url.trim()) form.append("link_url", newForm.link_url.trim());
      if (newForm.starts_at) form.append("starts_at", new Date(newForm.starts_at).toISOString());
      if (newForm.ends_at) form.append("ends_at", new Date(newForm.ends_at).toISOString());
      form.append("display_order", newForm.display_order || "0");
      form.append("is_active", String(newForm.is_active));
      form.append("file", newFile);

      const res = await fetch("/api/admin/promo-banners", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menambah banner");

      toast.success("Banner ditambahkan");
      setNewForm(EMPTY_NEW);
      setNewFile(null);
      applyRow(result.data as Banner);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const handleReplaceImage = async (banner: Banner, file: File | null | undefined) => {
    if (!checkFile(file) || !file) return;

    setBusy(banner.id);
    try {
      const form = new FormData();
      form.append("id", banner.id);
      form.append("file", file);

      const res = await fetch("/api/admin/promo-banners", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengganti gambar");

      toast.success("Gambar banner diganti");
      applyRow(result.data as Banner);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async (banner: Banner) => {
    const draft = drafts[banner.id];
    if (!draft) return;

    setBusy(banner.id);
    try {
      const res = await fetch("/api/admin/promo-banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: banner.id,
          title: draft.title,
          link_url: draft.link_url,
          starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
          ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
          display_order: Number(draft.display_order) || 0,
          is_active: draft.is_active,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan banner");

      toast.success("Banner disimpan");
      applyRow(result.data as Banner);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm(`Hapus banner "${banner.title}"? Gambarnya ikut dihapus.`)) return;

    setBusy(banner.id);
    try {
      const res = await fetch(`/api/admin/promo-banners?id=${encodeURIComponent(banner.id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus banner");

      toast.success("Banner dihapus");
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[banner.id];
        return next;
      });
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3">
          <h1
            className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Banner Promo
          </h1>
          <p className="text-[10px] text-stone-400">
            Section &quot;Promo&quot; di homepage — {banners.length} banner. Section ini hanya
            menampilkan gambar, bukan produk.
          </p>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
        {/* ── Tambah banner ── */}
        <Card className="p-4 border-stone-200 rounded-xl bg-white space-y-3">
          <p className="text-sm font-bold text-stone-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-700" />
            Tambah banner
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] text-stone-500">Judul</Label>
              <Input
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Promo akhir tahun"
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">Tautan (opsional)</Label>
              <Input
                value={newForm.link_url}
                onChange={(e) => setNewForm((f) => ({ ...f, link_url: e.target.value }))}
                placeholder="/bundles atau https://…"
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">Mulai tayang (kosong = langsung)</Label>
              <Input
                type="datetime-local"
                value={newForm.starts_at}
                onChange={(e) => setNewForm((f) => ({ ...f, starts_at: e.target.value }))}
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">
                Berakhir (kosong = tanpa batas)
              </Label>
              <Input
                type="datetime-local"
                value={newForm.ends_at}
                onChange={(e) => setNewForm((f) => ({ ...f, ends_at: e.target.value }))}
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">Urutan</Label>
              <Input
                type="number"
                value={newForm.display_order}
                onChange={(e) => setNewForm((f) => ({ ...f, display_order: e.target.value }))}
                className="mt-1 h-9 rounded-lg text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-stone-500">Gambar</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setNewFile(e.target.files?.[0] ?? null);
                  // Kosongkan input supaya file yang sama bisa dipilih lagi
                  // setelah banner sebelumnya dibuat.
                  e.target.value = "";
                }}
                className="mt-1 h-9 rounded-lg text-xs file:text-xs"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                JPG/PNG/WebP, maks 5MB. Rasio lebar (mis. 16:9) paling pas.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newForm.is_active}
                onChange={(e) => setNewForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              Langsung tayang
            </label>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={busy !== null}
              className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:bg-stone-300"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {busy === "new" ? "Mengunggah..." : "Tambah banner"}
            </Button>
          </div>
        </Card>

        {/* ── Daftar banner ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : banners.length === 0 ? (
          <Card className="p-10 border-stone-200 rounded-xl bg-white text-center">
            <ImageOff className="w-8 h-8 mx-auto text-stone-300 mb-3" />
            <p className="text-sm font-medium text-stone-700">Belum ada banner promo</p>
            <p className="text-xs text-stone-400 mt-1">
              Selama belum ada banner aktif, section Promo di homepage tidak ditampilkan.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => {
              const draft = drafts[banner.id] ?? toDraft(banner);
              const dirty = isDirty(banner, draft);
              const status = statusOf(banner);

              return (
                <Card key={banner.id} className="p-4 border-stone-200 rounded-xl bg-white">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full sm:w-56 shrink-0 aspect-16/9 rounded-lg overflow-hidden bg-stone-100">
                      {banner.image_url ? (
                        <Image
                          src={banner.image_url}
                          alt={banner.title}
                          fill
                          sizes="224px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <ImageOff className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className={`text-[9px] shrink-0 ${status.cls}`}>
                          {status.label}
                        </Badge>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          Urutan {banner.display_order}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <Label className="text-[10px] text-stone-500">Judul</Label>
                          <Input
                            value={draft.title}
                            onChange={(e) => updateDraft(banner.id, { title: e.target.value })}
                            className="mt-1 h-8 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-stone-500">Tautan</Label>
                          <Input
                            value={draft.link_url}
                            onChange={(e) => updateDraft(banner.id, { link_url: e.target.value })}
                            placeholder="/bundles"
                            className="mt-1 h-8 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-stone-500">Mulai</Label>
                          <Input
                            type="datetime-local"
                            value={draft.starts_at}
                            onChange={(e) => updateDraft(banner.id, { starts_at: e.target.value })}
                            className="mt-1 h-8 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-stone-500">Berakhir</Label>
                          <Input
                            type="datetime-local"
                            value={draft.ends_at}
                            onChange={(e) => updateDraft(banner.id, { ends_at: e.target.value })}
                            className="mt-1 h-8 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-stone-500">Urutan</Label>
                          <Input
                            type="number"
                            value={draft.display_order}
                            onChange={(e) =>
                              updateDraft(banner.id, { display_order: e.target.value })
                            }
                            className="mt-1 h-8 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-stone-500">Ganti gambar</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              handleReplaceImage(banner, file);
                            }}
                            className="mt-1 h-8 rounded-lg text-xs file:text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.is_active}
                            onChange={(e) =>
                              updateDraft(banner.id, { is_active: e.target.checked })
                            }
                            className="w-4 h-4 rounded accent-emerald-600"
                          />
                          Tayangkan
                        </label>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(banner)}
                            disabled={busy !== null}
                            className="h-8 px-3 text-xs rounded-lg border-stone-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Hapus
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(banner)}
                            disabled={busy !== null || !dirty}
                            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:bg-stone-300"
                          >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {busy === banner.id ? "Menyimpan..." : dirty ? "Simpan" : "Tersimpan"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-stone-400">
          Gambar disimpan ke bucket Storage <code>promo-banners</code> dan langsung dipakai di
          homepage. Banner yang nonaktif atau di luar jadwal disembunyikan otomatis oleh{" "}
          <code>/api/home</code>.
        </p>
      </div>
    </div>
  );
}
