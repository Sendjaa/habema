"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Edit, ExternalLink, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Manajemen instansi untuk logo cloud homepage.
 *
 * Baris baru selalu lahir nonaktif: menampilkan nama instansi adalah klaim
 * publik, jadi tombol "Tampilkan" hanya boleh dinyalakan setelah izin tertulis
 * dicatat di consent_note. Form memperingatkan hal itu, tidak melarang —
 * penilai akhirnya manusia.
 */

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  sector: string | null;
  documentation_slug: string | null;
  display_order: number;
  is_active: boolean;
  consent_note: string | null;
}

const SECTORS = ["Pendidikan", "Korporat", "Komunitas", "Yayasan", "Pemerintah"];

const emptyForm = {
  name: "",
  sector: "",
  logo_url: "",
  documentation_slug: "",
  display_order: "0",
  consent_note: "",
  is_active: false,
};

export default function OrganizationsManagement() {
  const [rows, setRows] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations?search=${encodeURIComponent(search)}`);
      const result = await res.json();
      if (result.success) setRows(result.data || []);
      else toast.error(result.error || "Gagal memuat data instansi");
    } catch {
      toast.error("Gagal memuat data instansi");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchRows, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchRows, search]);

  const set = (key: keyof typeof emptyForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (org: Organization) => {
    setEditing(org);
    setForm({
      name: org.name,
      sector: org.sector || "",
      logo_url: org.logo_url || "",
      documentation_slug: org.documentation_slug || "",
      display_order: String(org.display_order ?? 0),
      consent_note: org.consent_note || "",
      is_active: org.is_active,
    });
    setShowForm(true);
  };

  const payload = () => ({
    name: form.name,
    sector: form.sector,
    logo_url: form.logo_url,
    documentation_slug: form.documentation_slug,
    display_order: form.display_order,
    consent_note: form.consent_note,
    is_active: form.is_active,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama instansi wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/organizations/${editing.id}` : "/api/admin/organizations",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload()),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan instansi");

      toast.success(editing ? "Instansi diperbarui" : "Instansi baru ditambahkan");
      setShowForm(false);
      setEditing(null);
      fetchRows();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (org: Organization) => {
    if (org.is_active) {
      // Menyembunyikan selalu aman; menampilkan yang perlu peringatan.
      await update(org, { is_active: false }, ` "${org.name}" disembunyikan dari homepage`);
      return;
    }
    if (!org.consent_note?.trim()) {
      openEdit(org);
      toast.error("Catat izin tertulis di Consent dulu sebelum menampilkan instansi ini");
      return;
    }
    await update(org, { is_active: true }, `"${org.name}" tampil di logo cloud`);
  };

  const update = async (org: Organization, fields: Record<string, unknown>, message: string) => {
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengubah instansi");
      toast.success(message);
      fetchRows();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const handleDelete = async (org: Organization) => {
    if (!window.confirm(`Hapus instansi "${org.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus instansi");
      toast.success("Instansi dihapus");
      fetchRows();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const shown = rows.filter((r) => r.is_active).length;

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Instansi &amp; Komunitas
            </h1>
            <p className="text-[10px] text-stone-400">
              Logo cloud di homepage — {shown} dari {rows.length} instansi tampil
            </p>
          </div>
          <Button
            size="sm"
            onClick={openNew}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tambah Instansi
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau sektor..."
          className="h-10 rounded-lg bg-white border-stone-200"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center border-stone-200 rounded-xl">
            <Building2 className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="text-sm text-stone-400">
              {search ? "Tidak ada instansi yang cocok" : "Belum ada instansi terdaftar"}
            </p>
          </Card>
        ) : (
          rows.map((org) => (
            <Card key={org.id} className="p-4 border-stone-200 rounded-xl bg-white">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-stone-800 truncate">{org.name}</p>
                    <Badge
                      className={`text-[9px] shrink-0 ${
                        org.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {org.is_active ? "Ditampilkan" : "Tersembunyi"}
                    </Badge>
                    {org.sector && (
                      <Badge className="text-[9px] shrink-0 bg-stone-100 text-stone-500">
                        {org.sector}
                      </Badge>
                    )}
                    <span className="text-[10px] text-stone-400 shrink-0">
                      urutan {org.display_order}
                    </span>
                  </div>

                  {org.consent_note ? (
                    <p className="text-[10px] text-stone-500 mt-1">Consent: {org.consent_note}</p>
                  ) : (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Izin tertulis belum dicatat — tidak bisa ditampilkan
                    </p>
                  )}

                  {org.documentation_slug && (
                    <a
                      href={`/organisasi/${org.documentation_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline mt-1"
                    >
                      Halaman dokumentasi <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 px-2 text-[10px] rounded-lg ${
                      org.is_active ? "text-stone-400 hover:text-amber-600" : "text-stone-400 hover:text-emerald-600"
                    }`}
                    onClick={() => handleToggle(org)}
                  >
                    {org.is_active ? "Sembunyikan" : "Tampilkan"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-stone-400 hover:text-blue-600"
                    onClick={() => openEdit(org)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-stone-400 hover:text-red-600"
                    onClick={() => handleDelete(org)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border-stone-200 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-lg font-semibold text-stone-900"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {editing ? "Edit Instansi" : "Tambah Instansi"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-stone-400 rounded-lg"
                  onClick={() => setShowForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-stone-500">Nama instansi *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="cth. Universitas Padjadjaran"
                    className="mt-1 h-10 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-stone-500">Sektor</Label>
                    <Input
                      value={form.sector}
                      onChange={(e) => set("sector", e.target.value)}
                      list="org-sectors"
                      placeholder="Pendidikan"
                      className="mt-1 h-10 rounded-lg"
                    />
                    <datalist id="org-sectors">
                      {SECTORS.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Urutan tampil</Label>
                    <Input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => set("display_order", e.target.value)}
                      className="mt-1 h-10 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-stone-500">URL logo</Label>
                  <Input
                    value={form.logo_url}
                    onChange={(e) => set("logo_url", e.target.value)}
                    placeholder="https://... (kosong = tampilkan nama teks)"
                    className="mt-1 h-10 rounded-lg"
                  />
                </div>

                <div>
                  <Label className="text-xs text-stone-500">Slug halaman dokumentasi</Label>
                  <Input
                    value={form.documentation_slug}
                    onChange={(e) => set("documentation_slug", e.target.value)}
                    placeholder="cth. universitas-padjadjaran"
                    className="mt-1 h-10 rounded-lg"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Isi hanya bila halaman /organisasi/&lt;slug&gt; untuk instansi ini sudah ada.
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-stone-500">Catatan izin (consent)</Label>
                  <Input
                    value={form.consent_note}
                    onChange={(e) => set("consent_note", e.target.value)}
                    placeholder="cth. Surat izin 12 Mar 2026, PIC: Bu Rina"
                    className="mt-1 h-10 rounded-lg"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Instansi tanpa catatan izin tidak bisa ditampilkan di homepage.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  Tampilkan di logo cloud
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-stone-500 rounded-lg"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {saving ? "Menyimpan..." : "Simpan"}
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
