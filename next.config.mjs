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
}

export default nextConfig