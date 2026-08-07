"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Plus,
  Edit,
  Package,
  Save,
  X,
  Phone,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  operational_hours: string | null;
  map_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  equipment: {
    id: string;
    name: string;
    image_url: string | null;
    stock_quantity: number;
  };
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    operational_hours: "",
    map_url: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Inventory state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [editingInventory, setEditingInventory] = useState<string | null>(null);
  const [inventoryQty, setInventoryQty] = useState<number>(0);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/branches");
      const result = await res.json();
      if (result.success) {
        setBranches(result.data || []);
      }
    } catch {
      toast.error("Gagal memuat data cabang");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (branchId: string) => {
    setLoadingInventory(true);
    try {
      const res = await fetch(`/api/admin/branches/inventory?branchId=${branchId}`);
      const result = await res.json();
      if (result.success) {
        setInventory(result.data || []);
      }
    } catch {
      toast.error("Gagal memuat inventaris cabang");
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nama cabang wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = editingBranch
        ? `/api/admin/branches/${editingBranch.id}`
        : "/api/admin/branches";
      const method = editingBranch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal menyimpan cabang");
      }

      toast.success(editingBranch ? "Cabang diperbarui" : "Cabang baru ditambahkan");
      setShowForm(false);
      setEditingBranch(null);
      resetForm();
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      operational_hours: branch.operational_hours || "",
      map_url: branch.map_url || "",
      is_active: branch.is_active,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !branch.is_active }),
      });
      if (res.ok) {
        toast.success(`Cabang ${branch.is_active ? "dinonaktifkan" : "diaktifkan"}`);
        fetchBranches();
      }
    } catch {
      toast.error("Gagal mengubah status cabang");
    }
  };

  const handleUpdateInventory = async (inventoryId: string) => {
    try {
      const item = inventory.find((i) => i.id === inventoryId);
      if (!item) return;

      const res = await fetch("/api/admin/branches/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch?.id,
          equipmentId: item.equipment.id,
          quantity: inventoryQty,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success("Stok diperbarui");
      setEditingInventory(null);
      fetchInventory(selectedBranch!.id);
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui stok");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      phone: "",
      operational_hours: "",
      map_url: "",
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Manajemen Cabang
            </h1>
            <p className="text-[10px] text-stone-400 hidden sm:block">Kelola cabang & inventaris per lokasi</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setEditingBranch(null);
              setShowForm(true);
            }}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tambah Cabang
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Daftar Cabang</h2>
            {branches.length === 0 ? (
              <Card className="p-6 text-center border-stone-200 rounded-xl">
                <MapPin className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="text-sm text-stone-400">Belum ada cabang</p>
              </Card>
            ) : (
              branches.map((branch) => (
                <Card
                  key={branch.id}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedBranch?.id === branch.id
                      ? "border-emerald-500 bg-emerald-50/50 shadow-md"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                  onClick={() => {
                    setSelectedBranch(branch);
                    fetchInventory(branch.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-800 truncate">{branch.name}</p>
                        <Badge
                          className={`text-[9px] shrink-0 ${
                            branch.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {branch.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      {branch.address && (
                        <p className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {branch.address}{branch.city ? `, ${branch.city}` : ""}
                        </p>
                      )}
                      {branch.phone && (
                        <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {branch.phone}
                        </p>
                      )}
                      {branch.operational_hours && (
                        <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {branch.operational_hours}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-stone-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(branch);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 ${branch.is_active ? "text-stone-400 hover:text-amber-600" : "text-stone-400 hover:text-emerald-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(branch);
                        }}
                      >
                        {branch.is_active ? "⏸" : "▶"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Inventory Panel */}
          <div className="lg:col-span-2">
            {selectedBranch ? (
              <Card className="border-stone-200 rounded-xl">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">
                      Inventaris — {selectedBranch.name}
                    </h2>
                    <p className="text-[10px] text-stone-400">Stok peralatan di cabang ini</p>
                  </div>
                  {selectedBranch.map_url && (
                    <a
                      href={selectedBranch.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      Lihat di Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="p-4">
                  {loadingInventory ? (
                    <div className="text-center py-8 text-stone-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                      <p className="text-xs">Memuat inventaris...</p>
                    </div>
                  ) : inventory.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="text-xs">Belum ada inventaris</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {inventory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100"
                        >
                          {item.equipment?.image_url ? (
                            <img
                              src={item.equipment.image_url}
                              alt={item.equipment.name}
                              className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-stone-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-stone-800 truncate">
                              {item.equipment?.name || "Produk"}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              Global: {item.equipment?.stock_quantity || 0} unit
                            </p>
                          </div>
                          {editingInventory === item.id ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                type="number"
                                min={0}
                                value={inventoryQty}
                                onChange={(e) => setInventoryQty(Number(e.target.value))}
                                className="w-20 h-8 text-xs border-stone-200 rounded-lg"
                              />
                              <Button
                                size="sm"
                                className="h-8 px-2 bg-emerald-600 text-white rounded-lg"
                                onClick={() => handleUpdateInventory(item.id)}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-stone-400"
                                onClick={() => setEditingInventory(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-sm font-bold ${item.quantity > 0 ? "text-emerald-700" : "text-stone-400"}`}>
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-stone-400 hover:text-blue-600"
                                onClick={() => {
                                  setEditingInventory(item.id);
                                  setInventoryQty(item.quantity);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="border-stone-200 rounded-xl p-12 text-center">
                <MapPin className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <h3 className="text-sm font-bold text-stone-600">Pilih Cabang</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Klik salah satu cabang di sebelah kiri untuk melihat inventarisnya
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Branch Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg rounded-xl border-stone-200 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
                  {editingBranch ? "Edit Cabang" : "Tambah Cabang Baru"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-stone-400 hover:text-stone-600 rounded-lg"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBranch(null);
                    resetForm();
                  }}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-stone-600">Nama Cabang *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Habema Bandung Kota"
                    className="mt-1 border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-stone-600">Alamat</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jl. Merdeka No. 45"
                    className="mt-1 border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-stone-600">Kota</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bandung"
                      className="mt-1 border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-stone-600">Telepon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="mt-1 border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-stone-600">Jam Operasional</Label>
                  <Input
                    value={formData.operational_hours}
                    onChange={(e) => setFormData({ ...formData, operational_hours: e.target.value })}
                    placeholder="08.00 - 20.00 WIB"
                    className="mt-1 border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-stone-600">URL Google Maps</Label>
                  <Input
                    value={formData.map_url}
                    onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="mt-1 border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-stone-300"
                  />
                  <Label htmlFor="is_active" className="text-xs font-medium text-stone-600 cursor-pointer">
                    Cabang Aktif
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-stone-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-stone-200 text-stone-600 rounded-lg"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBranch(null);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : editingBranch ? "Simpan Perubahan" : "Tambah Cabang"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
