# Fitur Aplikasi Habema Outdoor

## 📋 Deskripsi Aplikasi

Habema Outdoor adalah platform sewa peralatan outdoor dan camping premium yang dirancang untuk memudahkan petualangan Anda. Aplikasi ini menyediakan berbagai perlengkapan outdoor berkualitas dengan sistem pemesanan yang mudah dan aman, mencakup layanan **sewa (rental)** dan **pembelian (shop)**.

---

## 🏠 Halaman Utama

### 1. **Halaman Beranda (`/`)**
- **Hero Section**: Tampilan menarik dengan formulir pencarian (nama produk + pilihan tanggal sewa)
- **Produk Unggulan**: Menampilkan peralatan terpopuler
- **Paket Bundel Unggulan**: Promosi paket hemat
- **Audience Splitter**: Navigasi berdasarkan target pengguna (rental/shop)

### 2. **Katalog Sewa (`/catalog_rental`)**
- **Grid Tampilan Produk**: Layout responsif untuk desktop dan mobile
- **Filter & Pencarian**:
  - Pencarian berdasarkan nama
  - Filter berdasarkan kategori
  - Filter berdasarkan cabang (hanya tampilkan produk yang stoknya > 0 di cabang dipilih)
  - Filter berdasarkan rentang harga
  - Sortir berdasarkan nama, harga (rendah/tinggi), dan rating
  - Filter ketersediaan berdasarkan tanggal (`startDate`/`endDate`)
- **Detail Produk (`/product/[id]`)**: Gambar, spesifikasi lengkap, harga per hari/malam, stok per cabang, rating & review, tombol wishlist, produk terkait

### 3. **Katalog Beli (`/catalog_shop`)**
- Produk jual dengan harga, stok, brand, kategori, `is_featured`/`is_new`, dan rating
- Filter harga hingga Rp5.000.000, sortir termasuk "terbaru"

### 4. **Bundel & Paket**
- **Promo (`/bundles`)**: Daftar kode diskon dan bundel, klaim kode diskon, refresh real-time
- **Paket (`/packages`)**: Kartu paket bundel dengan detail include/exclude
- **Open Trip (`/opentrip`)**: Paket perjalanan (Open Trip, Camping Keluarga, Private Camp, Campervan) dengan pemesanan via WhatsApp

### 5. **Pusat Bantuan (`/guide`, `/help`, `/faq`)**
- **Panduan (`/guide`)**: Kategori (booking, pembayaran, pengiriman, akun, keamanan), tingkat kesulitan, fitur sorot
- **FAQ (`/help`)**: Pencarian, kategori (Pemesanan, Pengiriman & Pengambilan, Pembayaran), tombol WhatsApp Support
- **FAQ Statis (`/faq`)**: Syarat (KTP/SIM, deposit, min 1 hari/maks 30 hari, diskon sewa >7 hari)
- **Halaman lain**: Kontak, Tentang, Karier, Kebijakan Privasi, Syarat & Ketentuan, Kebijakan Rental, Kebijakan Pengembalian

---

## 🔄 Alur Pemesanan (Booking)

### 1. **Langkah Pemesanan (`/booking`)**
1. **Pilih Tanggal**: DateRangePicker, tanggal terisi otomatis dari parameter URL (hero/katalog)
2. **Pilih Cabang**: Pemilihan lokasi cabang pengambilan (card list berdasarkan ketersediaan stok) dan cabang pengembalian (dropdown, mendukung cross-branch return)
3. **Syarat & Ketentuan**: Checklist persetujuan yang tersimpan di localStorage
4. **Verifikasi Identitas**: Upload KTP/SIM + nomor + foto, tersimpan ke tabel `user_identity` (status `pending`)
5. **Metode Pembayaran**: Transfer Bank, QRIS, atau WhatsApp Konfirmasi
6. **Opsi Pengambilan**:
   - **Ambil di Cabang**: Pilih salah satu dari 3 cabang (Cihanjuang/Basecamp Utama, Bandung Kota, Lembang)
   - **Diantar**: Pilihan lokasi Leaflet, ongkir otomatis (jarak + durasi + volume), area Bandung & KBB, tipe lokasi (standar/camping/outdoor/remote/emergency) dengan biaya tambahan 25%/20%/35%/50%

### 2. **Perhitungan Harga**
- Subtotal = Σ(harga × qty) × hari
- Diskon dari kode yang diklaim (persentase dengan `max_discount` atau nominal tetap)
- **Deposit 20%** dari subtotal setelah diskon
- Total = subtotal diskon + ongkir

### 3. **Pembayaran**
- **Transfer Bank** (BCA, Mandiri, BNI, BRI): *wajib login*, verifikasi manual 10-30 menit
- **QRIS** (GoPay, OVO, Dana): *wajib login*, instan
- **Midtrans Snap**: Popup pembayaran (kartu kredit, transfer, e-wallet, QRIS sesuai konfigurasi Midtrans) + webhook dengan verifikasi signature (sha512)
- **WhatsApp Konfirmasi**: Tersedia untuk tamu dan pengguna terdaftar; membuka `wa.me` dengan ringkasan pesanan

### 4. **Guest Checkout (Sebagian)**
- Tamu **bisa** membuat pemesanan (`user_id: null`) tetapi **hanya** melalui metode WhatsApp Konfirmasi
- Transfer Bank dan QRIS menampilkan notifikasi untuk login terlebih dahulu

### 5. **Setelah Pembayaran**
- **Konfirmasi Pesanan (`/order-confirmation`)**: Unduh invoice (PNG) hasil canvas
- **Halaman status pembayaran**: `/payment/finish`, `/payment/pending`, `/payment/error`
- **Riwayat Pemesanan (`/orders` dan `/bookings/[id]`)**: Status booking, detail item, rincian harga, tombol "Bayar Sekarang"

---

## 👤 Fitur Pengguna

### 1. **Autentikasi (`/login`)**
- Login/register dengan email & password
- **Verifikasi OTP via email** (Resend) untuk registrasi dan login
- **Google OAuth** (`/auth/callback`)
- **Cloudflare Turnstile** sebagai proteksi bot
- Reset & lupa password
- **Diskon pengguna baru** (10-50%) via kode diskon

### 2. **Dashboard Akun (`/account`)**
- Tab **Pesanan**: riwayat booking dengan tanggal ambil, durasi, pembatalan
- Tab **Alamat**: CRUD alamat pengiriman (label, penerima, telepon, provinsi, kota, kode pos, default)
- Tab **Profil**: Informasi pribadi
- Tab **Notifikasi**: Preferensi notifikasi (toggle)
- **Edit Profil (`/account/edit`)**: Nama, telepon, email, upload avatar (Supabase Storage)

### 3. **Fitur Tambahan**
- **Wishlist / Favorit**: Toggle pada halaman produk (tersimpan per pengguna)
- **Review**: Rating 1-5, komentar, filter (semua/dengan foto/bintang 5/bintang 4), balasan review, lapor review
- **Download Invoice**: Hasil canvas PNG pada halaman konfirmasi

---

## 🏪 Fitur Admin (`/admin`)

### 1. **Dashboard**
- Ringkasan booking hari ini (pending/confirmed/picked_up)
- Daftar booking aktif dengan info pelanggan
- Jumlah notifikasi belum dibaca

### 2. **Manajemen Perlengkapan (`/admin/equipment`)**
- CRUD lengkap: nama, kategori, brand, deskripsi, harga per hari/malam, stok, kapasitas, berat, dimensi, material, spesifikasi, upload gambar/gallery, status promo

### 3. **Manajemen Booking (`/admin/bookings`)**
- Statistik (total/pending/confirmed/revenue)
- Pencarian, filter status, filter tamu/terdaftar, filter per cabang, pagination, ekspor CSV (termasuk kolom cabang)
- Detail booking: aksi status pending → confirmed → picked_up → returned, edit, hapus
- Info cabang pengambilan & pengembalian di tabel dan detail modal

### 4. **Manajemen Pengguna (`/admin/users`)**
- Pencarian, filter status & tanggal, pagination
- Detail: alamat, jumlah booking, total belanja

### 5. **Diskon (`/admin/discounts`)**
- CRUD kode diskon: tipe persentase/fixed, min purchase, max discount, berlaku untuk (semua/kategori/peralatan), rentang tanggal, batas pemakaian

### 6. **Promo Produk (`/admin/products-promo`)**
- Toggle `is_promo`, persentase diskon, harga promo otomatis, tanggal mulai/selesai, tab (Semua/Aktif/Akan Datang/Berakhir)

### 7. **Katalog Shop (`/admin/catalog-shop`)**
- CRUD produk jual: harga, harga asli, stok, kategori, brand, is_featured/is_new, gallery, spesifikasi JSON

### 8. **Analisis (`/admin/analisis`)**
- Revenue per status, revenue harian, tren bulanan 6 bulan, revenue per kategori, jumlah pengguna, stok menipis

### 9. **Manajemen Cabang (`/admin/branches`)**
- Daftar semua cabang (aktif/nonaktif) dengan info alamat, telepon, jam operasional, link Google Maps
- CRUD cabang: tambah, edit, aktifkan/nonaktifkan
- **Inventaris per Cabang**: Kelola stok peralatan di tiap cabang (branch_inventory), edit jumlah stok langsung dari dashboard admin

### 10. **Autentikasi Admin (`/admin/login`)**
- Email/password + Turnstile + OTP, pintu masuk berdasarkan flag `users.is_vendor`

---

## 🔔 Notifikasi

- **Notifikasi Admin**: Tabel `notifications` (jenis `new_booking`, `id_verification`), panel notifikasi admin, jumlah belum dibaca di dashboard
- Preferensi notifikasi pengguna (order confirmation, reminder, promo, WhatsApp, email mingguan)

## 🏢 Multi-Cabang

### Struktur Database
- **`branches`**: 3 cabang (Cihanjuang/Basecamp Utama, Bandung Kota, Lembang) dengan alamat, telepon, jam operasional, link maps, status aktif
- **`branch_inventory`**: Stok peralatan per cabang (branch_id + equipment_id + quantity)
- **`bookings`**: Kolom `pickup_branch_id`, `return_branch_id`, `pickup_branch_name`, `return_branch_name`

### Alur Pengguna
1. Pengguna memilih cabang pengambilan saat checkout (hanya cabang dengan stok > 0 yang ditampilkan)
2. Stok dikurangi otomatis saat booking dibuat (mencegah overbooking)
3. Pengguna bisa memilih cabang pengembalian berbeda (cross-branch return)
4. Saat booking dibatalkan, stok dikembalikan ke cabang pengambilan

### Untuk Admin
- Kelola cabang (CRUD) di `/admin/branches`
- Kelola inventaris per cabang (stok peralatan)
- Filter booking per cabang di halaman manajemen booking
- Info cabang ditampilkan di tabel booking, detail modal, dan CSV export

---

## 🔌 Integrasi & API

### Integrasi Eksternal
- **Supabase**: Backend-as-a-Service (PostgreSQL, Row Level Security, Storage, Auth)
- **Midtrans Snap**: Pembayaran online (popup + redirect + webhook)
- **WhatsApp**: Metode pembayaran "WhatsApp Konfirmasi" dan tautan bantuan (wa.me)
- **Google OAuth**: Login dengan akun Google
- **Resend**: Pengiriman email (OTP)
- **Cloudflare Turnstile**: Proteksi bot
- **Leaflet**: Pemilih lokasi & perhitungan ongkir

### API Routes (`app/api/*`)
| Route | Fungsi |
|-------|--------|
| `/api/auth/send-otp` | Kirim OTP (register/login) via email |
| `/api/auth/verify-otp` | Verifikasi OTP & login |
| `/api/bookings/create` | Buat booking + item + notifikasi + decrement stok cabang (mendukung tamu) |
| `/api/bookings/cancel` | Batalkan booking + kembalikan stok cabang |
| `/api/midtrans/create-transaction` | Buat transaksi Midtrans |
| `/api/midtrans/webhook` | Notifikasi status pembayaran (verifikasi signature) |
| `/api/discounts/claim` | Klaim kode diskon |
| `/api/user-discounts` | Daftar diskon yang diklaim pengguna |
| `/api/identity/upsert` | Simpan verifikasi identitas (KTP/SIM) |
| `/api/products`, `/api/categories`, `/api/bundles` | Data produk, kategori, bundel |
| `/api/branches` | Daftar cabang aktif |
| `/api/branches/availability` | Ketersediaan stok per cabang (date-aware: cek overlap booking) |
| `/api/admin/dashboard` | Data dashboard (booking aktif, notifikasi) |
| `/api/admin/stats` | Data analisis & statistik |
| `/api/admin/bookings` | Kelola booking (filter per cabang, info branch) |
| `/api/admin/branches` | CRUD cabang |
| `/api/admin/branches/[id]` | Update/hapus cabang |
| `/api/admin/branches/inventory` | Kelola stok per cabang (branch_inventory) |
| `/api/admin/catalog-shop` | Kelola katalog shop |
| `/api/track` | Pixel pelacakan 1×1 |
| `/api/placeholder` | Gambar placeholder |

---

## 📊 Status Fitur

| Fitur | Status | Prioritas |
|-------|--------|-----------|
| Booking System (multi-step) | ✅ Aktif | Tinggi |
| Multi-Cabang (3 lokasi, stok per cabang, cross-branch return) | ✅ Aktif | Tinggi |
| Payment (Midtrans + offline) | ✅ Aktif | Tinggi |
| WhatsApp Konfirmasi | ✅ Aktif | Tinggi |
| User Authentication (OTP/OAuth) | ✅ Aktif | Tinggi |
| Katalog Sewa & Beli (filter per cabang) | ✅ Aktif | Tinggi |
| Bundel, Paket, Open Trip | ✅ Aktif | Sedang |
| Diskon & Promo | ✅ Aktif | Sedang |
| Review & Wishlist | ✅ Aktif | Sedang |
| Verifikasi Identitas (KTP/SIM) | ✅ Aktif (manual review) | Sedang |
| Pengiriman & Ongkir Otomatis | ✅ Aktif (Bandung & KBB) | Sedang |
| Admin Manajemen Cabang & Inventaris | ✅ Aktif | Sedang |
| Push Notifications | ❌ Belum Ada | Rendah |
| Membership / Loyalty Program | ❌ Belum Ada | Rendah |
| Vendor Dashboard | ❌ Belum Ada | Rendah |
| PWA / Offline | 📋 Sebagian (manifest saja, tanpa service worker) | Rendah |

---

## 🛠️ Teknologi yang Digunakan

### Frontend
- **Next.js 19** (App Router): React framework dengan routing
- **TypeScript**: Type safety dan better development
- **Tailwind CSS**: Utility-first CSS framework
- **React 19**: Library UI
- **Zustand**: State management (cart, order, identity, location)
- **Radix / shadcn-style UI**: Komponen UI
- **Lucide React**: Icon system
- **Sonner**: Toast notifications
- **Framer Motion**: Animasi

### Backend & Database
- **Supabase**: Backend-as-a-Service dengan PostgreSQL
- **Row Level Security**: Keamanan data tingkat baris
- **Supabase Storage**: Upload avatar dan foto dokumen
- **24 tabel database**: bookings, booking_items, equipment, shop_products, bundles, discounts, user_identity, reviews, branches, branch_inventory, dll.

### Deployment & Monitoring
- **Vercel**: Platform hosting dan deployment
- **Error Boundaries**: Penanganan error React
- **Vercel Analytics**: Monitoring produksi

### Integrasi
- **Midtrans Snap**: Payment gateway
- **WhatsApp**: Notifikasi dan konfirmasi pesanan
- **Resend**: Email (OTP)
- **Google OAuth**: Login
- **Cloudflare Turnstile**: Keamanan formulir
- **Leaflet**: Pemetaan lokasi

---

## 🎯 Target Pengguna

### 1. **Pengguna Utama**
- **Pendaki & Camper**: Pecinta alam yang butuh peralatan
- **Event Organizer**: Penyelenggara acara outdoor
- **Photografer**: Butuh peralatan shooting outdoor
- **Family Groups**: Liburan keluarga di alam

### 2. **Pengguna Sekunder**
- **Corporate Events**: Outing perusahaan
- **Education Institutions**: Kegiatan sekolah/universitas
- **Tourism Operators**: Paket wisata outdoor

---

## 📈 Roadmap Pengembangan

### Selesai
- ✅ Booking system multi-step
- ✅ Pembayaran online (Midtrans) + offline (transfer/QRIS/WhatsApp)
- ✅ Autentikasi dengan OTP email + Google OAuth
- ✅ Katalog sewa & beli dengan filter/sortir
- ✅ Bundel, paket, open trip, diskon & promo
- ✅ Verifikasi identitas (KTP/SIM)
- ✅ Pengiriman dengan ongkir otomatis (Bandung & KBB)
- ✅ Review, wishlist, download invoice
- ✅ Admin dashboard, manajemen booking/equipment/user/discount/promo/analisis
- ✅ Notifikasi admin
- ✅ Multi-cabang (3 lokasi, stok per cabang, cross-branch return)
- ✅ Admin manajemen cabang & inventaris per cabang
- ✅ Filter katalog per cabang
- ✅ Stok otomatis berkurang saat booking, dikembalikan saat cancel
- ✅ Availability API date-aware (cek overlap tanggal booking)

### Berikutnya
- 🚧 Push notifications
- 🚧 Service worker / PWA offline
- 🚧 Membership / loyalty program
- 🚧 Vendor dashboard
- 🚧 Integrasi kurir untuk pengembalian
- 📋 Automasi validasi dokumen identitas (OCR)
- 📋 Ekspansi area pengiriman

---

## 🔗 Link Penting

- **Beranda**: `/`
- **Katalog Sewa**: `/catalog_rental`
- **Katalog Beli**: `/catalog_shop`
- **Detail Produk**: `/product/{id}`
- **Promo**: `/bundles`
- **Paket**: `/packages`
- **Open Trip**: `/opentrip`
- **Keranjang**: `/cart`
- **Booking**: `/booking?id={productId}`
- **Pembayaran**: `/payment`
- **Riwayat**: `/orders`
- **Akun**: `/account`
- **Bantuan**: `/guide`, `/help`, `/faq`
- **Admin**: `/admin`
- **Admin Cabang**: `/admin/branches`

---

*Update terakhir: 7 Agustus 2026*
