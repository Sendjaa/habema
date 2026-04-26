// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { Toaster } from 'sonner'
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
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
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