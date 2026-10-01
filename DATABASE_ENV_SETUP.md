# Pemisahan Database Dev dan Production

Status: **sedang dikerjakan** (25 Sep 2026). Jalur yang dipilih: **project
Supabase cloud kedua khusus dev** (Jalur B di bawah).

Sampai pemisahan selesai, `.env` masih berisi kredensial production. Sebagai
jaring pengaman sementara, `next.config.mjs` sekarang **menghentikan
`npm run dev`** kalau `NEXT_PUBLIC_SUPABASE_URL` menunjuk ke project
production — jadi tidak ada lagi data uji yang masuk ke data pelanggan asli
selama proses migrasi berlangsung.

Jaring pengaman kedua menutup lubang yang berbeda: Supabase CLI di mesin ini
ter-link ke project **production**, sehingga `supabase db push` berjalan
terhadap database pelanggan asli tanpa peringatan apa pun — dan itu justru
perintah yang dijalankan di langkah 5. Karena itu `scripts/db-guard.mjs`
sekarang memeriksa `supabase/.temp/linked-project.json` sebelum perintah
dijalankan. Pakai perintah npm-nya, bukan `supabase` langsung:

| Perintah | Kegunaan |
| --- | --- |
| `npm run db:status` | cetak project yang sedang ter-link (tidak pernah memblokir) |
| `npm run db:link -- --project-ref <ref>` | pindahkan tautan ke project dev |
| `npm run db:push:dry` | lihat migrasi yang akan dijalankan, tanpa mengubah apa pun |
| `npm run db:push` | jalankan migrasi ke project yang ter-link |
| `npm run supabase:types:dev` | generate tipe dari project yang ter-link |

Ketiganya **menolak jalan selama tautan masih production**. Batas
jangkauannya: perintah `supabase` yang Anda ketik langsung di terminal tidak
melewati pengaman ini, jadi kebiasaannya adalah selalu memakai `npm run db:*`
untuk perintah yang mengubah database. `supabase db dump` sengaja tidak
dijaga karena hanya membaca — lihat langkah 4.

---

## 1. Kondisi saat ini

| Hal | Nilai |
| --- | --- |
| Project Supabase | `ypbdqkfxtmkbllhezmqz` ("habamaOutdoor") |
| Dipakai oleh | dev lokal **dan** production |
| File env | hanya `.env` (gitignored), berisi kredensial production |
| `.env.local` | belum ada |
| Supabase CLI | v1.226.4, ter-link ke project **production** |
| Docker | belum terpasang |
| `supabase/seed.sql` | belum ada (hanya relevan untuk Jalur A) |

Konsekuensinya: `npm run dev` menulis booking, order, dan notifikasi uji ke
tabel yang sama dengan data pelanggan asli.

## File env yang berlaku

```
.env.local.example       template dev        (di-commit)
.env.production.example  template production (di-commit)
.env                     kredensial production, dipakai dev saat ini  (JANGAN di-commit)
.env.local               belum ada — dibuat di langkah 5              (JANGAN di-commit)
```

Prioritas Next.js: `.env` < `.env.local`. `.env.local` menang di **semua**
environment, termasuk saat `npm run build`. Jadi jangan pernah menaruh
kredensial production di `.env.local`.

---

## 2. Jalur yang dipilih: project cloud dev kedua

Alasan memilih ini dibanding Supabase lokal via Docker:

- Tanpa Docker Desktop (unduhan ~1 GB+), jadi bisa dikerjakan sekarang.
- Paling mirip production: Auth, Storage, dan PostgREST versi cloud yang sama.
- URL dev berbentuk `https://<ref>.supabase.co`, sehingga `remotePatterns` dan
  CSP di `next.config.mjs` **tidak perlu diubah** (keduanya sudah mengizinkan
  `*.supabase.co` dan `https:`). Ini menghilangkan tiga blocker yang muncul
  kalau memakai Supabase lokal `http://127.0.0.1`.

Yang perlu diketahui: **pgAdmin tidak menggantikan Supabase.** pgAdmin adalah
klien GUI untuk PostgreSQL — ia hanya bisa terhubung *ke* Postgres. Aplikasi
ini tidak punya driver Postgres sama sekali; semua akses lewat
`@supabase/supabase-js` (PostgREST + GoTrue + Storage API). Jadi Postgres polos
tanpa Supabase tidak akan menjalankan aplikasi ini. Yang benar: pakai pgAdmin
sebagai jendela untuk melihat/mengedit Postgres milik project dev Supabase.

---

## 3. Langkah 1 — buat project dev di dashboard Supabase

Tidak bisa lewat CLI; harus manual.

1. Buka <https://supabase.com/dashboard> → **New project**.
2. Organisasi yang sama dengan production, supaya mudah dikelola.
3. Beri nama yang jelas, mis. `habema-dev` — jangan `habamaOutdoor`.
4. **Simpan `Project ref`** (formatnya 20 karakter, mirip
   `abcdefghijklmnop`). Ada di Project Settings → General, dan di URL dashboard.
5. Catat **region** project (dipakai untuk host pooler di langkah 4).
6. Periksa **versi Postgres** project dev. `supabase/config.toml:30` menyetel
   `major_version = 15`. Kalau project dev dibuat dengan versi mayor berbeda,
   migrasi bisa gagal atau berperilaku beda — samakan kalau memungkinkan.

> Kuota gratis Supabase mengizinkan lebih dari satu project per organisasi,
> tapi jumlahnya terbatas dan project gratis bisa di-*pause* kalau lama tidak
> aktif. **Verifikasi batas kuota dan kebijakan pause di dashboard Anda** —
> project dev yang ter-pause akan membuat `npm run dev` gagal sampai di-restore.

## 4. Langkah 2 — siapkan pgAdmin untuk DB dev

Bagian ini menjawab kebutuhan memakai pgAdmin untuk database development.

### 4a. Pasang pgAdmin

Ada dua cara di Windows 11:

- **Installer resmi pgAdmin 4** — <https://www.pgadmin.org/download/pgadmin-4-windows/>.
  Pilih yang ini kalau hanya butuh GUI-nya (tidak perlu `psql`).
- **Bundel PostgreSQL EDB** — <https://www.enterprisedb.com/downloads/postgres-postgresql-downloads>.
  Pilih ini kalau Anda juga ingin `psql` di terminal; saat instalasi, centang
  pgAdmin dan Command Line Tools. **Tidak perlu** meng-install server Postgres-nya
  (uncheck "PostgreSQL Server") karena kita memakai Postgres milik Supabase.

> Cara termudah memakai `psql` tanpa instalasi: pgAdmin 4 versi desktop sudah
> menyertakan *Query Tool*, dan Supabase Dashboard juga punya SQL Editor.

### 4b. Ambil connection string dari dashboard

Dashboard project **dev** → **Project Settings** → **Database** → bagian
**Connection string**. Supabase menyediakan beberapa pilihan, dan **pilihannya
penting** untuk pgAdmin:

| Mode | Host | Port | Cocok untuk pgAdmin? |
| --- | --- | --- | --- |
| **Session pooler** | `aws-0-<region>.pooler.supabase.com` | `5432` | ✅ **pakai ini** |
| Transaction pooler | `aws-0-<region>.pooler.supabase.com` | `6543` | ❌ |
| Direct connection | `db.<ref>.supabase.co` | `5432` | ⚠️ sering gagal |

Alasannya:

- **Session pooler** mempertahankan sesi penuh dan mendukung prepared
  statements — pgAdmin butuh ini untuk membuka koneksi yang bertahan lama.
- **Transaction pooler** memakai mode transaction: state sesi tidak dijamin
  antar query. Di pgAdmin ini sering muncul sebagai error saat membuka skema,
  menjalankan query bertahap, atau memakai *Query Tool* dalam waktu lama.
- **Direct connection** sekarang diarahkan Supabase ke **IPv6-only** untuk
  project baru. Banyak koneksi Windows (termasuk yang IPv4-only) tidak bisa
  menjangkaunya. Kalau direct connection Anda gagal dengan pesan seperti
  *"could not translate host name"* atau timeout, itu sebabnya — pakai session
  pooler, yang IPv4.

> ⚠️ **Konfirmasi di dashboard Anda.** Detail di atas (nama host pooler, port,
> dan status IPv6 direct connection) adalah perilaku Supabase yang dapat
> berubah. Halaman Connection string menampilkan nilai persis untuk project
> Anda — salin dari sana, jangan menyalin dari dokumen ini.

Format yang biasanya muncul di session pooler:

```
Host     : aws-0-<region>.pooler.supabase.com
Port     : 5432
Database : postgres
Username : postgres.<project-ref-dev>      <-- perhatikan, pakai titik
Password : <password database project dev>
```

Kalau lupa password database: Project Settings → Database → **Reset database
password**. Password ini berbeda dari anon/service role key.

### 4c. Daftarkan server di pgAdmin

1. Buka pgAdmin → klik kanan **Servers** → **Register** → **Server…**
2. Tab **General** → Name: `habema-dev` (jangan `habema-prod` — beri nama yang
   tidak mungkin tertukar).
3. Tab **Connection**:
   - Host / Port / Maintenance database / Username / Password: isi dari
     langkah 4b.
   - Centang **Save password** kalau tidak mau mengetik ulang (hanya di mesin
     pribadi).
4. Tab **SSL**:
   - **SSL mode: `Require`** untuk Supabase cloud. (Kalau koneksi gagal dengan
     `Require`, coba `Prefer` — tapi `Require` yang benar untuk cloud.)
5. **Save**, lalu klik dobel untuk connect. Kalau berhasil, Anda akan melihat
   `Databases → postgres → Schemas → public`.

**Penting:** daftarkan juga project production sebagai server terpisah dengan
nama yang jelas berbeda (mis. `habema-PRODUCTION`), atau **jangan daftarkan
sama sekali**. Kekuatan pgAdmin adalah Anda bisa mengedit data langsung —
di server production itu berbahaya. Kalau production tidak terdaftar, tidak ada
yang bisa salah klik.

### 4d. Apa yang sebaiknya dikerjakan di pgAdmin vs CLI

| Pekerjaan | Cara terbaik |
| --- | --- |
| Lihat/inspeksi tabel, jalankan query ad-hoc | **pgAdmin** ✅ |
| Bandingkan skema dev vs production | **pgAdmin** ✅ (dua server berdampingan) |
| Edit/benahi data baris tertentu saat debugging | **pgAdmin** ✅ |
| Jalankan migrasi (`supabase/migrations/*.sql`) | ❌ **bukan pgAdmin** — pakai `supabase db push` (langkah 5) |
| Buat akun admin | Dashboard Supabase → Authentication (langkah 7) |

Migrasi dijalankan lewat CLI, bukan pgAdmin, karena CLI mencatat migrasi yang
sudah dijalankan di tabel `supabase_migrations.schema_migrations`. Kalau Anda
menempel SQL migrasi manual ke pgAdmin, catatan itu tidak ikut terisi sehingga
`supabase db push` berikutnya akan mencoba menjalankannya lagi.

## 5. Langkah 3 — kirim 20 migrasi ke DB dev

> ⚠️ **Bahaya terbesar di seluruh proses ini.** CLI saat ini ter-link ke
> project **production**. Sejak `scripts/db-guard.mjs` ditambahkan, perintah
> di bawah menolak jalan selama tautannya masih production — tapi pengaman
> itu hanya berlaku untuk perintah `npm run db:*`, bukan `supabase` langsung.

Urutannya:

```bash
# 1. Link ke project DEV (ganti dengan ref dari langkah 3)
npm run db:link -- --project-ref <ref-project-dev>

# 2. BUKTIKAN tautan sudah pindah — jangan lewatkan langkah ini
npm run db:status
#    Harus mencetak ✅ dengan ref project DEV. Kalau masih
#    ypbdqkfxtmkbllhezmqz, JANGAN lanjut.

# 3. Lihat dulu migrasi apa yang akan dijalankan, tanpa mengubah apa pun
npm run db:push:dry

# 4. Kalau daftarnya sudah benar, baru jalankan
npm run db:push
```

Kalau link terlanjur salah dan migrasi terkirim ke production, **jangan**
mencoba memperbaikinya sendiri — hubungi pemilik project dan pulihkan dari
backup Supabase.

## 6. Langkah 4 — isi data katalog ke DB dev

Skema didapat dari migrasi. Untuk data, salin **hanya tabel katalog** —
jangan pernah menyalin tabel pelanggan.

**Aman disalin** (data referensi, tidak ada data pribadi pelanggan):
`equipment_categories`, `bundles`, `bundle_items`, `branch_inventory`,
`shop_products`, `branches`

> `branches` berisi kolom `phone`, tapi itu nomor cabang Habema sendiri yang
> memang sudah tampil publik di situs — bukan data pelanggan.

**⚠️ Periksa dulu sebelum disalin** — mengandung rujukan ke `public.users`,
sehingga bisa gagal FK kalau user production tidak ikut tersalin (dan memang
tidak boleh ikut):

| Tabel | Kolom | Tindakan |
| --- | --- | --- |
| `equipment` | `vendor_id` → `users(id)`, ON DELETE CASCADE | **kosongkan** jadi `NULL` |
| `discounts` | `created_by` | kosongkan atau sesuaikan |
| `user_discounts` | `user_id` → `users(id)`, **NOT NULL** | jangan disalin — data per-user |

`equipment.vendor_id` mudah terlewat: daftar migrasi menunjukkan kolom ini
ditambahkan di `supabase/migrations/20260727000100_add_equipment_detail_columns.sql:13`
sebagai FK ke `public.users`. Kalau baris `equipment` disalin apa adanya,
`vendor_id` akan menunjuk UUID user production yang tidak ada di DB dev →
insert gagal dengan FK violation.

Jalankan ini di DB dev **setelah** restore katalog:

```sql
-- Lepaskan rujukan ke user production
update public.equipment set vendor_id = null where vendor_id is not null;
```

**JANGAN disalin** (data pelanggan / transaksi asli):
`bookings`, `booking_items`, `booking_bundle_items`, `shop_orders`,
`shop_order_items`, `notifications`, `user_identity`, `users`, `addresses`,
`reviews`, `otp_codes`, dan seluruh skema `auth`

Dump dari production (butuh link sementara ke production, lalu **link balik ke
dev setelahnya**):

```bash
supabase db dump --data-only -f katalog.sql \
  -t public.equipment_categories \
  -t public.equipment \
  -t public.bundles \
  -t public.bundle_items \
  -t public.branches \
  -t public.branch_inventory \
  -t public.shop_products
```

Cara termudah me-restore ke project dev: buka `katalog.sql`, salin isinya,
tempel ke **pgAdmin → Query Tool** (terhubung ke server `habema-dev`), lalu
jalankan. Atau lewat SQL Editor di dashboard Supabase dev.

Setelah itu ganti `user_id` / `created_by` yang menunjuk ke user production,
atau kosongkan kolomnya.

**Periksa juga Storage.** Foto equipment ada di Supabase Storage, bukan di
Postgres. Menyalin baris `equipment` saja tidak menyalin gambarnya — URL gambar
akan menunjuk ke bucket production. Di dev, foto akan gagal tampil sampai Anda
meng-upload ulang beberapa gambar uji ke bucket dev.

## 7. Langkah 5 — buat `.env.local`

```bash
cp .env.local.example .env.local
```

Lalu isi tiga nilai ini dengan kredensial project **dev** (Dashboard dev →
Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref-project-dev>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key dev>
SUPABASE_SERVICE_ROLE_KEY=<service_role key dev>
```

Sisanya (Midtrans sandbox, Turnstile test key, Resend, Google) sudah benar di
template. **Jangan sentuh `.env`** — biarkan berisi kredensial production.

Buat akun admin di project dev: Dashboard dev → **Authentication** → **Add
user** → email + password. Lalu samakan di `.env.local`:

```
ADMIN_EMAIL=<email admin dev>
NEXT_PUBLIC_ADMIN_EMAIL=<email admin dev>
```

Generate tipe DB dari project dev (pastikan sudah ter-link ke dev):

```bash
npm run supabase:types:dev
```

### Catatan script tipe DB

`package.json` sekarang memisahkan tiga perintah supaya tidak salah arah:

| Perintah | Sumber tipe |
| --- | --- |
| `npm run supabase:types:dev` | project yang sedang **ter-link** (pakai ini untuk dev) |
| `npm run supabase:types:prod` | production, ref di-hardcode |
| `npm run supabase:types:local` | Supabase lokal (Jalur A) |

`:dev` sekarang dijaga `scripts/db-guard.mjs`: selama CLI masih ter-link ke
production, perintah itu menolak jalan. Tanpa pengaman itu ia diam-diam
menulis tipe production ke `types/supabase.ts` sambil menyandang nama "dev" —
persis kebingungan yang membuat `:prod` dan `:dev` dipisah.

`npm run supabase:types` tetap ada sebagai alias `:prod` agar perintah lama
tetap jalan — tapi **jangan dipakai saat mengerjakan dev**, karena akan menulis
ulang `types/supabase.ts` dengan skema production.

## 8. Langkah 6 — verifikasi sebelum bekerja

```bash
npm run dev
```

Saat start, `next.config.mjs` mencetak target DB-nya:

```
  ✅ DB target: project dev <ref-dev> (bukan production)
```

Kalau yang muncul justru:

```
  ⛔ DEV DILARANG MENUNJUK DATABASE PRODUCTION
```

berarti `.env.local` belum terbaca atau isinya masih production. Dev server
sengaja dihentikan sebelum melayani request apa pun, jadi tidak ada data uji
yang tertulis.

Uji isolasi dengan hal yang bisa dibuktikan:

1. Jalankan `npm run dev`, lalu buat satu booking uji.
2. Buka **pgAdmin** → server `habema-dev` → `public.bookings` → Refresh.
   Booking uji harus muncul di sini.
3. Buka dashboard **production** → Table Editor → `bookings`. Booking uji tadi
   **tidak boleh** ada di sana.

Kalau langkah 3 gagal, hentikan pekerjaan dan periksa `.env.local` sebelum
melanjutkan.

## 9. Rollback

Kalau ada yang salah, kembalikan dev ke kondisi aman sementara:

```bash
rm .env.local          # dev kembali memakai .env (production)
```

Tapi sejak pengaman di `next.config.mjs` aktif, `npm run dev` akan menolak
jalan dengan kredensial production — itu memang tujuannya. Untuk sementara
saja, `ALLOW_PRODUCTION_DB_IN_DEV=true npm run dev` bisa menembusnya. Sadari
risikonya: data uji Anda akan masuk ke data pelanggan asli.

Project dev Supabase bisa dihapus kapan saja dari dashboard tanpa memengaruhi
production.

---

## Checklist

- [ ] Buat project dev `habema-dev` di dashboard Supabase, catat ref & region
- [ ] Cek versi Postgres project dev (samakan dengan `major_version = 15`)
- [ ] Pasang pgAdmin di Windows
- [ ] Daftarkan server `habema-dev` di pgAdmin (Session pooler, SSL `Require`)
- [ ] `npm run db:link -- --project-ref <ref-dev>` + **verifikasi** `npm run db:status`
- [ ] `npm run db:push:dry`, lalu `npm run db:push`
- [ ] Salin tabel katalog saja (tanpa data pelanggan)
- [ ] `update public.equipment set vendor_id = null` di DB dev (lepas rujukan user production)
- [ ] Buat akun admin di Supabase Auth project dev
- [ ] Isi `.env.local` dengan kredensial dev
- [ ] `npm run supabase:types:dev`
- [ ] `npm run dev` → pastikan mencetak `✅ DB target: project dev`
- [ ] Verifikasi: booking uji muncul di dev dan **tidak** muncul di production
- [ ] Pastikan `.env` dan env Vercel masih menunjuk production

## Berkas yang perlu diperbarui setelah selesai

- `DATABASE_ENV_SETUP.md` (dokumen ini) — ubah status jadi selesai, hapus
  instruksi Jalur A kalau tidak dipakai.
- `.env.local.example` — hapus blok "STATUS DATABASE SAAT INI" yang menyatakan
  dev dan production belum dipisah.
- `CLAUDE.md` — bagian Environment perlu menyebut `.env.local` untuk dev
  (catatan: `CLAUDE.md` di-*gitignore*, jadi perubahan ini lokal saja).

## Sisa risiko yang belum tertutup

1. **`supabase/seed.sql` tidak ada**, padahal `supabase/config.toml:46-50`
   menyetel `[db.seed] enabled = true` dengan `sql_paths = ['./seed.sql']`.
   Ini hanya relevan untuk Jalur A (`supabase db reset`) — `supabase db push`
   tidak menjalankan seed. Kalau nanti beralih ke Docker, buat file itu dulu.
2. **Gambar dari Storage** — lihat catatan di langkah 6; foto equipment tidak
   ikut tersalin bersama baris tabelnya.
3. **`scripts/db-guard.mjs` belum pernah dijalankan.** Ditulis 25 Sep 2026
   saat shell di mesin pengembang diblokir, jadi isinya baru diperiksa dengan
   membaca kode — belum ada satu pun kasus yang benar-benar dieksekusi.
   Uji dulu sebelum mengandalkannya:
   `npm run db:status` (harus mencetak ⛔ production) dan
   `npm run db:push:dry` (harus menolak, bukan menjalankan push).
4. **CLI masih ter-link ke production sampai langkah 5 dijalankan.** Jadi
   `npm run db:push` akan menolak jalan — itu perilaku yang benar, bukan
   kerusakan. Kalau nanti perlu menjalankan perintah yang menyasar production,
   pindahkan tautannya secara sadar, jangan lewat `ALLOW_PRODUCTION_DB=true`
   yang mudah terlupakan.
