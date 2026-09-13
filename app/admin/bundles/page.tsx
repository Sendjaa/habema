"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  BundleListEditor,
  mergeBundleItemsIntoRows,
  newBundleRow,
  rowsFromLegacyList,
  serializeBundleRows,
  type BundleLineRow,
} from "@/components/admin/bundle-list-editor";

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  target_audience: string | null;
  bundle_price: number;
  original_price: number | null;
  discount_percentage: number | null;
  image_url: string | null;
  includes: string[] | null;
  excludes: string[] | null;
  pax_min: number | null;
  pax_max: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

const AUDIENCES = ["Open Trip", "Camping Keluarga", "Private Camp", "Campervan", "Paket Rental Grup"];

const emptyForm = {
  name: "",
  target_audience: "Paket Rental Grup",
  description: "",
  bundle_price: "",
  original_price: "",
  discount_percentage: "",
  image_url: "",
  pax_min: "",
  pax_max: "",
  is_active: true,
};

const formatRp = (n: number | null | undefined) =>
  n == null
    ? "-"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(n);

export default function BundlesManagement() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  // Baris Include/Exclude terstruktur (pengganti textarea).
  const [includeRows, setIncludeRows] = useState<BundleLineRow[]>([newBundleRow({ qty: 1 })]);
  const [excludeRows, setExcludeRows] = useState<BundleLineRow[]>([newBundleRow()]);
  // True bila komposisi stok berhasil dimuat (edit) / tidak relevan (create).
  // PUT items hanya dijalankan bila true agar tidak menghapus data saat gagal load.
  const [itemsHydrated, setItemsHydrated] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchBundles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/bundles?${params}`);
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result?.error || `HTTP ${res.status}`);
      setBundles(result.data || []);
    } catch (e: any) {
      console.error("Error fetching bundles:", e);
      toast.error(e?.message || "Gagal memuat bundles");
      setBundles([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setIncludeRows([newBundleRow({ qty: 1 })]);
    setExcludeRows([newBundleRow()]);
    setItemsHydrated(true);
    setShowModal(true);
  };

  const openEdit = async (b: Bundle) => {
    setEditing(b);
    setForm({
      name: b.name || "",
      target_audience: b.target_audience || "Paket Rental Grup",
      description: b.description || "",
      bundle_price: String(b.bundle_price ?? ""),
      original_price: b.original_price != null ? String(b.original_price) : "",
      discount_percentage: b.discount_percentage != null ? String(b.discount_percentage) : "",
      image_url: b.image_url || "",
      pax_min: b.pax_min != null ? String(b.pax_min) : "",
      pax_max: b.pax_max != null ? String(b.pax_max) : "",
      is_active: b.is_active !== false,
    });
    // Parse teks lama jadi baris agar langsung bisa diedit.
    const parsedInc = rowsFromLegacyList(b.includes);
    const parsedExc = rowsFromLegacyList(b.excludes);
    setIncludeRows(parsedInc.length > 0 ? parsedInc : [newBundleRow({ qty: 1 })]);
    setExcludeRows(parsedExc.length > 0 ? parsedExc : [newBundleRow()]);
    setItemsHydrated(false);
    setShowModal(true);
    // Gabungkan komposisi stok (ground truth) ke baris Include by nama alat.
    try {
      const res = await fetch(`/api/admin/bundles/${b.id}/items`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memuat komposisi");
      const items = (json.data || [])
        .map((r: any) => ({
          equipment_id: String(r.equipment?.id || ""),
          name: String(r.equipment?.name || ""),
          price: Number(r.equipment?.price_per_night) || 0,
          quantity: Number(r.quantity) || 1,
        }))
        .filter((r: any) => r.equipment_id && r.name);
      setIncludeRows((prev) => mergeBundleItemsIntoRows(prev, items));
      setItemsHydrated(true);
    } catch {
      // Biarkan baris teks apa adanya; sync stok dilewati saat simpan.
    }
  };

  const set = (k: keyof typeof emptyForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const cleanRows = (rows: BundleLineRow[]) =>
    rows
      .map((r) => ({
        ...r,
        label: r.label.trim(),
        qty: r.qty == null ? null : Math.max(1, Math.round(r.qty) || 1),
      }))
      .filter((r) => r.label !== "");

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Nama bundle wajib diisi");
      return;
    }
    const price = Number(form.bundle_price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Harga bundle tidak valid");
      return;
    }
    const cleanIncludes = cleanRows(includeRows);
    if (cleanIncludes.length === 0) {
      toast.error("Include minimal 1 baris");
      return;
    }
    const cleanExcludes = cleanRows(excludeRows);
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        target_audience: form.target_audience.trim() || null,
        description: form.description.trim() || null,
        bundle_price: Math.round(price),
        original_price: form.original_price === "" ? null : Number(form.original_price),
        discount_percentage: form.discount_percentage === "" ? null : Number(form.discount_percentage),
        image_url: form.image_url.trim() || null,
        includes: serializeBundleRows(cleanIncludes),
        excludes: serializeBundleRows(cleanExcludes),
        pax_min: form.pax_min === "" ? null : Number(form.pax_min),
        pax_max: form.pax_max === "" ? null : Number(form.pax_max),
        is_active: form.is_active,
      };
      const url = editing ? `/api/admin/bundles/${editing.id}` : "/api/admin/bundles";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result?.error || `HTTP ${res.status}`);
      // Sinkronkan baris ter-link katalog ke bundle_items (sumber cek stok).
      // Dilewati bila komposisi gagal dimuat saat edit agar tidak menghapus data.
      const savedId = editing ? editing.id : result.data?.id;
      const linked = cleanIncludes.filter((r) => r.equipment_id);
      if (savedId && (linked.length > 0 || (editing && itemsHydrated))) {
        try {
          const resItems = await fetch(`/api/admin/bundles/${savedId}/items`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: linked.map((r) => ({ equipment_id: r.equipment_id, quantity: r.qty ?? 1 })),
            }),
          });
          const jsonItems = await resItems.json().catch(() => ({}));
          if (!resItems.ok || !jsonItems.success) throw new Error(jsonItems.error || "Gagal menyimpan komposisi");
        } catch (e: any) {
          toast.warning("Paket tersimpan, tapi komposisi stok gagal disinkronkan. Buka Edit untuk mengulang.");
          setShowModal(false);
          fetchBundles();
          return;
        }
      }
      toast.success(editing ? "Bundle diperbarui" : "Bundle ditambahkan");
      setShowModal(false);
      fetchBundles();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan bundle");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: Bundle) => {
    try {
      const res = await fetch(`/api/admin/bundles/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !(b.is_active !== false) }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result?.error || `HTTP ${res.status}`);
      toast.success(b.is_active !== false ? "Bundle dinonaktifkan" : "Bundle diaktifkan");
      fetchBundles();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengubah status");
    }
  };

  const remove = async (b: Bundle) => {
    if (!confirm(`Hapus bundle "${b.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/admin/bundles/${b.id}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result?.error || `HTTP ${res.status}`);
      toast.success("Bundle dihapus");
      fetchBundles();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus bundle");
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
              Bundles / Paket
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {bundles.length} paket · tampil di /bundles, /packages, /opentrip
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBundles}
              className="h-9 px-3 text-xs text-stone-500 hover:text-stone-800 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openAdd}
              className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Bundle
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, kategori, deskripsi..."
            className="pl-9 h-10 bg-white border-stone-200 rounded-xl text-sm"
          />
        </div>

        <Card className="border-stone-200 rounded-xl shadow-none overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            </div>
          ) : bundles.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-stone-500">
                {searchTerm ? "Bundle tidak ditemukan" : "Belum ada bundle"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="lg:hidden divide-y divide-stone-100">
                {bundles.map((b) => (
                  <div key={b.id} className="p-4 space-y-3">
                    <div className="flex gap-3">
                      {b.image_url ? (
                        <img src={b.image_url} alt={b.name} className="w-16 h-16 rounded-lg object-cover border border-stone-200 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-stone-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-stone-900 truncate">{b.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {b.target_audience && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">{b.target_audience}</Badge>
                          )}
                          <Badge className={`${b.is_active !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-500 border-stone-200"} text-[10px]`}>
                            {b.is_active !== false ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-stone-900 mt-1">
                          {formatRp(b.bundle_price)}
                          {b.original_price != null && (
                            <span className="ml-2 text-xs font-normal text-stone-400 line-through">{formatRp(b.original_price)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs flex-1 rounded-lg" onClick={() => openEdit(b)}>
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => toggleActive(b)}>
                        {b.is_active !== false ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 rounded-lg" onClick={() => remove(b)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Paket</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Kategori</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Harga</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.map((b) => (
                      <tr key={b.id} className="border-b border-stone-100 hover:bg-stone-50/60">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {b.image_url ? (
                              <img src={b.image_url} alt={b.name} className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-stone-300" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900 truncate max-w-56">{b.name}</p>
                              {b.description && <p className="text-xs text-stone-400 truncate max-w-56">{b.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {b.target_audience ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">{b.target_audience}</Badge>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-semibold text-stone-900">{formatRp(b.bundle_price)}</p>
                          {b.original_price != null && (
                            <p className="text-xs text-stone-400 line-through">{formatRp(b.original_price)}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${b.is_active !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-500 border-stone-200"} text-[10px]`}>
                            {b.is_active !== false ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-stone-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Edit" onClick={() => openEdit(b)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px] text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg" title="Aktif/Nonaktif" onClick={() => toggleActive(b)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Hapus" onClick={() => remove(b)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Modal tambah/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border-stone-200 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
                  {editing ? "Edit Bundle" : "Tambah Bundle"}
                </h2>
                <Button variant="ghost" size="sm" className="text-stone-400 rounded-lg" onClick={() => setShowModal(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-stone-500">Nama paket *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="cth. Open Trip Sunrise" className="mt-1 h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-stone-500">Kategori / target</Label>
                    <Input value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)} list="bundle-audiences" placeholder="Open Trip" className="mt-1 h-10 rounded-lg" />
                    <datalist id="bundle-audiences">
                      {AUDIENCES.map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => set("is_active", e.target.checked)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      Tampilkan di website
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Deskripsi</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="Deskripsi singkat paket..."
                    className="mt-1 w-full p-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-stone-500">Harga (Rp) *</Label>
                    <Input value={form.bundle_price} onChange={(e) => set("bundle_price", e.target.value)} inputMode="numeric" placeholder="150000" className="mt-1 h-10 rounded-lg" />
                    <p className="text-[11px] text-stone-400 mt-1">Untuk Paket Rental Grup = per paket per malam.</p>
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Harga coret (Rp)</Label>
                    <Input value={form.original_price} onChange={(e) => set("original_price", e.target.value)} inputMode="numeric" placeholder="Opsional" className="mt-1 h-10 rounded-lg" />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Diskon (%)</Label>
                    <Input value={form.discount_percentage} onChange={(e) => set("discount_percentage", e.target.value)} inputMode="decimal" placeholder="Opsional" className="mt-1 h-10 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-stone-500">Pax min (orang)</Label>
                    <Input value={form.pax_min} onChange={(e) => set("pax_min", e.target.value)} inputMode="numeric" placeholder="cth. 2" className="mt-1 h-10 rounded-lg" />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Pax max (orang)</Label>
                    <Input value={form.pax_max} onChange={(e) => set("pax_max", e.target.value)} inputMode="numeric" placeholder="cth. 2 / 7 / 10" className="mt-1 h-10 rounded-lg" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">URL gambar</Label>
                  <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." className="mt-1 h-10 rounded-lg" />
                  {form.image_url && (
                    <img src={form.image_url} alt="Preview" className="mt-2 w-full h-36 rounded-lg object-cover border border-stone-200" />
                  )}
                </div>
                <div className="space-y-4">
                  <BundleListEditor
                    title="Include — isi paket *"
                    hint="Cari alat katalog untuk baris ber-pcs (otomatis potong stok saat dibooking), atau tambah baris kustom untuk jasa/layanan. Kolom pcs opsional."
                    rows={includeRows}
                    onChange={setIncludeRows}
                    defaultQty={1}
                    namePlaceholder="cth. Tenda kap 4"
                  />
                  <BundleListEditor
                    title="Exclude"
                    hint="Hal yang tidak termasuk. Kolom pcs opsional, hanya untuk tampilan."
                    rows={excludeRows}
                    onChange={setExcludeRows}
                    defaultQty={null}
                    namePlaceholder="cth. Tiket masuk kawasan"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setShowModal(false)} disabled={saving}>
                    Batal
                  </Button>
                  <Button className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" onClick={save} disabled={saving}>
                    {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Bundle"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
