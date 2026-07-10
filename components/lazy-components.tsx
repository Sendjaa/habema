"use client";

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy loading wrapper component
export const LazyWrapper = ({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) => (
  <Suspense 
    fallback={
      fallback || (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )
    }
  >
    {children}
  </Suspense>
);

// Lazy load existing components
export const LazyIDVerificationForm = lazy(() => 
  import('@/components/checkout/id-verification-form').then(module => ({
    default: module.IDVerificationForm
  }))
);

export const LazyLocationPicker = lazy(() => 
  import('@/components/booking/location-picker').then(module => ({
    default: module.LocationPicker
  }))
);

// Simple lazy loading utilities
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/images/bannerImage.webp',
    '/favicon-habema-32x32.ico'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = 'image';
    link.type = 'image/png';
    document.head.appendChild(link);
  });
};
