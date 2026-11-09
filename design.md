# Design System — Habema

Spesifikasi visual tunggal untuk seluruh halaman publik Habema. Halaman wajib
patuh spec ini. `app/catalog_shop/page.tsx` adalah implementasi rujukan.

## 1. Warna (palet WanderMap — token di `app/globals.css` blok `@theme`)

> Token didefinisikan di `app/globals.css` (`@theme` + `:root`), **bukan** di
> `tailwind.config.ts` — project ini Tailwind v4 dan file config tersebut tidak dibaca.

| Peran            | Token            | Hex        | Pemakaian                              |
|------------------|------------------|------------|----------------------------------------|
| Primary          | `forest`         | `#0F766E`  | Tombol, harga, link hover, aksen teks  |
| Primary hover    | `forest-dark`    | `#115E59`  | Hover tombol primary                   |
| Primary light    | `forest-light`   | `#14B8A6`  | Gradient hero                          |
| Accent / CTA     | `gold`           | `#F97316`  | Badge diskon, chip hero, teks highlight|
| Accent light     | `gold-light`     | `#FB923C`  | Hover/overlay oranye                   |
| Background       | `cream`          | `#FFFFFF`  | Background halaman & surface kartu     |
| Background alt   | `cream-dark`     | `#F1F5F9`  | Section alternatif                     |
| Neutral          | `stone`          | `#64748B`  | Border, teks sekunder                  |
| Semantic         | `success`/`warning`/`error` | `#059669` / `#D97706` / `#EF4444` | Stok, status, error |

**Aturan 3 warna:** UI hanya memakai tiga keluarga — `forest` (primary),
`gold` (aksen/CTA), dan `stone` (netral). Putih/cream adalah surface, bukan
warna merek. Token `earth` dan `info` dialiaskan ke `forest` agar tidak
menambah hue; warna semantic hanya untuk status.
| Text             | `--foreground` / `stone-600` | `#0F172A` | Judul / body / label              |


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
- **Tidak ada section yang boleh melebarkan halaman.** Pengukurannya
  `document.documentElement.scrollWidth === clientWidth` di 375/768/1024/1280/
  1536. Dua sumber yang pernah menyalah dan cara menutupnya: blob dekorasi
  `w-96 blur-[120px]` di "Gear Terfavorit" (94→478 di layar 375) butuh
  `overflow-hidden` pada section-nya, dan kotak pencarian header punya
  min-content ±257px dari `size` bawaan `<input>` sehingga mendorong baris
  4px keluar di `md` — item `flex-1` itu butuh `min-w-0`. Baris yang memang
  digeser (`overflow-x-auto` di tile kegiatan) tidak ikut melebarkan
  dokumen: yang dihitung anak-anak di luar scroll container.

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

### Navbar desktop (`components/navigation/header.tsx`)
Baris tunggal `sticky top-0 z-50`, tinggi `h-16 md:h-20`, container
`max-w-7xl mx-auto px-4 lg:px-8`, transisi `duration-500`.

| Elemen | Kelas wajib | Catatan |
|--------|-------------|---------|
| Surface diam | `bg-cream border-b border-transparent` | putih, tanpa garis |
| Surface scroll | `bg-background/95 backdrop-blur-md border-border shadow-sm` | hanya alpha + border + shadow yang berubah; tinggi tetap |
| Logo | `/images/habema_logo_orange.png`, `block h-9 w-auto md:h-11` | sumber aslinya 348×136, jadi `width`/`height` prop-nya 348/136 dan tingginya yang dikunci ke bar (`h-16 md:h-20`); `h-auto w-auto` membuat logo menggambar 348px penuh dan memecahkan baris |
| Search | `hidden md:flex flex-1 max-w-xl` · `h-11 rounded-lg border` | focus: `bg-white border-forest shadow-lg` |
| Item nav | `variant="ghost"` + `text-forest/80` | hover otomatis `bg-accent text-accent-foreground` dari primitif Button — jangan di-override lokal |
| Item aktif | `text-forest` + `border-l-2 border-forest` | hanya di drawer/panel sekunder |
| Dropdown konten | `bg-popover border-border shadow-lg rounded-*` | ikon `text-forest`, judul `text-foreground`, deskripsi `text-muted-foreground`, hover `bg-forest-soft` |
| Badge keranjang | `bg-secondary text-white ring-2 ring-background` | ring pakai `background` agar menempel di surface putih |
| Overlay mobile | `fixed inset-0 z-[70] md:hidden bg-cream` | drawer sekunder `lg:hidden` |

Tumpukan z-index: header `z-50` → search suggestion `z-50` di dalam `z-60`
wrapper → overlay/panel mobile `z-[70]` → breadcrumb katalog `z-30` (di bawah
header, boleh tertimpa).

Breakpoint yang berlaku (sudah diputuskan):
- Search dan item nav sama-sama muncul di `md` (768px), jadi 768px+ langsung
  mendapat satu baris utuh — bukan search tanpa item nav.
- Breadcrumb katalog memakai `sticky top-16 md:top-20 z-30`, menempel tepat di
  bawah header (h-16 / md:h-20) alih-alih menimpanya.
- Drawer mobile memakai `z-[70]` agar berada di atas header `z-50`.

### Button
- Primary: `bg-forest hover:bg-forest-dark text-white rounded-xl font-bold`.
- Outline: `border-forest text-forest hover:bg-forest hover:text-white rounded-full`.
- Disabled: `bg-stone-300 text-stone-500 cursor-not-allowed`.
- Primitif `components/ui` (sumber kebenaran varian CVA):
  `default` = `bg-primary` + hover `bg-forest-dark` (teal-800), `secondary` = CTA
  oranye `bg-secondary`, `link` = `text-info` (teal, alias forest), `ghost`/`outline` hover =
  `bg-accent` (oranye muda `#FFEDD5`, teks `#9A3412`), radius dasar `rounded-lg`,
  Badge `rounded-full`. Jangan tambah kelas warna lokal di pemakaian — pakai varian.

### Overlay & modal produk (`app/product/[id]/page.tsx`)
- **Modal tidak boleh bersarang di wrapper `md:hidden`.** Panel share pernah
  duduk di dalam "MOBILE BOTTOM NAVIGATION" (`md:hidden fixed bottom-0 ...`),
  jadi `display: none` warisan itu ikut mematikan "PANEL SHARE - Desktop
  Center" dan tombol Bagikan di desktop tidak melakukan apa pun. Modal dipasang
  di akar halaman, sejajar dengan bar bawah.
- **Overlay di atas header sticky (`z-50`) memakai `z-[70]`,** sama seperti
  drawer mobile. `z-1` cukup untuk bar bawah, tidak untuk modal.
- **Wadah full-screen `pointer-events-none`, kartunya `pointer-events-auto`.**
  Tanpa itu, kontainer `fixed inset-0` yang transparan menahan klik di area
  gelap sehingga backdrop tidak bisa menutup modal.
- **Wishlist disimpan di `localStorage` key `habema_wishlist`** (array id
  produk), dibaca lewat `useEffect` supaya hydration tetap bersih. Pemicunya
  ada dua dan saling eksklusif: baris aksi di kartu harga (`lg:hidden`) dan
  sidebar kanan (`lg:block`).

## 6. State Halaman

- **Loading**: skeleton `aspect-[3/4]` sesuai bentuk kartu.
- **Empty**: `rounded-3xl border-2 border-dashed border-stone-200`,
  emoji + pesan + tombol "Reset Semua Filter" (outline forest).

## 7. Aturan Emas

1. Jangan duplikasi markup kartu — selalu pakai `CatalogGrid`.
2. Jangan hardcode warna di luar token.
3. Kartu produk selalu navigasi ke detail (`/product/[id]`).
4. Konsisten dengan `catalog_rental` (hero + breadcrumb + grid sama).
5. Mulai dengan foto besar & berkualitas (hero, kartu produk) — imagery mendominasi teks.
6. Jangan pakai carousel yang auto-scroll; navigasi gambar harus manual.

## 8. Homepage (`app/page.tsx`)

Urutan section dan alasannya — jangan ditukar tanpa alasan:

| # | Komponen | Isi | Sumber data |
|---|----------|-----|-------------|
| 1 | `HeroSectionFull` | Foto + cari tanggal sewa | sudah ada |
| 2 | `ActivityCategories` | Tile kegiatan, link ke halaman kegiatan | jumlah alat: `equipment.activities`; foto: `activity_tiles` |
| 3 | `PromoBanners` | Banner promo (gambar kampanye, bukan produk) | `promo_banners` yang aktif & dalam jadwal |
| 4 | `FeaturedProducts` | Gear rental terpopuler | `/api/products/featured-products` |
| 5 | `FeaturedBundles` | Paket grup 2/4/6-7/10 orang | `/api/bundles` |
| 6 | `ShopProducts` | Produk untuk dibeli (`ShopGrid`) | `shop_products` |
| 7 | `LogoCloud` | Instansi/lembaga yang pernah menyewa | `client_organizations` (is_active) |
| 8 | `CTA` + `FirstVisitPrompt` | penutup | sudah ada |

Aturan khusus section baru:

- **Satu endpoint, tiga section.** `LogoCloud`, `ActivityCategories`, dan
  `PromoBanners` membaca `/api/home` lewat `useHomeData()`;
  `useOptimizedFetch` men-dedupe sehingga tetap satu request.
- **Tanpa statistik angka.** Bukti sosial di akhir halaman memakai logo
  instansi (`LogoCloud`), bukan hitungan booking/unit/rating yang rawan
  bias data.
- **Section menyembunyikan dirinya kalau data kosong** (`return null`), bukan
  menampilkan strip kosong. Ini juga membuat homepage tetap utuh sebelum
  migrasi `20261104000000` dijalankan.
- **Slug kegiatan hanya di `lib/activities.ts`.** Label tile, chip filter,
  validasi param `?kegiatan=`, target `/kegiatan/[slug]`, dan daftar centang
  "Kegiatan" di admin semuanya dari satu daftar itu. Menambah kegiatan =
  menambah satu entri di sana.
- **Foto tile dikurasi, bukan diturunkan dari katalog.** `activity_tiles`
  (satu baris per slug) dibaca `/api/home` dan dikelola di
  `/admin/activities` — dulu fotunya diambil dari `equipment.imageUrl` alat
  paling sering disewa, sehingga tampilan homepage berubah setiap kali foto
  alat berubah. Tile tanpa baris aktif jatuh ke `fallbackActivityImage`.
  Tabelnya tidak menampung kosakata kegiatan: slug divalidasi API terhadap
  `lib/activities.ts`, bukan lewat CHECK di SQL.
- **Foto tile masuk sebagai file, tidak ada kolom URL di form.** `POST
  /api/admin/activities` (multipart) menyimpan ke bucket Storage `activities`
  yang dibuat migrasi yang sama, `PUT` hanya untuk teks alternatif dan status
  pakai. Foto lama dihapus best-effort saat diganti. Dev lokal adalah
  pengecualian: gateway tidak melayani `/storage/v1`, jadi file ditulis ke
  `public/uploads/activities/` (di-gitignore) dan dilayani sebagai file
  statis — cabang itu mati di production karena diikat `DEV_LOCAL_AUTH`.
- **Cache `/api/home` (5 menit) ada di `lib/home-data.ts`,** bukan di route
  handler: route hanya boleh mengekspor handler + konfigurasi (ekspor
  tambahan ditandai Next sebagai "non-standard export"). `/api/admin/activities`
  memanggil `revalidateHome()` supaya foto baru langsung terlihat.
- **Logo cloud tidak boleh diisi nama yang belum izin.** Kolom `is_active`
  default `false` dan `consent_note` disediakan untuk mencatat izin tertulis;
  tile tanpa `documentation_slug` dirender tanpa tautan.
- **Rentang warna section baru memakai token, bukan palet mentah:** overlay
  hero kegiatan `bg-linear-to-t from-forest/95 via-forest/60` (scrim vertikal —
  foto hero bisa berlatar putih, jadi judul harus duduk di pita bawah yang
  gelap), scrim tile kegiatan cuma `h-1/3 from-stone-900/85` (scrim penuh
  pernah dipakai dan dilepas karena menutupi seluruh foto), badge diskon `bg-secondary`,
  teks highlight `text-gold`, permukaan `bg-background` / `bg-card` /
  `border-border`.
- **Grid tile kegiatan:** di layar sempit satu baris `flex gap-3
  overflow-x-auto` dengan tile `aspect-square` kecil (`basis-[144px]
  sm:basis-[160px]`, `rounded-xl`) yang digeser mendatar, bukan jadi kolom
  tinggi. Mulai `lg` susunannya `lg:grid lg:grid-cols-3` dengan kartu
  `lg:aspect-4/3` (`lg:shrink lg:basis-auto lg:min-w-0`, `rounded-2xl`) yang
  mengisi kontainer — enam kotak 176px yang dipusatkan di layar lebar terlihat
  seperti deretan tombol, bukan kategori. Di ukuran itu labelnya naik ke
  `lg:text-2xl` dan scrim melebar jadi `lg:h-1/2 lg:from-stone-900/90` karena
  teksnya dua baris. Baris yang digeser memakai utilitas `no-scrollbar`
  (`app/globals.css`): tanpa itu `::-webkit-scrollbar { height: 6px }` di layer
  base meninggalkan garis 6px di bawah tile. Geser tetap hidup — di 375px
  `scrollWidth − clientWidth` 581px dan tile ketiga masih menyembul keluar.
- **Banner promo adalah gambar kampanye, bukan kartu produk.** Section ini
  tidak menampilkan nama alat, harga, badge diskon, atau CTA "sewa sekarang" —
  itu milik `FeaturedProducts` dan `CatalogGrid`. Satu banner mengisi lebar
  kontainer dengan `aspect-16/9`; dua banner atau lebih tersusun
  `md:grid-cols-2`. Sumbernya tabel `promo_banners` (gambar, judul sebagai teks
  alternatif, tautan opsional, jadwal tayang, urutan) yang dikelola di
  `/admin/promo-banners`. Tautan dirender sebagai `Link` untuk path internal dan
  `<a>` untuk http/https; banner tanpa tautan tetap tayang sebagai gambar.
  Promo per produk (`equipment.isPromo`) tetap ada, tetapi hanya untuk harga
  promo di `/bundles` dan detail produk — bukan lagi untuk mengisi section ini.

Yang masih terbuka:
- `components/audienSplitter.tsx` tidak lagi dipakai homepage (isinya adalah
  banner produk); konversikan jadi baris promo/banner, jangan kembalikan
  sebagai section berdiri sendiri.

### Halaman kegiatan (`app/kegiatan/[slug]/page.tsx`)

Ditautkan dari tile `ActivityCategories`. Server component dengan drizzle
(`getDb`), tanpa endpoint baru: orang datang dengan rencana ("mau pendakian"),
jadi di sini dua lini bisnis disatukan — alat sewa dan barang beli dalam satu
layar, sesuatu yang sengaja tidak dilakukan `/catalog_rental` dan
`/catalog_shop`.

- Foto hero dari `activity_tiles` (slug yang sama, baris aktif pertama),
  fallback ke `activity.image` lalu `fallbackActivityImage`.
- Alat sewa: `equipment.activities` memuat slug; barang beli:
  `shop_products.activities` (migrasi `20261106000001`, `text[]` + indeks GIN,
  pola yang sama persis dengan equipment). Keduanya difilter lewat
  `arrayContains` dan diambil maksimal 8 baris.
- Tag `shop_products.activities` diisi dari checkbox "Kegiatan" di
  `/admin/catalog-shop`; API membuang slug yang tidak ada di
  `lib/activities.ts` daripada menolak produk.
- Paket diambil dari `bundles.target_audience` yang sama dengan label
  kegiatan, jadi kegiatan tanpa paket tidak menampilkan section itu.
- **Komposisi section diatur per kegiatan** lewat `Activity.sections`
  (`'packages' | 'gear' | 'products'`, urutan = urutan render, tidak disebut =
  tidak tampil; default `gear, products, packages`). Open trip adalah
  satu-satunya yang menyimpang: `['packages', 'gear']`, karena katalognya
  adalah keberangkatan — paket memimpin dengan harga per orang dan judul
  "Jadwal …", dan barang beli tidak ditawarkan sama sekali. Aturan bentuk ini
  sengaja tinggal di `lib/activities.ts`, bukan sebagai `if (slug === …)` di
  halaman.
- **Jadwal bertanggal belum ada.** `bundles` tidak punya kolom tanggal, jadi
  "jadwal" di halaman open trip saat ini berarti daftar paket open trip yang
  sama dengan yang di `/opentrip` (halaman itu sudah mengelompokkan paket
  dengan label kegiatan yang sama, jadi halaman kegiatan tidak membawa
  daftar sendiri). Keberangkatan dengan tanggal, kuota, dan status penuh
  adalah tabel baru (`open_trip_schedules`), bukan perluasan halaman ini.
- Slug tidak dikenal → `notFound()`; semua section kosong → state "sedang
  disusun" dengan jalur tanya tim cabang, bukan halaman hampa.
- `/catalog_rental?kegiatan=` tidak berubah: filternya tetap ada dan tetap
  dipakai tombol "Lihat semua alat", hanya titik masuk utamanya yang pindah.

### Halaman instansi (`app/organisasi/[slug]/page.tsx`)

Ditautkan dari `LogoCloud` ketika `documentation_slug` terisi. Server component
dengan drizzle (`getDb`), tanpa endpoint baru dan tanpa tabel konten: identitas
dari `client_organizations`, rekomendasi dari `bundles.target_audience` yang
dipetakan per sektor (`AUDIENCES_BY_SECTOR` di berkas halaman itu).

- Baris nonaktif atau slug yang tidak dikenal → `notFound()` (404), bukan
  halaman kosong.
- `consent_note` tidak pernah dirender — itu catatan internal siapa yang
  memberi izin publikasi.
- `logo_url` memakai `<img>` biasa: host logo diisi admin dari domain mana pun,
  sedangkan `next/image` dibatasi `remotePatterns` di `next.config.mjs`.
- CTA WhatsApp memakai telepon cabang aktif pertama, sama seperti bagian
  footer homepage.

## 9. Menjalankan dev tanpa menyentuh production

    npm run dev:db      # PostgREST + shim auth di http://127.0.0.1:54321
    npm run dev         # .env.local harus menunjuk alamat itu

Kalau `NEXT_PUBLIC_SUPABASE_URL` masih berisi ref production, `next dev` berhenti
(`next.config.mjs`). Seed data uji lokal — pemetaan kegiatan per alat, tiga promo produk,
satu banner promo, dan beberapa instansi untuk logo cloud:

    "C:\Program Files\PostgreSQL\18\bin\psql.exe" "$POSTGRES_URL" -f scripts/local-dev-seed.sql

Idempoten dan hanya untuk `habema_local`; nama instansinya fiktif dan
`consent_note`-nya menandai itu data uji.

**Migrasi di dev dijalankan manual** lewat psql ke `habema_local`. Setelah
menambah kolom, PostgREST harus disuruh membaca ulang schema cache-nya —
perubahan DDL tidak terdeteksi sendiri, dan kolom baru tidak akan bisa ditulis
(`Could not find the '...' column of '...' in the schema cache`) sementara
membacanya tetap lancar:

    "C:\Program Files\PostgreSQL\18\bin\psql.exe" "$POSTGRES_URL" -c "notify pgrst, 'reload schema';"

Supabase production melakukan ini otomatis lewat `supabase db push`.

**Login di dev.** Turnstile dan email OTP adalah layanan eksternal yang tidak
bisa dipakai dari mesin pengembang: Cloudflare tidak menyelesaikan challenge di
localhost, dan Resend tidak boleh dipakai mengirim email pelanggan dari laptop.
`lib/dev-local-auth.ts` menandai kondisi itu (`NODE_ENV=development` dan host
`NEXT_PUBLIC_SUPABASE_URL` adalah 127.0.0.1/localhost), dan hanya dua hal yang
berubah:

- token Turnstile tidak diverifikasi di server, dan widgetnya tidak dirender;
- kode OTP dikirim di layar pada langkah verifikasi (banner amber
  "Dev lokal — kode ini ada di terminal dev server..."), plus dicetak ke
  terminal. Di production `devOtp` tidak pernah ikut dikembalikan.

Kode itu hanya muncul di layar karena dev server bisa berjalan di tempat yang
tidak terlihat (background task, terminal lain, container). Yang mengirim
keputusannya adalah server lewat field `devOtp`, bukan halaman login yang menebak
lingkungannya sendiri.

Seluruh keputusan lain tetap sama persis — password dicek, `is_vendor` dicek,
perangkat terpercaya dan langkah OTP tetap berfungsi. Build produksi tidak
pernah cocok dengan dua syarat itu, jadi dev tidak punya jalur khusus di
production.

Akun uji di `habema_local`: `admin.dev@habema.test` / `rahasia123`
(`is_vendor = true`) dan `pelanggan.uji@habema.test` / `rahasia123` (non-vendor,
untuk menguji batas admin). Domain `habema.test` tidak akan pernah jadi akun
nyata; kalau hilang, buat ulang lewat `POST /auth/v1/admin/users`.

## 10. Kapan OTP diminta

OTP bukan ritual tiap masuk, dan bukan sesuatu yang bisa dimatikan per akun.
Aturannya per jalur:

| jalur | password | OTP |
|---|---|---|
| `/admin/login`, perangkat baru | ya | **ya** — satu-satunya lapis kedua yang akun admin punya |
| `/admin/login`, perangkat terpercaya | ya | tidak |
| `/login` pelanggan, risiko normal | ya | tidak |
| `/login` pelanggan, Turnstile `risk: high` | ya | **ya** |
| daftar akun baru & reset password | ya | selalu — di situ email memang harus dibuktikan |

Perangkat terpercaya = cookie `habema_admin_trust` (httpOnly, `path=/api/auth`,
30 hari) yang isinya token acak; database `admin_device_trust` hanya menyimpan
sha256-nya, jadi isi tabel tidak bisa dipakai login dan satu perangkat bisa
dicabut sendiri. Keluar dari admin selalu mencabut penanda itu. Kalau database
tidak terjangkau, sistem dianggap "perangkat belum dikenal" (fail closed) dan
OTP diminta.

Keputusannya ada di rute, bukan di komponen: `/api/auth/admin-login` dan
`/api/auth/login` masing-masing memeriksa Turnstile, password, dan (untuk
admin) `is_vendor` dalam satu permintaan. Dulu cek `is_vendor` hanya ada di
halaman React, jadi siapa pun yang tahu endpoint bisa meminta OTP atas nama
akun biasa. Satu rute juga mencegah token Turnstile dipakai dua kali — kalau
verifikasi dilakukan `/api/auth/admin-login` lalu diulang `/api/auth/send-otp`,
Cloudflare menolak permintaan kedua dan pengguna terjebak meminta kode yang
tidak pernah datang.

Skor `risk` dari Cloudflare hanya dikirim kalau widget dikonfigurasi dengan
`refreshRisk`; tanpa itu field-nya tidak ada dan dianggap normal, sehingga
login pelanggan berjalan tanpa OTP.




