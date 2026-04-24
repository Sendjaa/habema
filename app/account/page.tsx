"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Mail,
  Phone,
  LogOut,
  Edit2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Package,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";


interface UserProfile {
  last_sign_in_at: string | number | Date;
  email_confirmed_at: any;
  id: string;
  email: string;
  phone?: string;
  user_metadata: {
    [x: string]: any;
    phone: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface DBOrder {
  id: string;
  items: string[];
  total: number;
  status: string;
  pickup_date: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
  rental_days?: number;
}

interface DBAddress {
  id: string;
  label: string;
  address_details: string;
  is_primary: boolean;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const DEFAULT_NOTIF = {
  order_confirm: true,
  return_reminder: true,
  promo: false,
  whatsapp: true,
  weekly_email: false,
};

export default function AccountPage() {
  const router = useRouter();

  // ── States ──
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dbOrders, setDbOrders] = useState<DBOrder[]>([]);
  const [addresses, setAddresses] = useState<DBAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<DBOrder | null>(null);
  const [notif, setNotif] = useState(DEFAULT_NOTIF);

  // ── Fetch Data ──
  const fetchData = useCallback(async () => {
    try {
      // 1. Get Auth User
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.replace("/login");
        return;
      }
      setUser(authUser as unknown as UserProfile);

      // 2. Get Bookings dari Tabel 'bookings' (simplified query)
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false });

        if (bookingsError) {
          console.error('Bookings error:', bookingsError);
        } else if (bookingsData) {
          // Get booking items separately for each booking
          const bookingsWithItems = await Promise.all(
            bookingsData.map(async (booking: any) => {
              try {
                const { data: itemsData } = await supabase
                  .from("booking_items")
                  .select(`
                    *,
                    equipment (
                      name,
                      image_url
                    )
                  `)
                  .eq("booking_id", booking.id);

                return {
                  ...booking,
                  booking_items: itemsData || []
                };
              } catch (error) {
                console.error('Error fetching booking items:', error);
                return {
                  ...booking,
                  booking_items: []
                };
              }
            })
          );

          // Transform bookings data to match DBOrder interface
          const transformedOrders = bookingsWithItems.map((booking: any) => ({
            id: booking.id,
            items: booking.booking_items?.map((item: any) => item.equipment?.name || 'Equipment') || [],
            total: booking.total_cost || 0,
            status: booking.status,
            pickup_date: booking.pickup_date,
            created_at: booking.created_at,
            start_date: booking.start_date,
            end_date: booking.end_date,
            rental_days: booking.rental_days
          }));
          setDbOrders(transformedOrders);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }

      // 3. Get Addresses - dengan error handling jika tabel tidak ada
      try {
        const { data: addrData, error: addrError } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", authUser.id);

        if (addrError) {
          console.log('Addresses table not found or error:', addrError);
          setAddresses([]); // Set empty array if table doesn't exist
        } else if (addrData) {
          setAddresses(addrData);
        }
      } catch (error) {
        console.log('Error fetching addresses:', error);
        setAddresses([]); // Set empty array on error
      }
    } catch (err) {
      console.error("Error syncing data:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const handleBookingDetail = useCallback((bookingId: string) => {
    // Navigate to booking detail page
    router.push(`/bookings/${bookingId}`);
  }, [router]);

  const handleCancelOrder = useCallback((order: DBOrder) => {
    // Open confirmation modal with order details
    setOrderToCancel(order);
    setCancelModalOpen(true);
  }, []);

  const confirmCancelOrder = useCallback(async () => {
    if (!orderToCancel) return;

    try {
      // Update booking status to cancelled in database
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderToCancel.id);

      if (error) {
        console.error('Error cancelling booking:', error);
        toast.error('Gagal membatalkan pesanan. Silakan coba lagi.');
        return;
      }

      // Update local state
      setDbOrders(prev => 
        prev.map(order => 
          order.id === orderToCancel.id 
            ? { ...order, status: 'cancelled' }
            : order
        )
      );

      // Close modal
      setCancelModalOpen(false);
      setOrderToCancel(null);

      toast.success('Pesanan berhasil dibatalkan');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    }
  }, [orderToCancel]);

  const toggleNotif = (key: keyof typeof DEFAULT_NOTIF) =>
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!user) return null;

  // ── Derived Data ──
  const fullName = user.user_metadata?.full_name || "Petualang Habema";
  const email = user.email ?? "";
  const phone = user.phone || null;
  const initials = getInitials(fullName);
  const joinDate = formatDate(user.created_at);

  const activeOrders = dbOrders.filter(
    (o) => !["returned", "completed", "cancelled"].includes(o.status),
  );
  const cancelledOrders = dbOrders.filter((o) => o.status === "cancelled");
  const historyOrders = dbOrders.filter((o) =>
    ["returned", "completed"].includes(o.status),
  );
  const totalSpend = dbOrders.reduce((acc, o) => acc + (o.total ?? 0), 0);

  // -- Derived Verification Logic --
  const verifications = [
    {
      label: "Email",
      status: user.email_confirmed_at ? "ok" : "missing",
    },
    {
      label: "Nomor HP",
      status: user.phone || user.user_metadata?.phone ? "ok" : "missing",
    },
    {
      label: "KTP / Identitas",
      status: user.user_metadata?.identity_verified ? "ok" : "pending",
    },
    {
      label: "Alamat",
      status: addresses.length > 0 ? "ok" : "missing",
    },
  ] as const;

  const BADGE_MAP = {
    ok: {
      cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
      label: "✓ Terverifikasi",
    },
    pending: {
      cls: "bg-amber-50 text-amber-800 border-amber-200",
      label: "Sedang Diproses",
    },
    missing: {
      cls: "bg-stone-100 text-stone-600 border-stone-200",
      label: "Belum Diisi",
    },
  };

  const NOTIF_ITEMS: {
    key: keyof typeof DEFAULT_NOTIF;
    title: string;
    sub: string;
  }[] = [
      {
        key: "order_confirm",
        title: "Konfirmasi Pesanan",
        sub: "Notifikasi saat pesanan dikonfirmasi admin",
      },
      {
        key: "return_reminder",
        title: "Pengingat Pengembalian",
        sub: "Peringatan H-1 sebelum batas kembali alat",
      },
      {
        key: "promo",
        title: "Promo & Penawaran",
        sub: "Diskon eksklusif dan perlengkapan baru",
      },
      {
        key: "whatsapp",
        title: "Notifikasi WhatsApp",
        sub: "Kirim status pesanan via pesan WhatsApp",
      },
      {
        key: "weekly_email",
        title: "Email Mingguan",
        sub: "Ringkasan aktivitas akun tiap minggu",
      },
    ];

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body">
      {/* Top bar - Responsive Padding */}
      <div className="border-b border-stone-200 bg-white px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-xl md:text-2xl font-semibold text-stone-900 tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Akun Saya
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Kelola profil dan pengaturan akun Anda
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-20">
        {/* PERBAIKAN 2: Grid Stack di mobile (cols-1), Side-by-side di Desktop (lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-[#085041] rounded-2xl p-6 text-[#E1F5EE]">
              <div
                className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mb-4"
                style={{ fontFamily: "'Fraunces', serif", fontSize: "20px" }}
              >
                {initials}
              </div>

              <p className="font-medium text-base leading-tight mb-1 truncate">
                {fullName}
              </p>
              <p className="text-xs text-[#9FE1CB] mb-4 break-all opacity-80">
                {email}
              </p>

              <div className="border-t border-white/10 pt-4 space-y-2.5 mb-5">
                <div className="flex items-center gap-2.5 text-xs text-[#9FE1CB]">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  {user.user_metadata?.phone || "Belum ada nomor"}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#9FE1CB]">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  {email}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#9FE1CB]">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  Gabung {joinDate}
                </div>
              </div>

              {/* Tombol Stack di Mobile agar Area Klik Luas */}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/20 text-[#E1F5EE] text-xs font-medium gap-2 border-none"
                  asChild
                >
                  <Link href="/account/edit">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profil
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={logoutLoading}
                  onClick={handleLogout}
                  className="w-full h-10 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-red-200 text-xs font-medium gap-2 border-none"
                >
                  {logoutLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  Keluar
                </Button>
              </div>
            </div>

            {/* Status Verifikasi - Grid 2 kolom di tablet (sm), 1 di lainnya */}
            <Card className="p-5 bg-white border-stone-200 rounded-2xl shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">
                  Status Verifikasi
                </h3>
                {/* Tooltip atau Icon indikator keamanan tambahan */}
                <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {verifications.map(({ label, status }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1 group"
                  >
                    <span className="text-xs text-stone-500 group-hover:text-stone-800 transition-colors">
                      {label}
                    </span>

                    <Badge
                      className={`
            ${BADGE_MAP[status].cls} 
            border text-[9px] font-bold px-2 py-0.5 shadow-none 
            transition-all duration-300
          `}
                    >
                      {BADGE_MAP[status].label}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Progress Bar Sederhana (Opsional - untuk memberi motivasi user) */}
              <div className="mt-5 pt-4 border-t border-stone-50">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter mb-1.5">
                  <span className="text-stone-400">Kelengkapan Profil</span>
                  <span className="text-emerald-700">
                    {Math.round(
                      (verifications.filter((v) => v.status === "ok").length /
                        verifications.length) *
                      100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-1000"
                    style={{
                      width: `${(verifications.filter((v) => v.status === "ok").length / verifications.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* MAIN PANEL */}
          <Card className="bg-white border-stone-200 rounded-2xl shadow-none overflow-hidden h-fit">
            <Tabs defaultValue="profil" className="flex flex-col">
              {/* PERBAIKAN 3: Tabs Scrollable secara Horizontal di Mobile */}
              <div className="overflow-x-auto no-scrollbar bg-stone-50 border-b border-stone-100">
                <TabsList className="bg-transparent rounded-none px-2 h-auto justify-start gap-0 p-0 flex min-w-max">
                  {[
                    "profil",
                    "pesanan",
                    "alamat",
                    "keamanan",
                    "notifikasi",
                  ].map((val) => (
                    <TabsTrigger
                      key={val}
                      value={val}
                      className="rounded-none h-12 px-5 text-xs font-medium text-stone-400 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 data-[state=active]:bg-white capitalize whitespace-nowrap"
                    >
                      {val}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="profil" className="p-4 md:p-8 space-y-8 mt-0">
                {/* Ringkasan Aktivitas - Tetap 3 kolom tapi responsive sizing */}
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-4">
                    Ringkasan Aktivitas
                  </p>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {[
                      { num: dbOrders.length, label: "Sewa" },
                      { num: activeOrders.length, label: "Aktif" },
                      {
                        num: formatCurrency(totalSpend),
                        label: "Belanja",
                        isPrice: true,
                      },
                    ].map(({ num, label, isPrice }) => (
                      <div
                        key={label}
                        className="bg-stone-50 rounded-2xl p-3 md:p-4 text-center border border-stone-100/50"
                      >
                        <p
                          className="text-stone-900 font-medium leading-tight mb-1 truncate"
                          style={{
                            fontFamily: "'Fraunces', serif",
                            fontSize: isPrice
                              ? "clamp(12px, 3.5vw, 16px)"
                              : "clamp(18px, 5vw, 24px)",
                          }}
                        >
                          {num}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-stone-400 uppercase font-medium">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-stone-100" />

                {/* Informasi Pribadi - 1 kolom di HP, 2 di Desktop */}
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-4">
                    Informasi Pribadi
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {[
                      { label: "Nama Lengkap", val: fullName },
                      { label: "Email", val: email },
                      {
                        label: "Nomor HP",
                        val: user.user_metadata?.phone ?? "—",
                      },
                      { label: "Bergabung Sejak", val: joinDate },
                      {
                        label: "Status Akun",
                        val: "Member Aktif",
                        green: true,
                      },
                    ].map(({ label, val, green }) => (
                      <div
                        key={label}
                        className="bg-stone-50/50 border border-stone-100 rounded-2xl px-4 py-3.5"
                      >
                        <p className="text-[9px] text-stone-400 mb-1 tracking-widest uppercase font-bold">
                          {label}
                        </p>
                        <p
                          className={`text-sm font-medium truncate ${green ? "text-emerald-700" : "text-stone-800"}`}
                        >
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tabs lainnya secara otomatis menyesuaikan padding container */}
              <TabsContent
                value="pesanan"
                className="p-4 md:p-8 mt-0 space-y-8"
              >
                {/* Bagian 1: Pesanan Aktif */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                      Pesanan Aktif
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50"
                    >
                      {activeOrders.length} Berjalan
                    </Badge>
                  </div>

                  {activeOrders.length === 0 ? (
                    <div className="border-2 border-dashed border-stone-100 rounded-2xl p-10 text-center">
                      <Package className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-stone-500 mb-4">
                        Belum ada alat yang sedang disewa
                      </p>
                      <Button
                        size="sm"
                        className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl px-6"
                        asChild
                      >
                        <Link href="/catalog">Eksplor Katalog</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {activeOrders.map((o) => (
                        <div
                          key={o.id}
                          className="group border border-stone-200 rounded-2xl p-4 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">
                                  ID: #{o.id.slice(0, 8)}
                                </span>
                                <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-bold uppercase px-2 py-0">
                                  {o.status}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-stone-800 text-sm md:text-base leading-tight">
                                {o.items?.[0] || "Perlengkapan Outdoor"}
                                {o.items?.length > 1 && (
                                  <span className="text-stone-400 font-normal">
                                    {" "}
                                    +{o.items.length - 1} alat lainnya
                                  </span>
                                )}
                              </h4>
                            </div>
                            <p className="font-bold text-emerald-800 text-sm">
                              {formatCurrency(o.total)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                <Clock className="w-3 h-3" />
                                <span>{o.start_date} - {o.end_date}</span>
                              </div>
                              {o.rental_days && (
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                                  <span>{o.rental_days} hari</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelOrder(o)}
                                className="h-7 text-[11px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Batalkan
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBookingDetail(o.id)}
                                className="h-7 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg"
                              >
                                Detail <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bagian 2: Pesanan Dibatalkan */}
                {cancelledOrders.length > 0 && (
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-4 px-1">
                      Pesanan Dibatalkan
                    </p>
                    <div className="space-y-2">
                      {cancelledOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100 opacity-75"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                              <X className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight">
                                  ID: #{o.id.slice(0, 8)}
                                </span>
                                <Badge className="bg-red-100 text-red-700 border-none text-[9px] font-bold uppercase px-2 py-0">
                                  Dibatalkan
                                </Badge>
                              </div>
                              <h4 className="font-medium text-red-800 text-sm">
                                {o.items?.[0] || "Perlengkapan Outdoor"}
                                {o.items?.length > 1 && (
                                  <span className="text-red-600 font-normal">
                                    {" "}
                                    +{o.items.length - 1} alat lainnya
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[11px] text-red-500 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{o.start_date} - {o.end_date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="font-bold text-red-800 text-sm">
                            {formatCurrency(o.total)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bagian 3: Riwayat Pesanan */}
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-4 px-1">
                    Riwayat Selesai
                  </p>

                  {historyOrders.length === 0 ? (
                    <p className="text-xs text-stone-400 italic px-1">
                      Belum ada riwayat transaksi.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {historyOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 opacity-75 grayscale hover:grayscale-0 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-stone-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-stone-700">
                                {o.items?.[0] || "Item Sewa"}
                              </p>
                              <p className="text-[10px] text-stone-400">
                                {formatDate(o.created_at)} · Berhasil
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-stone-600">
                              {formatCurrency(o.total)}
                            </p>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase">
                              Selesai
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box Bantuan */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-blue-900 uppercase">
                      Butuh bantuan pesanan?
                    </p>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Jika ada kendala pada status pembayaran atau pengambilan
                      alat, silakan hubungi admin melalui
                      <Link href="/help" className="underline font-bold ml-1">
                        Pusat Bantuan
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="alamat" className="p-4 md:p-8 mt-0 space-y-6">
                {/* Header & Add Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">
                      Daftar Lokasi
                    </p>
                    <h3
                      className="text-lg font-semibold text-stone-800"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      Alamat Pengiriman
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl gap-2 h-10 px-5 shadow-sm shadow-emerald-900/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Tambah Alamat
                    </span>
                  </Button>
                </div>

                {/* Address List */}
                <div className="grid grid-cols-1 gap-4">
                  {addresses.length === 0 ? (
                    <div className="border-2 border-dashed border-stone-100 rounded-3xl p-12 text-center">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-stone-200" />
                      </div>
                      <p className="text-sm font-medium text-stone-500 mb-2">
                        Belum ada alamat tersimpan
                      </p>
                      <p className="text-xs text-stone-400 max-w-[240px] mx-auto">
                        Tambahkan alamat untuk mempercepat proses checkout dan
                        perhitungan ongkir.
                      </p>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`relative border-2 rounded-2xl p-5 transition-all ${addr.is_primary
                            ? "border-emerald-600/20 bg-emerald-50/10"
                            : "border-stone-100 bg-white hover:border-stone-200"
                          }`}
                      >
                        {/* Label & Status */}
                        <div className="flex items-center gap-3 mb-3">
                          <Badge
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow-none border ${addr.is_primary
                                ? "bg-emerald-800 text-white border-emerald-800"
                                : "bg-stone-100 text-stone-500 border-stone-200"
                              }`}
                          >
                            {addr.label}
                          </Badge>
                          {addr.is_primary && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Utama
                            </span>
                          )}
                        </div>

                        {/* Address Detail */}
                        <div className="space-y-1 mb-5">
                          <p className="text-sm font-semibold text-stone-800 leading-tight">
                            {user.user_metadata?.full_name || "Penerima"}
                            <span className="text-stone-400 font-normal ml-2">
                              ({phone || "No. HP belum diatur"})
                            </span>
                          </p>
                          <p className="text-xs text-stone-500 leading-relaxed max-w-md">
                            {addr.address_details}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 border-t border-stone-100 pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg px-4"
                          >
                            Edit
                          </Button>
                          {!addr.is_primary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg px-4"
                            >
                              Atur Utama
                            </Button>
                          )}
                          <div className="flex-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Zone Note */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex gap-3">
                  <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-stone-500 leading-relaxed italic">
                    Habema saat ini hanya melayani pengiriman di wilayah{" "}
                    <strong>Bandung Raya</strong> dan <strong>KBB</strong>.
                    Pastikan koordinat alamat Anda sudah akurat untuk memudahkan
                    kurir kami.
                  </p>
                </div>
              </TabsContent>
              <TabsContent
                value="keamanan"
                className="p-4 md:p-8 mt-0 space-y-8"
              >
                {/* Header Keamanan */}
                <div>
                  <h3
                    className="text-lg font-semibold text-stone-800 mb-1"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    Keamanan Akun
                  </h3>
                  <p className="text-xs text-stone-500">
                    Kelola kredensial dan proteksi akses akun Habema Anda
                  </p>
                </div>

                {/* Status Keamanan Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-5 border-stone-200 bg-emerald-50/30 shadow-none rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Status Proteksi
                      </p>
                      <p className="text-sm font-semibold text-stone-800">
                        {user.email_confirmed_at
                          ? "Sangat Kuat"
                          : "Perlu Verifikasi"}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-5 border-stone-200 bg-stone-50 shadow-none rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Bell className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Login Terakhir
                      </p>
                      <p className="text-sm text-center font-semibold text-stone-800">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" },
                          )
                          : "Baru saja"}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Opsi Keamanan List */}
                <div className="space-y-4">
                  {/* FITUR: UBAH PASSWORD */}
                  <div className="group flex items-center justify-between p-4 rounded-2xl border border-stone-100 hover:border-stone-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">
                          Kata Sandi
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Atur ulang password melalui email
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 text-xs font-bold border-stone-200 hover:bg-stone-50 px-4"
                      onClick={async () => {
                        const { error } =
                          await supabase.auth.resetPasswordForEmail(
                            user.email!,
                            {
                              redirectTo: `${window.location.origin}/reset-password`,
                            },
                          );
                        if (error) toast.error(error.message);
                        else
                          toast.success(
                            "Link reset password telah dikirim ke email Anda",
                          );
                      }}
                    >
                      Reset
                    </Button>
                  </div>

                  {/* FITUR: VERIFIKASI EMAIL */}
                  {!user.email_confirmed_at && (
                    <div className="group flex items-center justify-between p-4 rounded-2xl border border-amber-100 bg-amber-50/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            Verifikasi Email
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Email Anda belum terverifikasi
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-amber-700 hover:bg-amber-100 px-4 h-9 rounded-xl"
                        onClick={() =>
                          toast.info("Fitur verifikasi ulang sedang disiapkan")
                        }
                      >
                        Verifikasi
                      </Button>
                    </div>
                  )}

                  {/* FITUR: LOGOUT ALL SESSIONS */}
                  <div className="group flex items-center justify-between p-4 rounded-2xl border border-stone-100 hover:border-stone-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">
                          Sesi Aktif
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Keluar dari semua perangkat lain
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl h-9 text-xs font-bold text-stone-600 hover:bg-stone-100 px-4"
                      onClick={async () => {
                        const { error } = await supabase.auth.signOut({
                          scope: "others",
                        });
                        if (error) toast.error(error.message);
                        else
                          toast.success(
                            "Berhasil keluar dari semua perangkat lain",
                          );
                      }}
                    >
                      Log out lain
                    </Button>
                  </div>
                </div>

                {/* Zona Bahaya */}
                <div className="pt-6 border-t border-stone-100">
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">
                        Zona Bahaya
                      </p>
                    </div>
                    <p className="text-[11px] text-red-700/70 mb-4 leading-relaxed">
                      Menghapus akun akan membatalkan semua pesanan aktif dan
                      menghapus riwayat sewa secara permanen.
                    </p>
                    <Button
                      variant="ghost"
                      className="h-9 px-4 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors"
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.",
                        );
                        if (confirmed)
                          toast.error(
                            "Fitur penghapusan otomatis sedang dinonaktifkan demi keamanan. Hubungi admin.",
                          );
                      }}
                    >
                      Hapus Akun
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && orderToCancel && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-3">
              <X className="w-5 h-5 text-red-600" />
            </div>
            
            <h3 className="text-base font-semibold text-center text-stone-900 mb-2">
              Batalkan Pesanan?
            </h3>
            
            <p className="text-xs text-stone-600 text-center mb-4">
              Apakah Anda yakin ingin membatalkan pesanan ini?
            </p>

            {/* Order Details */}
            <div className="bg-stone-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-stone-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-stone-900 text-xs truncate">
                    {orderToCancel.items?.[0] || "Perlengkapan Outdoor"}
                    {orderToCancel.items && orderToCancel.items.length > 1 && (
                      <span className="text-stone-500 font-normal">
                        {" +" + (orderToCancel.items.length - 1)}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-stone-500">
                    ID: #{orderToCancel.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <Clock className="w-3 h-3" />
                  <span className="truncate">
                    {orderToCancel.start_date} - {orderToCancel.end_date}
                  </span>
                </div>
                <p className="font-bold text-stone-900 text-xs">
                  {formatCurrency(orderToCancel.total)}
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-900">
                    Peringatan
                  </p>
                  <p className="text-xs text-amber-700">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelModalOpen(false);
                  setOrderToCancel(null);
                }}
                className="flex-1 border-stone-300 text-stone-700 hover:bg-stone-50 h-8 text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={confirmCancelOrder}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
              >
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
