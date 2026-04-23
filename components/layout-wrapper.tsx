'use client'

import { usePathname } from 'next/navigation'
import { Header } from './navigation/header'
import { Footer } from './navigation/footer'

export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Check if current page is admin page
  const isAdminPage = pathname?.startsWith('/admin')
  
  // Don't show header and footer on admin pages
  if (isAdminPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }
  
  // Show header and footer for client pages
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
