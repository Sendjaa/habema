"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Calendar,
  Camera,
  MapPin,
  Star,
  TrendingUp,
  Award,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

interface UserProfile {
  last_sign_in_at: string | number | Date;
  email_confirmed_at: any;
  id: string;
  auth_user_id: string;
  created_at: string;
  email: string | null;
  phone: string | null;
  user_metadata: any;
  app_metadata: any;
}
interface DBOrder {
  id: string;
  items: string[];
  total: number;
  status: string;
  pickup_date: string | null;
  created_at: string;
  start_date: string;
  end_date: string;
  rental_days: number;
}
interface DBAddress {
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

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: "Menunggu",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   dot: "bg-amber-500" },
  confirmed:  { label: "Dikonfirmasi", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500" },
  active:     { label: "Aktif",        color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  returned:   { label: "Dikembalikan", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  completed:  { label: "Selesai",      color: "text-stone-700",  bg: "bg-stone-100 border-stone-200",  dot: "bg-stone-500" },
  cancelled:  { label: "Dibatalkan",   color: "text-red-700",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500" },
};

const DEFAULT_NOTIF = {
  order_confirm: true,
  return_reminder: true,
  promo: false,
  whatsapp: true,
  weekly_email: false,
};

// ── Toggle Switch Component ──
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-emerald-500" : "bg-stone-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Order Card Component ──
function OrderCard({
  order,
  onDetail,
  onCancel,
  showCancel = false,
  dimmed = false,
}: {
  order: DBOrder;
  onDetail: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  dimmed?: boolean;
}) {
  const cfg = STATUS_CONFIG[order.status] ?? {
    label: order.status,
    color: "text-stone-700",
    bg: "bg-stone-100 border-stone-200",
    dot: "bg-stone-400",
  };

  return (
    <div
      className={`bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        dimmed ? "opacity-60" : "" 
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full ${cfg.dot}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className="text-xs text-stone-400">{formatDateShort(order.created_at)}</span>
          </div>
          <span className="text-xs font-mono text-stone-400 flex-shrink-0">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Items */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-stone-800 leading-snug line-clamp-2">
            {order.items.join(", ")}
          </p>
        </div>

        {/* Rental period */}
        <div className="flex items-center gap-4 text-xs text-stone-500 mb-4 p-3 bg-stone-50 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{order.start_date}</span>
          </div>
          <div className="text-stone-300">→</div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{order.end_date}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-medium text-stone-600">{order.rental_days} hari</span>
          </div>
        </div>

        {/* Footer: price + actions */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Total</p>
            <p className="text-base font-bold text-stone-900">
              Rp {order.total.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showCancel && onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Batalkan
              </button>
            )}
            <button
              onClick={onDetail}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors"
            >
              Detail
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty State Component ──
function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: any;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-stone-400" />
      </div>
      <h3 className="text-sm font-semibold text-stone-700 mb-1">{title}</h3>
      <p className="text-xs text-stone-400 mb-5 max-w-xs">{desc}</p>
      {action}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dbOrders, setDbOrders] = useState<DBOrder[]>([]);
  const [addresses, setAddresses] = useState<DBAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<DBOrder | null>(null);
  const [notif, setNotif] = useState(DEFAULT_NOTIF);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) { router.replace("/login"); return; }
      setUser(authUser as unknown as UserProfile);

      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false });
        if (!bookingsError && bookingsData) {
          const bookingsWithItems = await Promise.all(
            bookingsData.map(async (booking: any) => {
              try {
                const { data: itemsData } = await supabase
                  .from("booking_items").select(`*, equipment (name, image_url)`).eq("booking_id", booking.id);
                return { ...booking, booking_items: itemsData || [] };
              } catch { return { ...booking, booking_items: [] }; }
            })
          );
          setDbOrders(bookingsWithItems.map((booking: any) => ({
            id: booking.id,
            items: booking.booking_items?.map((item: any) => item.equipment?.name || "Equipment") || [],
            total: booking.total_cost || 0,
            status: booking.status,
            pickup_date: booking.pickup_date,
            created_at: booking.created_at,
            start_date: booking.start_date,
            end_date: booking.end_date,
            rental_days: booking.rental_days,
          })));
        }
      } catch { /* silent */ }

      try {
        const { data: addrData, error: addrError } = await supabase
          .from("addresses").select("*").eq("user_id", authUser.id);
        setAddresses(addrError ? [] : (addrData ?? []));
      } catch { setAddresses([]); }
    } catch (err) {
      console.error("Error syncing data:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const handleBookingDetail = useCallback((id: string) => router.push(`/bookings/${id}`), [router]);

  const handleCancelOrder = useCallback((order: DBOrder) => {
    setOrderToCancel(order); setCancelModalOpen(true);
  }, []);

  const confirmCancelOrder = useCallback(async () => {
    if (!orderToCancel) return;
    try {
      // @ts-ignore
      const { error } = await supabase.from("bookings").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", orderToCancel.id);
      if (error) { toast.error("Gagal membatalkan pesanan."); return; }
      setDbOrders((prev) => prev.map((o) => o.id === orderToCancel.id ? { ...o, status: "cancelled" } : o));
      setCancelModalOpen(false); setOrderToCancel(null);
      toast.success("Pesanan berhasil dibatalkan");
    } catch { toast.error("Terjadi kesalahan."); }
  }, [orderToCancel]);

  const toggleNotif = (key: keyof typeof DEFAULT_NOTIF) =>
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <p className="text-sm text-stone-500">Memuat akun Anda...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const fullName = user.user_metadata?.full_name || "Petualang Habema";
  const email = user.email ?? "";
  const phone = user.phone || null;
  const initials = getInitials(fullName);
  const joinDate = formatDate(user.created_at);
  const activeOrders = dbOrders.filter((o) => !["returned", "completed", "cancelled"].includes(o.status));
  const cancelledOrders = dbOrders.filter((o) => o.status === "cancelled");
  const historyOrders = dbOrders.filter((o) => ["returned", "completed"].includes(o.status));
  const totalSpend = dbOrders.reduce((acc, o) => acc + (o.total ?? 0), 0);

  const verifications = [
    { label: "Email",          icon: Mail,     status: user.email_confirmed_at ? "ok" : "missing" },
    { label: "Nomor HP",       icon: Phone,    status: user.phone || user.user_metadata?.phone ? "ok" : "missing" },
    { label: "KTP / Identitas", icon: User,    status: user.user_metadata?.identity_verified ? "ok" : "pending" },
    { label: "Alamat",         icon: MapPin,   status: addresses.length > 0 ? "ok" : "missing" },
  ] as const;

  const completedCount = verifications.filter((v) => v.status === "ok").length;

  return (
    <div className="min-h-screen bg-[#F7F7F5]">

      {/* ── HERO PROFILE HEADER ── */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{initials}</span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-stone-100 rounded-lg flex items-center justify-center shadow-sm hover:bg-stone-50 transition-colors">
                <Camera className="w-3.5 h-3.5 text-stone-600" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 truncate">{fullName}</h1>
                {completedCount === 4 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Terverifikasi
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500 mb-3 truncate">{email}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-stone-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Bergabung {joinDate}
                </span>
                {phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {phone}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push("/account/edit")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profil</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
              >
                {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Pesanan", value: dbOrders.length, color: "text-stone-900" },
              { label: "Aktif",         value: activeOrders.length, color: "text-emerald-600" },
              { label: "Selesai",       value: historyOrders.length, color: "text-stone-900" },
              { label: "Dibatalkan",    value: cancelledOrders.length, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="bg-stone-50 rounded-xl p-3 sm:p-4 text-center border border-stone-100">
                <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── SIDEBAR ── */}
          <aside className="lg:w-72 flex-shrink-0 space-y-4">

            {/* Total Spend Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <Award className="w-5 h-5 text-emerald-200 opacity-60" />
              </div>
              <p className="text-xs text-emerald-100 mb-1">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-white">
                Rp {totalSpend.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-emerald-200 mt-2">{dbOrders.length} transaksi selesai</p>
            </div>

            {/* Verification Card */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-800">Status Akun</h3>
                  <span className="text-xs font-bold text-emerald-600">{completedCount}/4</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / 4) * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-3 space-y-1">
                {verifications.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        item.status === "ok" ? "bg-emerald-50" : item.status === "pending" ? "bg-amber-50" : "bg-red-50"
                      }`}>
                        <item.icon className={`w-3.5 h-3.5 ${
                          item.status === "ok" ? "text-emerald-600" : item.status === "pending" ? "text-amber-500" : "text-red-500"
                        }`} />
                      </div>
                      <span className="text-xs font-medium text-stone-700">{item.label}</span>
                    </div>
                    {item.status === "ok" ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    ) : item.status === "pending" ? (
                      <Clock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
              {completedCount < 4 && (
                <div className="px-4 pb-4">
                  <button className="w-full py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                    Lengkapi Verifikasi
                  </button>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-50">
                <h3 className="text-sm font-semibold text-stone-800">Menu Akun</h3>
              </div>
              {[
                { icon: User,    label: "Edit Profil",   href: "/account/edit" },
                { icon: MapPin,  label: "Alamat Saya",   href: "/account/addresses" },
                { icon: Bell,    label: "Notifikasi",    href: "#" },
                { icon: Settings,label: "Pengaturan",    href: "/account/settings" },
              ].map((item) => (
                <Link key={item.label} href={item.href}
                  className="flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-stone-400" />
                    <span className="text-sm text-stone-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </Link>
              ))}
            </div>
          </aside>

          {/* ── MAIN PANEL ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">

              {/* Tab header */}
              <Tabs defaultValue="active">
                <div className="border-b border-stone-100 px-2">
                  <TabsList className="flex bg-transparent h-auto p-0 gap-0 w-full sm:w-auto">
                    {[
                      { value: "active",    label: "Aktif",    count: activeOrders.length },
                      { value: "history",   label: "Riwayat",  count: historyOrders.length },
                      { value: "cancelled", label: "Dibatalkan", count: cancelledOrders.length },
                      { value: "settings",  label: "Pengaturan", count: null },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="relative flex items-center gap-1.5 px-4 sm:px-5 py-4 text-xs sm:text-sm font-medium text-stone-500 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-transparent hover:text-stone-700 transition-colors whitespace-nowrap"
                      >
                        {tab.label}
                        {tab.count !== null && tab.count > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-stone-100 text-stone-600 rounded-full data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
                            {tab.count}
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Active Orders */}
                <TabsContent value="active" className="p-5 sm:p-6">
                  {activeOrders.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="Tidak ada pesanan aktif"
                      desc="Anda belum memiliki pesanan yang sedang berlangsung saat ini"
                      action={
                        <Link href="/catalog">
                          <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                            <Plus className="w-4 h-4" />
                            Sewa Sekarang
                          </button>
                        </Link>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {activeOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onDetail={() => handleBookingDetail(order.id)}
                          onCancel={() => handleCancelOrder(order)}
                          showCancel
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* History */}
                <TabsContent value="history" className="p-5 sm:p-6">
                  {historyOrders.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="Belum ada riwayat"
                      desc="Pesanan yang telah selesai akan ditampilkan di sini"
                    />
                  ) : (
                    <div className="space-y-3">
                      {historyOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onDetail={() => handleBookingDetail(order.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Cancelled */}
                <TabsContent value="cancelled" className="p-5 sm:p-6">
                  {cancelledOrders.length === 0 ? (
                    <EmptyState
                      icon={X}
                      title="Tidak ada pesanan dibatalkan"
                      desc="Pesanan yang dibatalkan akan ditampilkan di sini"
                    />
                  ) : (
                    <div className="space-y-3">
                      {cancelledOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onDetail={() => handleBookingDetail(order.id)}
                          dimmed
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Settings */}
                <TabsContent value="settings" className="p-5 sm:p-6 space-y-6">
                  {/* Personal Info */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-stone-800">Informasi Pribadi</h3>
                      <button
                        onClick={() => router.push("/account/edit")}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Nama Lengkap", value: fullName },
                        { label: "Email", value: email },
                        { label: "Nomor HP", value: phone || "Belum diatur" },
                        { label: "Bergabung Sejak", value: joinDate },
                      ].map((field) => (
                        <div key={field.label} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                          <p className="text-xs text-stone-400 mb-1">{field.label}</p>
                          <p className="text-sm font-medium text-stone-800 truncate">{field.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h3 className="text-sm font-semibold text-stone-800 mb-4">Preferensi Notifikasi</h3>
                    <div className="rounded-xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
                      {[
                        { key: "order_confirm",   label: "Konfirmasi Pesanan",    desc: "Notifikasi saat pesanan dikonfirmasi" },
                        { key: "return_reminder", label: "Pengingat Pengembalian", desc: "Ingatkan H-1 sebelum tanggal kembali" },
                        { key: "promo",           label: "Promo & Diskon",         desc: "Info penawaran dan diskon terbaru" },
                        { key: "whatsapp",        label: "Notifikasi WhatsApp",    desc: "Terima notifikasi via WhatsApp" },
                        { key: "weekly_email",    label: "Email Mingguan",         desc: "Ringkasan aktivitas setiap minggu" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50/50 transition-colors">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium text-stone-800">{label}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
                          </div>
                          <Toggle
                            checked={notif[key as keyof typeof DEFAULT_NOTIF]}
                            onChange={() => toggleNotif(key as keyof typeof DEFAULT_NOTIF)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div>
                    <h3 className="text-sm font-semibold text-stone-800 mb-3">Sesi</h3>
                    <button
                      onClick={handleLogout}
                      disabled={logoutLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      Keluar dari Akun
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* ── CANCEL MODAL ── */}
      {cancelModalOpen && orderToCancel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-stone-900">Batalkan Pesanan?</h3>
              </div>
            </div>
            {/* Modal body */}
            <div className="px-6 py-4">
              <p className="text-sm text-stone-600 mb-3">
                Anda akan membatalkan pesanan berikut:
              </p>
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 mb-1">
                <p className="text-sm font-semibold text-stone-800 line-clamp-2">
                  {orderToCancel.items.join(", ")}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {orderToCancel.start_date} – {orderToCancel.end_date}
                </p>
                <p className="text-sm font-bold text-stone-900 mt-1">
                  Rp {orderToCancel.total.toLocaleString("id-ID")}
                </p>
              </div>
              <p className="text-xs text-red-500 mt-3">
                ⚠ Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            {/* Modal footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setCancelModalOpen(false); setOrderToCancel(null); }}
                className="flex-1 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
              >
                Tidak, Kembali
              </button>
              <button
                onClick={confirmCancelOrder}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}