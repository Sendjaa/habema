# UAT Test — Checkout Produk Shop (Bukan Rental)

Dokumen UAT (User Acceptance Testing) untuk alur pembelian produk shop di Habema:
produk → Beli Sekarang / Keranjang → `/checkout` → pembayaran Midtrans (Snap) → order-confirmation.

Lingkungan pengujian: **sandbox Midtrans** (`MIDTRANS_PRODUCTION=false`, `NEXT_PUBLIC_MIDTRANS_PRODUCTION=false`).
Semua kolom berstatus **PASS** harus lolos sebelum rilis.

---

## 1. Pemicu & Aktor

**Pemicu:** Pengguna ingin membeli produk outdoor (bukan menyewa) dari katalog shop.

| Aktor | Peran |
|-------|-------|
| Pelanggan | Memilih produk, mengisi data pengiriman, membayar, menerima barang |
| Sistem | Menghitung harga, membuat order, memproses pembayaran Midtrans |
| Midtrans (sandbox) | Menyediakan Snap payment & virtual account / e-wallet uji coba |
| Admin | Melihat order shop masuk di dashboard |

---

## 2. Ringkasan User Journey

```
Katalog Shop / Detail Produk
        ↓
"Beli Sekarang"  atau  "Masuk Keranjang"
        ↓
Halaman /checkout (form pengiriman + ringkasan)
        ↓
Validasi form → POST /api/checkout → order masuk DB
        ↓
Midtrans Snap (sandbox) terbuka
        ↓
Bayar → order-confirmation
```

---

## 3. Test Case UAT

### A. Entry Point — Detail Produk Shop

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
|----|----------|---------|------------------------|--------|
| A1 | Beli Sekarang (guest) | 1. Buka halaman detail produk shop. 2. Atur qty (mis. 2). 3. Klik "Beli Sekarang" | Produk masuk keranjang, langsung diarahkan ke `/checkout`. Jika belum login, muncul modal login | |
| A2 | Beli Sekarang (logged in) | 1. Login dulu. 2. Buka produk. 3. Klik "Beli Sekarang" | Langsung ke `/checkout` dengan produk sudah terisi di ringkasan | |
| A3 | Tambah ke keranjang | Klik "Masuk Keranjang" (qty 1) lalu buka keranjang | Qty sesuai; menambahkan produk yang sama menaikkan qty (bukan duplikat baris) | |
| A4 | Kuantitas di keranjang | Di ringkasan checkout, klik `+` / `-` | Total & subtotal berubah sesuai qty; qty tidak bisa kurang dari 1 | |

### B. Halaman Checkout — Form Pengiriman

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
|----|----------|---------|------------------------|--------|
| B1 | Validasi field wajib | Klik "Bayar Sekarang" dengan form kosong | Toast error menampilkan field yang kurang; tidak ada request ke server | |
| B2 | Nama / HP / Alamat tidak valid | Isi hanya sebagian | Form tidak submit sampai semua field wajib terisi | |
| B3 | Email opsional tapi valid | Isi email tidak valid (mis. "abc") | Browser menolak (input type=email) | |
| B4 | Persistensi form | Isi form → reload / tutup browser → buka `/checkout` lagi | Data form terisi otomatis dari localStorage | |
| B5 | Form terhapus setelah sukses | Setelah order berhasil, buka `/checkout` baru | Form sudah kosong (localStorage `habema-checkout-form` terhapus) | |
| B6 | Keranjang kosong | Buka `/checkout` tanpa item | Muncul "Keranjang Kosong" + tombol "Belanja Sekarang" | |

### C. Perhitungan Harga & Voucher

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
|----|----------|---------|------------------------|--------|
| C1 | Subtotal | 1 produk Rp150.000 qty 2 | Subtotal = Rp300.000 | |
| C2 | Diskon persen | Terapkan voucher 10% dengan min_purchase ≤ subtotal | Diskon = 10% subtotal (dibatasi max_discount jika ada) | |
| C3 | Diskon fixed | Terapkan voucher nominal Rp30.000 | Diskon = min(30.000, subtotal) | |
| C4 | Voucher tidak memenuhi syarat | Voucher dengan min_purchase > subtotal | Diskon tidak terpotong; total = subtotal | |
| C5 | Total akhir | Subtotal − diskon (+ ongkir jika ada) | Total tampil konsisten antara UI & response | |

### D. API & Database

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
|----|----------|---------|------------------------|--------|
| D1 | POST /api/checkout sukses | Submit form valid | HTTP 200, body berisi `orderId`, `paymentOrderId`, `token`, `redirect_url` | |
| D2 | Order tersimpan | Cek DB setelah sukses | Baris `shop_orders` + `shop_order_items` terbuat dengan status `pending` | |
| D3 | Item tersimpan benar | Cek `shop_order_items` | product_id, price, quantity, total sesuai keranjang | |
| D4 | Nama produk panjang | Produk dengan nama > 50 karakter | Midtrans menerima (nama dipotong 50 char) — tidak muncul error "Name is too long" | |
| D5 | Item kosong | POST tanpa items | HTTP 400 `Item kosong` | |
| D6 | Data pelanggan kurang | POST tanpa nama/HP/alamat | HTTP 400 `Data pelanggan belum lengkap` | |

### E. Pembayaran Midtrans Snap

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
|----|----------|---------|------------------------|--------|
| E1 | Script Snap sandbox | Buka checkout, load Snap | Script dimuat dari `app.sandbox.midtrans.com/snap/snap.js` (BUKAN `app.midtrans.com`) | |
| E2 | Popup terbuka | Klik "Bayar Sekarang" | Popup Snap sandbox terbuka dengan nominal sesuai `gross_amount` | |
| E3 | Popup kosong / 404 | — | Tidak boleh ada 404 `GET /snap/v1/transactions/...` | |
| E4 | Bayar sukses | Selesaikan pembayaran (sandbox) | Callback `onSuccess` → keranjang & form dikosongkan, redirect `/order-confirmation` | |
| E5 | Bayar pending | Gunakan metode yang mengembalikan pending | Redirect `/order-confirmation?order_id=...&status=pending` | |
| E6 | Tutup popup | Klik "X" / close tanpa bayar | Toast "Pembayaran gagal" opsional; order tetap `pending` di DB | |

### F. Konfirmasi Order & Data Final

| ID | Skenario | Langkah | Hasil yang Diharapkan | Status |
|----|----------|---------|------------------------|--------|
| F1 | Order-confirmation | Setelah bayar | Halaman `/order-confirmation` muncul dengan order ID / status | |
| F2 | Status di DB | Cek `shop_orders` | `order_id` konsisten dengan `paymentOrderId` di response | |
| F3 | Notifikasi admin | Lihat dashboard admin | Order shop baru tampil di daftar order admin | |

---

## 4. Kasus Khusus / Regresi

| ID | Kasus | Hasil yang Diharapkan | Status |
|----|-------|------------------------|--------|
| R1 | Checkout 2x berurutan | Setiap checkout membuat order baru (order_id berbeda); form tidak membawa data order lama | |
| R2 | Order tetap ada saat popup ditutup | Tutup popup → buka `/checkout` lagi | Order di DB tetap `pending` (tidak terhapus) | |
| R3 | Voucher + nama produk panjang bersamaan | Submit produk nama panjang + voucher 10% | HTTP 200; `gross_amount` = subtotal − diskon; item sum = gross_amount | |
| R4 | Halaman `/catalog_shop` & detail shop tetap normal | Regresi setelah perubahan | Tidak ada error render | |

---

## 5. Lingkungan & Data Uji

- Base URL: `http://localhost:3000`
- Akun uji: (isi email sandbox / akun Google test)
- Produk uji: `HABEMA OUTDOOR - Hydropack Timbanuh 10L ...` (nama 101 char, harga Rp150.000)
- Kartu sandbox Midtrans: gunakan kartu test dari dashboard Midtrans (mis. `4811 1111 1111 1114`, CVV `123`, bulan/tahun valid di masa depan)
- DB: tabel `shop_orders`, `shop_order_items` (Supabase)

---

## 6. Catatan

- Build saat ini mengabaikan error TypeScript (`typescript.ignoreBuildErrors: true`); verifikasi manual wajib.
- Tidak ada runner test terkonfigurasi; UAT ini dijalankan manual.
- Sandbox token ≠ production token; pastikan script Snap & server key sama-sama sandbox.
- Jika terjadi 500, periksa `console.error` di terminal dev server dan file `.checkout-debug.log`.

---

*Dokumen ini dapat diperbarui seiring perubahan alur checkout shop.*
