# Habema Outdoor - Dokumentasi Arsitektur

## Ringkasan

Habema Outdoor adalah website rental peralatan outdoor yang dibangun dengan Next.js 14, TypeScript, dan Supabase sebagai backend. Website ini menyediakan sistem booking untuk rental peralatan outdoor dengan fitur pembayaran online dan admin dashboard.

## Teknologi yang Digunakan

### Frontend
- **Framework**: Next.js 14 dengan App Router
- **Bahasa**: TypeScript
- **Styling**: TailwindCSS dengan custom design system
- **UI Components**: Komponen Shadcn/ui
- **State Management**: Zustand untuk global state
- **Icons**: Lucide React
- **Toast Notifications**: Sonner

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **Payment Gateway**: Midtrans

### Alat Pengembangan
- **Package Manager**: npm
- **Linting**: ESLint + TypeScript
- **Environment**: Variabel environment Next.js

## Struktur Proyek

```
habemaOutdoor/
├── app/                          # Next.js App Router
│   ├── account/                  # Halaman akun pengguna
│   ├── admin/                    # Dashboard admin
│   │   ├── bookings/            # Manajemen booking
│   │   ├── equipment/           # Manajemen peralatan
│   │   ├── users/               # Manajemen pengguna
│   │   └── page.tsx             # Beranda admin dashboard
│   ├── api/                     # API routes
│   │   ├── categories/          # API kategori produk
│   │   ├── midtrans/            # API payment gateway
│   │   └── products/            # API produk
│   ├── booking/                 # Alur booking
│   ├── cart/                    # Keranjang belanja
│   ├── order-confirmation/      # Halaman konfirmasi pesanan
│   ├── payment/                 # Halaman pembayaran
│   ├── product/[id]/           # Halaman detail produk
│   └── layout.tsx              # Layout utama
├── components/                  # Komponen reusable
│   ├── admin/                  # Komponen khusus admin
│   ├── authForm/               # Form autentikasi
│   ├── booking/                # Komponen booking
│   └── ui/                     # Komponen Shadcn/ui
├── lib/                         # Library utility
│   ├── booking-utils.ts         # Perhitungan booking
│   ├── catalog-context.ts       # Konteks katalog produk
│   ├── midtrans.ts             # Integrasi Midtrans
│   ├── store.ts                # Zustand store
│   └── supabaseClient.ts       # Klien Supabase
├── public/                      # Aset statis
│   └── images/                 # Gambar produk dan aset
├── scripts/                     # Skrip database
└── styles/                      # Gaya global
```

## Skema Database

### Tabel Utama

#### `equipment`
- `id` (UUID, Primary Key)
- `name` (Text) - Nama peralatan
- `description` (Text) - Deskripsi produk
- `price_per_night` (Integer) - Harga per hari
- `image_url` (Text) - URL gambar produk
- `category_id` (UUID, Foreign Key) - Kategori produk
- `specifications` (JSON) - Spesifikasi produk
- `weight_kg` (Integer) - Berat dalam kg
- `dimensions` (Text) - Dimensi produk
- `capacity` (Text) - Kapasitas
- `material` (Text) - Material
- `weather_rating` (Text) - Rating cuaca

#### `bookings`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key, Nullable) - ID user (null untuk guest)
- `start_date` (Timestamp) - Tanggal mulai sewa
- `end_date` (Timestamp) - Tanggal selesai sewa
- `rental_days` (Integer) - Jumlah hari sewa
- `subtotal` (Integer) - Subtotal
- `total_cost` (Integer) - Total biaya
- `deposit_amount` (Integer) - Jumlah deposit
- `status` (Text) - Status booking (pending, active, completed, cancelled)

#### `booking_items`
- `id` (UUID, Primary Key)
- `booking_id` (UUID, Foreign Key) - ID booking
- `equipment_id` (UUID, Foreign Key) - ID peralatan
- `quantity` (Integer) - Jumlah
- `unit_price` (Integer) - Harga per unit
- `subtotal` (Integer) - Subtotal untuk item ini

#### `users` (Supabase Auth)
- `id` (UUID, Primary Key)
- `email` (Text) - Email user
- `created_at` (Timestamp) - Tanggal dibuat

#### `user_profiles`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - ID user
- `full_name` (Text) - Nama lengkap
- `phone` (Text) - Nomor telepon
- `address` (Text) - Alamat

#### `user_identity`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - ID user
- `id_type` (Text) - Tipe ID (KTP, SIM, dll)
- `id_number` (Text) - Nomor ID
- `id_photo_url` (Text) - URL foto ID
- `verification_status` (Text) - Status verifikasi

## Fitur Utama

### 1. Katalog Produk
- Jelajahi peralatan berdasarkan kategori
- Halaman detail produk dengan spesifikasi
- Fungsi pencarian dan filter
- Manajemen keranjang belanja

### 2. Sistem Booking
- Pemilihan rentang tanggal untuk periode sewa
- Perhitungan harga berdasarkan durasi
- Verifikasi ID untuk pengguna tamu
- Konfirmasi booking dan pembuatan invoice

### 3. Integrasi Pembayaran
- Integrasi payment gateway Midtrans
- Berbagai metode pembayaran (QRIS, Transfer Bank, E-wallet)
- Pelacakan status pembayaran
- Opsi pembayaran WhatsApp untuk tamu

### 4. Manajemen Pengguna
- Registrasi dan autentikasi pengguna
- Dukungan pengguna tamu
- Manajemen profil
- Sistem verifikasi ID

### 5. Dashboard Admin
- Manajemen booking (lihat, update, hapus)
- Manajemen peralatan
- Manajemen pengguna
- Analitik dan laporan
- Sistem notifikasi untuk booking baru

### 6. Sistem Invoice
- Pembuatan invoice dinamis
- Unduh format JPEG
- Desain profesional dengan logo
- Validasi harga dan perhitungan

## Autentikasi & Otorisasi

### Peran Pengguna
- **Guest**: Dapat menjelajahi produk dan melakukan booking dengan verifikasi ID
- **User**: Pengguna terdaftar dengan kemampuan booking penuh
- **Admin**: Akses penuh ke dashboard admin dan fitur manajemen

### Kontrol Akses
- Kebijakan Supabase Row Level Security (RLS)
- Perlindungan rute khusus admin
- Autentikasi rute API
- Kontrol akses level komponen

## Alur Pembayaran

### 1. Alur Pengguna Tamu
```
Pemilihan Produk → Tambah ke Keranjang → Detail Booking → Verifikasi ID → Pembayaran WhatsApp → Konfirmasi Pesanan
```

### 2. Alur Pengguna Terdaftar
```
Pemilihan Produk → Tambah ke Keranjang → Detail Booking → Metode Pembayaran → Pembayaran Midtrans → Konfirmasi Pesanan
```

### 3. Metode Pembayaran
- **WhatsApp**: Konfirmasi langsung untuk pengguna tamu
- **Midtrans**: Pembayaran online untuk berbagai metode
  - QRIS
  - Transfer Bank (BCA, BNI, BRI, Mandiri)
  - E-wallet (Gopay, OVO, ShopeePay)

## Manajemen State

### Zustand Store
```typescript
interface TransactionData {
  items: CartItem[];
  days: number;
  duration: number;
  totalPrice: number;
  payment: {
    method: string;
    bank?: string;
  };
}
```

### Local Storage
- Persistensi data booking tamu
- State keranjang belanja
- Preferensi pengguna

## Arsitektur API

### Rute API RESTful
- `/api/categories` - Kategori produk
- `/api/products/featured` - Produk unggulan
- `/api/midtrans/create-transaction` - Pembuatan transaksi pembayaran

### Fungsi Database
- Perhitungan booking
- Validasi harga
- Manajemen inventory
- Verifikasi pengguna

## Fitur Real-time

### Notifikasi Admin
- Notifikasi booking baru
- Update real-time (saat diaktifkan)
- Panel notifikasi dengan status baca/belum dibaca

### Peningkatan Masa Depan
- Update status booking langsung
- Pelacakan inventory real-time
- Sistem chat untuk dukungan pelanggan

## Pertimbangan Keamanan

### Perlindungan Data
- Kebijakan RLS untuk akses database
- Validasi dan sanitasi input
- Penanganan upload file yang aman
- Perlindungan variabel environment

### Keamanan Pembayaran
- Pemrosesan pembayaran Midtrans yang aman
- Validasi transaksi
- Langkah-langkah pencegahan penipuan

## Optimasi Kinerja

### Frontend
- Code splitting otomatis Next.js
- Optimasi gambar dengan komponen Next.js Image
- Lazy loading untuk komponen
- Manajemen state yang efisien

### Backend
- Optimasi query database
- Fungsi edge Supabase untuk operasi kompleks
- Strategi caching untuk data yang sering diakses

## Deployment

### Pengaturan Environment
- Development: Pengembangan lokal dengan Supabase lokal
- Staging: Deployment preview Vercel
- Production: Vercel dengan Supabase production

### Variabel Environment
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
```

## Monitoring & Analitik

### Pelacakan Error
- Logging console untuk debugging
- Error boundaries untuk komponen React
- Logging operasi database

### Monitoring Kinerja
- Analitik bawaan Next.js
- Kinerja query database
- Pelacakan waktu load halaman

## Pengembangan Masa Depan

### Fitur yang Direncanakan
- Pengembangan aplikasi mobile
- Pencarian dan filter tingkat lanjut
- Sistem ulasan pelanggan
- Integrasi program loyalitas
- Dukungan multi-bahasa
- Dashboard analitik tingkat lanjut

### Pertimbangan Skalabilitas
- Migrasi arsitektur microservices
- Strategi caching tingkat lanjut
- Implementasi CDN
- Optimasi database untuk traffic tinggi

## Panduan Kontribusi

### Standar Kode
- Mode strict TypeScript
- Konfigurasi ESLint
- Pemformatan kode Prettier
- Dokumentasi komponen

### Alur Kerja Git
- Pengembangan fitur branch
- Review pull request
- Integrasi pengujian otomatis
- Semantic versioning

## Pemecahan Masalah

### Masalah Umum
- **Kegagalan Pembayaran**: Periksa konfigurasi Midtrans
- **Error Database**: Verifikasi kebijakan RLS
- **Masalah Autentikasi**: Periksa pengaturan auth Supabase
- **Masalah Kinerja**: Optimasi query database

### Alat Debug
- Alat pengembang browser
- Log dashboard Supabase
- Mode pengembangan Next.js
- Logging query database
