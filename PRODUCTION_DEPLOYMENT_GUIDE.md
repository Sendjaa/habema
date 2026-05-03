# Production Deployment Guide

## 🚀 Production Configuration

### 1. Environment Variables (CRITICAL)

Update `.env.local` dengan production values:

```bash
# Midtrans Production
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxx  # Production client key
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxx              # Production server key
MIDTRANS_PRODUCTION=true                               # MUST BE TRUE!

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com           # Production domain

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### 2. Midtrans Setup Production

1. **Login ke Midtrans Dashboard**
2. **Switch ke Production Environment**
3. **Copy Production Keys** (dimulai dengan `Mid-client-` dan `Mid-server-`)
4. **Update Payment Methods** yang ingin di-enable
5. **Configure Callback URLs**:
   - Finish: `https://yourdomain.com/payment/finish`
   - Error: `https://yourdomain.com/payment/error`
   - Pending: `https://yourdomain.com/payment/pending`

### 3. Deployment Steps

#### Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables di Vercel Dashboard
vercel env add NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
vercel env add MIDTRANS_SERVER_KEY
vercel env add MIDTRANS_PRODUCTION
vercel env add NEXT_PUBLIC_BASE_URL
```

#### Manual Deployment
```bash
# Build untuk production
npm run build

# Start production server
npm start
```

### 4. Critical Production Checks

#### ✅ Pre-Deployment Checklist
- [ ] Midtrans production keys sudah didapat
- [ ] Environment variables sudah di-set dengan benar
- [ ] `MIDTRANS_PRODUCTION=true` (sangat penting!)
- [ ] Base URL production sudah benar
- [ ] Callback URLs sudah di-configure di Midtrans

#### ✅ Post-Deployment Testing
- [ ] Test booking dengan payment method yang berbeda
- [ ] Verifikasi Midtrans popup muncul
- [ ] Test payment success flow
- [ ] Test payment error flow
- [ ] Check notifications terbuat dengan benar
- [ ] Verify database records

### 5. Production vs Development Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Midtrans Keys | Sandbox (`SB-Mid-`) | Production (`Mid-`) |
| Environment | `MIDTRANS_PRODUCTION=false` | `MIDTRANS_PRODUCTION=true` |
| Base URL | `http://localhost:3000` | `https://yourdomain.com` |
| Payment Mode | Test/Sandbox | Real Transactions |

### 6. Common Production Issues

#### Issue: "Access denied due to unauthorized"
**Cause**: Menggunakan sandbox keys di production
**Fix**: Pastikan menggunakan production keys (`Mid-client-` bukan `SB-Mid-client-`)

#### Issue: Callback URLs tidak berfungsi
**Cause**: Callback URLs di Midtrans tidak sesuai dengan production domain
**Fix**: Update callback URLs di Midtrans dashboard

#### Issue: Environment variables tidak ter-load
**Cause**: Environment variables tidak di-set di hosting platform
**Fix**: Set environment variables di hosting platform dashboard

### 7. Security Considerations

- 🔐 **Jangan expose server keys** di client-side code
- 🔐 **Gunakan HTTPS** untuk production
- 🔐 **Validate environment variables** sebelum deploy
- 🔐 **Monitor transactions** untuk fraud detection

### 8. Monitoring & Logging

Production monitoring:
- Midtrans transaction logs
- Error tracking (Sentry, etc.)
- Database performance
- Payment success/failure rates

---

## 🚨 CRITICAL REMINDER

**JANGAN LUPA**: Pastikan `MIDTRANS_PRODUCTION=true` di production environment. Jika tidak, payment tidak akan bekerja!

---

## 📞 Support

Jika ada masalah production:
1. Check environment variables
2. Verify Midtrans dashboard configuration  
3. Check server logs
4. Test dengan Midtrans production API directly
