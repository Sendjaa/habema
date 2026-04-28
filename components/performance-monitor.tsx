'use client'

import { useEffect, useCallback } from 'react'

interface PerformanceMetrics {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
}

export function PerformanceMonitor() {
  // Use requestIdleCallback for non-critical performance monitoring
  const schedulePerformanceMonitoring = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') return

    // Use requestIdleCallback to avoid blocking main thread
    const monitorWhenIdle = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(
          () => {
            observeWebVitals();
          },
          { timeout: 3000 }
        );
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(observeWebVitals, 2000);
      }
    };

    monitorWhenIdle();
  }, []);

  useEffect(() => {
    // Delay monitoring to prioritize critical rendering
    const timer = setTimeout(schedulePerformanceMonitoring, 1500);
    return () => clearTimeout(timer);
  }, [schedulePerformanceMonitoring]);

  return null;
}

// Optimized Web Vitals monitoring
function observeWebVitals() {
  if (!('PerformanceObserver' in window)) return;

  // Batch all performance observations
  const observers: PerformanceObserver[] = [];

  try {
    // LCP - Most critical metric
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const lcpValue = Math.round(lastEntry.startTime);
      
      // Only log in development or when debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('LCP:', lcpValue);
      }
      
      // Send to analytics asynchronously
      if (window.gtag && lcpValue > 0) {
        setTimeout(() => {
          window.gtag?.('event', 'LCP', {
            event_category: 'Web Vitals',
            value: lcpValue,
            non_interaction: true,
          });
        }, 0);
      }
    });
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    observers.push(lcpObserver);

    // CLS - Layout stability
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });
    
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    observers.push(clsObserver);

    // Cleanup function
    setTimeout(() => {
      // Report final CLS value
      if (clsValue > 0.1) {
        console.warn('High CLS detected:', clsValue);
      }
      
      // Disconnect observers to save memory
      observers.forEach(observer => observer.disconnect());
    }, 10000);

  } catch (error) {
    console.warn('Performance monitoring error:', error);
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: any) => void
  }
}
