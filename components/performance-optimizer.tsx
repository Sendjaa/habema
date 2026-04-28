"use client";

import { useEffect, useState } from 'react';

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics = {
    scriptTime: 0,
    renderTime: 0,
    bundleSize: 0,
    layoutShifts: 0
  };

  private constructor() {
    this.setupPerformanceObserver();
    this.optimizeMainThread();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private setupPerformanceObserver() {
    // Monitor layout shifts
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            this.metrics.layoutShifts += (entry as any).value;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private optimizeMainThread() {
    // Use requestIdleCallback for non-critical tasks
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.deferNonCriticalTasks();
      });
    }
  }

  private deferNonCriticalTasks() {
    // Defer image loading and analytics
    setTimeout(() => {
      this.loadDeferredImages();
      this.loadDeferredScripts();
    }, 100);
  }

  private loadDeferredImages() {
    // Lazy load images below the fold
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
  }

  private loadDeferredScripts() {
    // Load non-critical scripts after main content
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => {
      if (script.getAttribute('src')) {
        const newScript = document.createElement('script');
        newScript.src = script.getAttribute('src')!;
        newScript.async = true;
        document.body.appendChild(newScript);
      }
    });
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public optimizeBundleSize() {
    // Dynamic imports for code splitting
    return {
      lazyLoadComponents: () => import('./lazy-components'),
      lazyLoadAnalytics: () => import('./analytics'),
      lazyLoadAdmin: () => import('./admin-features')
    };
  }
}

interface PerformanceMetrics {
  scriptTime: number;
  renderTime: number;
  bundleSize: number;
  layoutShifts: number;
}

// React Hook for performance optimization
export function usePerformanceOptimization() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    scriptTime: 0,
    renderTime: 0,
    bundleSize: 0,
    layoutShifts: 0
  });

  useEffect(() => {
    const optimizer = PerformanceOptimizer.getInstance();
    
    // Monitor performance
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      if (navigation) {
        setMetrics({
          scriptTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          renderTime: navigation.loadEventEnd - navigation.loadEventStart,
          bundleSize: optimizer.getMetrics().bundleSize,
          layoutShifts: optimizer.getMetrics().layoutShifts
        });
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  return metrics;
}

// Bundle size optimization utilities
export const bundleOptimizer = {
  // Split large components
  lazyLoad: (componentPath: string) => {
    return () => import(`../components/${componentPath}`);
  },

  // Preload critical resources only
  preloadCritical: (resources: string[]) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.includes('.css') ? 'style' : 'script';
      document.head.appendChild(link);
    });
  },

  // Minimize render blocking
  deferNonCritical: () => {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(resolve);
      } else {
        setTimeout(resolve, 1);
      }
    });
  }
};

// CSS optimization utilities
export const cssOptimizer = {
  // Critical CSS inlining
  inlineCritical: (css: string) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  },

  // Non-critical CSS loading
  loadNonCritical: (cssPath: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = cssPath;
    link.as = 'style';
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }
};
