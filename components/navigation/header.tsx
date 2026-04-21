"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Search,
  ChevronDown,
  MapPin,
  Phone,
  Compass,
  Leaf,
  Mountain,
  ShieldCheck,
  TrendingUp,
  Clock,
  Zap,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import React from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredRecommendation, setFeaturedRecommendation] =
    useState<any>(null);
  const cartItems = useCartStore((state) => state.items);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const navbarHeight = "100px";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, recRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products/featured?limit=1"),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (recRes.ok) {
          const recData = await recRes.json();
          setFeaturedRecommendation(recData[0]);
        }
      } catch (error) {
        console.error("Gagal memuat data awal:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchSearchProducts = async () => {
      if (searchValue.length < 2) {
        setProducts([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(searchValue)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchValue]);

  const closeMenu = () => setIsMenuOpen(false);
  const totalItems = (cartItems || []).reduce(
    (total: number, item: any) => total + item.quantity,
    0,
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#F2EDE4]/95 backdrop-blur-md border-b border-emerald-900/10 shadow-sm"
          : "bg-[#F2EDE4] border-b border-transparent"
      }`}
    >
      {/* Top Bar */}
      <div className="hidden sm:block bg-[#1B4332] text-emerald-50/70 text-[11px] py-2 font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-8">
            <span className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Basecamp Habema, Bandung
            </span>
            <span className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              +62 812 3456 789
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <Link href="/help" className="hover:text-white transition-colors">
              Bantuan
            </Link>
            <div className="w-[1px] h-3 bg-emerald-800" />
            <Link href="/track" className="hover:text-white transition-colors">
              Lacak Pesanan
            </Link>
            
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 gap-8">
          {/* 1. Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 bg-[#1B4332] rounded-lg flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105">
              <Leaf className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-[#1B4332] tracking-tight leading-none">
                HABEMA
              </h1>
              <span className="text-[10px] font-semibold text-emerald-800/60 uppercase tracking-widest mt-0.5">
                Outdoor Rental
              </span>
            </div>
          </Link>

          {/* 2. Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl relative group px-4 z-[60]">
            <div
              className={`w-full h-11 flex items-center px-4 rounded-lg border transition-all ${isOpen ? "bg-white border-emerald-600 shadow-sm" : "bg-gray-100 border-transparent hover:bg-gray-200/70"}`}
            >
              <Search
                className={`w-5 h-5 mr-3 transition-colors ${isOpen ? "text-emerald-600" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Cari perlengkapan gunung..."
                className="bg-transparent border-none outline-none text-sm flex-1 text-gray-800"
                value={searchValue}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <button onClick={() => setSearchValue("")} className="mr-2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-bold text-gray-500">
                /
              </div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    style={{ top: navbarHeight }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[40]"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{ top: navbarHeight }}
                    className="fixed left-0 w-full bg-[#F2EDE4]/95 z-[50] shadow-xl border-b border-gray-100"
                  >
                    <div className="max-w-7xl mx-auto grid grid-cols-12 overflow-hidden">
                      {/* Left: History/Trends */}
                      <div className="col-span-3 bg-gray-50/50 p-8 border-r border-gray-100">
                        <div className="mb-8">
                          <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Terakhir Dicari
                          </h4>
                          <div className="space-y-3 text-sm text-gray-600">
                            <p className="hover:text-emerald-700 cursor-pointer">
                              Tenda Kapasitas 4
                            </p>
                            <p className="hover:text-emerald-700 cursor-pointer">
                              Carrier 60L
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> Populer
                          </h4>
                          <div className="space-y-3 text-sm text-gray-600">
                            {categories.slice(0, 3).map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center gap-2 hover:text-emerald-700 cursor-pointer"
                              >
                                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />{" "}
                                {c.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Results */}
                      <div className="col-span-6 p-8 min-h-[450px]">
                        {!searchValue ? (
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-4">
                                Destinasi Populer
                              </h4>
                              <div className="space-y-2">
                                {[
                                  { n: "Gunung Prau", l: "Wonosobo" },
                                  { n: "Gunung Gede", l: "Cianjur" },
                                ].map((mt) => (
                                  <div
                                    key={mt.n}
                                    className="p-3 rounded-lg hover:bg-white flex items-center gap-3 cursor-pointer group transition-all border border-transparent hover:border-emerald-100"
                                  >
                                    <div className="w-10 h-10 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                      <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold">
                                        {mt.n}
                                      </p>
                                      <p className="text-[10px] text-gray-500 uppercase">
                                        {mt.l}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-4">
                                Kategori
                              </h4>
                              <div className="space-y-1">
                                {categories.slice(0, 5).map((cat) => (
                                  <Link
                                    key={cat.id}
                                    href={`/catalog/${cat.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block p-2 text-sm font-semibold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-md"
                                  >
                                    {cat.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : isLoading ? (
                          <div className="space-y-4">
                            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-16 bg-gray-100 animate-pulse rounded-xl"
                              />
                            ))}
                          </div>
                        ) : products.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                              Hasil Untuk "{searchValue}"
                            </h4>
                            {products.map((product) => (
                              <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-white hover:border-emerald-200 transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {product.image ? (
                                      <img
                                        src={product.image}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <Mountain className="w-6 h-6 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-800">
                                      {product.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      Tersedia di Hub {product.hub || "Pusat"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-black text-emerald-700">
                                    Rp{" "}
                                    {Number(product.price).toLocaleString(
                                      "id-ID",
                                    )}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-bold">
                                    / HARI
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-16 text-center">
                            <Search className="w-12 h-12 text-gray-200 mb-4" />
                            <h5 className="text-sm font-bold text-gray-800">
                              Tidak ada hasil
                            </h5>
                            <p className="text-xs text-gray-400 mt-2">
                              Coba kata kunci lain.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Expert Choice */}
                      <div className="col-span-3 p-8 border-l border-gray-100 bg-emerald-50/20">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-4 italic">
                          Rekomendasi Ahli
                        </h4>
                        {featuredRecommendation && (
                          <Link
                            href={`/product/${featuredRecommendation.id}`}
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group block"
                          >
                            <div className="h-28 bg-gray-200 flex items-center justify-center overflow-hidden">
                              {featuredRecommendation.image ? (
                                <img
                                  src={featuredRecommendation.image}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <Mountain className="w-10 h-10 opacity-20" />
                              )}
                            </div>
                            <div className="p-4">
                              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                                Top Rated
                              </p>
                              <h5 className="text-xs font-bold text-gray-800">
                                {featuredRecommendation.name}
                              </h5>
                              <div className="flex items-center gap-1 mt-2">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-[10px] font-bold text-gray-600">
                                  {featuredRecommendation.rating || "4.9"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        )}
                        <div className="mt-6 flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                          <p className="text-[9px] text-gray-500 font-medium">
                            Jaminan alat bersih & layak pakai di setiap
                            pendakian.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <Link href="/catalog">
              <Button
                variant="ghost"
                className="font-semibold text-emerald-900/80 text-[14px]"
              >
                Katalog
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="font-semibold text-emerald-900/80 text-[14px] flex items-center gap-1"
                >
                  Kategori <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 rounded-md p-1 bg-white border-emerald-900/10 shadow-xl"
              >
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/catalog/${cat.id}`}>
                    <DropdownMenuItem className="rounded-sm focus:bg-emerald-50 cursor-pointer py-2 text-sm font-medium">
                      {cat.name}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/bundles">
              <Button
                variant="ghost"
                className="font-bold text-orange-700 hover:text-orange-800 hover:bg-orange-50 text-[14px]"
              >
                Paket Hemat
              </Button>
            </Link>
          </div>

          {/* 4. Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-emerald-900/70"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-emerald-900/70 hover:text-[#1B4332]"
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="w-[22px] h-[22px]" />
                {isClient && totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#F2EDE4]">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-emerald-900/70"
              asChild
            >
              <Link href="/account">
                <User className="w-[22px] h-[22px]" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden ml-1 text-emerald-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* 5. Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px]"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 top-0 h-full w-[280px] bg-white shadow-2xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10 pb-4 border-b">
                <h2 className="text-xs font-bold text-emerald-900/40 uppercase tracking-widest">
                  Navigasi
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                  className="h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-1">
                <MobileNavLink
                  href="/catalog"
                  label="Katalog Gear"
                  onClick={closeMenu}
                />
                <MobileNavLink
                  href="/bundles"
                  label="Paket Bundling"
                  onClick={closeMenu}
                />
                <MobileNavLink
                  href="/guide"
                  label="Panduan Sewa"
                  onClick={closeMenu}
                />
              </div>
              <div className="mt-auto pt-6">
                <Link href="/catalog" onClick={closeMenu}>
                  <Button className="w-full bg-[#1B4332] text-white font-bold h-12">
                    Sewa Sekarang
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileNavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between px-4 py-4 rounded-md text-[15px] font-semibold text-emerald-900/80 hover:bg-emerald-50 transition-colors border-l-2 border-transparent hover:border-emerald-700"
    >
      {label}
      <Compass className="w-4 h-4 opacity-20" />
    </Link>
  );
}
