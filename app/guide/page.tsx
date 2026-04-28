"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  Shield,
  Package,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Star,
  Phone,
  Mail,
  MessageCircle,
  HelpCircle,
  Search,
  Filter,
  TrendingUp,
  Zap,
  Heart,
  Truck,
  Award,
  HeadphonesIcon as Headphones,
  FileText,
  Video,
  Download,
} from "lucide-react";

export default function GuidePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", name: "Semua Panduan", icon: BookOpen, color: "bg-emerald-500" },
    { id: "booking", name: "Cara Pemesanan", icon: Package, color: "bg-blue-500" },
    { id: "payment", name: "Pembayaran", icon: CreditCard, color: "bg-green-500" },
    { id: "delivery", name: "Pengiriman", icon: Truck, color: "bg-orange-500" },
    { id: "account", name: "Akun & Profil", icon: Users, color: "bg-purple-500" },
    { id: "safety", name: "Keamanan", icon: Shield, color: "bg-red-500" },
  ];

  const guides = [
    {
      id: 1,
      category: "booking",
      title: "Cara Memesan Peralatan Outdoor",
      description: "Panduan lengkap langkah demi langkah untuk memesan peralatan outdoor yang Anda butuhkan.",
      difficulty: "Mudah",
      readTime: "5 menit",
      icon: Package,
      featured: true,
      steps: [
        "Browse katalog peralatan",
        "Pilih item yang diinginkan",
        "Tentukan durasi sewa",
        "Lakukan pembayaran",
        "Tunggu konfirmasi",
      ],
    },
    {
      id: 2,
      category: "payment",
      title: "Metode Pembayaran yang Tersedia",
      description: "Pelajari berbagai metode pembayaran yang aman dan mudah untuk transaksi Anda.",
      difficulty: "Mudah",
      readTime: "3 menit",
      icon: CreditCard,
      featured: true,
      methods: ["Transfer Bank", "E-Wallet", "Virtual Account", "COD"],
    },
    {
      id: 3,
      category: "delivery",
      title: "Proses Pengiriman & Pengembalian",
      description: "Pahami alur pengiriman peralatan ke lokasi Anda dan prosedur pengembalian.",
      difficulty: "Sedang",
      readTime: "7 menit",
      icon: Truck,
      featured: false,
    },
    {
      id: 4,
      category: "account",
      title: "Mengelola Profil Pengguna",
      description: "Panduan untuk mengatur profil, alamat, dan preferensi akun Anda.",
      difficulty: "Mudah",
      readTime: "4 menit",
      icon: Users,
      featured: false,
    },
    {
      id: 5,
      category: "safety",
      title: "Tips Keamanan Saat Bersepeda",
      description: "Panduan keselamatan penting untuk pengalaman bersepeda yang aman dan nyaman.",
      difficulty: "Sedang",
      readTime: "10 menit",
      icon: Shield,
      featured: true,
    },
    {
      id: 6,
      category: "booking",
      title: "Cara Membatalkan Pesanan",
      description: "Langkah-langkah untuk membatalkan pesanan dan memahami kebijakan pembatalan.",
      difficulty: "Mudah",
      readTime: "3 menit",
      icon: Package,
      featured: false,
    },
  ];

  const filteredGuides = guides.filter((guide) => {
    const matchesCategory = activeCategory === "all" || guide.category === activeCategory;
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredGuides = guides.filter((guide) => guide.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-medium">Pusat Bantuan & Panduan</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Panduan Lengkap Habema
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Temukan jawaban dan panduan lengkap untuk pengalaman menyewa peralatan outdoor yang mudah dan aman
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari panduan yang Anda butuhkan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 placeholder-gray-500 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: "Panduan Aktif", value: "6+" },
            { icon: Users, label: "Pengguna Puas", value: "1000+" },
            { icon: Clock, label: "Response Time", value: "< 5 menit" },
            { icon: Star, label: "Rating", value: "4.9" },
          ].map((stat, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-4 text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kategori Panduan</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className={`flex items-center gap-2 ${
                    activeCategory === category.id
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-emerald-600 hover:text-emerald-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Featured Guides */}
        {activeCategory === "all" && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Panduan Unggulan</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGuides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <Card key={guide.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-lg overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-blue-500" />
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                          <Icon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <Star className="w-3 h-3 mr-1" />
                          Unggulan
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {guide.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 mb-4 line-clamp-2">{guide.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {guide.readTime}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {guide.difficulty}
                        </Badge>
                      </div>
                      <Button className="w-full group/btn">
                        Baca Panduan
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Guides */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeCategory === "all" ? "Semua Panduan" : categories.find(c => c.id === activeCategory)?.name}
            </h2>
            <div className="text-sm text-gray-500">
              {filteredGuides.length} panduan ditemukan
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Card key={guide.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-emerald-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <Icon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {guide.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.id === guide.category)?.name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {guide.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{guide.description}</p>
                    <Button variant="outline" className="w-full group/btn">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Baca Selengkapnya
                      <ChevronRight className="w-4 h-4 ml-auto group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Butuh Bantuan Tambahan?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tim Support Siap Membantu
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Jika Anda tidak menemukan jawaban yang dicari, tim support kami siap membantu Anda 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                <MessageCircle className="w-5 h-5 mr-2" />
                Live Chat
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-600">
                <Mail className="w-5 h-5 mr-2" />
                Email Support
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-600">
                <Phone className="w-5 h-5 mr-2" />
                +62 812-3456-7890
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
