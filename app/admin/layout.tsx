"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { NotificationsPanel } from "@/components/admin/notifications-panel";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Percent,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Mountain,
  Store,
  MapPin,
  Layers,
  Building2,
  Compass,
  GalleryHorizontal,
  Image,
  Ticket,
  Box,
  Megaphone,
  Settings,
  BarChart2,
  ImageIcon,
} from "lucide-react";

type NavSection = {
  title: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Ringkasan",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analisis", label: "Analisis", icon: BarChart2 },
    ],
  },
  {
    title: "Data Master",
    items: [
      { href: "/admin/equipment", label: "Produk Rental", icon: Package },
      { href: "/admin/branches", label: "Cabang", icon: MapPin },
      { href: "/admin/bundles", label: "Bundles / Paket", icon: Layers },
      { href: "/admin/organizations", label: "Instansi / Klien", icon: Building2 },
    ],
  },
  {
    title: "Konten & Tampilan",
    items: [
      { href: "/admin/shop-hero", label: "Hero Toko", icon: Image },
      { href: "/admin/promo-banners", label: "Banner Promo", icon: GalleryHorizontal },
      { href: "/admin/activities", label: "Foto Kegiatan", icon: Compass },
      { href: "/admin/catalog-shop", label: "Katalog Toko", icon: Store },
    ],
  },
  {
    title: "Transaksi",
    items: [
      { href: "/admin/bookings", label: "Booking Rental", icon: Ticket },
      { href: "/admin/orders-shop", label: "Order Toko", icon: ShoppingCart },
    ],
  },
  {
    title: "Promosi & Penjualan",
    items: [
      { href: "/admin/products-promo", label: "Promo Produk", icon: Percent },
      { href: "/admin/discounts", label: "Kode Diskon / Voucher", icon: Tag },
    ],
  },
  {
    title: "Pengguna & Hak Akses",
    items: [
      { href: "/admin/users", label: "Pengguna Admin", icon: Users },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/admin-trust", { method: "DELETE" }).catch(() => null);
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#F1EFE8] font-body">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b border-stone-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-base font-semibold text-stone-900 tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Habema
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {section.title}
              </p>
              {section.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(href)
                      ? "bg-emerald-50 text-emerald-800 font-medium"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-stone-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header: bel notifikasi */}
        <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
          <div className="px-4 py-2.5 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-emerald-800 flex items-center justify-center">
                <Mountain className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                className="text-sm font-semibold text-stone-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Habema Admin
              </span>
            </div>
            <div className="ml-auto">
              <NotificationsPanel />
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}