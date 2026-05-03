/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Fix workspace root warning
  turbopack: {
    root: process.cwd(),
  },
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
      inlineCss: true,
      removeUnusedCss: true,
    },
    // Optimize bundle splitting
    optimizeServerReact: true,
  },
  // Move deprecated experimental keys to top level
  serverExternalPackages: ['@supabase/supabase-js'],
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
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
    ],
  },
  // CSS optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', 
  },
  // Compression and caching
  compress: true,
  poweredByHeader: false,
}

export default nextConfig