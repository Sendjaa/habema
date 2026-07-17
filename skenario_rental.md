# Skenario Rental Alat Outdoor Habema

## 1. Pemicu Skenario

Pengguna ingin menyewa peralatan outdoor untuk kegiatan camping/ hiking/ pendakian.

---

## 2. Aktor

| Aktor | Peran |
|-------|-------|
| Pelanggan | Memilih alat, mengisi data, membayar, mengambil/ menerima alat |
| Admin | Meninjau pesanan, menyiapkan alat, mengonfirmasi status |
| Kurir/ Logistik | Mengantar alat ke lokasi pelanggan (jika pilih delivery) |
| Sistem | Menghitung harga, memproses pembayaran Midtrans, mengirim notifikasi |

---

## 3. Alur Skenario Utama

### 3.1 Eksplorasi Produk

1. Pelanggan masuk ke halaman katalog.
2. Melihat daftar alat: tenda, carrier, matras, kompor, dll.
3. Membuka detail produk untuk melihat spesifikasi, harga harian, dan ketersediaan.
4. Menentukan tanggal mulai dan tanggal kembali.
5. Menentukan jumlah unit.
6. Klik tombol "Sewa Sekarang" atau "Tambah ke Keranjang".

---

### 3.2 Keranjang & Checkout

1. Jika memilih keranjang, pelanggan bisa menambahkan beberapa alat sekaligus.
2. Sistem menghitung total berdasarkan:
   - harga sewa per hari
   - lama rental (dalam hari)
   - jumlah unit
3. Pelanggan lanjut ke halaman booking.

---

### 3.3 Halaman Booking

Booking terdiri dari 4 langkah:

#### Langkah 1: Pilih Tanggal Rental

- Pelanggan memilih rentang tanggal mulai dan kembali.
- Sistem menampilkan durasi dalam hari.
- Sistem menghitung subtotal harga rental.

#### Langkah 2: Identitas & Syarat

- Pelanggan mengisi data diri:
  - nama lengkap
  - NIK
  - nomor telepon
  - alamat
  - unggah foto KTP (jika diwajibkan)
- Pelanggan menyetujui checklist syarat rental:
  - tidak merokok di dalam tenda
  - bertanggung jawab atas kerusakan
  - mengembalikan dalam kondisi bersih
  - denda keterlambatan sesuai ketentuan

#### Langkah 3: Pengambilan atau Pengantaran

- Pelanggan memilih salah satu:
  - **Pickup**: ambil sendiri ke basecamp/ workshop.
  - **Delivery**: alat diantar ke alamat pelanggan.
- Jika **delivery**:
  - pelanggan memasukkan alamat lengkap
  - sistem menghitung ongkir berdasarkan jarak dan bobot total
  - pelanggan memilih waktu pengantaran (pagi/ siang/ sore/ fleksibel)
  - pelanggan bisa menambahkan catatan lokasi/ akses jalan

#### Langkah 4: Pembayaran

- Pelanggan memilih metode pembayaran:
  - Transfer Bank (BCA, BNI, Mandiri, BRI)
  - Midtrans Snap (VA, e-wallet, kartu kredit)
- Sistem membuat transaksi melalui Midtrans (atau mode mock saat development).
- Pelanggan menyelesaikan pembayaran.
- Setelah sukses:
  - booking tersimpan ke database
  - notifikasi masuk ke dashboard admin
  - pelanggan diarahkan ke halaman konfirmasi order

---

## 4. Status Pesanan

| Status | Keterangan |
|--------|------------|
| `pending` | Menunggu pembayaran atau konfirmasi |
| `confirmed` | Pembayaran diterima, pesanan dikonfirmasi |
| `ready` | Alat telah disiapkan, siap pickup/ kirim |
| `picked-up` | Alat sudah diambil/ diterima pelanggan |
| `returned` | Alat sudah dikembalikan |
| `completed` | Peminjaman selesai, deposit/ dana kembali diproses |

---

## 5. Skenario Alternatif

### 5.1 Pelanggan Belum Login

- Saat checkUser di halaman booking, jika belum login tetap bisa lanjut sebagai guest.
- Namun, sistem memungkinkan adm data booking tetap disimpanin mengaitkan dengan akun setelah login ulang.

### 5.2 Alat Tidak Tersedia di Tanggal Pilihan

- Sistem menampilkan pesan ketersediaan.
- Pelanggan diminta memilih tanggal lain.

### 5.3 Pembayaran Gagal

- Midtrans merespons gagal.
- Pelanggan diarahkan kembali ke halaman pembayaran.
- Booking tetap berstatus `pending` selama batas waktu yang ditentukan.

### 5.4 Pengambilan Lewat Waktu

- Jika pelanggan terlambat mengambil, sistem menghitung denda keterlambatan.
- Denda = 1,5x harga sewa per hari x hari terlambat.

### 5.5 Kerusakan/ Kehilangan Alat

- Saat pengembalian, admin melakukan pengecekan kondisi.
- Jika ada kerusakan, biaya perbaikan dikenakan ke pelanggan.

---

## 6. Entitas Data yang Terlibat

### 6.1 Frontend State

- `items`: daftar alat di keranjang
- `currentTransaction`: data transaksi sementara
- `identity`: data pelanggan
- `location`: data lokasi pengantaran
- `orders`: riwayat pesanan lokal

### 6.2 Tabel Database

- `equipment`: data alat outdoor
- `equipment_categories`: kategori alat
- `bundles`: paket rental
- `bookings`: data pemesanan
- `booking_items`: item dalam satu booking
- `user_identity`: identitas penyewa
- `notifications`: notifikasi ke admin/ pelanggan

---

## 7. Notifikasi & Komunikasi

- Setelah booking sukses:
  - Admin menerima notifikasi "Pesanan Baru".
  - Pelanggan bisa menerima pesan WhatsApp konfirmasi.
  - Pelanggan melihat halaman order-confirmation dengan QR code/ order ID.

---

## 8. Batasan & Catatan Teknis

- Build saat ini mengabaikan error TypeScript (`typescript.ignoreBuildErrors: true`), jadi perlu hati-hati saat mengubah alur data bertipe.
- Tidak ada runner test. Verifikasi manual harus dilakukan setiap kali mengubah flow booking/ payment.
- Pembayaran di development bisa menggunakan mode mock jika kredential Midtrans belum lengkap.

---

## 9. Ringkasan Alur User Journey

```
Katalog / Hero
    ↓
Pilih Alat & Tanggal
    ↓
Keranjang / Sewa Sekarang
    ↓
Booking (4 langkah)
    ↓
Pembayaran Midtrans / Transfer
    ↓
Konfirmasi Order
    ↓
Pickup / Delivery
    ↓
Penggunaan
    ↓
Pengembalian
    ↓
Completed
```

---

*Dokumen ini dapat diperbarui seiring perubahan fitur rental.*
