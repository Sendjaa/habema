"use client"

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
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
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Booking", icon: ShoppingCart },
  { href: "/admin/equipment", label: "Produk Rental", icon: Package },
  { href: "/admin/branches", label: "Cabang", icon: MapPin },
  { href: "/admin/catalog-shop", label: "Katalog Toko", icon: Store },
  { href: "/admin/orders-shop", label: "Order Toko", icon: ShoppingCart },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/discounts", label: "Diskon", icon: Tag },
  { href: "/admin/products-promo", label: "Promo Produk", icon: Percent },
  { href: "/admin/analisis", label: "Analisis", icon: TrendingUp },
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
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  // Halaman login tidak memakai sidebar/chrome admin.
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

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-stone-200 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
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
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
