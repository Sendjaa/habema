/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https', // Gunakan 'protocol', bukan 'protocols'
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // Jika perlu http, buat objek terpisah
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
    ],
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
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'sonner'],
    optimizeCss: {
      inlineCss: true,
      removeUnusedCss: true,
    },
  },
  // Reduce CSS chunk splitting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          styles: {
            name: 'styles',
            test: /\.(css|scss|sass)$/,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    return config
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