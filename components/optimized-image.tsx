"use client";

import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: 'high' | 'medium' | 'low';
  loading?: 'lazy' | 'eager';
  sizes?: string;
  quality?: number;
  format?: 'webp' | 'avif';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  priority = 'medium',
  loading = 'lazy',
  sizes,
  quality = 85,
  format = 'auto',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Generate responsive image URLs
  const generateOptimizedSrc = (originalSrc: string, w?: number, h?: number) => {
    // Hanya CDN Unsplash yang support param ?w/h/q on-the-fly.
    // URL lain (Supabase storage, pinimg, dll) pakai apa adanya.
    if (!originalSrc.includes('unsplash.com')) return originalSrc;
    const params = new URLSearchParams();
    
    if (w) params.set('w', w.toString());
    if (h) params.set('h', h.toString());
    if (quality) params.set('q', quality.toString());
    if (format && format !== 'auto') params.set('f', format);
    
    const paramString = params.toString();
    return `${originalSrc}?${paramString}`;
  };

  // Generate responsive sizes attribute
  const generateSizes = (baseWidth: number, baseHeight: number) => {
    const sizes = [
      `(max-width: ${baseWidth}px) ${baseWidth}px`,
      `(max-width: ${baseWidth * 0.75}px) ${Math.round(baseWidth * 0.75)}px`,
      `(max-width: ${baseWidth * 0.5}px) ${Math.round(baseWidth * 0.5)}px`,
    ];
    return sizes.join(', ');
  };

  // Determine optimal format based on browser support
  const getOptimalFormat = () => {
    if (typeof document === 'undefined') return 'webp';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'webp';
    
    // Check WebP support
    const webpSupported = canvas.toDataURL('image/webp', 0.9).indexOf('data:image/webp') === 0;
    
    // Check AVIF support
    if (webpSupported) {
      const avifData = canvas.toDataURL('image/avif', 0.9);
      const avifSupported = avifData.indexOf('data:image/avif') === 0;
      if (avifSupported) return 'avif';
    }
    
    return 'webp';
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const optimizedSrc = generateOptimizedSrc(src, width, height);
            setCurrentSrc(optimizedSrc);
            setIsLoaded(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [src, width, height, quality, format]);

  const finalSrc = currentSrc || generateOptimizedSrc(src, width, height);
  const finalSizes = width && height ? generateSizes(width, height) : sizes;
  const finalFormat = format === 'auto' ? getOptimalFormat() : format;

  return (
    <img
      ref={imgRef}
      src={finalSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      width={width}
      height={height}
      loading={loading}
      sizes={finalSizes}
      style={{
        objectFit: 'cover',
        backgroundColor: '#f3f4f6',
      }}
      onError={(e) => {
        // Fallback to original format if optimized format fails
        if (finalFormat !== 'auto') {
          const fallbackSrc = generateOptimizedSrc(src, width, height);
          if (fallbackSrc !== finalSrc) {
            setCurrentSrc(fallbackSrc);
          }
        }
      }}
      onLoad={() => setIsLoaded(true)}
      decoding="async"
    />
  );
};

// Hook for responsive image optimization
export const useImageOptimization = () => {
  const [isWebPSupported, setIsWebPSupported] = useState(false);
  const [isAVIFSupported, setIsAVIFSupported] = useState(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check WebP support
    const webpData = canvas.toDataURL('image/webp', 0.9);
    setIsWebPSupported(webpData.indexOf('data:image/webp') === 0);

    // Check AVIF support
    const avifData = canvas.toDataURL('image/avif', 0.9);
    setIsAVIFSupported(avifData.indexOf('data:image/avif') === 0);
  }, []);

  return {
    isWebPSupported,
    isAVIFSupported,
    optimalFormat: isAVIFSupported ? 'avif' : isWebPSupported ? 'webp' : 'jpeg',
  };
};

// Preload critical images
export const preloadCriticalImages = (imageUrls: string[]) => {
  if (typeof document === 'undefined') return;
  imageUrls.forEach((url, index) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'image';
    link.fetchPriority = index === 0 ? 'high' : 'auto';
    document.head.appendChild(link);
  });
};
