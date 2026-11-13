"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  ImageOff,
  Plus,
  Save,
  Trash2,
  Upload,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Kelola katalog kegiatan (CRUD lengkap).
 *
 * Setiap baris = satu kegiatan: slug, label, blurb, foto, urutan, status
 * aktif, dan seksi katalog. Foto diunggah sebagai file (bukan URL diketik)
 * supaya tidak ada tautan mati. Data ini dipakai /api/home untuk menampilkan
 * <ActivityCategories /> di halaman depan.
 */

interface Activity {
  id: string;
  slug: string;
  label: string;
  blurb: string | null;
  image_url: string | null;
  image_alt: string | null;
  is_active: boolean;
  display_order: number;
  sections: string[];
  created_at: string | null;
  updated_at: string | null;
}

const MAX_SIZE = 3 * 1024 * 1024;

function initialForm() {
  return {
    slug: "",
    label: "",
    blurb: "",
    sections: "",
    display_order: "0",
    is_active: "true",
  };
}

export default function ActivityManagement() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const form = useRef<Record<string, string>>(initialForm());
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activities");
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Gagal memuat kegiatan");
      setItems((result.data ?? []) as Activity[]);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat kegiatan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFile = (slug: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pilih file gambar (JPG, PNG, WebP)");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File terlalu besar — maksimal 3MB");
      return;
    }
    const input = fileInputs.current[slug];
    if (!input) return;
    input.value = "";
    uploadFile(slug, file);
  };

  async function uploadFile(slug: string, file: File) {
    setBusy(slug);
    try {
      const form = new FormData();
      form.append("id", slug); // id = slug untuk replace foto (POST pakai id)
      form.append("file", file);

      const res = await fetch("/api/admin/activities", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengunggah foto");
      toast.success(`Foto diperbarui`);
      await fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  }

  const handleCreate = async () => {
    const f = form.current;
    if (!f.slug?.trim()) {
      toast.error("Slug wajib diisi");
      return;
    }
    if (!f.label?.trim()) {
      toast.error("Label wajib diisi");
      return;
    }

    setBusy("create");
    try {
      const formData = new FormData();
      formData.append("slug", f.slug.trim());
      formData.append("label", f.label.trim());
      if (f.blurb?.trim()) formData.append("blurb", f.blurb.trim());
      if (f.sections?.trim()) formData.append("sections", f.sections.trim());
      formData.append("display_order", f.display_order || "0");
      formData.append("is_active", f.is_active);

      const fileInput = fileInputs.current["new"];
      if (fileInput?.files?.[0]) formData.append("file", fileInput.files[0]);

      const res = await fetch("/api/admin/activities", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat kegiatan");
      toast.success(`Kegiatan "${f.label}" dibuat`);
      form.current = initialForm();
      const input = fileInputs.current["new"];
      if (input) input.value = "";
      setCreating(false);
      await fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const handleUpdate = async (id: string) => {
    const f = form.current;
    const patch: Record<string, any> = { id };
    if (f.slug?.trim()) patch.slug = f.slug.trim();
    if (f.label?.trim()) patch.label = f.label.trim();
    if (f.blurb !== undefined) patch.blurb = f.blurb.trim() || null;
    if (f.sections?.trim()) patch.sections = f.sections.trim();
    if (f.display_order !== undefined) patch.display_order = f.display_order;
    if (f.is_active !== undefined) patch.is_active = f.is_active;

    setBusy(id);
    try {
      const res = await fetch("/api/admin/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan perubahan");
      toast.success("Perubahan disimpan");
      setEditing(null);
      form.current = initialForm();
      await fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Hapus kegiatan "${label}"? Foto-nya juga akan dihapus.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/activities?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus kegiatan");
      toast.success(`Kegiatan "${label}" dihapus`);
      await fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const activeCount = items.filter((i) => i.is_active).length;
  const withPhoto = items.filter((i) => i.image_url).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1
                className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Kelola Kegiatan
              </h1>
              <p className="text-[10px] text-stone-400">
                Katalog kegiatan untuk tile homepage &amp; filter katalog —
                {activeCount} aktif, {withPhoto} punya foto kurasi
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCreating((c) => !c)}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {creating ? "Batal Tambah" : "Tambah Kegiatan"}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Form tambah kegiatan */}
        {creating && (
          <Card className="p-5 border-stone-200 rounded-xl bg-white mb-6">
            <h2 className="text-xs sm:text-sm font-bold text-stone-800 mb-4">
              Kegiatan Baru
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-1 sm:col-span-1">
                <Label className="text-[10px] text-stone-500 block mb-1">
                  Slug
                </Label>
                <Input
                  value={form.current.slug}
                  onChange={(e) =>
                    (form.current.slug = e.target.value.toLowerCase().replace(/\s+/g, "-"))
                  }
                  placeholder="camping-keluarga"
                  className="mt-1 h-9 rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                <Label className="text-[10px] text-stone-500 block mb-1">
                  Label
                </Label>
                <Input
                  value={form.current.label}
                  onChange={(e) => (form.current.label = e.target.value)}
                  placeholder="Camping Keluarga"
                  className="mt-1 h-9 rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                <Label className="text-[10px] text-stone-500 block mb-1">
                  Blurb
                </Label>
                <Input
                  value={form.current.blurb}
                  onChange={(e) => (form.current.blurb = e.target.value)}
                  placeholder="Deskripsi singkat kegiatan"
                  className="mt-1 h-9 rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                <Label className="text-[10px] text-stone-500 block mb-1">
                  Seksi (comma-separated)
                </Label>
                <Input
                  value={form.current.sections}
                  onChange={(e) => (form.current.sections = e.target.value)}
                  placeholder="gear, products"
                  className="mt-1 h-9 rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                <Label className="text-[10px] text-stone-500 block mb-1">
                  Urutan
                </Label>
                <Input
                  type="number"
                  value={form.current.display_order}
                  onChange={(e) => (form.current.display_order = e.target.value)}
                  className="mt-1 h-9 rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                <Label className="text-[10px] text-stone-500 block mb-1 flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.current.is_active === "true"}
                    onChange={(e) =>
                      (form.current.is_active = e.target.checked ? "true" : "false")
                    }
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  Aktif
                </Label>
              </div>
              <div className="col-span-1 sm:col-span-1 lg:col-span-1">
                <Label className="text-[10px] text-stone-500 block mb-1">
                  Foto (opsional)
                </Label>
                <input
                  ref={(el) => {
                    fileInputs.current["new"] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFile("new", e.target.files?.[0] ?? null)
                  }
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputs.current["new"]?.click()}
                    className="h-8 px-3 text-xs rounded-lg border-stone-300 text-stone-700"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Pilih foto
                  </Button>
                  <span className="text-[10px] text-stone-400">
                    JPG/PNG/WebP, maks 3MB
                  </span>
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={busy === "create"}
                  className="h-8 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:bg-stone-300"
                >
                  {busy === "create" ? "Membuat..." : "Simpan Kegiatan"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    form.current = initialForm();
                    setCreating(false);
                  }}
                  className="h-8 flex-1 rounded-lg border-stone-300 text-stone-700 disabled:bg-stone-300"
                >
                  Batal
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => {
            const isEditing = editing === item.id;
            const preview = item.image_url || "/images/background_catalog_shop.jpeg";

            return (
              <Card key={item.id} className="p-4 border-stone-200 rounded-xl bg-white">
                <div className="flex gap-3">
                  <div className="relative w-28 shrink-0 aspect-[4/5] rounded-lg overflow-hidden bg-stone-100">
                    <Image
                      src={preview}
                      alt={item.image_alt ?? item.label}
                      fill
                      sizes="112px"
                      unoptimized
                      className="object-cover"
                    />
                    {!item.image_url && (
                      <div className="absolute inset-0 bg-stone-200 flex items-center justify-center">
                        <span className="text-[10px] text-stone-400">No photo</span>
                      </div>
                    )}
                    {!item.is_active && (
                      <div className="absolute inset-0 bg-stone-900/45 flex items-center justify-center">
                        <ImageOff className="w-5 h-5 text-white/80" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-stone-800 truncate">
                        {item.label}
                      </p>
                      <Badge
                        className={`text-[9px] shrink-0 ${
                          item.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-stone-400 truncate">
                      /catalog_rental?kegiatan={item.slug}
                    </p>
                    {item.blurb && (
                      <p className="text-[10px] text-stone-500 line-clamp-2">
                        {item.blurb}
                      </p>
                    )}
                    {item.sections.length > 0 && (
                      <p className="text-[9px] text-stone-400 truncate">
                        Seksi: {item.sections.join(", ")}
                      </p>
                    )}

                    {isEditing ? (
                      <EditForm
                        item={item}
                        onSave={handleUpdate}
                        onCancel={() => setEditing(null)}
                        formRef={form}
                        fileInputs={fileInputs}
                        busy={busy === item.id}
                        setBusy={setBusy}
                      />
                    ) : (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.is_active}
                              onChange={(e) =>
                                form.current = {
                                  ...form.current,
                                  [item.id]: {
                                    ...(form.current[item.id] ?? {}),
                                    is_active: e.target.checked ? "true" : "false",
                                  },
                                }
                              }
                              className="w-4 h-4 rounded accent-emerald-600"
                            />
                            Aktifkan
                          </label>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              form.current = {
                                slug: item.slug,
                                label: item.label,
                                blurb: item.blurb ?? "",
                                sections: item.sections.join(", "),
                                display_order: String(item.display_order),
                                is_active: String(item.is_active),
                              };
                              setEditing(item.id);
                            }}
                            className="h-8 px-2 text-xs rounded-lg border-stone-300 text-stone-700 disabled:bg-stone-300"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id, item.label)}
                            className="h-8 px-2 text-xs rounded-lg disabled:bg-stone-300"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    )}

                    {!item.image_url && (
                      <div className="mt-2">
                        <input
                          ref={(el) => {
                            fileInputs.current[item.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFile(item.id, e.target.files?.[0] ?? null)
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === item.id}
                          onClick={() => fileInputs.current[item.id]?.click()}
                          className="w-full h-8 text-xs rounded-lg border-stone-300 text-stone-700 disabled:bg-stone-300"
                        >
                          {busy === item.id ? "Mengunggah..." : "Pilih foto"}
                        </Button>
                        <span className="text-[9px] text-stone-400 block mt-1">
                          JPG/PNG/WebP, maks 3MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center text-center py-12">
            <p className="text-stone-400 text-sm">Belum ada kegiatan.</p>
            <Button
              size="sm"
              onClick={() => setCreating(true)}
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Buat Pertama
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditForm({
  item,
  onSave,
  onCancel,
  formRef,
  fileInputs,
  busy,
  setBusy,
}: {
  item: Activity;
  onSave: (id: string) => void;
  onCancel: () => void;
  formRef: React.MutableRefObject<Record<string, string>>;
  fileInputs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  busy: boolean;
  setBusy: (v: string | null) => void;
}) {
  const f = formRef.current;
  if (!f[item.id]) {
    f[item.id] = {
      slug: item.slug,
      label: item.label,
      blurb: item.blurb ?? "",
      sections: item.sections.join(", "),
      display_order: String(item.display_order),
      is_active: String(item.is_active),
    };
  }

  const handleSave = async () => {
    const ff = f[item.id];
    if (!ff.slug?.trim()) {
      toast.error("Slug wajib diisi");
      return;
    }
    if (!ff.label?.trim()) {
      toast.error("Label wajib diisi");
      return;
    }

    setBusy(item.id);
    try {
      const patch: Record<string, any> = { id: item.id, slug: ff.slug.trim(), label: ff.label.trim() };
      if (ff.blurb !== undefined) patch.blurb = ff.blurb.trim() || null;
      if (ff.sections?.trim()) patch.sections = ff.sections.trim();
      if (ff.display_order !== undefined) patch.display_order = ff.display_order;
      if (ff.is_active !== undefined) patch.is_active = ff.is_active;

      const res = await fetch("/api/admin/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan perubahan");
      toast.success("Perubahan disimpan");
      onCancel();
      delete f[item.id];
      // fetchItems dipanggil di parent lewat onSave
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-4 border-emerald-200 rounded-xl bg-emerald-50 mt-4">
      <h3 className="text-xs font-bold text-emerald-800 mb-3">Edit Kegiatan</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-1">
          <Label className="text-[9px] text-stone-500 block mb-1">Slug</Label>
          <Input
            value={f[item.id].slug}
            onChange={(e) =>
              (f[item.id].slug = e.target.value.toLowerCase().replace(/\s+/g, "-"))
            }
            className="mt-1 h-8 rounded-lg text-[10px]"
          />
        </div>
        <div className="col-span-1 sm:col-span-1">
          <Label className="text-[9px] text-stone-500 block mb-1">Label</Label>
          <Input
            value={f[item.id].label}
            onChange={(e) => (f[item.id].label = e.target.value)}
            className="mt-1 h-8 rounded-lg text-[10px]"
          />
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
          <Label className="text-[9px] text-stone-500 block mb-1">Blurb</Label>
          <Input
            value={f[item.id].blurb}
            onChange={(e) => (f[item.id].blurb = e.target.value)}
            className="mt-1 h-8 rounded-lg text-[10px]"
          />
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <Label className="text-[9px] text-stone-500 block mb-1">Seksi</Label>
          <Input
            value={f[item.id].sections}
            onChange={(e) => (f[item.id].sections = e.target.value)}
            placeholder="gear, products"
            className="mt-1 h-8 rounded-lg text-[10px]"
          />
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <Label className="text-[9px] text-stone-500 block mb-1">Urutan</Label>
          <Input
            type="number"
            value={f[item.id].display_order}
            onChange={(e) => (f[item.id].display_order = e.target.value)}
            className="mt-1 h-8 rounded-lg text-[10px]"
          />
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <Label className="text-[9px] text-stone-500 block mb-1 flex items-center gap-1">
            <input
              type="checkbox"
              checked={f[item.id].is_active === "true"}
              onChange={(e) =>
                (f[item.id].is_active = e.target.checked ? "true" : "false")
              }
              className="w-4 h-4 rounded accent-emerald-600"
            />
            Aktif
          </Label>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={busy}
            className="h-8 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:bg-stone-300"
          >
            {busy ? "Menyimpan..." : <><Save className="w-3.5 h-3.5 mr-1.5" /> Simpan</>}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="h-8 flex-1 rounded-lg border-stone-300 text-stone-700 disabled:bg-stone-300"
          >
            Batal
          </Button>
        </div>
      </div>
    </Card>
  );
}
