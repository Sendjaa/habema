// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { Toaster } from 'sonner'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { CssLoader } from '@/components/css-loader'
import './globals.css'

// ── Fonts ──────────────────────────────────────────────────────
// Fraunces: display/serif untuk heading & branding
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

// DM Sans: body font yang bersih dan modern
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

// ── Metadata ───────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://habema.id'
  ),
  title: {
    default: 'Habema — Sewa Alat Outdoor & Camping',
    template: '%s | Habema',
  },
  description:
    'Sewa perlengkapan camping dan outdoor premium untuk petualangan tanpa batas. Tenda, sleeping bag, carrier, dan lebih banyak lagi dari Basecamp Habema.',
  keywords: [
    'sewa alat camping',
    'rental outdoor gear',
    'habema',
    'tenda camping',
    'perlengkapan pendakian',
    'Papua outdoor',
    'sewa carrier',
  ],
  authors: [{ name: 'Habema', url: 'https://habema.id' }],
  creator: 'Habema',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://habema.id',
    siteName: 'Habema',
    title: 'Habema — Sewa Alat Outdoor & Camping',
    description:
      'Sewa perlengkapan camping dan outdoor premium untuk petualangan tanpa batas.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Habema — Sewa Alat Outdoor & Camping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Habema — Sewa Alat Outdoor & Camping',
    description:
      'Sewa perlengkapan camping dan outdoor premium untuk petualangan tanpa batas.',
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
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-habema-32x32.ico',
  },
  manifest: '/site.webmanifest',
}

// ── Viewport (dipisah dari metadata — best practice Next.js 14+) ──
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
  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${dmSans.variable} bg-background scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/x-icon" sizes="32x32" href="/favicon-habema-32x32.ico" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/favicon-habema-32x32.ico" as="image" type="image/x-icon" />
        <link rel="preload" href="/og-image.jpg" as="image" />
        
        {/* Preload LCP image for faster loading */}
        <link 
          rel="preload" 
          href="/images/bannerImage.png" 
          as="image" 
          fetchPriority="high"
        />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://i.pinimg.com" />
        <link rel="preconnect" href="https://vercel.app" crossOrigin="anonymous" />
        
        {/* Critical CSS - inlined for fastest render */}
        <style dangerouslySetInnerHTML={{
          __html: `
            * { box-sizing: border-box; }
            body { margin: 0; background: #F5EFE7; font-family: var(--font-body); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            .bg-background { background-color: #F5EFE7; }
            .text-foreground { color: #2D5016; }
            .font-body { font-family: var(--font-body); }
            .antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            .min-h-screen { min-height: 100vh; }
            .loading-spinner { width: 40px; height: 40px; border: 4px solid #E8DFCF; border-top: 4px solid #2D5016; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .navbar-container { position: sticky; top: 0; z-index: 50; background: rgba(245, 239, 231, 0.95); backdrop-filter: blur(10px); }
            .hero-gradient { background: linear-gradient(135deg, #2D5016 0%, #3E6B1F 100%); }
            .no-js { display: none; }
            .js-loaded { opacity: 1; transition: opacity 0.3s ease; }
          `
        }} />
        
                
        {/* DNS prefetch for non-critical resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        {/* CSS loader for non-blocking styles */}
        <CssLoader />
        
        {/* Performance monitoring */}
        <PerformanceMonitor />
        
        {/* Toast notifications */}
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

        {/* Main layout (Navbar/Footer logic inside) */}
        <LayoutWrapper>{children}</LayoutWrapper>

        {/* Analytics & performance — production only */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
          </>
        )}
      </body>
    </html>
  )
}