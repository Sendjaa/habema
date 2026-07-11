=== PANDUAN INSTALASI HABEMA (NON-IT) ===

1. EXTRACT ZIP
   - Klik kanan file ZIP → Extract All

2. JALANKAN SETUP
   - Buka folder "habema-setup"
   - Double-klik "setup.bat"
   - Tunggu sampai selesai

3. ISI KUNCI API
   - Buka folder "project"
   - Edit file ".env.local" dengan Notepad
   - Isi 5 kunci API (dari Supabase & Midtrans)

4. JALANKAN WEBSITE
   - Buka folder "project" → Shift + Klik Kanan → "Open in Terminal"
   - Ketik: npm run dev
   - Buka http://localhost:3000 di browser

5. SETUP AWAL
   - Ikuti panduan di SETUP_GUIDE_NON_IT.md

=== CATATAN ===
- Pastikan terhubung internet
- Gunakan Chrome/Firefox
- Untuk testing, gunakan Midtrans Sandbox
- Tidak perlu deploy untuk testing lokal

=== DUKUNGAN ===
- Baca SETUP_GUIDE_NON_IT.md untuk panduan lengkap
- Hubungi kami jika ada masalah