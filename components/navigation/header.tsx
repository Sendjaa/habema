"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ShoppingCart,
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
  User,
  LogIn
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
import { supabase } from "@/lib/supabaseClient";
import { NavbarUserControl } from "./navUserControl";
import Image from "next/image";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navbarBottom, setNavbarBottom] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredRecommendation, setFeaturedRecommendation] = useState<any>(null);
  const cartItems = useCartStore((state) => state.items);
  const [isClient, setIsClient] = React.useState(false);
  const [user, setUser] = useState<any>(null);
  

  React.useEffect(() => {
    setIsClient(true);
    
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const navbarHeight = "100px";

  // --- FIX 1: Lock Scroll saat Menu Mobile Terbuka ---
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  useEffect(() => {
    const updateNavbarPosition = () => {
      setIsScrolled(window.scrollY > 10);
      
      // Calculate navbar bottom position
      const headerElement = document.querySelector('header');
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        setNavbarBottom(rect.bottom);
      }
    };

    const handleScroll = () => {
      updateNavbarPosition();
    };
    
    // Initial calculation
    updateNavbarPosition();
    
    // Update on scroll
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateNavbarPosition);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateNavbarPosition);
    };
  }, []);

  // Disable scroll when search modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

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
          const result = await response.json();
          setProducts(result.data || []);
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
      {/* <div className="hidden sm:block bg-[#1B4332] text-emerald-50/70 text-[11px] py-2 font-medium tracking-wide">
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
            <Link href="/help" className="hover:text-white transition-colors">Bantuan</Link>
            <div className="w-[1px] h-3 bg-emerald-800" />
            <Link href="/track" className="hover:text-white transition-colors">Lacak Pesanan</Link>
          </div>
        </div>
      </div> */}

      <nav className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 gap-4">
          {/* 1. Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <Image src="/images/logo-dark.png" alt="Habema Logo" width={80} height={40} />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-[#1B4332] tracking-tight leading-none">HABEMA</h1>
              <span className="text-[10px] font-semibold text-emerald-800/60 uppercase tracking-widest mt-0.5">Outdoor Rental</span>
            </div>
          </Link>

          {/* 2. Desktop Search - FIX 2: Z-INDEX & Clickability */}
          <div className="hidden md:flex flex-1 max-w-xl relative group px-4 z-[60]">
            <div
              className={`w-full h-11 flex items-center px-4 rounded-lg border cursor-text transition-all ${isOpen ? "bg-white border-emerald-600 shadow-sm" : "bg-gray-100 border-transparent hover:bg-gray-200/70"}`}
              onClick={() => setIsOpen(true)} // Pastikan div pembungkus juga trigger focus
            >
              <Search className={`w-5 h-5 mr-3 transition-colors ${isOpen ? "text-emerald-600" : "text-gray-500"}`} />
              <input
                type="text"
                placeholder="Cari perlengkapan gunung..."
                className="bg-transparent border-none outline-none text-sm flex-1 text-gray-800"
                value={searchValue}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <button onClick={(e) => { e.stopPropagation(); setSearchValue(""); }} className="mr-2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-bold text-gray-500">/</div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Overlay untuk klik di luar */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-black/20 z-[40]"
                    onClick={() => setIsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{ top: "100%" }}
                    className="absolute left-0 right-0 bg-[#F2EDE4] z-[50] shadow-xl border border-gray-100 rounded-xl overflow-hidden mt-2"
                  >
                    {/* Content Search Results */}
                    <div className="grid grid-cols-12 max-h-[70vh] overflow-y-auto">
                      {/* Left: Search Results */}
                      <div className="col-span-8 border-r border-gray-200 bg-white">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Hasil Pencarian</h3>
                            <div className="flex items-center gap-2">
                              {isLoading && <div className="text-xs text-gray-500">Mencari...</div>}
                              <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </button>
                            </div>
                          </div>
                          
                          {searchValue.length < 2 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Ketik minimal 2 karakter untuk mencari</p>
                            </div>
                          ) : products.length === 0 && !isLoading ? (
                            <div className="text-center py-8 text-gray-400">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Tidak ada hasil untuk "{searchValue}"</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {products.map((product) => {
                                // Check if search matches product name or category
                                const searchLower = searchValue.toLowerCase();
                                const nameMatch = product.name?.toLowerCase().includes(searchLower);
                                const categoryMatch = product.equipment_categories?.name?.toLowerCase().includes(searchLower);
                                
                                return (
                                  <Link
                                    key={product.id}
                                    href={`/product/${product.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    onClick={() => {
                                      setIsOpen(false);
                                      setSearchValue("");
                                    }}
                                  >
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                      {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                                          <Mountain className="w-6 h-6 text-emerald-600" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                                        {nameMatch && (
                                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">
                                            Nama
                                          </span>
                                        )}
                                        {categoryMatch && (
                                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded-full">
                                            Kategori
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Leaf className="w-3 h-3" />
                                        {product.equipment_categories?.name || 'Tidak ada kategori'}
                                      </p>
                                      <p className="text-sm font-bold text-emerald-600">
                                        Rp{Number(product.price_per_night || 0).toLocaleString('id-ID')}/hari
                                      </p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right: Expert Choice */}
                      <div className="col-span-4 bg-gray-50">
                        <div className="p-4">
                          <h3 className="text-sm font-bold text-gray-900 mb-4">Pilihan Expert</h3>
                          
                          {featuredRecommendation ? (
                            <Link
                              href={`/product/${featuredRecommendation.id}`}
                              className="block"
                              onClick={() => {
                                setIsOpen(false);
                                setSearchValue("");
                              }}
                            >
                              <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 relative">
                                  {featuredRecommendation.image_url && (
                                    <img 
                                      src={featuredRecommendation.image_url} 
                                      alt={featuredRecommendation.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                    HOT
                                  </div>
                                </div>
                                <div className="p-3">
                                  <h4 className="text-xs font-bold text-gray-900 truncate mb-1">{featuredRecommendation.name}</h4>
                                  <p className="text-xs text-gray-500 mb-2">{featuredRecommendation.equipment_categories?.name}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-emerald-600">
                                      Rp{Number(featuredRecommendation.price_per_night || 0).toLocaleString('id-ID')}
                                    </span>
                                    <div className="flex items-center text-xs text-amber-500">
                                      <Star className="w-3 h-3 fill-current mr-1" />
                                      4.8
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs">Tidak ada rekomendasi</p>
                            </div>
                          )}
                          
                          {/* Categories */}
                          <div className="mt-6">
                            <h4 className="text-xs font-bold text-gray-900 mb-3">Kategori Populer</h4>
                            <div className="space-y-2">
                              {categories.slice(0, 4).map((category) => (
                                <Link
                                  key={category.id}
                                  href={`/catalog?category=${category.id}`}
                                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors"
                                  onClick={() => {
                                    setIsOpen(false);
                                    setSearchValue("");
                                  }}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Leaf className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{category.name}</p>
                                    <p className="text-xs text-gray-500">{category.description}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
            )}
          </AnimatePresence>
        </div>

          {/* 3. Navigation & Actions */}
          <div className="flex items-center gap-1">
            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-1 mr-2">
                <Link href="/catalog">
                    <Button variant="ghost" className="font-semibold text-emerald-900/80 text-[14px]">Katalog</Button>
                </Link>
                <Link href="/bundles">
                    <Button variant="ghost" className="font-bold text-orange-700 hover:text-orange-800 hover:bg-orange-50 text-[14px]">Paket Hemat</Button>
                </Link>
            </div>

            <Button variant="ghost" size="icon" className="relative text-emerald-900/70" asChild>
              <Link href="/cart">
                <ShoppingCart className="w-[22px] h-[22px]" />
                {isClient && totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#F2EDE4]">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>

            {/* login - Fitur Akun */}
            <NavbarUserControl />

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden ml-1 text-emerald-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </nav>
      {/* 5. Mobile Menu Overlay & Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
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
                <h2 className="text-xs font-bold text-emerald-900/40 uppercase tracking-widest">Navigasi</h2>
                <Button variant="ghost" size="icon" onClick={closeMenu} className="h-8 w-8">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-1">
                {isClient && (
                  <Link
                    href={user ? "/account" : "/login"}
                    onClick={closeMenu}
                    className={`flex items-center justify-between px-4 py-4 rounded-md text-[15px] font-bold mb-2 transition-all ${
                      user 
                        ? "text-emerald-700 bg-emerald-50" 
                        : "text-orange-700 bg-orange-50 border border-orange-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {user ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center overflow-hidden">
                            <User className="w-4 h-4 text-emerald-700" />
                          </div>
                          <div className="flex flex-col">
                            <span className="leading-none">{user.email?.split('@')[0] || "Akun Saya"}</span>
                            <span className="text-[10px] font-medium text-emerald-600/60 mt-1">Lihat Profil</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          <span>Masuk / Daftar</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 -rotate-90 opacity-40" />
                  </Link>
                )}

                <MobileNavLink href="/catalog" label="Katalog Gear" onClick={closeMenu} />
                <MobileNavLink href="/bundles" label="Paket Bundling" onClick={closeMenu} />
                <MobileNavLink href="/guide" label="Panduan Sewa" onClick={closeMenu} />
              </div>

              <div className="mt-auto pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status Member</p>
                    <p className="text-xs font-bold text-emerald-900">Verified Adventurer</p>
                  </div>
                </div>
                <Link href="/catalog" onClick={closeMenu}>
                  <Button className="w-full bg-[#1B4332] text-white font-bold h-12 shadow-lg shadow-emerald-900/20">
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

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
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