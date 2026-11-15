# Checkout UI Spec — `/checkout/[id]`

## Device artboards (Figcraft)
| Device | Width × Height | Scale |
|--------|----------------|-------|
| Desktop-XL | 1440 × 1024 px | 1x |
| Tablet-Landscape | 1024 × 768 px | 1x |
| Mobile-Portrait | 375 × 812 px | 2x |

## Style tokens (impor ke Figcraft Variables)
- **Primary**: `#0F5EF0` — tombol utama, langkah aktif
- **Accent**: `#F2A900` — highlight, badge diskon
- **Gray-100**: `#F9FAFB` — background halaman
- **Gray-900**: `#111827` — teks utama
- **Border**: `#E5E7EB`
- **Error**: `#EF4444`
- **Success**: `#10B981`
- **Radius**: `8px`
- **Shadow card**: `0 4 12 0 rgba(0,0,0,0.07)`
- **Spacing base**: `16px`
- **Font base**: Inter 400 16px
- **Font heading**: Inter 600 (desktop 24px / tablet 20px / mobile 18px)

## Komponen (buat sebagai Figcraft Component)
1. `HeaderBar` — logo, tombol back, indikator progress
2. `ProgressSteps` — stepper horizontal (desktop/tablet) atau titik (mobile)
3. `CheckoutCard` — kontainer utama: daftar item, form pengiriman, metode pembayaran
4. `ItemRow` — gambar produk, judul, qty selector, harga
5. `QtySelector` — tombol +/- untuk jumlah sewa
6. `PriceBadge` — harga total, optional diskon
7. `FormField` — input teks dengan label dan state validasi
8. `PaymentButton` — CTA utama Midtrans Snap (disabled/loading)
9. `FooterNote` — teks kecil, link syarat & ketentuan

## Layout per device

### Desktop-XL (≥1280 px)
```
+-----------------------------------------------------------+
| HeaderBar (fixed)                                         |
+-----------------------------------------------------------+
| ProgressSteps (horizontal)                                |
+-----------------------------------------------------------+
| Grid 2-col, gap 24px                                      |
| | CheckoutCard (70%) | SummaryCard (30%, sticky top)   | |
| | - ItemRows         | - Order summary               | |
| | - Delivery form    | - Promo code input            | |
| | - Payment method   | - Total & Pay button        | |
| +-------------------------------------------------------+ |
| FooterNote                                                |
+-----------------------------------------------------------+
```

### Tablet-Landscape (768–1279 px)
```
+-------------------------------+
| HeaderBar                     |
+-------------------------------+
| ProgressSteps (horizontal)   |
+-------------------------------+
| CheckoutCard (full width)    |
| - ItemRows                   |
| - Delivery form              |
| - Payment method             |
+-------------------------------+
| SummaryCard (full width)     |
| - Order summary              |
| - Promo code                 |
| - Total & Pay button         |
+-------------------------------+
| FooterNote                   |
+-------------------------------+
```

### Mobile-Portrait (≤767 px)
```
+---------------------------+
| HeaderBar (compact)      |
+---------------------------+
| ProgressSteps (dots)     |
+---------------------------+
| CheckoutCard (full width)|
| - ItemRows (compact)     |
| - QtySelector inline     |
| - Delivery form          |
| - Payment method         |
+---------------------------+
| SummaryCard (collapsible)|
| - Tap to expand total    |
+---------------------------+
| PaymentButton (sticky bottom, full-width) |
+---------------------------+
| FooterNote (small)       |
+---------------------------+
```

## Interaksi (prototipe Figcraft)
- **Qty change** → hitung ulang harga secara langsung
- **Apply promo** → field inline + toast sukses/error
- **Step navigation** → klik nomor step (desktop/tablet), titik (mobile)
- **Payment** → klik **Pay** → buka Midtrans Snap modal
- **Address autocomplete** → dropdown Google Maps
- **Error handling** → teks merah di bawah field, scroll ke field yang error jika perlu

## Langkah penerapan di Figcraft
1. Buat 3 artboard dengan ukuran di atas.
2. Tambahkan Variable/Style sesuai `checkout-ui-spec.json`.
3. Buat 9 Komponen di atas, lalu compose layout tiap device sesuai wireframe.
4. Atur prototype connection (next step, back, accordion toggle summary mobile).
5. Export assets / CSS untuk diterapkan ke halaman `/checkout/[id]` di Next.js.
