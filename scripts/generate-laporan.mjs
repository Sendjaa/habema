import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  TableOfContents, PageBreak, Header, Footer, PageNumber, NumberFormat,
  LevelFormat, convertInchesToTwip, ExternalHyperlink,
} from 'docx';
import * as fs from 'fs';

// ── Helpers ──────────────────────────────────────────────────────
const FONT = 'Calibri';
const COLORS = { primary: '1B4332', secondary: '2D6A4F', accent: '40916C', dark: '1C1C1C', body: '333333', light: '666666' };

function heading(level, text, options = {}) {
  const styleMap = {
    1: { size: 28, color: COLORS.primary, spacing: { before: 400, after: 200 } },
    2: { size: 24, color: COLORS.secondary, spacing: { before: 300, after: 150 } },
    3: { size: 22, color: COLORS.accent, spacing: { before: 250, after: 120 } },
    4: { size: 20, color: COLORS.dark, spacing: { before: 200, after: 100 } },
  };
  const s = styleMap[level] || styleMap[4];
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
    spacing: s.spacing,
    ...options,
    children: [
      new TextRun({
        text, bold: true, font: FONT, size: s.size, color: s.color,
        ...(options.runOptions || {}),
      }),
    ],
  });
}

function para(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    ...options,
    children: [
      new TextRun({
        text, font: FONT, size: 20, color: COLORS.body,
        ...(options.runOptions || {}),
      }),
    ],
  });
}

function multiRun(runs, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    ...options,
    children: runs.map(r => new TextRun({ font: FONT, size: 20, color: COLORS.body, ...r })),
  });
}

function bullet(text, options = {}) {
  return new Paragraph({
    spacing: { after: 60, line: 260 },
    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
    ...options,
    children: [
      new TextRun({ text: '•  ', font: FONT, size: 20, color: COLORS.accent }),
      new TextRun({ text, font: FONT, size: 20, color: COLORS.body, ...(options.runOptions || {}) }),
    ],
  });
}

function spacer(h = 200) {
  return new Paragraph({ spacing: { before: h, after: 0 }, children: [] });
}

function codeBlock(code) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: convertInchesToTwip(0.3) },
    shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
    children: [new TextRun({ text: code, font: 'Consolas', size: 17, color: '2D2D2D' })],
  });
}

// ── Simple Table helper ──────────────────────────────────────────
function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'E8F0EC' },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, font: FONT, size: 18, color: COLORS.primary })] })],
        })),
      }),
      ...rows.map((row, i) => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(cell), font: FONT, size: 17, color: COLORS.body })] })],
        })),
      })),
    ],
  });
}

// ── Table of Contents ────────────────────────────────────────────
function tocSection() {
  return [
    spacer(100),
    heading(1, 'Daftar Isi'),
    new TableOfContents('Daftar Isi', { hyperlink: true }),
    spacer(300),
  ];
}

// ── BAB I: Pendahuluan ───────────────────────────────────────────
function bab1() {
  return [
    heading(1, 'BAB I: PENDAHULUAN'),
    spacer(),

    heading(2, '1.1 Latar Belakang'),
    para('Habema adalah platform penyewaan perlengkapan outdoor berbasis web yang dikembangkan untuk memudahkan proses penyewaan alat-alat outdoor seperti tenda, carrier, sleeping bag, dan perlengkapan hiking lainnya. Platform ini dirancang untuk memberikan pengalaman yang mulus bagi pelanggan dalam mencari, memilih, dan menyewa perlengkapan outdoor secara online.'),
    para('Pengembangan Habema bertujuan untuk mengatasi berbagai tantangan dalam penyewaan perlengkapan outdoor konvensional, termasuk proses pemesanan yang rumit, kurangnya transparansi harga, dan keterbatasan akses informasi ketersediaan barang secara real-time.'),
    spacer(),

    heading(2, '1.2 Tujuan'),
    bullet('Menyediakan platform e-commerce untuk penyewaan perlengkapan outdoor yang mudah digunakan'),
    bullet('Mengintegrasikan sistem pembayaran digital melalui Midtrans untuk transaksi yang aman'),
    bullet('Menyediakan dashboard admin yang komprehensif untuk mengelola bisnis penyewaan'),
    bullet('Menerapkan sistem autentikasi yang aman menggunakan Supabase dan Google OAuth'),
    bullet('Mendukung pengelolaan inventaris, diskon, dan promo produk secara real-time'),
    spacer(),

    heading(2, '1.3 Ruang Lingkup'),
    bullet('Manajemen produk dan kategori perlengkapan outdoor'),
    bullet('Sistem pemesanan (booking) dengan durasi sewa fleksibel'),
    bullet('Integrasi pembayaran dengan Midtrans (credit card, bank transfer, e-wallet)'),
    bullet('Dashboard admin dengan analitik pendapatan'),
    bullet('Manajemen pengguna (customer dan vendor/admin)'),
    bullet('Sistem diskon dan promo produk'),
    bullet('Notifikasi real-time untuk aktivitas admin'),
    bullet('Dukungan pengiriman dan pick-up lokasi'),
    spacer(),

    heading(2, '1.4 Teknologi yang Digunakan'),
    spacer(),
    simpleTable(
      ['Teknologi', 'Fungsi', 'Versi'],
      [
        ['Next.js', 'Framework React full-stack dengan App Router', '16.2.0'],
        ['TypeScript', 'Type safety untuk JavaScript', '5.x'],
        ['React', 'Library UI', '19.x'],
        ['Supabase', 'Database PostgreSQL + Auth + Realtime', 'Latest'],
        ['Midtrans', 'Payment gateway (Snap API)', 'Latest'],
        ['Zustand', 'State management dengan persist', '5.x'],
        ['Tailwind CSS', 'Utility-first CSS framework', '4.x'],
        ['Google OAuth', 'Autentikasi pengguna', '-'],
        ['Radix UI', 'Headless UI primitives (shadcn/ui)', 'Latest'],
        ['Sonner', 'Toast notifications', 'Latest'],
      ]
    ),
  ];
}

// ── BAB II: Arsitektur Sistem ────────────────────────────────────
function bab2() {
  return [
    heading(1, 'BAB II: ARSITEKTUR SISTEM'),
    spacer(),

    heading(2, '2.1 Struktur Proyek'),
    para('Proyek Habema mengikuti struktur Next.js App Router dengan pembagian folder berdasarkan fungsionalitas:'),
    spacer(),
    codeBlock('habema/\n├── app/                    # Halaman & API Routes\n│   ├── admin/               # Dashboard admin\n│   ├── booking/             # Alur pemesanan\n│   ├── payment/             # Halaman pembayaran\n│   ├── catalog_rental/      # Katalog sewa\n│   ├── catalog_shop/        # Katalog beli\n│   └── api/                 # Backend endpoints\n├── components/              # Komponen React reusable\n│   ├── ui/                  # UI primitives (shadcn)\n│   ├── booking/             # Komponen booking flow\n│   ├── admin/               # Komponen admin\n│   └── home/                # Komponen halaman depan\n├── lib/                     # Utility & konfigurasi\n│   ├── supabaseClient.ts    # Client Supabase (anon)\n│   ├── supabaseAdmin.ts     # Client Supabase (service role)\n│   ├── store.ts             # Zustand store (cart/order)\n│   ├── midtrans.ts          # Integrasi Midtrans\n│   └── booking-utils.ts     # Helper booking\n├── types/                   # Type definitions\n│   └── supabase.ts          # Generated Supabase types\n└── components/ui/           # shadcn/ui primitives'),
    spacer(),

    heading(2, '2.2 Arsitektur Data Flow'),
    heading(3, '2.2.1 Alur Frontend'),
    bullet('User berinteraksi melalui komponen React (Client Components)'),
    bullet('State dikelola dengan Zustand (persisted ke localStorage untuk cart)'),
    bullet('Data real-time via Supabase Realtime subscriptions'),
    bullet('Pembayaran diproses melalui Midtrans Snap JS di sisi client'),
    spacer(),

    heading(3, '2.2.2 Alur Backend (API Routes)'),
    bullet('Server-side API Routes di app/api/* menangani operasi database'),
    bullet('Service Role Key digunakan untuk operasi admin (bypass RLS)'),
    bullet('Midtrans transaction creation & webhook handling di server'),
    bullet('Semua operasi CRUD untuk bookings, products, users melalui API'),
    spacer(),

    heading(3, '2.2.3 Database (Supabase PostgreSQL)'),
    para('Database menggunakan Supabase PostgreSQL dengan Row-Level Security (RLS). Tabel-tabel utama:'),
    spacer(),
    simpleTable(
      ['Tabel', 'Fungsi', 'Key Fields'],
      [
        ['bookings', 'Data pemesanan', 'id, user_id, status, total_cost, start_date, end_date'],
        ['booking_items', 'Item dalam booking', 'booking_id, equipment_id, quantity, subtotal, unit_price'],
        ['equipment', 'Produk perlengkapan', 'id, name, price_per_night, stock_quantity, category_id'],
        ['equipment_categories', 'Kategori produk', 'id, name, description, icon_name'],
        ['users', 'Pengguna (customer/admin)', 'id, email, full_name, is_vendor'],
        ['notifications', 'Notifikasi admin', 'id, title, message, is_read'],
        ['discounts', 'Kode diskon', 'id, code, discount_percent, valid_from, valid_until'],
        ['bundles', 'Paket bundling', 'id, name, items, total_price, discount_percent'],
      ]
    ),
    spacer(),

    heading(2, '2.3 Autentikasi & Authorization'),
    para('Sistem autentikasi menggunakan Supabase Auth dengan Google OAuth sebagai penyedia utama. Alur autentikasi:'),
    bullet('User login melalui Google OAuth (atau email/password)'),
    bullet('Session dikelola oleh Supabase Auth (PKCE flow)'),
    bullet('Admin page memverifikasi is_vendor = true pada tabel users'),
    bullet('API Routes admin menggunakan service role key untuk bypass RLS'),
    spacer(),

    heading(2, '2.4 Integrasi Pembayaran (Midtrans)'),
    para('Midtrans Snap API digunakan sebagai payment gateway. Alur pembayaran:'),
    bullet('1. Backend membuat transaction via Midtrans API (server-key)'),
    bullet('2. Frontend memuat Snap JS popup dengan transaction token'),
    bullet('3. User menyelesaikan pembayaran di popup Midtrans'),
    bullet('4. Midtrans mengirim webhook ke /api/midtrans/webhook'),
    bullet('5. Webhook memperbarui status booking & payment'),
    bullet('6. Notifikasi dikirim ke admin dashboard'),
  ];
}

// ── BAB III: Admin Dashboard ─────────────────────────────────────
function bab3() {
  return [
    heading(1, 'BAB III: ADMIN DASHBOARD'),
    spacer(),

    heading(2, '3.1 Halaman Dashboard (/admin)'),
    para('Halaman utama admin menampilkan ringkasan bisnis dalam bentuk kartu statistik dan grafik. Dashboard dirancang dengan tema warna hijau hangat (emerald) dan krem (F1EFE8) untuk kenyamanan visual.'),
    spacer(),

    heading(3, '3.1.1 Statistik Utama'),
    para('Empat kartu statistik utama menampilkan metrik penting:'),
    spacer(),
    simpleTable(
      ['Metrik', 'Sumber Data', 'Deskripsi'],
      [
        ['Total Booking', 'Tabel bookings (count)', 'Jumlah total pemesanan'],
        ['Pendapatan Bulan Ini', 'bookings.total_cost (filter bulan berjalan)', 'Total pendapatan bulan ini'],
        ['Total Pengguna', 'Tabel users (count)', 'Jumlah pengguna terdaftar + pertumbuhan bulan ini'],
        ['Total Produk', 'Tabel equipment (count)', 'Jumlah produk + peringatan stok rendah (≤3)'],
      ]
    ),
    spacer(),

    heading(3, '3.1.2 Detail Pendapatan'),
    para('Dashboard menampilkan analisis pendapatan yang lebih rinci melalui empat visualisasi:'),
    spacer(),

    heading(4, 'a. Pendapatan Berdasarkan Status'),
    para('Revenue dihitung dari total_cost per status booking menggunakan data dari API /api/admin/stats. Lima status dengan progress bar:'),
    bullet('Selesai (returned) — pendapatan dari booking yang sudah selesai'),
    bullet('Dipinjam (picked_up) — barang sedang dipinjam'),
    bullet('Terkonfirmasi (confirmed) — booking terkonfirmasi, barang belum diambil'),
    bullet('Menunggu (pending) — booking menunggu konfirmasi'),
    bullet('Dibatalkan (cancelled) — booking yang dibatalkan'),
    spacer(),

    heading(4, 'b. Pendapatan Harian (Bulan Ini)'),
    para('Menampilkan pendapatan per hari dalam bulan berjalan dalam bentuk bar chart horizontal. Data dikelompokkan dari created_at booking dengan filter bulan dan tahun berjalan.'),
    spacer(),

    heading(4, 'c. Tren Pendapatan (6 Bulan)'),
    para('Bar chart yang menunjukkan tren pendapatan 6 bulan terakhir (termasuk bulan berjalan). Data dikelompokkan per bulan dari created_at booking.'),
    spacer(),

    heading(4, 'd. Pendapatan per Kategori'),
    para('Menampilkan pendapatan yang dikelompokkan berdasarkan kategori alat (equipment_categories). Data dihitung dari subtotal booking_items yang di-joinkan ke equipment → equipment_categories.'),
    spacer(),

    heading(2, '3.1.3 Logika Bisnis Revenue'),
    para('Revenue dihitung dengan dua pendekatan:'),
    bullet('Aggregate Revenue: Dihitung dari total_cost di tabel bookings (sudah termasuk subtotal + delivery cost - diskon)'),
    bullet('Category Revenue: Dihitung dari subtotal di tabel booking_items, dikelompokkan per kategori melalui relasi equipment → equipment_categories'),
    para('Endpoint API: GET /api/admin/stats — mengembalikan totalRevenue, monthlyRevenue, revenueByStatus, dailyRevenue, monthlyRevenueTrend, dan revenueByCategory.'),
  ];
}

// ── BAB IV: Manajemen Booking ────────────────────────────────────
function bab4() {
  return [
    heading(1, 'BAB IV: MANAJEMEN BOOKING'),
    spacer(),

    heading(2, '4.1 Halaman Daftar Booking (/admin/bookings)'),
    para('Halaman ini menyajikan daftar semua pemesanan dengan berbagai fitur untuk memudahkan pengelolaan. UI menggunakan warna krem hangat (F1EFE8) dan bahasa Indonesia untuk kenyamanan admin.'),
    spacer(),

    heading(3, '4.1.1 Fitur Pencarian & Filter'),
    para('Halaman menyediakan filter yang memudahkan admin menemukan booking spesifik:'),
    bullet('Pencarian teks (search) — mencari berdasarkan ID booking atau email pelanggan'),
    bullet('Filter Status — Menunggu, Terkonfirmasi, Dipinjam, Selesai, Dibatalkan'),
    bullet('Filter Tipe Pengguna — Semua, Terdaftar, atau Tamu'),
    bullet('Tombol "Hapus Filter" untuk mereset semua filter sekaligus'),
    spacer(),

    heading(3, '4.1.2 Tampilan Data'),
    para('Daftar booking ditampilkan dalam dua mode responsif:'),
    spacer(),

    heading(4, 'Mode Mobile (Card View)'),
    bullet('Setiap booking ditampilkan sebagai kartu dengan ID, status badge, dan total harga'),
    bullet('Informasi pelanggan (email) dan thumbnail barang (maks 3)'),
    bullet('Tanggal sewa dan tanggal dibuat'),
    bullet('Tombol Detail dan Edit'),
    spacer(),

    heading(4, 'Mode Desktop (Table View)'),
    para('Tabel dengan kolom:'),
    bullet('ID — 8 karakter pertama dari UUID'),
    bullet('Pelanggan — email (dengan ikon hijau untuk terdaftar, kuning untuk tamu)'),
    bullet('Barang — thumbnail image + nama barang (+ count jika >1 item)'),
    bullet('Tanggal Sewa — start → end date + durasi'),
    bullet('Status — badge dengan warna sesuai status'),
    bullet('Total — harga dalam format IDR'),
    bullet('Dibuat — tanggal + jam'),
    bullet('Aksi — tombol Lihat Detail (Eye) dan Edit'),
    spacer(),

    heading(3, '4.1.3 Pagination & Export'),
    para('Data dibagi 10 item per halaman dengan navigasi Previous / Next. Tersedia tombol Export CSV untuk men-download data booking.'),
    spacer(),

    heading(2, '4.2 Halaman Detail Booking (/admin/bookings/[id])'),
    para('Halaman detail menampilkan informasi lengkap sebuah booking dengan layout dua kolom.'),
    spacer(),

    heading(3, '4.2.1 Main Content (Kolom Kiri)'),
    spacer(),
    heading(4, 'Informasi Booking'),
    bullet('ID Booking, Status badge, Tanggal Mulai & Selesai'),
    bullet('Durasi sewa (hari) dan waktu dibuat'),
    bullet('Catatan (notes) jika ada dalam background stone-50'),
    spacer(),
    heading(4, 'Barang yang Disewa'),
    bullet('Thumbnail image + nama barang + deskripsi'),
    bullet('Quantity dan unit price'),
    spacer(),

    heading(3, '4.2.2 Sidebar (Kolom Kanan)'),
    spacer(),
    heading(4, 'Informasi Pelanggan'),
    bullet('Ikon + email pelanggan (jika terdaftar) atau "Pengguna Tamu"'),
    bullet('ID user (8 karakter pertama)'),
    spacer(),
    heading(4, 'Ringkasan Biaya'),
    bullet('Subtotal, Pajak (Rp 0), dan Total dengan warna emerald'),
    spacer(),
    heading(4, 'Aksi Status'),
    bullet('Tombol workflow sesuai status saat ini:'),
    bullet('  Menunggu → Konfirmasi Booking (confirmed)'),
    bullet('  Terkonfirmasi → Tandai Dipinjam (picked_up)'),
    bullet('  Dipinjam → Tandai Selesai (returned)'),
    bullet('Tombol Edit Booking untuk mengubah data'),
    spacer(),

    heading(3, '4.2.3 API Backend'),
    para('Endpoint /api/admin/bookings/[id] mendukung tiga method HTTP:'),
    spacer(),
    simpleTable(
      ['Method', 'Fungsi', 'Request Body'],
      [
        ['GET', 'Mengambil detail booking + items + user profile', '-'],
        ['PATCH', 'Mengubah status booking', '{ "status": "confirmed" }'],
        ['DELETE', 'Menghapus booking beserta items', '-'],
      ]
    ),
    spacer(),

    heading(2, '4.3 Alur Booking End-to-End'),
    para('Berikut alur lengkap pemesanan dari awal hingga pembayaran:'),
    spacer(),
    bullet('1. Pelanggan memilih produk di katalog dengan quantity dan durasi sewa'),
    bullet('2. Data produk disimpan ke Zustand store (localStorage key: habema-cart-storage)'),
    bullet('3. Pelanggan masuk ke halaman /booking dengan parameter id & quantity'),
    bullet('4. System menampilkan detail produk, memilih tanggal sewa, dan menghitung harga'),
    bullet('5. Pelanggan mengisi identitas (nama, email, no HP, alamat)'),
    bullet('6. Pelanggan memilih opsi pengiriman (delivery) atau pick-up'),
    bullet('7. System membuat booking di database via POST /api/bookings/create'),
    bullet('8. System membuat transaksi Midtrans via POST /api/midtrans/create-transaction'),
    bullet('9. Pelanggan membayar melalui popup Snap Midtrans'),
    bullet('10. Midtrans mengirim webhook ke /api/midtrans/webhook'),
    bullet('11. Webhook memperbarui status booking dan mengirim notifikasi admin'),
    bullet('12. Admin menerima notifikasi real-time di dashboard'),
  ];
}

// ── BAB V: Database Schema ───────────────────────────────────────
function bab5() {
  return [
    heading(1, 'BAB V: DATABASE SCHEMA'),
    spacer(),

    heading(2, '5.1 Entity Relationship Diagram'),
    para('Berikut adalah relasi antar tabel utama dalam sistem Habema:'),
    spacer(),
    codeBlock(
      'equipment_categories (1) ──┬── (N) equipment\n' +
      '                               │\n' +
      '    bundles (independent)       │\n' +
      '                               │\n' +
      '    bookings (1) ──┬── (N) booking_items ──┬── (N:1) equipment\n' +
      '                    │                        │\n' +
      '                    │                        └── (N:1) equipment_inventory\n' +
      '                    │\n' +
      '                    └── (N:1) users (customer)\n' +
      '                                │\n' +
      '                                └── (1) users (vendor/admin via is_vendor)\n' +
      '\n' +
      '    discounts (independent, applied via code)\n' +
      '    notifications (linked to users via triggers)\n' +
      '    user_discounts (M:N between users & discounts)'
    ),
    spacer(),

    heading(2, '5.2 Detail Tabel'),
    spacer(),

    heading(3, '5.2.1 Tabel bookings'),
    para('Menyimpan data pemesanan utama. Setiap booking memiliki status yang mengikuti workflow: pending → confirmed → picked_up → returned, atau langsung ke cancelled.'),
    spacer(),
    simpleTable(
      ['Kolom', 'Tipe', 'Deskripsi'],
      [
        ['id', 'UUID (PK)', 'Primary key'],
        ['user_id', 'UUID (FK → users)', 'ID pelanggan (nullable untuk guest)'],
        ['status', 'VARCHAR', 'pending | confirmed | picked_up | returned | cancelled'],
        ['start_date', 'DATE', 'Tanggal mulai sewa'],
        ['end_date', 'DATE', 'Tanggal selesai sewa'],
        ['rental_days', 'INTEGER', 'Jumlah hari sewa'],
        ['subtotal', 'NUMERIC', 'Total harga barang sebelum diskon & delivery'],
        ['delivery_cost', 'NUMERIC', 'Biaya pengiriman'],
        ['discount_amount', 'NUMERIC', 'Jumlah diskon'],
        ['deposit_amount', 'NUMERIC', 'Deposit (20% dari subtotal setelah diskon)'],
        ['total_cost', 'NUMERIC', 'Total akhir (subtotal + delivery - diskon)'],
        ['payment_status', 'VARCHAR', 'pending | settlement | expired | deny'],
        ['payment_method', 'VARCHAR', 'Metode pembayaran Midtrans'],
        ['midtrans_order_id', 'VARCHAR', 'Order ID dari Midtrans'],
        ['created_at', 'TIMESTAMP', 'Waktu dibuat'],
      ]
    ),
    spacer(),

    heading(3, '5.2.2 Tabel booking_items'),
    para('Menyimpan detail item dalam setiap booking. Satu booking bisa memiliki banyak item.'),
    spacer(),
    simpleTable(
      ['Kolom', 'Tipe', 'Deskripsi'],
      [
        ['id', 'UUID (PK)', 'Primary key'],
        ['booking_id', 'UUID (FK → bookings)', 'ID booking'],
        ['equipment_id', 'UUID (FK → equipment)', 'ID alat yang disewa'],
        ['quantity', 'INTEGER', 'Jumlah unit'],
        ['unit_price', 'NUMERIC', 'Harga per unit saat booking dibuat'],
        ['subtotal', 'NUMERIC', 'unit_price × quantity × rental_days'],
      ]
    ),
    spacer(),

    heading(3, '5.2.3 Tabel equipment'),
    para('Menyimpan data produk perlengkapan outdoor yang tersedia untuk disewa.'),
    spacer(),
    simpleTable(
      ['Kolom', 'Tipe', 'Deskripsi'],
      [
        ['id', 'UUID (PK)', 'Primary key'],
        ['category_id', 'UUID (FK → equipment_categories)', 'Kategori alat'],
        ['name', 'VARCHAR', 'Nama produk'],
        ['description', 'TEXT', 'Deskripsi produk'],
        ['price_per_day', 'NUMERIC', 'Harga sewa per hari'],
        ['price_per_night', 'NUMERIC', 'Harga sewa per malam (digunakan)'],
        ['stock_quantity', 'INTEGER', 'Jumlah stok tersedia'],
        ['image_url', 'TEXT', 'URL gambar produk'],
        ['is_available', 'BOOLEAN', 'Status ketersediaan'],
        ['is_promo', 'BOOLEAN', 'Apakah sedang promo'],
        ['promo_price_per_night', 'NUMERIC', 'Harga promo per malam'],
        ['rental_count', 'INTEGER', 'Jumlah total penyewaan (counter)'],
        ['discount_percentage', 'NUMERIC', 'Diskon persentase'],
      ]
    ),
    spacer(),

    heading(3, '5.2.4 Tabel equipment_categories'),
    para('Mengelompokkan produk ke dalam kategori. Setiap equipment memiliki satu category.'),
    spacer(),
    simpleTable(
      ['Kolom', 'Tipe', 'Deskripsi'],
      [
        ['id', 'UUID (PK)', 'Primary key'],
        ['name', 'VARCHAR', 'Nama kategori (Tenda, Carrier, Sleeping Bag, dll)'],
        ['description', 'TEXT', 'Deskripsi kategori'],
        ['icon_name', 'VARCHAR', 'Nama ikon untuk tampilan frontend'],
        ['display_order', 'INTEGER', 'Urutan tampilan'],
      ]
    ),
    spacer(),

    heading(3, '5.2.5 Tabel users'),
    para('Menyimpan data pengguna termasuk customer dan admin/vendor.'),
    spacer(),
    simpleTable(
      ['Kolom', 'Tipe', 'Deskripsi'],
      [
        ['id', 'UUID (PK)', 'Primary key (sync dengan Supabase Auth)'],
        ['email', 'VARCHAR', 'Email pengguna'],
        ['full_name', 'VARCHAR', 'Nama lengkap'],
        ['phone', 'VARCHAR', 'Nomor telepon'],
        ['is_vendor', 'BOOLEAN', 'Flag untuk akses admin/vendor'],
      ]
    ),
  ];
}

// ── BAB VI: API Endpoints ────────────────────────────────────────
function bab6() {
  return [
    heading(1, 'BAB VI: API ENDPOINTS'),
    spacer(),

    heading(2, '6.1 Admin Endpoints'),
    spacer(),
    simpleTable(
      ['Endpoint', 'Method', 'Fungsi'],
      [
        ['/api/admin/stats', 'GET', 'Statistik dashboard & detail pendapatan'],
        ['/api/admin/bookings', 'GET', 'Daftar booking dengan filter, search, pagination'],
        ['/api/admin/bookings/[id]', 'GET', 'Detail booking + items + user profile'],
        ['/api/admin/bookings/[id]', 'PATCH', 'Update status booking'],
        ['/api/admin/bookings/[id]', 'DELETE', 'Hapus booking'],
      ]
    ),
    spacer(),

    heading(2, '6.2 Public Endpoints'),
    spacer(),
    simpleTable(
      ['Endpoint', 'Method', 'Fungsi'],
      [
        ['/api/products', 'GET', 'Daftar produk (filter by category)'],
        ['/api/products/featured-products', 'GET', 'Produk unggulan'],
        ['/api/products/promo', 'GET', 'Produk promo'],
        ['/api/categories', 'GET', 'Daftar kategori'],
        ['/api/categories/features', 'GET', 'Fitur kategori'],
        ['/api/bundles', 'GET', 'Paket bundling'],
        ['/api/product/[id]', 'GET', 'Detail produk'],
        ['/api/bookings/create', 'POST', 'Membuat booking baru'],
        ['/api/midtrans/create-transaction', 'POST', 'Membuat transaksi Midtrans'],
        ['/api/midtrans/webhook', 'POST', 'Webhook notifikasi Midtrans'],
        ['/api/identity/upsert', 'POST', 'Update identitas pengguna'],
        ['/api/discounts/claim', 'POST', 'Klaim kode diskon'],
        ['/api/user-discounts', 'GET', 'Diskon user'],
        ['/api/track', 'GET', 'Tracking order'],
      ]
    ),
    spacer(),

    heading(2, '6.3 Response Format'),
    para('Semua endpoint mengembalikan response dalam format JSON konsisten:'),
    spacer(),
    codeBlock(
      '// Sukses\n' +
      '{\n' +
      '  "success": true,\n' +
      '  "data": { ... },\n' +
      '  "count": 100,        // untuk list endpoints\n' +
      '  "totalPages": 10     // untuk pagination\n' +
      '}\n' +
      '\n' +
      '// Error\n' +
      '{\n' +
      '  "error": "Error message"\n' +
      '}'
    ),
  ];
}

// ── BAB VII: Deployment & Konfigurasi ────────────────────────────
function bab7() {
  return [
    heading(1, 'BAB VII: DEPLOYMENT & KONFIGURASI'),
    spacer(),

    heading(2, '7.1 Environment Variables'),
    para('File .env.local diperlukan untuk menjalankan aplikasi. Copy dari .env.local.example:'),
    spacer(),
    simpleTable(
      ['Variable', 'Deskripsi', 'Required'],
      [
        ['NEXT_PUBLIC_SUPABASE_URL', 'URL project Supabase', 'Ya'],
        ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Anon/public key Supabase', 'Ya'],
        ['SUPABASE_SERVICE_ROLE_KEY', 'Service role key Supabase (server-only)', 'Ya (admin)'],
        ['NEXT_PUBLIC_MIDTRANS_CLIENT_KEY', 'Client key Midtrans', 'Ya'],
        ['MIDTRANS_SERVER_KEY', 'Server key Midtrans (server-only)', 'Ya'],
        ['MIDTRANS_PRODUCTION', 'Mode produksi Midtrans (true/false)', 'Ya'],
        ['NEXT_PUBLIC_BASE_URL', 'Base URL aplikasi', 'Ya'],
        ['NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'Client ID Google OAuth', 'Opsional'],
        ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'API key Google Maps', 'Opsional'],
      ]
    ),
    spacer(),

    heading(2, '7.2 Perintah Penting'),
    spacer(),
    simpleTable(
      ['Perintah', 'Fungsi'],
      [
        ['npm install', 'Install dependencies'],
        ['npm run dev', 'Menjalankan development server'],
        ['npm run build', 'Build production bundle'],
        ['npm run start', 'Menjalankan production server'],
        ['npm run supabase:types', 'Generate TypeScript types dari Supabase'],
        ['npm run lint', 'Menjalankan ESLint (belum dikonfigurasi)'],
      ]
    ),
    spacer(),

    heading(2, '7.3 Catatan Penting'),
    bullet('TypeScript error diabaikan saat build (typescript.ignoreBuildErrors: true di next.config.mjs)'),
    bullet('Pastikan .env.local tidak masuk version control'),
    bullet('Untuk development Midtrans, set MIDTRANS_PRODUCTION = false'),
    bullet('Jika Midtrans credentials tidak ada, sistem akan menggunakan mock payment response'),
    bullet('Database Supabase memerlukan RLS policies untuk keamanan data'),
  ];
}

// ── BAB VIII: Penutup ────────────────────────────────────────────
function bab8() {
  return [
    heading(1, 'BAB VIII: PENUTUP'),
    spacer(),

    heading(2, '8.1 Kesimpulan'),
    para('Habema telah berhasil dikembangkan sebagai platform penyewaan perlengkapan outdoor yang komprehensif. Sistem ini mencakup seluruh alur bisnis dari katalog produk, pemesanan, pembayaran digital, hingga dashboard manajemen admin.'),
    para('Dengan menggunakan teknologi modern seperti Next.js 16, Supabase, dan Midtrans, Habema mampu memberikan pengalaman pengguna yang responsif, aman, dan real-time. Penggunaan TypeScript dan shadcn/ui memastikan kode yang terstruktur rapi dan UI yang konsisten.'),
    spacer(),

    heading(2, '8.2 Saran Pengembangan'),
    bullet('Menambahkan sistem rating dan review produk'),
    bullet('Integrasi dengan layanan ekspedisi untuk tracking pengiriman'),
    bullet('Notifikasi WhatsApp/SMS otomatis untuk reminder pengembalian'),
    bullet('Analitik lanjutan dengan grafik interaktif (menggunakan recharts atau chart.js)'),
    bullet('Multi-bahasa (i18n) untuk mendukung turis asing'),
    bullet('Aplikasi mobile (React Native) untuk kemudahan akses'),
    spacer(200),
  ];
}

// ── COVER PAGE ───────────────────────────────────────────────────
function coverPage() {
  return [
    spacer(1200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'LAPORAN TEKNIS', font: FONT, size: 56, bold: true, color: COLORS.primary })],
    }),
    spacer(100),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'SISTEM INFORMASI PENYEWAAN', font: FONT, size: 40, color: COLORS.secondary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'PERLENGKAPAN OUTDOOR', font: FONT, size: 40, color: COLORS.secondary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '"HABEMA"', font: FONT, size: 44, bold: true, color: COLORS.primary })],
    }),
    spacer(400),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Habema Outdoor Equipment Rental Platform', font: FONT, size: 22, italics: true, color: COLORS.light })],
    }),
    spacer(100),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Next.js 16 · Supabase · Midtrans · TypeScript · Tailwind CSS', font: FONT, size: 18, color: COLORS.light })],
    }),
    spacer(600),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Dokumen: v1.0 — ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, font: FONT, size: 18, color: COLORS.light })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── BUILD ────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 20, color: COLORS.body } },
    },
  },
  sections: [
    { children: coverPage() },
    { children: tocSection() },
    {
      children: [
        ...bab1(),
        ...bab2(),
        ...bab3(),
        ...bab4(),
        ...bab5(),
        ...bab6(),
        ...bab7(),
        ...bab8(),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('document/laporan_habema.docx', buffer);
  console.log('✅ Laporan berhasil dibuat: document/laporan_habema.docx');
  console.log(`   Ukuran: ${(buffer.length / 1024).toFixed(1)} KB`);
});
