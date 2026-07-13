# Design System — Habema

Spesifikasi visual tunggal untuk seluruh halaman publik Habema. Halaman wajib
patuh spec ini. `app/catalog_shop/page.tsx` adalah implementasi rujukan.

## 1. Warna (Tailwind tokens — `tailwind.config.ts`)

| Peran            | Token            | Hex        | Pemakaian                              |
|------------------|------------------|------------|----------------------------------------|
| Primary          | `forest`         | `#2D5016`  | Tombol, harga, link hover, aksen teks  |
| Primary hover    | `forest-dark`    | `#1A3009`  | Hover tombol primary                   |
| Primary light    | `forest-light`   | `#3E6B1F`  | Gradient hero                         |
| Accent           | `gold`           | `#E8A76B`  | Badge diskon, chip hero, teks highlight|
| Accent light     | `gold-light`     | `#F0BF85`  | Hover/overlay emas                     |
| Background       | `cream`          | `#F5EFE7`  | Background halaman (toko)              |
| Background alt   | `cream-dark`     | `#E8DFCF`  | Section alternatif                     |
| Neutral          | `stone`          | `#A9A49E`  | Border, teks sekunder                  |
| Earth            | `earth`          | `#8B7355`  | Aksen earthy opsional                  |
| Semantic         | emerald / red    | —          | Stok tersedia / habis                  |
| Text             | `stone-900/600/500` | —       | Judul / body / label                   |

Larangan: jangan pakai warna hardcode di luar token di atas (mis. `#2D5016`
langsung) — gunakan token `forest` dll. agar konsisten saat diubah.

## 2. Tipografi

- **Heading**: `font-black uppercase tracking-tight`. (Serif `font-display`
  opsional untuk hero utama, tidak wajib.)
- **Body**: `font-medium`, warna `stone-600`.
- **Label kategori**: `text-xs font-bold uppercase tracking-wider text-stone-500`.
- **Harga**: `text-lg font-black text-forest`.

## 3. Radius & Elevation

- Kartu & tombol: `rounded-xl`.
- Kontainer besar: `rounded-2xl` / `rounded-3xl`.
- Badge / chip: `rounded-full`.
- Elevation: base `shadow-sm`, hover `shadow-md`, transisi `transition-all`.

## 4. Layout

- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Spacing section: `py-8` (desktop), `py-6` (mobile).
- Grid produk: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`.

## 5. Komponen

### Hero (banner halaman katalog)
- `bg-forest` + `bg-gradient-to-br from-forest via-forest-light/90 to-gold/30`.
- Judul `text-white font-black uppercase` + subtitle `text-white/80`.
- Chip kategori: `inline-flex ... rounded-full bg-white/10 text-gold`.
- Breadcrumb: `sticky top-0 z-30 bg-white shadow-sm border-b` (desktop);
  versi mobile di dalam hero.
- Tinggi: `py-10 md:py-14`.

### Product Card (`components/catalog/catalog-grid.tsx`) — SUMBER KE BENAR
- Seluruh kartu dibungkus `<Link href={/product/${id}${dateQuery}}>` → wajib clickable.
- Gambar: `aspect-[3/4]`, `object-cover`, `group-hover:scale-105`.
- Kartu: `rounded-xl border border-stone-200 bg-white hover:shadow-md`.
- Badge diskon: `bg-gold text-white rounded-full text-xs font-bold`.
- Badge stok: `bg-emerald-100 text-emerald-700` (tersedia) /
  `bg-red-100 text-red-700` (habis), `rounded-full`.
- Nama: `font-bold line-clamp-2 group-hover:text-forest`.
- Rating: `Star fill-yellow-400` + `(review_count)`.

### Filter (`components/catalog/catalog-filters.tsx`)
- Search: input + icon, `focus-visible:ring-forest`.
- Kategori: accordion checkbox, `data-[state=checked]:bg-forest`.
- Harga: range slider `accent-forest`, max `5.000.000`, step `10.000`.

### Button
- Primary: `bg-forest hover:bg-forest-dark text-white rounded-xl font-bold`.
- Outline: `border-forest text-forest hover:bg-forest hover:text-white rounded-full`.
- Disabled: `bg-stone-300 text-stone-500 cursor-not-allowed`.

## 6. State Halaman

- **Loading**: skeleton `aspect-[3/4]` sesuai bentuk kartu.
- **Empty**: `rounded-3xl border-2 border-dashed border-stone-200`,
  emoji + pesan + tombol "Reset Semua Filter" (outline forest).

## 7. Aturan Emas

1. Jangan duplikasi markup kartu — selalu pakai `CatalogGrid`.
2. Jangan hardcode warna di luar token.
3. Kartu produk selalu navigasi ke detail (`/product/[id]`).
4. Konsisten dengan `catalog_rental` (hero + breadcrumb + grid sama).
