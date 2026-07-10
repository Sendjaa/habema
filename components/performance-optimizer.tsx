"use client";

import { useEffect } from 'react';
import { preloadCriticalImages } from '@/components/optimized-image';

export function usePerformanceOptimizations() {
  useEffect(() => {
    // Only run on client-side
    if (typeof document === 'undefined') return;

    // Preload critical images for LCP
    const criticalImages = [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2070',
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=2003',
    ];
    preloadCriticalImages(criticalImages);

    // Preconnect to external domains
    const preconnectDomains = [
      'https://images.unsplash.com',
      'https://i.pinimg.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://*.supabase.co',
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Preload fonts
    const fontLinks = [
      { href: 'https://fonts.googleapis.com', rel: 'preconnect' },
      { href: 'https://fonts.gstatic.com', rel: 'preconnect', crossOrigin: 'anonymous' },
    ];

    fontLinks.forEach(font => {
      const link = document.createElement('link');
      link.rel = font.rel;
      link.href = font.href;
      if (font.crossOrigin) {
        link.crossOrigin = font.crossOrigin;
      }
      document.head.appendChild(link);
    });
  }, []);
}

export function ScriptOptimizer() {
  usePerformanceOptimizations();
  return null;
}
