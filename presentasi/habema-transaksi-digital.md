# Habema — Transisi Transaksi Rental & Toko dari Tradisional ke Digital Melalui Website

Otomatisasi promosi via email & WhatsApp · Website sebagai media sosial

Presentasi untuk Habema — 15 November 2026

---

## 1. Latar belakang: tradisional vs digital

**Tradisional**

- Jadwal sewa di catatan kertas, konfirmasi WA manual
- Antrian dan pembayaran di toko fisik, tunai atau transfer manual
- Promosi satu arah (brosur, mulut ke mulut), tidak terukur
- Tidak ada jejak digital transaksi pelanggan

**Digital via website**

- Pemilihan jadwal dan cabang secara online, identitas digital
- Toko tanpa antrian, transaksi 24/7 via Midtrans
- Promosi terukur: voucher, notifikasi, analitik
- Setiap transaksi tercatat terstruktur di database

Referensi: `app/booking/page.tsx` · `app/checkout/page.tsx`

---

## 2. Transaksi rental digital: 5 langkah

Referensi: `app/booking/page.tsx` · `lib/store.ts` · `lib/booking-utils.ts`

1. **Jadwal Sewa** — Pilih tanggal sewa & kembali, cabang pengambilan
2. **Verifikasi Identitas** — KTP/NIK, nama, telepon, alamat disimpan di keranjang
3. **Metode Pembayaran** — WA Konfirmasi, Transfer Bank, atau QRIS manual
4. **Syarat & Ketentuan** — Checklist disetujui, disimpan di localStorage
5. **Bayar** — QRIS dengan bukti upload, atau Midtrans Snap

Hitungan: harga × hari, kupon diskon, deposit 20%.

---

## 3. Transaksi toko digital

Referensi: `app/checkout/page.tsx` · `lib/store.ts`

- **Keranjang** — Item disimpan di browser (Zustand, kunci `habema-cart-storage`)
- **Alamat** — Cascading provinsi, kabupaten, kecamatan, desa
- **Ongkir** — Dihitung dari berat barang (`ShippingSelector`)
- **Pembayaran** — 15 metode: VA, e-wallet, retail, tunai saat terima (COD)
- **Midtrans Snap** — Pembayaran online langsung

---

## 4. Pembayaran digital & webhook otomatis

Referensi: `lib/midtrans.ts` · `app/api/midtrans/create-transaction/route.ts` · `app/api/midtrans/webhook/route.ts`

- **Midtrans Snap** — Skrip sandbox atau produksi (`NEXT_PUBLIC_MIDTRANS_PRODUCTION`)
- Order ID & jumlah total dihitung ulang di server
- **Webhook server-to-server** — Status berubah otomatis
- `capture`/`settlement` menghasilkan `paid` & `confirmed`
- `pending` / `deny` / `cancel` / `expire` / `refund` ditangani
- Idempoten: notifikasi duplikat diproses sekali
- Stok `rental_count` & `shop_orders` terupdate saat sukses

---

## 5. Siklus status transaksi

Referensi: `lib/store.ts` (`Order.status`) · `app/api/midtrans/webhook/route.ts`

`pending` → `confirmed` → `ready` → `picked-up` → `returned` → `completed`

- Setiap pesanan punya status tercatat dan riwayat
- Stok otomatis: `rental_count` per alat
- Stok `shop_orders` terkurangi saat pembayaran sukses
- Status tidak pernah menurun (final: `paid`/`refunded` dilindungi)

---

## 6. Otomatisasi promosi via email & WhatsApp

Referensi: `lib/store.ts` (`ClaimedDiscount`) · `lib/manual-payment.ts`

- **Voucher** — Klaim diskon via `POST /api/discounts/claim`, masuk ke keranjang
- **Notifikasi admin** — Baca & tandai dibaca via `app/api/admin/notifications`
- **WA Konfirmasi** — Link `wa.me`, nomor diformat `62xxx`, pesanan disimpan lokal
- **Roadmap (belum ada kode)** — Blast email & WA otomatis, pengingat pembayaran & konfirmasi keberangkatan

---

## 7. Website sebagai media sosial

Referensi: `app/layout.tsx` · `components/home/` · `app/api/home/`

- SEO ~60 kata kunci + Open Graph & Twitter card
- Halaman depan sebagai iklan: hero, banner promo, voucher
- Produk & paket unggulan di halaman muka
- Bukti sosial: logo cloud mitra, "2.000+ petualang"
- Tombol WhatsApp & telepon dari data cabang
- Masuk dengan Google OAuth, analitik Vercel & GTM

---

## 8. Admin vs publik

Referensi: `components/layout-wrapper.tsx` · `app/api/admin/*`

**Publik**

- Header + Footer, halaman sewa, toko, pembayaran

**Admin (`/admin/*`)**

- Tanpa Header/Footer, hanya vendor yang diakses
- Kelola produk, kategori, pesanan, banner promo

---

## 9. Manfaat digitalisasi

- Transaksi 24/7, tidak terbuka jam toko
- Catatan digital lengkap: pesanan, pembayaran, identitas, bukti
- Stok otomatis terupdate saat transaksi sukses
- Promosi terukur: klaim voucher & notifikasi
- Jangkauan lebih luas melalui media sosial & SEO

---

## 10. Roadmap

- Blast email & WhatsApp otomatis ke pelanggan (target; belum ada kode)
- Integrasi media sosial: share pesanan & ulasan pelanggan
- Pelatihan admin & cabang
- Midtrans ke mode produksi dengan kredensial resmi

---

## Penutup & Q&A

> "Digitalisasi transaksi = jangkauan lebih luas, catatan lebih rapi, promosi yang terukur."

Terima kasih — pertanyaan?
