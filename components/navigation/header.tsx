"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
  LogIn,
  Backpack,
  Store,
  Footprints,
  Trash2,
  History,
  AlertCircle
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

// Data untuk dropdown Layanan
const layananItems = [
  {
    label: "Rental",
    href: "/rental",
    icon: Backpack,
    description: "Sewa peralatan outdoor"
  },
  {
    label: "Shop",
    href: "/shop",
    icon: Store,
    description: "Belanja perlengkapan"
  },
  {
    label: "Open Trip",
    href: "/opentrip",
    icon: Footprints,
    description: "Paket petualangan kami"
  }
];

// Types
interface SearchProduct {
  id: string;
  name: string;
  image_url?: string;
  price_per_night?: number;
  price?: number;
  equipment_categories?: {
    name: string;
  };
  rating?: number;
  description?: string;
}

interface SearchCategory {
  id: number;
  name: string;
  description?: string;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navbarBottom, setNavbarBottom] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [featuredRecommendation, setFeaturedRecommendation] = useState<SearchProduct | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
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

  // Load recent searches dari localStorage
  useEffect(() => {
    if (isClient) {
      const saved = localStorage.getItem("habema_recent_searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error("Error loading recent searches:", e);
        }
      }
    }
  }, [isClient]);

  const navbarHeight = "100px";

  // --- Lock Scroll saat Menu Mobile Terbuka ---
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      // Scroll to top of menu panel
      if (menuPanelRef.current) {
        menuPanelRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { 
      document.body.style.overflow = "unset"; 
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const updateNavbarPosition = () => {
      setIsScrolled(window.scrollY > 10);
      
      const headerElement = document.querySelector('header');
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        setNavbarBottom(rect.bottom);
      }
    };
    const handleScroll = () => {
      updateNavbarPosition();
    };
    
    updateNavbarPosition();
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
    return () => { 
      document.body.style.overflow = "unset"; 
    };
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

  // Fetch initial data (categories & featured)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, recRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products/featured?limit=1"),
        ]);
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data);
        }
        if (recRes.ok) {
          const data = await recRes.json();
          setFeaturedRecommendation(data[0]);
        }
      } catch (error) {
        console.error("Gagal memuat data awal:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Enhanced search dengan debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchValue.length < 2) {
      setProducts([]);
      setSearchError(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(searchValue)}&limit=12`,
          {
            signal: AbortSignal.timeout(5000) // 5 second timeout
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setProducts(result.data || []);

        if (result.data?.length === 0) {
          setSearchError(`Tidak ada hasil untuk "${searchValue}"`);
        }
      } catch (error: any) {
        console.error("Search error:", error);
        if (error.name !== "AbortError") {
          setSearchError("Terjadi kesalahan saat mencari. Coba lagi.");
        }
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchValue]);

  const closeMenu = () => setIsMenuOpen(false);

  const totalItems = (cartItems || []).reduce(
    (total: number, item: any) => total + item.quantity,
    0,
  );

  // Handle search submission
  const handleSearch = (query: string) => {
    if (query.trim().length < 2) return;

    // Add to recent searches
    const updated = [
      query,
      ...recentSearches.filter(s => s !== query).slice(0, 4)
    ];
    setRecentSearches(updated);
    if (isClient) {
      localStorage.setItem("habema_recent_searches", JSON.stringify(updated));
    }

    // Navigate to catalog with search query
    setIsOpen(false);
    setSearchValue("");
    window.location.href = `/catalog?search=${encodeURIComponent(query)}`;
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (isClient) {
      localStorage.removeItem("habema_recent_searches");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#F2EDE4]/95 backdrop-blur-md border-b border-emerald-900/10 shadow-sm"
          : "bg-[#F2EDE4] border-b border-transparent"
      }`}
    >
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
          
          {/* 2. Desktop Search - Improved */}
          <div className="hidden md:flex flex-1 max-w-xl relative group px-4 z-60">
            <div
              className={`w-full h-11 flex items-center px-4 rounded-lg border cursor-text transition-all ${
                isOpen ? "bg-white border-emerald-600 shadow-lg" : "bg-gray-100 border-transparent hover:bg-gray-200/70"
              }`}
              onClick={() => setIsOpen(true)}
            >
              <Search className={`w-5 h-5 mr-3 transition-colors flex-shrink-0 ${isOpen ? "text-emerald-600" : "text-gray-500"}`} />
              <input
                type="text"
                placeholder="Cari perlengkapan, kategori..."
                className="bg-transparent border-none outline-none text-sm flex-1 text-gray-800 placeholder-gray-500"
                value={searchValue}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchValue);
                  }
                }}
              />
              {searchValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchValue("");
                    setSearchError(null);
                  }}
                  className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-bold text-gray-500">/</div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setIsOpen(false)}
                  />

                  {/* Search Results Modal */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{ top: "100%" }}
                    className="absolute left-0 right-0 bg-[#F2EDE4] z-50 shadow-2xl border border-gray-200 rounded-2xl overflow-hidden mt-2 max-h-[75vh] flex flex-col"
                  >
                    {/* Search Input Area */}
                    <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-bold text-gray-900">
                        {searchValue ? `Hasil untuk "${searchValue}"` : "Saran Pencarian"}
                      </h3>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="overflow-y-auto flex-1">
                      {/* Error State */}
                      {searchError && searchValue.length >= 2 && (
                        <div className="p-4 bg-red-50 border-b border-red-100">
                          <div className="flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{searchError}</p>
                          </div>
                        </div>
                      )}

                      {/* Loading State */}
                      {isLoading && searchValue.length >= 2 && (
                        <div className="p-8 text-center">
                          <div className="inline-block">
                            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                          </div>
                          <p className="text-sm text-gray-500 mt-3">Mencari produk...</p>
                        </div>
                      )}

                      {/* Results Grid */}
                      {!isLoading && searchValue.length >= 2 && products.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 p-4">
                          {products.map((product) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.id}`}
                              className="group cursor-pointer"
                              onClick={() => {
                                handleSearch(searchValue);
                              }}
                            >
                              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                                {/* Image */}
                                <div className="aspect-square bg-gray-100 overflow-hidden">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
                                      <Mountain className="w-8 h-8 text-emerald-600" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                  <h4 className="text-xs font-bold text-gray-900 truncate mb-1">
                                    {product.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 truncate mb-2">
                                    {product.equipment_categories?.name || "Gear"}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-emerald-600">
                                      Rp{Number(product.price_per_night || product.price || 0).toLocaleString('id-ID')}
                                    </span>
                                    {product.rating && (
                                      <div className="flex items-center text-xs text-amber-500">
                                        <Star className="w-3 h-3 fill-current" />
                                        {product.rating.toFixed(1)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Empty State */}
                      {searchValue.length < 2 && !isLoading && (
                        <div className="p-8">
                          {/* Recent Searches */}
                          {recentSearches.length > 0 && (
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                  <History className="w-4 h-4 text-gray-400" />
                                  Pencarian Terakhir
                                </h4>
                                <button
                                  onClick={clearRecentSearches}
                                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Hapus
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {recentSearches.map((search, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSearchValue(search)}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200"
                                  >
                                    {search}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Popular Categories */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Kategori Populer</h4>
                            <div className="space-y-2">
                              {categories.slice(0, 5).map((category) => (
                                <button
                                  key={category.id}
                                  onClick={() => setSearchValue(category.name)}
                                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <Leaf className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                                    {category.description && (
                                      <p className="text-xs text-gray-500 truncate">{category.description}</p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Featured Product */}
                          {featuredRecommendation && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Rekomendasi</h4>
                              <Link
                                href={`/product/${featuredRecommendation.id}`}
                                className="block"
                                onClick={() => {
                                  setIsOpen(false);
                                  setSearchValue("");
                                }}
                              >
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-3 flex gap-3">
                                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                    {featuredRecommendation.image_url && (
                                      <img
                                        src={featuredRecommendation.image_url}
                                        alt={featuredRecommendation.name}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="inline-block bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mb-1">
                                      HOT
                                    </div>
                                    <h5 className="text-sm font-bold text-gray-900 truncate">
                                      {featuredRecommendation.name}
                                    </h5>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {featuredRecommendation.equipment_categories?.name}
                                    </p>
                                    <span className="text-sm font-bold text-emerald-600">
                                      Rp{Number(featuredRecommendation.price_per_night || 0).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* View All CTA */}
                    {searchValue.length >= 2 && products.length > 0 && (
                      <div className="bg-white border-t border-gray-100 p-3 text-center flex-shrink-0">
                        <button
                          onClick={() => handleSearch(searchValue)}
                          className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Lihat Semua Hasil ({products.length} produk)
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          {/* 3. Navigation & Actions */}
          <div className="flex items-center gap-1">
            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-1 mr-2">
              {/* Dropdown Layanan */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-semibold text-emerald-900/80 text-[14px] flex items-center gap-1">
                    Layanan
                    <ChevronDown className="w-4 h-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white border border-gray-200 shadow-lg">
                  {layananItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-emerald-50">
                          <Icon className="w-4 h-4 text-emerald-600" />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-emerald-900">{item.label}</span>
                            <span className="text-xs text-gray-500">{item.description}</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Link href="/bundles">
                <Button variant="ghost" className="font-bold text-orange-700 hover:text-orange-800 hover:bg-orange-50 text-[14px]">Paket Hemat</Button>
              </Link>
            </div>
            
            <Button variant="ghost" size="icon" className="relative text-emerald-900/70" asChild>
              <Link href="/cart">
                <ShoppingCart className="w-5.5 h-5.5" />
                {isClient && totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#F2EDE4]">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>
            
            {/* User Control */}
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
      
      {/* Mobile Menu - RESPONSIVE FIX */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px]"
              onClick={closeMenu}
            />
            {/* Mobile Menu Panel - Full Height & Scrollable */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-70 bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header - Fixed */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-xs font-bold text-emerald-900/40 uppercase tracking-widest">Navigasi</h2>
                <Button variant="ghost" size="icon" onClick={closeMenu} className="h-8 w-8">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Scrollable Content Area */}
              <div 
                ref={menuPanelRef}
                className="flex-1 overflow-y-auto"
              >
                <div className="px-6 py-4 space-y-1">
                  {/* User Account Section */}
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
                            <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <User className="w-4 h-4 text-emerald-700" />
                            </div>
                            <div className="flex flex-col">
                              <span className="leading-none">{user.email?.split('@')[0] || "Akun Saya"}</span>
                              <span className="text-[10px] font-medium text-emerald-600/60 mt-1">Lihat Profil</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-5 h-5 flex-shrink-0" />
                            <span>Masuk / Daftar</span>
                          </>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90 opacity-40 flex-shrink-0" />
                    </Link>
                  )}
                  
                  {/* Dropdown Layanan */}
                  <div className="border-l-2 border-transparent">
                    <button
                      onClick={() => setExpandedMobileMenu(expandedMobileMenu === "layanan" ? null : "layanan")}
                      className="w-full flex items-center justify-between px-4 py-4 rounded-md text-[15px] font-semibold text-emerald-900/80 hover:bg-emerald-50 transition-colors"
                    >
                      <span>Layanan</span>
                      <ChevronDown
                        className={`w-4 h-4 opacity-40 transition-transform flex-shrink-0 ${
                          expandedMobileMenu === "layanan" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    
                    <AnimatePresence>
                      {expandedMobileMenu === "layanan" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 space-y-1">
                            {layananItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={closeMenu}
                                  className="flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium text-emerald-900/70 hover:bg-emerald-50 transition-colors border-l-2 border-emerald-600"
                                >
                                  <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  <div className="flex flex-col">
                                    <span>{item.label}</span>
                                    <span className="text-xs text-gray-500">{item.description}</span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Other Links */}
                  <MobileNavLink href="/bundles" label="Paket Hemat" onClick={closeMenu} />
                  <MobileNavLink href="/guide" label="Panduan Sewa" onClick={closeMenu} />
                </div>
              </div>
              
              {/* Footer - Fixed */}
              <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 space-y-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status Member</p>
                    <p className="text-xs font-bold text-emerald-900">Verified Adventurer</p>
                  </div>
                </div>
                <Link href="/rental" onClick={closeMenu}>
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
      <Compass className="w-4 h-4 opacity-20 flex-shrink-0" />
    </Link>
  );
}