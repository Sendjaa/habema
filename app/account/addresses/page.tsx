"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Plus, Trash2, Edit2, Loader2, Home, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace("/login"); return; }

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      setAddresses(error ? [] : (data ?? []));
    } catch (err) {
      console.error("Error fetching addresses:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) { toast.error("Gagal menghapus alamat"); return; }
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Alamat berhasil dihapus");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);

      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
      toast.success("Alamat default diperbarui");
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <p className="text-sm text-stone-500">Memuat alamat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/account"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Alamat Saya</h1>
              <p className="text-sm text-stone-500 mt-1">Kelola alamat pengiriman Anda</p>
            </div>
            <Link href="/account/addresses/add">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah Alamat</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Address List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-stone-400" />
              </div>
              <h3 className="text-sm font-semibold text-stone-700 mb-1">Belum ada alamat</h3>
              <p className="text-xs text-stone-400 mb-5">Tambahkan alamat untuk memudahkan pengiriman</p>
              <Link href="/account/addresses/add">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Tambah Alamat
                </button>
              </Link>
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-stone-800">{addr.label}</h3>
                        {addr.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                            <Home className="w-3 h-3" />
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-600 mb-1">{addr.recipient_name}</p>
                      <p className="text-xs text-stone-500 mb-2">{addr.phone}</p>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        {addr.address}, {addr.city}, {addr.province} {addr.postal_code}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-stone-50 border-t border-stone-100 px-5 py-3 flex items-center justify-end gap-2">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Home className="w-3.5 h-3.5" />
                      Jadikan Utama
                    </button>
                  )}
                  <Link
                    href={`/account/addresses/edit?id=${addr.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deletingId === addr.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
