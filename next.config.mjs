// ---------------------------------------------------------------
// PENGAMAN DATABASE — cegah `npm run dev` menulis ke production.
//
// Sebelum 25 Sep 2026, dev lokal memakai kredensial production: setiap
// booking/order uji masuk ke tabel yang sama dengan data pelanggan asli.
// Pengaman ini membuat `next dev` GAGAL saat memuat config, sehingga
// prosesnya keluar dan tidak ada pekerjaan yang bisa dilanjutkan.
//
// Catatan kejujuran: Next.js mencetak banner "Ready" sebelum config
// selesai dimuat, jadi ini bukan gerbang yang dijamin tertutup sebelum
// ada satu request pun dilayani. Jendela praktisnya di bawah satu detik
// dan tidak ada request yang terlayani tanpa Anda membuka halaman, tapi
// jangan perlakukan ini sebagai jaminan mutlak — tetap pastikan
// NEXT_PUBLIC_SUPABASE_URL benar sebelum mulai bekerja.
//
// Hanya aktif saat NODE_ENV=development (`npm run dev`). `npm run build`
// dan `npm run start` tidak terpengaruh, termasuk build di Vercel.
//
// Kalau memang perlu dev menunjuk production (mis. menelusuri bug data
// asli), set ALLOW_PRODUCTION_DB_IN_DEV=true. Sadari risikonya.
// ---------------------------------------------------------------
const PRODUCTION_PROJECT_REF = 'ypbdqkfxtmkbllhezmqz'

function supabaseProjectRef(url) {
  if (!url) return null
  const match = /^https?:\/\/([a-z0-9-]+)\.supabase\.(?:co|in)\b/i.exec(url)
  return match ? match[1] : null
}

function isLocalSupabase(url) {
  return typeof url === 'string' && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\b/.test(url)
}

// Ref Supabase asli adalah 20 karakter acak, jadi tidak akan mengandung kata
// seperti "your". Kalau mengandung, berarti .env.local masih berisi contoh
// dari .env.local.example dan belum diisi project sungguhan — jangan lapor
// "aman", karena itu menyesatkan.
function looksPlaceholder(ref) {
  return !ref || /your|example|placeholder|xxxx|changeme/i.test(ref)
}

const activeSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const activeProjectRef = supabaseProjectRef(activeSupabaseUrl)

if (process.env.NODE_ENV === 'development') {
  const allowProduction = process.env.ALLOW_PRODUCTION_DB_IN_DEV === 'true'

  if (activeProjectRef === PRODUCTION_PROJECT_REF && !allowProduction) {
    throw new Error(
      [
        '',
        '  ⛔ DEV DILARANG MENUNJUK DATABASE PRODUCTION',
        '',
        `  NEXT_PUBLIC_SUPABASE_URL menunjuk ke project production:`,
        `      ${activeSupabaseUrl}`,
        `      (ref: ${PRODUCTION_PROJECT_REF} — "habamaOutdoor")`,
        '',
        '  Kalau dibiarkan, booking, order, dan notifikasi uji Anda akan',
        '  bercampur dengan data pelanggan asli.',
        '',
        '  Perbaiki: isi .env.local dengan kredensial project DEV.',
        '      NEXT_PUBLIC_SUPABASE_URL',
        '      NEXT_PUBLIC_SUPABASE_ANON_KEY',
        '      SUPABASE_SERVICE_ROLE_KEY',
        '  .env.local menang atas .env, jadi .env boleh tetap berisi',
        '  kredensial production. Langkah lengkap: DATABASE_ENV_SETUP.md',
        '',
        '  Terpaksa harus menunjuk production? Set ALLOW_PRODUCTION_DB_IN_DEV=true.',
        '',
      ].join('\n')
    )
  }

  if (!activeSupabaseUrl) {
    console.warn(
      '\n  ⚠️  NEXT_PUBLIC_SUPABASE_URL belum diisi — dev server akan gagal saat\n' +
        '      komponen Supabase dimuat. Salin .env.local.example menjadi .env.local.\n'
    )
  } else if (isLocalSupabase(activeSupabaseUrl)) {
    console.log(`  ✅ DB target: Supabase lokal (${activeSupabaseUrl})`)
  } else if (activeProjectRef && activeProjectRef !== PRODUCTION_PROJECT_REF && !looksPlaceholder(activeProjectRef)) {
    console.log(`  ✅ DB target: project dev ${activeProjectRef} (bukan production)`)
  } else if (activeProjectRef && activeProjectRef !== PRODUCTION_PROJECT_REF) {
    console.warn(
      `\n  ⚠️  NEXT_PUBLIC_SUPABASE_URL masih berisi nilai contoh:\n` +
        `      ${activeSupabaseUrl}\n` +
        '      Ganti dengan ref project dev Anda, atau aplikasi akan gagal\n' +
        '      terhubung ke Supabase. Lihat DATABASE_ENV_SETUP.md langkah 5.\n'
    )
  } else if (activeProjectRef === PRODUCTION_PROJECT_REF && allowProduction) {
    console.warn(
      `\n  ⚠️  DB target: PRODUCTION (${PRODUCTION_PROJECT_REF}) — diizinkan lewat\n` +
        '      ALLOW_PRODUCTION_DB_IN_DEV=true. Data uji akan masuk ke data asli.\n'
    )
  } else if (activeSupabaseUrl) {
    console.log(`  ✅ DB target: ${activeSupabaseUrl}`)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Fix workspace root warning - use webpack on Windows
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  // Explicitly configure Turbopack to silence warning
  turbopack: {},
  // Add proxy configuration for authentication
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },  
      {
        source: '/proxy/:path*',
        destination: '/proxy/:path*',
      },
    ];
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'sonner'],
    optimizeCss: {
      inlineCss: false, // Disable - we handle CSS manually
      removeUnusedCss: true,
    },
    optimizeServerReact: true,
  },
  // Move deprecated experimental keys to top level
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  // Image optimization - modern formats
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.googleapis.com https://*.midtrans.com;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.img.susercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.shopee.co.id',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // CSS optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },
  // Compression and caching
  compress: true,
  poweredByHeader: false,
  // Preconnect to external domains
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Redirects HTTP to HTTPS
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
