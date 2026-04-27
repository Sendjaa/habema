'use client'

import { useEffect } from 'react'

interface PerformanceMetrics {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return

    // Monitor Web Vitals
    const observePerformance = () => {
      // Largest Contentful Paint (LCP)
      const observeLCP = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        console.log('LCP:', lastEntry.startTime)
        
        // Send to analytics if needed
        if (window.gtag) {
          window.gtag('event', 'LCP', {
            event_category: 'Web Vitals',
            value: Math.round(lastEntry.startTime),
          })
        }
      })
      
      observeLCP.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Contentful Paint (FCP)
      const observeFCP = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          console.log('FCP:', fcpEntry.startTime)
        }
      })
      
      observeFCP.observe({ entryTypes: ['paint'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const observeCLS = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        console.log('CLS:', clsValue)
      })
      
      observeCLS.observe({ entryTypes: ['layout-shift'] })

      // Time to First Byte (TTFB)
      const navigation = performance.getEntriesByType('navigation')[0] as any
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart
        console.log('TTFB:', ttfb)
      }
    }

    // Start observing after a short delay to ensure page is loaded
    const timer = setTimeout(observePerformance, 1000)

    return () => clearTimeout(timer)
  }, [])

  return null
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: any) => void
  }
}
