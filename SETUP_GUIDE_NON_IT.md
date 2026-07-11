# 📋 Panduan Sederhana untuk HABEMA
*(Untuk Pemilik Toko - Tanpa Skill IT)*

---

## 🎯 Persiapan (5 Menit)

### 1️⃣ Daftar Akun Gratis
Buka di browser (Chrome/Firefox):
- 🔗 [Supabase](https://app.supabase.com/sign-up) → Daftar pake email/Google
- 🔗 [Midtrans](https://dashboard.midtrans.com/) → Daftar pake email

**Catatan:** Semua layanan ini **GRATIS** untuk testing.

---

## 🚀 Langkah 1: Setup Supabase (Database) (5 Menit)

1. **Buat Project Baru**
   - Buka [Supabase](https://app.supabase.com/)
   - Klik **"New Project"**
   - Nama: `habema-[nama-toko]` (contoh: `habema-outdoor`)
   - Pilih **Region: Asia Southeast** (Singapore)
   - Klik **"Create Project"**

2. **Dapetin Kunci API**
   - Buka **Project Settings** (ikon gear)
   - Pilih **"API"**
   - Copy 3 kunci ini (simpan di Notepad):
     ```
     SUPABASE_URL = https://[nama-project].supabase.co
     SUPABASE_ANON_KEY = eyJhbGciOi... (anon public)
     SUPABASE_SERVICE_KEY = eyJhbGciOi... (service_role secret)
     ```

3. **Buat Storage untuk Gambar Produk**
   - Klik **"Storage"** di menu kiri
   - Klik **"Create Bucket"**
   - Nama: `product-images`
   - Klik **"Create"**

---

## 💳 Langkah 2: Setting Midtrans (Pembayaran) (5 Menit)

1. **Dapetin Kunci API**
   - Buka [Midtrans Dashboard](https://dashboard.midtrans.com/)
   - Klik **"Settings"** → **"API Keys"**
   - Copy 2 kunci ini (simpan di Notepad):
     ```
     MIDTRANS_CLIENT_KEY = SB-Mid-client-xxxxx (Sandbox)
     MIDTRANS_SERVER_KEY = SB-Mid-server-xxxxx (Sandbox)
     ```

2. **Aktifkan Metode Pembayaran**
   - Klik **"Payment Methods"**
   - Aktifkan:
     ✅ **QRIS** (wajib)
     ✅ Bank Transfer (BCA, Mandiri, BNI, BRI)
     ✅ Credit Card (untuk testing)

3. **Setup Callback URL (Penting!)**
   - Klik **"Settings"** → **"Configuration"**
   - **Finish Redirect URL:** `http://localhost:3000/payment/finish`
   - **Unfinish Redirect URL:** `http://localhost:3000/payment/failed`
   - **Error Redirect URL:** `http://localhost:3000/payment/error`
   - Klik **"Save"**

---

## 🔧 Langkah 3: Jalankan Setup (5 Menit)

1. Extract ZIP → Buka folder `habema-setup`
2. Double-klik `setup.bat` → **Tunggu sampai selesai**
3. Buka `project/.env.local` → **Isi 5 kunci API** (dari Supabase & Midtrans)
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[nama-project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... (anon public)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (service_role)
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
   MIDTRANS_PRODUCTION=false
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
4. **Jalankan Website:**
   - Buka folder `project` → **Shift + Klik Kanan → "Open in Terminal"**
   - Ketik: `npm run dev`
   - Buka **http://localhost:3000**

---

## 👤 Langkah 4: Buat Akun Admin (5 Menit)

1. **Buka Supabase** → [SQL Editor](https://app.supabase.com/project/[nama-project]/sql)
2. **Copy-paste kode ini:**
   ```sql
   INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, raw_user_meta_data)
   VALUES (
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'admin@habema.com',
     crypt('admin123', gen_salt('bf')),
     now(),
     now(),
     '{"role": "admin"}'
   ) ON CONFLICT (email) DO NOTHING;
   ```
3. Klik **"Run"**

**Akun Admin:**
- Email: `admin@habema.com`
- Password: `admin123`

---

## 📝 Langkah 5: Setting Awal Website (5 Menit)

1. **Login sebagai Admin**
   - Buka: `http://localhost:3000/login`
   - Email: `admin@habema.com`
   - Password: `admin123`

2. **Buka Admin Dashboard**
   - Klik **"Admin"** di menu
   - Buka **"Settings"**
   - Isi:
     - Nama Toko: `HABEMA Outdoor`
     - WhatsApp: `6281234567890`
     - Alamat: `Jl. Contoh No. 123`

3. **Tambah Produk**
   - Buka **"Products"**
   - Klik **"Tambah Produk"**
   - Isi:
     - Nama: `Tenda Camping`
     - Harga: `500000`
     - Kategori: `Rental`
     - Deskripsi: `Tenda untuk 4 orang`
     - Gambar: Upload foto produk

---

## ✅ Langkah 6: Test Website (5 Menit)

### 📱 Test sebagai Pelanggan
1. Buka: `http://localhost:3000`
2. Pilih produk → **"Add to Cart"**
3. Checkout → Pilih **Midtrans Payment**
4. Isi data customer
5. **Test dengan kartu testing:**
   - **Success:** 4811 1111 1111 1114
   - **Challenge:** 4911 1111 1111 1113
   - **Decline:** 4556 7375 8689 9855

### 👨💼 Test sebagai Admin
1. Login: `http://localhost:3000/login`
2. Buka: `http://localhost:3000/admin`
3. Lihat:
   - Total pesanan hari ini
   - Pendapatan
   - Produk terlaris

---

## 🆘 Troubleshooting (Pemecahan Masalah)

### ❌ Website gak bisa dibuka
- **Solusi:** Pastikan `npm run dev` berjalan
- **Cek:** Buka terminal, pastikan gak ada error

### ❌ Login gagal
- **Solusi:** Pastikan email & password benar
- **Cek:** Di Supabase → **Auth → Users** → Pastikan user udah ada

### ❌ Pembayaran gak terkonfirmasi
- **Solusi:**
  1. Pastikan **Callback URL** benar di Midtrans
  2. Gunakan **Sandbox Mode** (MIDTRANS_PRODUCTION=false)
  3. Cek **Logs** di terminal

### ❌ Gambar produk gak muncul
- **Solusi:** Pastikan **Storage Bucket** bernama `product-images` udah dibuat di Supabase

---

## 📞 Dukungan
- **Masalah Teknis:** Cek terminal logs
- **Midtrans:** [Dokumentasi Midtrans](https://docs.midtrans.com/)
- **Supabase:** [Dokumentasi Supabase](https://supabase.com/docs)

---

## 🎉 Selesai!
Website HABEMA udah siap digunakan! **Total waktu: ~30-40 menit**

### 📌 Yang Harus Diingat:
1. **JANGAN BAGIKAN** `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` ke siapa pun!
2. **Gunakan Sandbox Midtrans** untuk testing (gak pake uang beneran)
3. **Untuk Production:**
   - Ganti ke **Production API Keys** di Midtrans
   - Verifikasi bisnis di Midtrans
   - Deploy ke Vercel/Netlify

### 💡 Tips:
- **Test dulu** pake Sandbox sebelum live
- **Ganti password admin** setelah setup selesai
- **Backup data** secara berkala di Supabase

---

## 📌 Checklist Sebelum Live
- [ ] Website udah setup lokal
- [ ] Supabase udah disetup
- [ ] Midtrans udah disetup (callback URL + API keys)
- [ ] Admin user udah dibuat
- [ ] Produk udah ditambahkan
- [ ] Test pesan & bayar udah berhasil
- [ ] Ganti ke Production API Keys (jika udah verifikasi)

**Selamat! Toko online kamu udah digital!** 🎊