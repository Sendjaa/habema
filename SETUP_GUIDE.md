# Setup Guide - HABEMA Outdoor

## 🚨 **SOLUSI ERROR PEMBAYARAN**

Jika mengalami error saat pembayaran:
- `POST /api/midtrans/create-transaction 500 (Internal Server Error)`
- `POST /notifications 400 (Bad Request)`

Ikuti langkah-langkah di bawah ini:

## 📋 **Environment Variables Setup**

### 1. Copy Environment Template
```bash
cp .env.local.example .env.local
```

### 2. Konfigurasi Midtrans (WAJIB)
Daftar akun Midtrans di https://dashboard.midtrans.com/

#### Untuk Development:
```bash
# Gunakan Sandbox keys dari Midtrans Dashboard
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_PRODUCTION=false
```

#### Untuk Production:
```bash
# Gunakan Production keys dari Midtrans Dashboard
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxx
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxx
MIDTRANS_PRODUCTION=true
```

### 3. Konfigurasi Supabase (WAJIB)
```bash
# Dapatkan dari Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Konfigurasi Base URL
```bash
# Development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Production
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 5. Konfigurasi Google Maps (Optional)
```bash
# Daftar di https://console.cloud.google.com/
# Enable API: Distance Matrix API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

## 🔧 **Troubleshooting**

### Error: "Payment system not properly configured"
**Penyebab**: Environment variables Midtrans tidak diisi
**Solusi**: Isi `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dan `MIDTRANS_SERVER_KEY`

### Error: "supabaseKey is required"
**Penyebab**: Environment variables Supabase tidak diisi
**Solusi**: Isi semua Supabase keys di `.env.local`

### Error: "POST /notifications 400 (Bad Request)"
**Penyebab**: Notifications API error (sudah di-disable sementara)
**Solusi**: Error ini sudah diatasi, notifications sementara disabled

## 🧪 **Testing**

### 1. Test Environment Variables
```bash
# Restart development server
npm run dev

# Buka browser dan cek console untuk debug logs
```

### 2. Test Payment Flow
1. Buka http://localhost:3000
2. Pilih produk → Add to cart
3. Checkout → Pilih Midtrans Payment
4. Isi customer data
5. Test dengan kartu kredit testing:
   - **Success**: 4811 1111 1111 1114
   - **Challenge**: 4911 1111 1111 1113
   - **Decline**: 4556 7375 8689 9855

### 3. Test Development Mode
Jika tidak memiliki Midtrans keys, sistem akan otomatis menggunakan mock mode di development:
```javascript
{
  "success": true,
  "orderId": "HBM-xxxxx",
  "token": "mock-token-xxxxx",
  "redirect_url": "http://localhost:3000/payment/finish",
  "mock": true,
  "message": "Development mode - using mock payment"
}
```

## 🚀 **Production Deployment**

### 1. Update Environment Variables
```bash
# Production configuration
MIDTRANS_PRODUCTION=true
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=production-client-key
MIDTRANS_SERVER_KEY=production-server-key
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 2. Build and Deploy
```bash
npm run build
npm run start
```

### 3. Domain Configuration
- Daftarkan production domain di Midtrans Dashboard
- Configure SSL certificate
- Update callback URLs

## 📞 **Support**

### Midtrans Support
- Email: support@midtrans.com
- Phone: (021) 3000 0400
- Documentation: https://docs.midtrans.com/

### HABEMA Support
- WhatsApp: 0812-3456-7890
- Email: support@habema-outdoor.com

## 🔍 **Debug Mode**

Untuk debugging, enable console logs:
```javascript
// Cek browser console untuk:
// - Midtrans Config Debug
// - Initialization logs
// - Transaction creation logs
// - Error details
```

---

**CATATAN PENTING**:
1. Environment variables HARUS diisi di `.env.local` (jangan di .env.example)
2. Restart server setelah mengubah environment variables
3. Gunakan sandbox keys untuk development
4. Ganti ke production keys hanya saat deployment

## ✅ **Checklist Setup**

- [ ] Copy `.env.local.example` ke `.env.local`
- [ ] Isi Midtrans client key
- [ ] Isi Midtrans server key
- [ ] Isi Supabase URL
- [ ] Isi Supabase anon key
- [ ] Isi Supabase service role key
- [ ] Set correct base URL
- [ ] Restart development server
- [ ] Test payment flow
- [ ] Test with mock mode jika tidak ada keys
