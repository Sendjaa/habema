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
