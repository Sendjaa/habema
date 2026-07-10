"use client";
import { useState } from "react";
import {
  BookOpen, Users, Shield, Package, CreditCard, Clock,
  CheckCircle, ArrowRight, ChevronRight, Star, Phone,
  Mail, MessageCircle, HelpCircle, Search, Truck, X,
  ChevronDown, ChevronUp, AlertCircle, RotateCcw,
} from "lucide-react";

interface GuideStep {
  title: string;
  desc: string;
}

interface GuideContent {
  intro: string;
  steps: GuideStep[];
  tips?: string[];
}

interface Guide {
  id: number;
  category: string;
  title: string;
  description: string;
  difficulty: "Mudah" | "Sedang" | "Sulit";
  readTime: string;
  icon: any;
  featured: boolean;
  color: string;
  content: GuideContent;
}

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}

interface GuideModalProps {
  guide: Guide | null;
  onClose: () => void;
}

interface GuideCardProps {
  guide: Guide;
  onOpen: (guide: Guide) => void;
  featured: boolean;
}

const CATEGORIES = [
  { id: "all", name: "Semua Panduan", icon: BookOpen },
  { id: "booking", name: "Cara Pemesanan", icon: Package },
  { id: "payment", name: "Pembayaran", icon: CreditCard },
  { id: "delivery", name: "Pengiriman", icon: Truck },
  { id: "account", name: "Akun & Profil", icon: Users },
  { id: "safety", name: "Keamanan", icon: Shield },
];

const GUIDES = [
  {
    id: 1,
    category: "booking",
    title: "Cara Memesan Peralatan Outdoor",
    description: "Panduan lengkap langkah demi langkah untuk memesan peralatan outdoor yang Anda butuhkan.",
    difficulty: "Mudah" as const,
    readTime: "5 menit",
    icon: Package,
    featured: true,
    color: "#2563eb",
    content: {
      intro: "Memesan peralatan outdoor di Habema sangat mudah dan cepat. Ikuti langkah-langkah berikut untuk memulai petualangan Anda.",
      steps: [
        { title: "Browse Katalog", desc: "Buka halaman katalog dan gunakan filter kategori (tenda, sepeda, panjat tebing, dll.) untuk menemukan peralatan yang Anda butuhkan." },
        { title: "Pilih Item", desc: "Klik item yang diinginkan untuk melihat detail lengkap: foto, spesifikasi, ketersediaan, dan harga per hari." },
        { title: "Tentukan Durasi Sewa", desc: "Pilih tanggal mulai dan tanggal akhir sewa. Sistem akan otomatis menghitung total biaya berdasarkan durasi yang dipilih." },
        { title: "Tambah ke Keranjang", desc: "Klik 'Sewa Sekarang' lalu review pesanan Anda di halaman keranjang. Anda bisa menambah atau menghapus item." },
        { title: "Lakukan Pembayaran", desc: "Pilih metode pembayaran yang diinginkan (transfer bank, e-wallet, virtual account) dan selesaikan transaksi." },
        { title: "Tunggu Konfirmasi", desc: "Setelah pembayaran berhasil, Anda akan menerima email dan notifikasi konfirmasi beserta estimasi pengiriman." },
      ],
      tips: [
        "Pesan minimal 2 hari sebelum tanggal keberangkatan untuk memastikan ketersediaan",
        "Cek ulasan pengguna lain sebelum memilih peralatan",
        "Manfaatkan halaman 'Promo' untuk klaim kode potongan harga",
      ],
    },
  },
  {
    id: 2,
    category: "payment",
    title: "Metode Pembayaran yang Tersedia",
    description: "Pelajari berbagai metode pembayaran yang aman dan mudah untuk transaksi Anda.",
    difficulty: "Mudah" as const,
    readTime: "3 menit",
    icon: CreditCard,
    featured: true,
    color: "#16a34a",
    content: {
      intro: "Habema menyediakan berbagai pilihan pembayaran untuk kemudahan transaksi Anda. Semua metode dijamin aman dengan enkripsi SSL.",
      steps: [
        { title: "Transfer Bank", desc: "Tersedia untuk BCA, Mandiri, BNI, BRI, dan bank lainnya. Konfirmasi pembayaran otomatis dalam 1–2 jam." },
        { title: "E-Wallet", desc: "Mendukung GoPay, OVO, Dana, ShopeePay, dan LinkAja. Proses konfirmasi instan setelah pembayaran." },
        { title: "Virtual Account", desc: "Dapatkan nomor VA unik untuk setiap transaksi. Bisa dibayar melalui ATM, mobile banking, atau internet banking." },
        { title: "COD (Bayar di Tempat)", desc: "Tersedia untuk area tertentu. Bayar tunai saat peralatan diantarkan ke lokasi Anda." },
        { title: "Kartu Kredit/Debit", desc: "Mendukung Visa, Mastercard, dan JCB. Bisa dicicil 0% untuk pembelian di atas Rp 500.000." },
      ],
      tips: [
        "Simpan bukti pembayaran hingga peralatan dikembalikan",
        "Pembayaran e-wallet mendapat cashback hingga 10% untuk pengguna baru",
        "Gunakan Virtual Account untuk kemudahan lacak transaksi",
      ],
    },
  },
  {
    id: 3,
    category: "delivery",
    title: "Proses Pengiriman & Pengembalian",
    description: "Pahami alur pengiriman peralatan ke lokasi Anda dan prosedur pengembalian.",
    difficulty: "Sedang" as const,
    readTime: "7 menit",
    icon: Truck,
    featured: false,
    color: "#ea580c",
    content: {
      intro: "Habema melayani pengiriman ke seluruh wilayah Jawa Barat dengan armada khusus untuk memastikan peralatan tiba dalam kondisi sempurna.",
      steps: [
        { title: "Konfirmasi Pesanan", desc: "Setelah pembayaran diterima, tim kami akan menghubungi Anda untuk konfirmasi alamat dan jadwal pengiriman." },
        { title: "Persiapan & Pengemasan", desc: "Peralatan dicek kondisi dan kelengkapannya, kemudian dikemas dengan aman menggunakan pelindung khusus." },
        { title: "Pengiriman", desc: "Kurir kami akan mengantarkan peralatan ke alamat yang ditentukan. Anda akan mendapat notifikasi real-time status pengiriman." },
        { title: "Cek Kondisi", desc: "Periksa kondisi semua peralatan saat diterima. Laporkan jika ada kerusakan dalam 2 jam setelah terima." },
        { title: "Pengembalian", desc: "Hubungi kami H-1 sebelum tanggal pengembalian. Kurir akan menjemput peralatan di alamat yang sama atau alamat berbeda." },
      ],
      tips: [
        "Pastikan ada penerima di lokasi saat estimasi pengiriman tiba",
        "Foto kondisi peralatan sebelum dikembalikan sebagai bukti",
        "Pengembalian terlambat dikenakan biaya tambahan Rp 25.000/jam",
      ],
    },
  },
  {
    id: 4,
    category: "account",
    title: "Mengelola Profil Pengguna",
    description: "Panduan untuk mengatur profil, alamat, dan preferensi akun Anda.",
    difficulty: "Mudah" as const,
    readTime: "4 menit",
    icon: Users,
    featured: false,
    color: "#9333ea",
    content: {
      intro: "Kelola akun Habema Anda dengan mudah untuk pengalaman sewa yang lebih personal dan efisien.",
      steps: [
        { title: "Edit Profil", desc: "Masuk ke menu 'Profil' dan klik 'Edit'. Update nama, foto profil, nomor telepon, dan informasi pribadi lainnya." },
        { title: "Kelola Alamat", desc: "Tambah dan simpan beberapa alamat pengiriman untuk kemudahan pemesanan. Tandai satu alamat sebagai 'Utama'." },
        { title: "Notifikasi", desc: "Atur preferensi notifikasi: email, push notification, atau SMS untuk update pesanan, promo, dan pengingat pengembalian." },
        { title: "Keamanan Akun", desc: "Aktifkan verifikasi dua langkah (2FA) dan ganti password secara berkala untuk keamanan akun Anda." },
        { title: "Riwayat Sewa", desc: "Lihat histori semua transaksi, unduh invoice, dan berikan ulasan untuk peralatan yang pernah Anda sewa." },
      ],
      tips: [
        "Lengkapi profil untuk proses verifikasi yang lebih cepat",
        "Aktifkan 2FA untuk perlindungan ekstra",
        "Member dengan profil lengkap mendapat prioritas layanan",
      ],
    },
  },
  {
    id: 5,
    category: "safety",
    title: "Tips Keamanan Saat Bersepeda",
    description: "Panduan keselamatan penting untuk pengalaman bersepeda yang aman dan nyaman.",
    difficulty: "Sedang" as const,
    readTime: "10 menit",
    icon: Shield,
    featured: true,
    color: "#dc2626",
    content: {
      intro: "Keselamatan adalah prioritas utama. Ikuti panduan ini sebelum dan selama bersepeda untuk pengalaman yang aman dan menyenangkan.",
      steps: [
        { title: "Cek Peralatan", desc: "Sebelum berangkat, periksa tekanan ban, rem depan-belakang, lampu, dan kelengkapan lainnya. Pastikan semua berfungsi dengan baik." },
        { title: "Gunakan Helm", desc: "Selalu gunakan helm yang sesuai ukuran kepala. Pastikan tali helm terpasang dengan benar dan pas di kepala." },
        { title: "Pakaian yang Tepat", desc: "Kenakan pakaian cerah atau reflektif saat berkendara malam. Gunakan sarung tangan dan pelindung lutut untuk keamanan ekstra." },
        { title: "Ikuti Aturan Lalu Lintas", desc: "Patuhi rambu-rambu dan lampu lalu lintas. Gunakan jalur sepeda jika tersedia dan selalu beri sinyal saat berbelok." },
        { title: "Bawa Perlengkapan Darurat", desc: "Selalu bawa alat tambal ban, pompa mini, air minum, dan obat-obatan dasar. Simpan nomor darurat di ponsel." },
        { title: "Beritahu Orang Lain", desc: "Informasikan rute perjalanan dan estimasi waktu kepada keluarga atau teman. Check-in secara berkala saat perjalanan jauh." },
      ],
      tips: [
        "Hindari menggunakan earphone dengan volume tinggi saat berkendara",
        "Istirahat setiap 1–2 jam untuk perjalanan jarak jauh",
        "Cek cuaca sebelum berangkat dan hindari bersepeda saat hujan lebat",
      ],
    },
  },
  {
    id: 6,
    category: "booking",
    title: "Cara Membatalkan Pesanan",
    description: "Langkah-langkah untuk membatalkan pesanan dan memahami kebijakan pembatalan.",
    difficulty: "Mudah" as const,
    readTime: "3 menit",
    icon: RotateCcw,
    featured: false,
    color: "#0891b2",
    content: {
      intro: "Kami memahami bahwa rencana bisa berubah. Berikut panduan pembatalan pesanan dan kebijakan refund yang berlaku.",
      steps: [
        { title: "Buka Riwayat Pesanan", desc: "Masuk ke akun Anda dan pilih menu 'Pesanan Saya'. Temukan pesanan yang ingin dibatalkan." },
        { title: "Klik 'Batalkan Pesanan'", desc: "Pilih pesanan dan klik tombol 'Batalkan'. Pilih alasan pembatalan dari daftar yang tersedia." },
        { title: "Konfirmasi Pembatalan", desc: "Review detail pembatalan termasuk informasi refund yang akan Anda terima. Klik 'Konfirmasi' untuk melanjutkan." },
        { title: "Proses Refund", desc: "Refund akan diproses dalam 3–7 hari kerja. Dana dikembalikan ke metode pembayaran asal Anda." },
      ],
      tips: [
        "Pembatalan H-3 atau lebih: refund 100% tanpa potongan",
        "Pembatalan H-1 sampai H-2: refund 50% dari total pembayaran",
        "Pembatalan di hari H: tidak ada refund (kecuali force majeure)",
      ],
    },
  },
];

const DIFF_COLOR = { Mudah: "#16a34a", Sedang: "#d97706", Sulit: "#dc2626" };
const DIFF_BG   = { Mudah: "#dcfce7", Sedang: "#fef9c3", Sulit: "#fee2e2" };

function Badge({ children, color = "#374151", bg = "#f3f4f6" }: BadgeProps) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 3,
    }}>{children}</span>
  );
}

function GuideModal({ guide, onClose }: GuideModalProps) {
  if (!guide) return null;
  const Icon = guide.icon;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 620,
          maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${guide.color}dd, ${guide.color}99)`,
          borderRadius: "20px 20px 0 0", padding: "28px 28px 24px",
          position: "relative",
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.25)",
              border: "none", borderRadius: "50%", width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
          ><X size={16} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              background: "rgba(255,255,255,0.25)", borderRadius: 12,
              padding: 12, display: "flex",
            }}>
              <Icon size={24} color="#fff" />
            </div>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <Badge color="#fff" bg="rgba(255,255,255,0.25)">
                  <Clock size={10} /> {guide.readTime}
                </Badge>
                <Badge
                  color={DIFF_COLOR[guide.difficulty]}
                  bg="rgba(255,255,255,0.9)"
                >{guide.difficulty}</Badge>
              </div>
              <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>
                {guide.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px" }}>
          <p style={{ margin: "0 0 24px", color: "#4b5563", lineHeight: 1.7 }}>
            {guide.content.intro}
          </p>

          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
            Langkah-Langkah
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {guide.content.steps.map((step: GuideStep, i: number) => (
              <div key={i} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                background: "#f9fafb", borderRadius: 12, padding: "14px 16px",
              }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: "50%",
                  background: guide.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827", marginBottom: 3, fontSize: 14 }}>
                    {step.title}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {guide.content.tips && guide.content.tips.length > 0 && (
            <>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Tips Penting
              </h3>
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: 12, padding: "14px 16px",
              }}>
                {guide.content.tips.map((tip: string, i: number) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    marginBottom: i < guide.content.tips!.length - 1 ? 10 : 0,
                  }}>
                    <AlertCircle size={14} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: "#92400e", fontSize: 13, lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid #e5e7eb",
                background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >Tutup</button>
            <button
              style={{
                flex: 2, padding: "12px 0", borderRadius: 10, border: "none",
                background: guide.color, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <MessageCircle size={15} /> Hubungi Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ guide, onOpen, featured }: GuideCardProps) {
  const Icon = guide.icon;
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${featured ? guide.color + "44" : "#f3f4f6"}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {featured && (
        <div style={{ height: 4, background: `linear-gradient(90deg, ${guide.color}, ${guide.color}88)` }} />
      )}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{
            background: guide.color + "18", borderRadius: 10, padding: 10, display: "flex",
          }}>
            <Icon size={20} color={guide.color} />
          </div>
          {featured && (
            <Badge color="#92400e" bg="#fef9c3">
              <Star size={10} fill="#d97706" color="#d97706" /> Unggulan
            </Badge>
          )}
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>
          {guide.title}
        </h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {guide.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9ca3af" }}>
            <Clock size={11} /> {guide.readTime}
          </span>
          <Badge
            color={DIFF_COLOR[guide.difficulty]}
            bg={DIFF_BG[guide.difficulty]}
          >{guide.difficulty}</Badge>
        </div>
      </div>
      <div style={{ padding: "0 20px 20px", marginTop: "auto" }}>
        <button
          onClick={() => onOpen(guide)}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            border: `1.5px solid ${guide.color}`,
            background: "#fff", color: guide.color,
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = guide.color; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = guide.color; }}
        >
          <BookOpen size={14} /> Baca Selengkapnya <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const filtered = GUIDES.filter(g => {
    const catOk = activeCategory === "all" || g.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const searchOk = !q || g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    return catOk && searchOk;
  });

  const featured = filtered.filter(g => g.featured);
  const all = filtered;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <GuideModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #059669 0%, #0284c7 100%)",
        padding: "clamp(40px, 8vw, 64px) clamp(16px, 4vw, 24px) clamp(48px, 10vw, 80px)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200,
          background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280,
          background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
            borderRadius: 99, padding: "6px 16px", marginBottom: 20,
          }}>
            <BookOpen size={14} color="#fff" />
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>Pusat Bantuan & Panduan</span>
          </div>
          <h1 style={{ margin: "0 0 16px", color: "#fff", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.2 }}>
            Panduan Lengkap Habema
          </h1>
          <p style={{ margin: "0 0 32px", color: "rgba(255,255,255,0.88)", fontSize: "clamp(15px, 2.5vw, 17px)", lineHeight: 1.6 }}>
            Temukan jawaban dan panduan lengkap untuk pengalaman menyewa peralatan outdoor yang mudah dan aman
          </p>
          {/* Search */}
          <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
            <Search size={18} color="#9ca3af" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Cari panduan yang Anda butuhkan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                paddingLeft: 48, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                borderRadius: 14, border: "none", fontSize: 15, outline: "none",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)", color: "#111827",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
                  display: "flex", padding: 4,
                }}
              ><X size={16} /></button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 960, margin: "-28px auto 0", padding: "0 clamp(16px, 4vw, 24px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { icon: BookOpen, label: "Panduan Aktif", value: "6+" },
            { icon: Users, label: "Pengguna Puas", value: "1.000+" },
            { icon: Clock, label: "Response Time", value: "< 5 mnt" },
            { icon: Star, label: "Rating", value: "4.9" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 14, padding: "16px 12px", textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6",
            }}>
              <s.icon size={22} color="#059669" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px) clamp(40px, 8vw, 60px)" }}>
        {/* Category Filter */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "#111827" }}>Kategori Panduan</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 99, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    border: active ? "none" : "1.5px solid #e5e7eb",
                    background: active ? "#059669" : "#fff",
                    color: active ? "#fff" : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={14} /> {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <HelpCircle size={40} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 17, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Panduan tidak ditemukan</div>
            <div style={{ fontSize: 14 }}>Coba kata kunci lain atau pilih kategori berbeda</div>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              style={{
                marginTop: 16, padding: "10px 24px", borderRadius: 10,
                background: "#059669", color: "#fff", border: "none",
                fontWeight: 600, cursor: "pointer", fontSize: 14,
              }}
            >Reset Filter</button>
          </div>
        )}

        {/* Featured */}
        {activeCategory === "all" && !searchQuery && featured.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ background: "#fef9c3", borderRadius: 8, padding: 8, display: "flex" }}>
                <Star size={16} fill="#d97706" color="#d97706" />
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Panduan Unggulan</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {featured.map((g: Guide) => <GuideCard key={g.id} guide={g} onOpen={setSelectedGuide} featured />)}
            </div>
          </div>
        )}

        {/* All Guides */}
        {all.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {activeCategory === "all" && !searchQuery ? "Semua Panduan" :
                  searchQuery ? `Hasil pencarian "${searchQuery}"` :
                  CATEGORIES.find(c => c.id === activeCategory)?.name}
              </h2>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>{all.length} panduan</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {all.map((g: Guide) => <GuideCard key={g.id} guide={g} onOpen={setSelectedGuide} featured={false} />)}
            </div>
          </div>
        )}

        {/* Help Banner */}
        <div style={{
          marginTop: 56, background: "linear-gradient(135deg, #059669 0%, #0284c7 100%)",
          borderRadius: 20, padding: "clamp(32px, 6vw, 48px) clamp(20px, 4vw, 40px)", textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.2)", borderRadius: 99, padding: "6px 16px", marginBottom: 16,
          }}>
            <HelpCircle size={14} color="#fff" />
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>Butuh Bantuan Tambahan?</span>
          </div>
          <h2 style={{ margin: "0 0 12px", color: "#fff", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 800 }}>
            Tim Support Siap Membantu
          </h2>
          <p style={{ margin: "0 0 28px", color: "rgba(255,255,255,0.85)", fontSize: "clamp(14px, 2vw, 15px)", lineHeight: 1.6 }}>
            Jika Anda tidak menemukan jawaban yang dicari, tim support kami siap membantu 24/7
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {[
              { icon: MessageCircle, label: "Live Chat", primary: true },
              { icon: Mail, label: "Email Support", primary: false },
              { icon: Phone, label: "+62 812-3456-7890", primary: false },
            ].map((btn, i) => (
              <button key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 22px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14,
                background: btn.primary ? "#fff" : "rgba(255,255,255,0.15)",
                color: btn.primary ? "#059669" : "#fff",
                border: btn.primary ? "none" : "1.5px solid rgba(255,255,255,0.4)",
              }}>
                <btn.icon size={16} /> {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}