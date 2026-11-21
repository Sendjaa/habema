"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  CheckCircle2,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Kelola seluruh konten Open Trip.
 *
 * Sebelum halaman ini ada, jadwal trip hanya bisa diubah lewat API, sementara
 * voucher, gear add-on, FAQ, dan galeri lapangan ditulis statis di
 * app/opentrip/page.tsx. Setiap tab di sini menulis ke tabel ot_* lewat
 * /api/admin/opentrip-content (jadwal memakai /api/ot-trips yang sudah ada).
 */

type TabId = "trips" | "categories" | "vouchers" | "gear" | "faqs" | "gallery";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "trips", label: "Jadwal Trip", icon: CalendarDays },
  { id: "categories", label: "Kategori", icon: MapPin },
  { id: "vouchers", label: "Voucher", icon: Tag },
  { id: "gear", label: "Gear Add-on", icon: ListChecks },
  { id: "faqs", label: "FAQ", icon: CheckCircle2 },
  { id: "gallery", label: "Galeri Lapangan", icon: ImageIcon },
];

type FieldType = "text" | "textarea" | "number" | "checkbox" | "date" | "select" | "lines";

type ContentField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  full?: boolean;
  defaultValue?: string | number | boolean;
};

type ResourceConfig = {
  resource: string;
  noun: string;
  fields: ContentField[];
  columns: { key: string; label: string }[];
};

const CONTENT: Record<Exclude<TabId, "trips">, ResourceConfig> = {
  categories: {
    resource: "categories",
    noun: "kategori",
    fields: [
      { key: "name", label: "Nama kategori", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", help: "Kosongkan untuk dibuat otomatis dari nama." },
      { key: "description", label: "Deskripsi", type: "textarea", full: true },
      { key: "icon", label: "Ikon (emoji)", type: "text", placeholder: "🎒" },
      { key: "color", label: "Warna", type: "text", placeholder: "#10b981" },
      { key: "sort_order", label: "Urutan", type: "number", defaultValue: 0 },
      { key: "is_active", label: "Aktif tampil di halaman", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "name", label: "Nama" },
      { key: "slug", label: "Slug" },
      { key: "sort_order", label: "Urutan" },
      { key: "is_active", label: "Aktif" },
    ],
  },
  vouchers: {
    resource: "vouchers",
    noun: "voucher",
    fields: [
      { key: "code", label: "Kode voucher", type: "text", required: true, placeholder: "HABEMA10" },
      { key: "title", label: "Judul", type: "text", required: true },
      { key: "discount_amount", label: "Potongan (Rp)", type: "number", required: true, defaultValue: 0 },
      { key: "min_participants", label: "Minimal peserta", type: "number", defaultValue: 1 },
      { key: "valid_until", label: "Berlaku sampai", type: "date" },
      { key: "sort_order", label: "Urutan", type: "number", defaultValue: 0 },
      { key: "is_active", label: "Aktif tampil di halaman", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "code", label: "Kode" },
      { key: "title", label: "Judul" },
      { key: "discount_amount", label: "Potongan" },
      { key: "min_participants", label: "Min. peserta" },
      { key: "is_active", label: "Aktif" },
    ],
  },
  gear: {
    resource: "gear",
    noun: "gear add-on",
    fields: [
      { key: "name", label: "Nama item", type: "text", required: true },
      { key: "spec", label: "Spesifikasi", type: "text" },
      { key: "price_per_trip", label: "Harga per trip (Rp)", type: "number", defaultValue: 0 },
      { key: "sort_order", label: "Urutan", type: "number", defaultValue: 0 },
      { key: "is_active", label: "Aktif tampil di halaman", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "name", label: "Nama" },
      { key: "spec", label: "Spesifikasi" },
      { key: "price_per_trip", label: "Harga" },
      { key: "is_active", label: "Aktif" },
    ],
  },
  faqs: {
    resource: "faqs",
    noun: "FAQ",
    fields: [
      { key: "question", label: "Pertanyaan", type: "text", required: true, full: true },
      { key: "answer", label: "Jawaban", type: "textarea", required: true, full: true },
      { key: "sort_order", label: "Urutan", type: "number", defaultValue: 0 },
      { key: "is_active", label: "Aktif tampil di halaman", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "question", label: "Pertanyaan" },
      { key: "sort_order", label: "Urutan" },
      { key: "is_active", label: "Aktif" },
    ],
  },
  gallery: {
    resource: "gallery",
    noun: "foto galeri",
    fields: [
      {
        key: "image_url",
        label: "Foto galeri",
        type: "text",
        required: true,
        full: true,
        help: "Format JPEG, PNG, atau WebP. Maksimal 5 MB.",
      },
      { key: "caption", label: "Caption", type: "text", full: true },
      { key: "trip_title", label: "Nama trip", type: "text" },
      { key: "location", label: "Lokasi", type: "text" },
      { key: "elevation", label: "Elevasi", type: "text", placeholder: "2.565 mdpl" },
      { key: "taken_at", label: "Tanggal foto", type: "date" },
      { key: "sort_order", label: "Urutan", type: "number", defaultValue: 0 },
      { key: "is_active", label: "Aktif tampil di halaman", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "trip_title", label: "Trip" },
      { key: "location", label: "Lokasi" },
      { key: "taken_at", label: "Tanggal" },
      { key: "is_active", label: "Aktif" },
    ],
  },
};

function rupiah(value: unknown): string {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function emptyForm(fields: ContentField[]): Record<string, any> {
  const form: Record<string, any> = {};
  for (const field of fields) {
    form[field.key] = field.defaultValue ?? (field.type === "checkbox" ? false : "");
  }
  return form;
}

function rowToForm(row: Record<string, any>, fields: ContentField[]): Record<string, any> {
  const form: Record<string, any> = {};
  for (const field of fields) {
    const value = row[field.key];
    if (field.type === "checkbox") form[field.key] = Boolean(value);
    else if (field.type === "date") form[field.key] = value ? String(value).slice(0, 10) : "";
    else form[field.key] = value ?? "";
  }
  return form;
}

function ImageUploadField({
  value,
  onUpload,
}: {
  value: string;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Pilih file JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 5 MB.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/opentrip-content/upload", {
        method: "POST",
        body: fd,
      });
      const raw = await res.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        throw new Error(
          json?.error ||
            (res.status === 404
              ? "Endpoint upload tidak ditemukan. Muat ulang halaman admin lalu coba lagi."
              : raw.slice(0, 200) || `HTTP ${res.status}`),
        );
      }
      if (!json?.data?.url) throw new Error("Server tidak mengembalikan URL gambar.");
      onUpload(String(json.data.url));
      toast.success("Gambar berhasil diunggah");
    } catch (error: any) {
      setUploadError(error?.message || "Gagal mengunggah gambar");
      toast.error(error?.message || "Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          void handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Mengunggah..." : value ? "Ganti gambar" : "Pilih gambar"}
      </Button>
      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Pratinjau foto galeri"
          width={384}
          height={176}
          className="h-44 w-full max-w-sm rounded-md border border-stone-200 bg-stone-100 object-cover"
        />
      ) : (
        <div className="flex h-32 w-full max-w-sm items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-50 text-xs text-muted-foreground">
          Belum ada gambar
        </div>
      )}
    </div>
  );
}

function ContentTab({ config }: { config: ResourceConfig }) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/opentrip-content/${config.resource}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (error: any) {
      toast.error(error?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [config.resource]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(config.fields));
  };

  const openEdit = (row: Record<string, any>) => {
    setEditingId(String(row.id));
    setForm(rowToForm(row, config.fields));
  };

  const submit = async () => {
    if (!form) return;
    const missing = config.fields.filter((field) => field.required && !String(form[field.key] ?? "").trim());
    if (missing.length > 0) {
      toast.error(`Lengkapi: ${missing.map((field) => field.label).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/opentrip-content/${config.resource}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success(`${config.noun} berhasil ${editingId ? "diperbarui" : "ditambahkan"}`);
      setForm(null);
      setEditingId(null);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Record<string, any>) => {
    if (!confirm(`Hapus ${config.noun} ini?`)) return;
    try {
      const res = await fetch(
        `/api/admin/opentrip-content/${config.resource}?id=${encodeURIComponent(row.id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success(`${config.noun} dihapus`);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} {config.noun} tersimpan.
        </p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah {config.noun}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada data. Klik &quot;Tambah {config.noun}&quot; untuk membuat yang pertama.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-medium whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    {config.columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 align-top">
                        {column.key === "is_active" ? (
                          <Badge variant={row.is_active ? "default" : "secondary"}>
                            {row.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        ) : column.key === "discount_amount" || column.key === "price_per_trip" ? (
                          rupiah(row[column.key])
                        ) : (
                          <span className="line-clamp-2">{String(row[column.key] ?? "—")}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Ubah">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(row)}
                        title="Hapus"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">
                {editingId ? "Ubah" : "Tambah"} {config.noun}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setForm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
              {config.fields.map((field) => (
                <div key={field.key} className={field.full ? "sm:col-span-2" : undefined}>
                  {field.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm pt-6">
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.key])}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                        className="h-4 w-4"
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <Label className="mb-1.5 block text-sm">
                        {field.label}
                        {field.required && <span className="text-destructive"> *</span>}
                      </Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          rows={4}
                          value={form[field.key] ?? ""}
                          placeholder={field.placeholder}
                          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        />
                      ) : config.resource === "gallery" && field.key === "image_url" ? (
                        <ImageUploadField
                          value={String(form?.image_url ?? "")}
                          onUpload={(url: string) => {
                            setForm((prev) => (prev ? { ...prev, image_url: url } : prev));
                          }}
                        />
                      ) : (
                        <Input
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          value={form[field.key] ?? ""}
                          placeholder={field.placeholder}
                          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        />
                      )}
                      {field.help && <p className="text-xs text-muted-foreground mt-1">{field.help}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>
                Batal
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

type TripRow = Record<string, any>;

function toLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return [];
}

const TRIP_STATUS = ["draft", "published", "full", "completed", "archived"];
const DIFFICULTY = [
  { value: "", label: "—" },
  { value: "easy", label: "Mudah" },
  { value: "moderate", label: "Menengah" },
  { value: "challenging", label: "Menantang" },
  { value: "expert", label: "Ahli" },
];

function TripsTab({ categories }: { categories: Record<string, any>[] }) {
  const [rows, setRows] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TripRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ot-trips?status=all&limit=50&sort=departure_desc", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (error: any) {
      toast.error(error?.message || "Gagal memuat jadwal trip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const blankForm = (): TripRow => ({
    title: "",
    destination: "",
    destination_region: "",
    short_description: "",
    description: "",
    base_price: "",
    discount_price: "",
    tax_amount: "",
    duration_days: 1,
    duration_nights: 0,
    min_participants: 1,
    max_participants: 10,
    departure_date: "",
    return_date: "",
    departure_time: "",
    return_time: "",
    category_id: "",
    difficulty_level: "",
    fitness_required: "",
    featured_image: "",
    gallery_images: "",
    highlights: "",
    inclusions: "",
    exclusions: "",
    what_to_bring: "",
    important_notes: "",
    cancellation_policy: "",
    refund_policy: "",
    min_age: "",
    max_age: "",
    status: "draft",
    featured: false,
    priority: 0,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm());
  };

  const openEdit = (row: TripRow) => {
    setEditingId(String(row.id));
    setForm({
      title: row.title ?? "",
      destination: row.destination ?? "",
      destination_region: row.destination_region ?? "",
      short_description: row.short_description ?? "",
      description: row.description ?? "",
      base_price: row.base_price ?? "",
      discount_price: row.discount_price ?? "",
      tax_amount: row.tax_amount ?? "",
      duration_days: row.duration_days ?? 1,
      duration_nights: row.duration_nights ?? 0,
      min_participants: row.min_participants ?? 1,
      max_participants: row.max_participants ?? 10,
      departure_date: row.departure_date ? String(row.departure_date).slice(0, 10) : "",
      return_date: row.return_date ? String(row.return_date).slice(0, 10) : "",
      departure_time: row.departure_time ?? "",
      return_time: row.return_time ?? "",
      category_id: row.category_id ?? "",
      difficulty_level: row.difficulty_level ?? "",
      fitness_required: row.fitness_required ?? "",
      featured_image: row.featured_image ?? "",
      gallery_images: toLines(row.gallery_images).join("\n"),
      highlights: toLines(row.highlights).join("\n"),
      inclusions: toLines(row.inclusions).join("\n"),
      exclusions: toLines(row.exclusions).join("\n"),
      what_to_bring: toLines(row.what_to_bring).join("\n"),
      important_notes: toLines(row.important_notes).join("\n"),
      cancellation_policy: row.cancellation_policy ?? "",
      refund_policy: row.refund_policy ?? "",
      min_age: row.min_age ?? "",
      max_age: row.max_age ?? "",
      status: row.status ?? "draft",
      featured: Boolean(row.featured),
      priority: row.priority ?? 0,
    });
  };

  const submit = async () => {
    if (!form) return;
    if (!form.title || !form.destination || !form.description) {
      toast.error("Judul, destinasi, dan deskripsi wajib diisi.");
      return;
    }

    const lines = (value: string) =>
      String(value ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const base = Number(form.base_price) || 0;
    const discount = Number(form.discount_price) || 0;
    const tax = Number(form.tax_amount) || 0;

    const payload = {
      ...form,
      base_price: base,
      discount_price: discount,
      tax_amount: tax,
      final_price: base - discount + tax,
      duration_days: Number(form.duration_days) || 1,
      duration_nights: Number(form.duration_nights) || 0,
      min_participants: Number(form.min_participants) || 1,
      max_participants: Number(form.max_participants) || 1,
      priority: Number(form.priority) || 0,
      min_age: form.min_age === "" ? null : Number(form.min_age),
      max_age: form.max_age === "" ? null : Number(form.max_age),
      difficulty_level: form.difficulty_level || null,
      category_id: form.category_id || null,
      gallery_images: lines(form.gallery_images),
      highlights: lines(form.highlights),
      inclusions: lines(form.inclusions),
      exclusions: lines(form.exclusions),
      what_to_bring: lines(form.what_to_bring),
      important_notes: lines(form.important_notes),
    };

    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/ot-trips/${editingId}` : "/api/ot-trips", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      toast.success(`Jadwal berhasil ${editingId ? "diperbarui" : "dibuat"}`);
      setForm(null);
      setEditingId(null);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan jadwal");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: TripRow) => {
    if (!confirm(`Hapus jadwal "${row.title}"? Tindakan ini permanen.`)) return;
    try {
      const res = await fetch(`/api/ot-trips/${row.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success("Jadwal dihapus");
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menghapus jadwal");
    }
  };

  const textField = (key: string, label: string, props?: Record<string, any>) => (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <Input
        value={form?.[key] ?? ""}
        onChange={(e) => setForm({ ...(form as TripRow), [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  const numberField = (key: string, label: string, props?: Record<string, any>) => (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <Input
        type="number"
        value={form?.[key] ?? ""}
        onChange={(e) => setForm({ ...(form as TripRow), [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  const linesField = (key: string, label: string, placeholder?: string) => (
    <div className="sm:col-span-2">
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <Textarea
        rows={3}
        value={form?.[key] ?? ""}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...(form as TripRow), [key]: e.target.value })}
      />
      <p className="text-xs text-muted-foreground mt-1">Satu item per baris.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{rows.length} jadwal tersimpan.</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah jadwal
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada jadwal. Tambahkan jadwal pertama agar tampil di halaman /opentrip.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Keberangkatan</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Peserta</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Harga</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.destination}
                        {row.destination_region ? ` • ${row.destination_region}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.departure_date ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.current_participants ?? 0}/{row.max_participants ?? 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{rupiah(row.final_price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === "published" ? "default" : "secondary"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Ubah">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(row)}
                        title="Hapus"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">{editingId ? "Ubah jadwal" : "Tambah jadwal"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setForm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[68vh] overflow-y-auto">
              {textField("title", "Judul trip *")}
              {textField("destination", "Destinasi *")}
              {textField("destination_region", "Region destinasi", { placeholder: "Garut, Jawa Barat" })}
              <div>
                <Label className="mb-1.5 block text-sm">Kategori</Label>
                <select
                  value={form.category_id ?? ""}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-sm">Deskripsi singkat</Label>
                <Input
                  value={form.short_description ?? ""}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-sm">Deskripsi lengkap *</Label>
                <Textarea
                  rows={4}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {numberField("base_price", "Harga dasar (Rp) *")}
              {numberField("discount_price", "Diskon (Rp)")}
              {numberField("tax_amount", "Pajak (Rp)")}
              <div>
                <Label className="mb-1.5 block text-sm">Status</Label>
                <select
                  value={form.status ?? "draft"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {TRIP_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {textField("departure_date", "Tanggal berangkat *", { type: "date" })}
              {textField("return_date", "Tanggal pulang *", { type: "date" })}
              {textField("departure_time", "Jam berangkat", { placeholder: "20:00 WIB" })}
              {textField("return_time", "Jam pulang", { placeholder: "21:00 WIB" })}

              {numberField("duration_days", "Durasi (hari) *")}
              {numberField("duration_nights", "Durasi (malam)")}
              {numberField("min_participants", "Minimal peserta")}
              {numberField("max_participants", "Maksimal peserta *")}

              <div>
                <Label className="mb-1.5 block text-sm">Tingkat kesulitan</Label>
                <select
                  value={form.difficulty_level ?? ""}
                  onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {DIFFICULTY.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {textField("fitness_required", "Kebutuhan fisik", {
                placeholder: "Mampu trekking 3 jam",
              })}
              {numberField("min_age", "Usia minimum")}
              {numberField("max_age", "Usia maksimum")}
              {numberField("priority", "Prioritas urutan")}
              <label className="flex items-center gap-2 text-sm pt-6">
                <input
                  type="checkbox"
                  checked={Boolean(form.featured)}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4"
                />
                Tampilkan sebagai trip unggulan
              </label>

              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-sm">URL gambar utama</Label>
                <Input
                  value={form.featured_image ?? ""}
                  onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                />
              </div>
              {linesField("gallery_images", "URL galeri trip")}

              {linesField("highlights", "Highlight")}
              {linesField("inclusions", "Termasuk")}
              {linesField("exclusions", "Tidak termasuk")}
              {linesField("what_to_bring", "Perlengkapan yang dibawa")}
              {linesField("important_notes", "Catatan penting")}

              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-sm">Kebijakan pembatalan</Label>
                <Textarea
                  rows={2}
                  value={form.cancellation_policy ?? ""}
                  onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-sm">Kebijakan refund</Label>
                <Textarea
                  rows={2}
                  value={form.refund_policy ?? ""}
                  onChange={(e) => setForm({ ...form, refund_policy: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>
                Batal
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan jadwal
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AdminOpenTripPage() {
  const [tab, setTab] = useState<TabId>("trips");
  const [categories, setCategories] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/admin/opentrip-content/categories", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && res.ok) setCategories(Array.isArray(json.data) ? json.data : []);
      } catch {
        // Tab kategori akan menampilkan pesan errornya sendiri.
      }
    };
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const contentTab = useMemo(() => (tab === "trips" ? null : CONTENT[tab]), [tab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Open Trip</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola jadwal, kategori, voucher, gear add-on, FAQ, dan galeri lapangan yang tampil di
            halaman /opentrip.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/opentrip" target="_blank">
            Lihat halaman
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "trips" ? (
        <TripsTab categories={categories} />
      ) : (
        contentTab && <ContentTab key={contentTab.resource} config={contentTab} />
      )}
    </div>
  );
}
