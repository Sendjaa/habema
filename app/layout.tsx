// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/error-boundary'
import { GoogleOAuthProviderWrapper } from '@/components/providers/google_oauth_provider'
import './globals.css'

// ── Fonts ──────────────────────────────────────────────────────
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

// ── Metadata ───────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://habema.biz.id'
  ),
  title: {
    default: 'Habema — Rental, Shop & Open Trip Outdoor Terpercaya',
    template: '%s | Habema',
  },
  description:
    'Mau sewa tenda, beli perlengkapan camping, atau ikut open trip ke gunung dan wisata alam favorit? Habema punya semuanya. Sewa alat, belanja gear, dan gabung open trip dengan mudah dan aman.',
  keywords: [
    // Brand
    'habema',
    'habema outdoor',
    'habema bandung',

    // Rental / Sewa
    'sewa alat camping',
    'rental outdoor gear',
    'sewa tenda camping',
    'sewa carrier',
    'sewa sleeping bag',
    'sewa cooking set outdoor',
    'sewa kompor camping',
    'sewa matras camping',
    'sewa alat mendaki',
    'rental peralatan hiking',
    'sewa perlengkapan gunung',
    'tempat sewa alat camping bandung',
    'rental gear outdoor bandung',

    // Shop / Belanja
    'jual alat camping',
    'toko perlengkapan outdoor',
    'perlengkapan pendakian',
    'gear camping murah',
    'jual tenda dome',
    'jual carrier gunung',
    'perlengkapan hiking online',
    'belanja alat outdoor',

    // Open Trip
    'open trip gunung',
    'open trip camping',
    'open trip pendakian',
    'trip hiking bareng',
    'paket open trip gunung bandung',
    'komunitas pendaki',
    'jadwal open trip 2026',

    // Lokasi
    'outdoor bandung',
    'camping bandung',
    'pendakian jawa barat',
    'sewa alat camping jawa barat',

    // Long-tail
    'tenda camping berkualitas',
    'perlengkapan camping lengkap',
    'sewa alat camping murah',
    'rental gear pendakian terpercaya',
  ],
  authors: [{ name: 'Habema', url: 'https://habema.biz.id' }],
  creator: 'Habema',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://habema.biz.id',
    siteName: 'Habema',
    title: 'Habema — Rental, Shop & Open Trip Outdoor Terpercaya',
    description:
      'Mau sewa tenda, beli perlengkapan camping, atau ikut open trip ke gunung dan wisata alam favorit? Habema punya semuanya. Sewa alat, belanja gear, dan gabung open trip dengan mudah dan aman.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Habema — Rental, Shop & Open Trip Outdoor Terpercaya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Habema — Rental, Shop & Open Trip Outdoor Terpercaya',
    description:
      'Mau sewa tenda, beli perlengkapan camping, atau ikut open trip ke gunung dan wisata alam favorit? Habema punya semuanya. Sewa alat, belanja gear, dan gabung open trip dengan mudah dan aman.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-habema-32x32.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-habema-32x32.ico', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon-habema-32x32.ico',
  },
  manifest: '/site.webmanifest',
}

// ── Viewport ──────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// ── Layout ─────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    console.warn('⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID tidak ditemukan di .env.local')
  }

  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${dmSans.variable} bg-background scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/x-icon" sizes="32x32" href="/favicon-habema-32x32.ico" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <style dangerouslySetInnerHTML={{
          __html: `*{box-sizing:border-box}body{margin:0;background:var(--background);font-family:var(--font-body);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.bg-background{background-color:var(--background)}.text-foreground{color:var(--foreground)}.font-body{font-family:var(--font-body)}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.min-h-screen{min-height:100vh}.loading-spinner{width:40px;height:40px;border:4px solid var(--muted);border-top:4px solid var(--primary);border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.navbar-container{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.95);backdrop-filter:blur(10px)}.hero-gradient{background:linear-gradient(135deg,#0f766e 0%,#14b8a6 100%)}.no-js{display:none}.js-loaded{opacity:1;transition:opacity .3s ease}`
        }} />

        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <Toaster
          position="top-center"
          richColors
          expand
          closeButton
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'var(--font-body)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />

        <GoogleOAuthProviderWrapper clientId={googleClientId || ''}>
          <ErrorBoundary>
            <LayoutWrapper>{children}</LayoutWrapper>
          </ErrorBoundary>
        </GoogleOAuthProviderWrapper>

        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
          </>
        )}
      </body>
    </html>
  )
}